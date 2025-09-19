"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tradeId: string;
  allowCents: boolean;
  startingPrice: number | null;
  onPlaced?: () => void;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function BidDialog({
  open,
  onOpenChange,
  tradeId,
  allowCents,
  startingPrice,
  onPlaced,
}: Props) {
  const supabase = createClient();

  const [lastAmount, setLastAmount] = React.useState<number | null>(null);
  const [nextMin, setNextMin] = React.useState<number>(0);
  const [amount, setAmount] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  const step = allowCents ? 0.01 : 1;

  const computeNextMin = React.useCallback(
    (last: number | null) => {
      const base = last ?? startingPrice ?? 0;
      const min = allowCents ? round2(base + 0.01) : Math.floor(base) + 1;
      return min;
    },
    [allowCents, startingPrice]
  );

  React.useEffect(() => {
    if (!open) return;

    (async () => {
      const { data: last } = await supabase
        .from("trade_bids")
        .select("amount")
        .eq("trade_id", tradeId)
        .order("amount", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastVal = last?.amount ?? null;
      setLastAmount(lastVal);

      const min = computeNextMin(lastVal);
      setNextMin(min);
      setAmount(String(min)); // pré-preenche com o mínimo
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tradeId]);

  const valid = (() => {
    const n = Number(amount);
    if (Number.isNaN(n)) return false;
    return n >= nextMin;
  })();

  const submit = async () => {
    if (!valid) return;

    try {
      setLoading(true);
      const n = allowCents ? round2(Number(amount)) : Math.floor(Number(amount));

      const { error } = await supabase.rpc("place_bid", {
        p_trade_id: tradeId,
        p_amount: n,
      });

      if (error) {
        // LOG completo no console p/ debug
        console.error("[place_bid] error", {
          code: (error as any).code,
          message: error.message,
          details: (error as any).details,
          hint: (error as any).hint,
          name: error.name,
          status: (error as any).status,
        });

        // Mensagens amigáveis por código
        const code = (error as any).code as string | undefined;
        const msg =
          code === "28000"
            ? "Você precisa estar autenticado."
            : code === "P0001" || /owner_cannot_bid/i.test(error.message)
            ? "Você não pode dar lance no seu próprio leilão."
            : code === "P0002" || /listing_not_found/i.test(error.message)
            ? "Leilão não encontrado ou encerrado."
            : code === "22003" || /low_bid/i.test(error.message)
            ? "Lance abaixo do mínimo permitido."
            : code === "42702"
            ? "Erro interno do servidor (42702). A função foi atualizada para evitar esse erro. Atualize a página e tente novamente."
            : "Não foi possível registrar o lance.";

        toast({
          title: "Erro ao dar lance",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Lance registrado!",
        description: "Seu lance foi enviado.",
      });
      onOpenChange(false);
      onPlaced?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar lance</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Próximo lance mínimo: <b>R$ {nextMin.toFixed(allowCents ? 2 : 0)}</b>
          </div>
          <Input
            type="number"
            step={step}
            min={nextMin}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            placeholder={allowCents ? "ex.: 86.01" : "ex.: 87"}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!valid || loading}>
            {loading ? "Enviando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
