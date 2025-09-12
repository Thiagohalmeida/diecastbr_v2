"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

type Bid = {
  id: string;
  trade_id: string;
  bidder_user_id: string;
  amount: number;
  created_at: string;
};

type Props = {
  tradeId: string;
  allowCents: boolean;
  startingPrice: number | null | undefined;
};

export function BidsPanel({ tradeId, allowCents, startingPrice }: Props) {
  const supabase = createClient();
  const [bids, setBids] = useState<Bid[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const highest = useMemo(() => {
    if (!bids.length) return startingPrice ?? 0;
    return Math.max(...bids.map((b) => b.amount));
  }, [bids, startingPrice]);

  // próximo lance mínimo (apenas informativo)
  const minNext = useMemo(() => {
    if (!allowCents) return Math.trunc(highest) + 1;
    // se aceita centavos, só garante maior que o atual
    return Number((highest + 0.01).toFixed(2));
  }, [highest, allowCents]);

  const load = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    setUserId(auth?.user?.id ?? null);

    const { data } = await supabase
      .from("trade_bids")
      .select("id, trade_id, bidder_user_id, amount, created_at")
      .eq("trade_id", tradeId)
      .order("amount", { ascending: false })
      .limit(50);

    setBids((data ?? []) as Bid[]);
    setLoading(false);
  };

  useEffect(() => {
    load();

    // Realtime: novos lances
    const channel = supabase
      .channel(`bids_trade_${tradeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_bids", filter: `trade_id=eq.${tradeId}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeId]);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-lg font-semibold">Lances</div>
          <div className="text-sm text-muted-foreground">
            Maior: <b>R$ {highest?.toFixed(2)}</b> • Próximo mínimo: <b>R$ {minNext.toFixed(2)}</b>{" "}
            {!allowCents && <span>(sem centavos)</span>}
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">carregando lances…</div>
        ) : bids.length === 0 ? (
          <div className="text-sm text-muted-foreground">Ainda não há lances.</div>
        ) : (
          <ul className="space-y-2">
            {bids.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded border p-2 text-sm"
              >
                <div className="font-medium">
                  R$ {b.amount.toFixed(2)}
                  {userId && b.bidder_user_id === userId && (
                    <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-primary">
                      você
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground">
                  {new Date(b.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
