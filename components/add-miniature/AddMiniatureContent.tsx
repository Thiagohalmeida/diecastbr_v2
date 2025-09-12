"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { addToGarage } from "@/lib/services/garage";
import { toast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

function toISODate(brLike: string): string | null {
  if (!brLike) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(brLike)) return brLike; // input type=date
  const m = brLike.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}
function toISODateTime(dtLocal: string): string | null {
  if (!dtLocal) return null;
  // dt-local vem sem timezone -> assume local e transforma pra ISO-UTC
  const d = new Date(dtLocal);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}
function num(v: string): number | null {
  if (!v || !v.trim()) return null;
  const n = Number(v.replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

export function AddMiniatureContent() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // --- CATÁLOGO (miniatures_master)
  const [brand, setBrand] = useState("");
  const [modelName, setModelName] = useState("");
  const [launchYear, setLaunchYear] = useState("");
  const [baseColor, setBaseColor] = useState("");
  const [upc, setUpc] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // --- GARAGEM (user_miniatures)
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [pricePaid, setPricePaid] = useState("");
  const [condition, setCondition] = useState("Lacrado");
  const [variants, setVariants] = useState("");
  const [isTreasure, setIsTreasure] = useState(false);
  const [isSuperTreasure, setIsSuperTreasure] = useState(false);
  const [personalNotes, setPersonalNotes] = useState("");

  // --- NEGÓCIO
  const [listingType, setListingType] =
    useState<"none" | "sell" | "trade" | "auction" | "sell_or_trade">("none");
  const [salePrice, setSalePrice] = useState("");
  const [tradeAccepts, setTradeAccepts] = useState("");
  const [aucStartPrice, setAucStartPrice] = useState("");
  const [aucStart, setAucStart] = useState("");
  const [aucEnd, setAucEnd] = useState("");
  const [aucAllowCents, setAucAllowCents] = useState(true);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!brand.trim() || !modelName.trim()) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha Marca e Modelo.",
          variant: "destructive",
        });
        return;
      }

      if (listingType === "sell" || listingType === "sell_or_trade") {
        const n = num(salePrice);
        if (n == null) {
          toast({
            title: "Preço de venda inválido",
            description: "Informe um valor numérico (ex.: 99.90).",
            variant: "destructive",
          });
          return;
        }
      }
      if (listingType === "auction") {
        const start = toISODateTime(aucStart);
        const end = toISODateTime(aucEnd);
        if (!start || !end || new Date(start) >= new Date(end)) {
          toast({
            title: "Datas do leilão inválidas",
            description: "Defina início e fim corretos (fim após o início).",
            variant: "destructive",
          });
          return;
        }
      }

      await addToGarage({
        // master
        brand: brand.trim(),
        model_name: modelName.trim(),
        launch_year: launchYear ? Number(launchYear) : null,
        base_color: baseColor || null,
        upc: upc || null,
        image_url: imageUrl || null,

        // garagem
        acquisition_date: toISODate(acquisitionDate),
        price_paid: num(pricePaid),
        condition,
        variants: variants || null,
        is_treasure_hunt: isTreasure,
        is_super_treasure_hunt: isSuperTreasure,
        personal_notes: personalNotes || null,

        // negócio
        listing_type: listingType,
        sale_price: num(salePrice),
        trade_accepts: tradeAccepts || null,
        auction_starting_price: num(aucStartPrice),
        auction_start: toISODateTime(aucStart),
        auction_end: toISODateTime(aucEnd),
        auction_allow_cents: aucAllowCents,
      });

      toast({
        title: "Miniatura adicionada!",
        description:
          listingType === "none"
            ? "Ela foi salva na sua garagem."
            : "Anúncio criado na aba Negociação.",
      });

      router.replace("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao adicionar miniatura",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-8">
      <form onSubmit={onSubmit} className="space-y-8">
        {/* BLOCO: CATÁLOGO */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Miniatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Hot Wheels, Matchbox..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Ex.: Nissan Skyline GT-R"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ano de lançamento</Label>
                <Input
                  inputMode="numeric"
                  placeholder="2024"
                  value={launchYear}
                  onChange={(e) => setLaunchYear(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor principal</Label>
                <Input
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  placeholder="Vermelho"
                />
              </div>
              <div className="space-y-2">
                <Label>UPC / Código</Label>
                <Input
                  value={upc}
                  onChange={(e) => setUpc(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL da imagem (opcional)</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* BLOCO: COLEÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da sua Coleção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data de Aquisição</Label>
                <Input
                  type="date"
                  value={acquisitionDate}
                  onChange={(e) => setAcquisitionDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Pago (R$)</Label>
                <Input
                  inputMode="decimal"
                  placeholder="59.90"
                  value={pricePaid}
                  onChange={(e) => setPricePaid(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Condição</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lacrado">Lacrado</SelectItem>
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Bom">Bom</SelectItem>
                    <SelectItem value="Usado">Usado</SelectItem>
                    <SelectItem value="Ruim">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Variantes</Label>
              <Input
                value={variants}
                onChange={(e) => setVariants(e.target.value)}
                placeholder="Rodas, tampografia, lote..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={isTreasure}
                  onCheckedChange={(v) => setIsTreasure(!!v)}
                />
                <span>É um Treasure Hunt?</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={isSuperTreasure}
                  onCheckedChange={(v) => setIsSuperTreasure(!!v)}
                />
                <span>É um Super Treasure Hunt?</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label>Notas Pessoais</Label>
              <Textarea
                rows={4}
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                placeholder="Detalhes, onde comprou, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* BLOCO: NEGÓCIO */}
        <Card>
          <CardHeader>
            <CardTitle>Negócio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Tipo</Label>
              <RadioGroup
                value={listingType}
                onValueChange={(v) =>
                  setListingType(v as "none" | "sell" | "trade" | "auction" | "sell_or_trade")
                }
                className="grid grid-cols-2 md:grid-cols-5 gap-2"
              >
                <label className="flex items-center gap-2 border rounded p-2">
                  <RadioGroupItem value="none" /> Nenhum
                </label>
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

            {["sell", "sell_or_trade"].includes(listingType) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Valor de Venda (R$)</Label>
                  <Input
                    inputMode="decimal"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                  />
                </div>
              </div>
            )}

            {listingType === "trade" && (
              <div className="space-y-2">
                <Label>Aceito (na troca)</Label>
                <Input
                  value={tradeAccepts}
                  onChange={(e) => setTradeAccepts(e.target.value)}
                  placeholder="Ex.: Boulevard, JDM, Super TH..."
                />
              </div>
            )}

            {listingType === "auction" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor inicial (R$)</Label>
                  <Input
                    inputMode="decimal"
                    value={aucStartPrice}
                    onChange={(e) => setAucStartPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permitir centavos?</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={aucAllowCents}
                      onCheckedChange={(v) => setAucAllowCents(!!v)}
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
                    value={aucStart}
                    onChange={(e) => setAucStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input
                    type="datetime-local"
                    value={aucEnd}
                    onChange={(e) => setAucEnd(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={submitting} className="min-w-[220px]">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  "Adicionar à Coleção"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
