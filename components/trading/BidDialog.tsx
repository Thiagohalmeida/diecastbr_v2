"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { placeBid } from "@/lib/services/trading";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tradeId: string;
  allowCents: boolean;
  onPlaced?: () => void;
};

export function BidDialog({ open, onOpenChange, tradeId, allowCents, onPlaced }: Props) {
  const [amount, setAmount] = useState("");
  const [min, setMin] = useState<number | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const supabase = createClient();
      // pega maior lance e preço inicial
      const { data: listing } = await supabase
        .from("trade_listings")
        .select("auction_starting_price")
        .eq("id", tradeId)
        .maybeSingle();
      const { data: highest } = await supabase
        .from("trade_bids")
        .select("amount")
        .eq("trade_id", tradeId)
        .order("amount", { ascending: false })
        .limit(1)
        .maybeSingle();

      const base = highest?.amount ?? listing?.auction_starting_price ?? 0;
      setMin(Number(base));
    })();
  }, [open, tradeId]);

  const submit = async () => {
    const n = Number(amount.replace(",", "."));
    if (!amount || Number.isNaN(n)) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    if (min != null && n <= min) {
      toast({
        title: "Lance baixo",
        description: `O valor deve ser maior que ${min.toFixed(2)}.`,
        variant: "destructive",
      });
      return;
    }
    if (!allowCents && n !== Math.trunc(n)) {
      toast({
        title: "Centavos não permitidos",
        description: "Este leilão aceita apenas valores inteiros.",
        variant: "destructive",
      });
      return;
    }

    setPosting(true);
    try {
      await placeBid(tradeId, n);
      toast({ title: "Lance registrado!" });
      onOpenChange(false);
      onPlaced?.();
    } catch (e: any) {
      toast({
        title: "Não foi possível registrar o lance",
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar lance</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Valor do lance {min != null && `(mín. > ${min.toFixed(2)})`}</Label>
          <Input
            inputMode="decimal"
            placeholder="Ex.: 100.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={posting}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
