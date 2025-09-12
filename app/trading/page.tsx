"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

type RawListing = {
  id: string;
  listing_type: "sell" | "trade" | "auction" | "sell_or_trade";
  status: "open" | "reserved" | "sold" | "canceled";
  sale_price: number | null;
  trade_accepts: string | null;
  auction_end: string | null;
  auction_starting_price: number | null;
  user_miniature_id: string;
};

type UMRow = { id: string; miniature_id: string | null };
type MasterRow = {
  id: string;
  brand: string | null;
  model_name: string | null;
  image_url: string | null;
};

type TL = RawListing & {
  brand: string | null;
  model_name: string | null;
  image_url: string | null;
};

export default function TradingPage() {
  const [tab, setTab] = useState<"sell" | "trade" | "auction">("sell");
  const [items, setItems] = useState<TL[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();

    const orFilter =
      tab === "sell"
        ? "listing_type.eq.sell,listing_type.eq.sell_or_trade"
        : tab === "trade"
        ? "listing_type.eq.trade,listing_type.eq.sell_or_trade"
        : "listing_type.eq.auction";

    const { data: rawListings, error } = await supabase
      .from("trade_listings")
      .select(
        "id, listing_type, status, sale_price, trade_accepts, auction_end, auction_starting_price, user_miniature_id"
      )
      .eq("status", "open")
      .or(orFilter);

    if (error) {
      console.error(error);
      setItems([]);
      setLoading(false);
      return;
    }

    const listings: RawListing[] = (rawListings ?? []) as RawListing[];
    if (listings.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    // ---- passo 2: resolver brand/model/image ----
    const umIds = listings.map((l: RawListing) => l.user_miniature_id);

    const { data: ums } = await supabase
      .from("user_miniatures")
      .select("id, miniature_id")
      .in("id", umIds);

    const umRows: UMRow[] = (ums ?? []) as UMRow[];
    const miniIds = umRows
      .map((u: UMRow) => u.miniature_id)
      .filter((x: string | null): x is string => !!x);

    const { data: masters } = await supabase
      .from("miniatures_master")
      .select("id, brand, model_name, image_url")
      .in("id", miniIds);

    const masterRows: MasterRow[] = (masters ?? []) as MasterRow[];

    const umMap = new Map<string, string>(); // user_miniature_id -> miniature_id
    umRows.forEach((u: UMRow) => {
      if (u.miniature_id) umMap.set(u.id, u.miniature_id);
    });

    const mMap = new Map<string, { brand: string | null; model_name: string | null; image_url: string | null }>();
    masterRows.forEach((m: MasterRow) =>
      mMap.set(m.id, { brand: m.brand, model_name: m.model_name, image_url: m.image_url })
    );

    const merged: TL[] = listings.map((l: RawListing) => {
      const mid = umMap.get(l.user_miniature_id);
      const meta = (mid && mMap.get(mid)) || { brand: null, model_name: null, image_url: null };
      return { ...l, brand: meta.brand, model_name: meta.model_name, image_url: meta.image_url };
    });

    setItems(merged);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6">
        <h1 className="text-2xl font-semibold mb-4">Negociação</h1>

        <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
          <TabsList>
            <TabsTrigger value="sell">Venda</TabsTrigger>
            <TabsTrigger value="trade">Troca</TabsTrigger>
            <TabsTrigger value="auction">Leilão</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> carregando anúncios…
              </div>
            ) : items.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Nenhum anúncio em <b>{tab === "sell" ? "Venda" : tab === "trade" ? "Troca" : "Leilão"}</b> no momento.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((it: TL) => (
                  <Card key={it.id}>
                    <CardContent className="p-4 space-y-3">
                      {it.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.image_url}
                          alt={`${it.brand ?? ""} ${it.model_name ?? ""}`}
                          className="aspect-video w-full rounded object-cover bg-muted"
                        />
                      ) : (
                        <div className="aspect-video bg-muted rounded" />
                      )}

                      <div className="font-medium">
                        {it.brand} — {it.model_name}
                      </div>

                      {tab === "sell" && (
                        <div className="text-sm">
                          Preço: {it.sale_price != null ? `R$ ${it.sale_price.toFixed(2)}` : "—"}
                        </div>
                      )}

                      {tab === "trade" && (
                        <div className="text-sm">Aceito: {it.trade_accepts || "combinar"}</div>
                      )}

                      {tab === "auction" && (
                        <div className="text-sm space-y-1">
                          <div>
                            Lance inicial:{" "}
                            {it.auction_starting_price != null ? `R$ ${it.auction_starting_price.toFixed(2)}` : "—"}
                          </div>
                          <div>Termina: {it.auction_end ? new Date(it.auction_end).toLocaleString() : "—"}</div>
                        </div>
                      )}

                      <Button className="w-full" asChild>
                        <a href={`/trading/${it.id}`}>Ver detalhes</a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
