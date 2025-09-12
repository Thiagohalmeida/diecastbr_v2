"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

const PAGE_SIZE = 20;

export function BidsPanel({ tradeId, allowCents, startingPrice }: Props) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);

  const [bids, setBids] = useState<Bid[]>([]);
  const [cursor, setCursor] = useState<string | null>(null); // created_at do último item
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // guard para evitar duplicar eventos realtime
  const seen = useRef<Set<string>>(new Set());

  // maior lance (busca performática no banco)
  const [topAmount, setTopAmount] = useState<number>(Number(startingPrice ?? 0));

  const minNext = useMemo(() => {
    if (!allowCents) return Math.trunc(topAmount) + 1;
    return Number((topAmount + 0.01).toFixed(2));
  }, [topAmount, allowCents]);

  async function fetchTop() {
    const { data } = await supabase
      .from("trade_bids")
      .select("amount")
      .eq("trade_id", tradeId)
      .order("amount", { ascending: false })
      .limit(1)
      .maybeSingle();
    const top = (data?.amount as number | undefined) ?? (startingPrice ?? 0);
    setTopAmount(Number(top));
  }

  async function loadFirst() {
    setLoading(true);
    const [{ data: auth }, { data: page }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("trade_bids")
        .select("id, trade_id, bidder_user_id, amount, created_at")
        .eq("trade_id", tradeId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE),
      fetchTop(),
    ]);

    setUserId(auth?.user?.id ?? null);

    const list = (page ?? []) as Bid[];
    list.forEach((b) => seen.current.add(b.id));
    setBids(list);
    setCursor(list.length ? list[list.length - 1].created_at : null);
    setHasMore(list.length === PAGE_SIZE);
    setLoading(false);
  }

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    const { data } = await supabase
      .from("trade_bids")
      .select("id, trade_id, bidder_user_id, amount, created_at")
      .eq("trade_id", tradeId)
      .lt("created_at", cursor) // keyset pagination (bem mais performática que offset)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    const list = (data ?? []) as Bid[];
    list.forEach((b) => seen.current.add(b.id));
    setBids((prev) => [...prev, ...list]);
    setCursor(list.length ? list[list.length - 1].created_at : null);
    setHasMore(list.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  // realtime: ao inserir lance novo, prepend + recalcula topo
  useEffect(() => {
    loadFirst();

    const ch = supabase
      .channel(`bids_${tradeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_bids", filter: `trade_id=eq.${tradeId}` },
        async (payload: any) => {
          const b: Bid = payload.new;
          if (seen.current.has(b.id)) return;
          seen.current.add(b.id);

          setBids((prev) => {
            const next = [b, ...prev].sort(
              (a, z) => new Date(z.created_at).getTime() - new Date(a.created_at).getTime()
            );
            return next;
          });

          // atualiza maior lance sem reconsultar tudo
          if (b.amount > topAmount) setTopAmount(b.amount);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeId]);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-lg font-semibold">Lances</div>
          <div className="text-sm text-muted-foreground">
            Maior: <b>R$ {topAmount.toFixed(2)}</b> • Próximo mínimo: <b>R$ {minNext.toFixed(2)}</b>{" "}
            {!allowCents && <span>(sem centavos)</span>}
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">carregando lances…</div>
        ) : bids.length === 0 ? (
          <div className="text-sm text-muted-foreground">Ainda não há lances.</div>
        ) : (
          <>
            <ul className="space-y-2">
              {bids.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded border p-2 text-sm">
                  <div className="font-medium">
                    R$ {b.amount.toFixed(2)}{" "}
                    {userId && b.bidder_user_id === userId && (
                      <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-primary">você</span>
                    )}
                  </div>
                  <div className="text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>

            {hasMore && (
              <div className="pt-2">
                <Button size="sm" variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Carregando…" : "Carregar mais"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
