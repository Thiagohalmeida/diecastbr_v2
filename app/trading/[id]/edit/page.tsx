"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/Navbar";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

function toISO(dtLocal: string) {
  if (!dtLocal) return null;
  const d = new Date(dtLocal);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}
function fromISOtoLocal(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [type, setType] =
    useState<"sell" | "trade" | "auction" | "sell_or_trade">("sell");
  const [salePrice, setSalePrice] = useState("");
  const [tradeAccepts, setTradeAccepts] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [allowCents, setAllowCents] = useState(true);

  useEffect(() => {
    (async () => {
      // pega anúncio
      const { data, error } = await supabase
        .from("trade_listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast({ title: "Anúncio não encontrado", variant: "destructive" });
        router.replace("/trading");
        return;
      }

      // garante que o usuário é o dono
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user || auth.user.id !== data.owner_user_id) {
        toast({
          title: "Sem permissão",
          description: "Você não pode editar este anúncio.",
          variant: "destructive",
        });
        router.replace(`/trading/${id}`);
        return;
      }

      setType(data.listing_type);
      setSalePrice((data.sale_price ?? "") as any);
      setTradeAccepts(data.trade_accepts ?? "");
      setStartPrice((data.auction_starting_price ?? "") as any);
      setStart(fromISOtoLocal(data.auction_start));
      setEnd(fromISOtoLocal(data.auction_end));
      setAllowCents(!!data.auction_allow_cents);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = {
        listing_type: type,
        sale_price: salePrice
          ? Number(String(salePrice).replace(",", "."))
          : null,
        trade_accepts: tradeAccepts || null,
        auction_starting_price: startPrice
          ? Number(String(startPrice).replace(",", "."))
          : null,
        auction_start: toISO(start) ?? null,
        auction_end: toISO(end) ?? null,
        auction_allow_cents: allowCents,
        status: "open",
      };

      const { error } = await supabase
        .from("trade_listings")
        .update(payload)
        .eq("id", id);
      if (error) throw error;

      toast({ title: "Anúncio atualizado!" });
      router.replace(`/trading/${id}`);
    } catch (e: any) {
      toast({
        title: "Erro ao salvar",
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => router.push(`/trading/${id}`)}>
            ← Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Editar anúncio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <RadioGroup
                value={type}
                onValueChange={(v) =>
                  setType(v as "sell" | "trade" | "auction" | "sell_or_trade")
                }
                className="grid grid-cols-2 md:grid-cols-4 gap-2"
              >
                <label className="flex items-center gap-2 border rounded p-2">
                  <RadioGroupItem value="sell" /> Venda
                </label>
                <label className="flex items-center gap-2 border rounded p-2">
                  <RadioGroupItem value="trade" /> Troca
                </label>
                <label className="flex items-center gap-2 border rounded p-2">
                  <RadioGroupItem value="sell_or_trade" /> Venda ou Troca
                </label>
                <label className="flex items-center gap-2 border rounded p-2">
                  <RadioGroupItem value="auction" /> Leilão
                </label>
              </RadioGroup>
            </div>

            {["sell", "sell_or_trade"].includes(type) && (
              <div className="space-y-2">
                <Label>Preço de venda (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                />
              </div>
            )}

            {type === "trade" && (
              <div className="space-y-2">
                <Label>Aceito (na troca)</Label>
                <Input
                  value={tradeAccepts}
                  onChange={(e) => setTradeAccepts(e.target.value)}
                />
              </div>
            )}

            {type === "auction" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor inicial (R$)</Label>
                  <Input
                    inputMode="decimal"
                    value={startPrice}
                    onChange={(e) => setStartPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permitir centavos?</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allowCents}
                      onCheckedChange={(v) => setAllowCents(!!v)}
                    />
                    <span className="text-sm text-muted-foreground">
                      Ex.: R$ 10,50
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
