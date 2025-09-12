"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { BidDialog } from "@/components/trading/BidDialog";
import { BidsPanel } from "@/components/trading/BidsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

type Listing = {
  id: string;
  listing_type: "sell" | "trade" | "auction" | "sell_or_trade";
  status: "open" | "reserved" | "sold" | "canceled";
  sale_price: number | null;
  trade_accepts: string | null;
  auction_start: string | null;
  auction_end: string | null;
  auction_starting_price: number | null;
  auction_allow_cents: boolean;
  owner_user_id: string;
  user_miniature_id: string;
  brand?: string | null;
  model_name?: string | null;
  image_url?: string | null;
};

export default function TradingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [openBid, setOpenBid] = useState(false);
  const supabase = createClient();

  const load = async () => {
    // 1) anúncio
    const { data: l, error: e1 } = await supabase
      .from("trade_listings")
      .select(
        "id, listing_type, status, sale_price, trade_accepts, auction_start, auction_end, auction_starting_price, auction_allow_cents, owner_user_id, user_miniature_id"
      )
      .eq("id", id)
      .single();

    if (e1 || !l) {
      toast({ title: "Anúncio não encontrado", variant: "destructive" });
      router.replace("/trading");
      return;
    }

    // 2) master (2 passos)
    let brand: string | null = null;
    let model_name: string | null = null;
    let image_url: string | null = null;

    const { data: um } = await supabase
      .from("user_miniatures")
      .select("miniature_id")
      .eq("id", l.user_miniature_id)
      .maybeSingle();

    if (um?.miniature_id) {
      const { data: master } = await supabase
        .from("miniatures_master")
        .select("brand, model_name, image_url")
        .eq("id", um.miniature_id)
        .maybeSingle();
      brand = master?.brand ?? null;
      model_name = master?.model_name ?? null;
      image_url = master?.image_url ?? null;
    }

    setListing({ ...l, brand, model_name, image_url });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">Carregando…</div>
      </div>
    );
  }

  const isOwner = user?.id === listing.owner_user_id;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6 space-y-6">
        <div>
          <Button variant="ghost" onClick={() => router.push("/trading")}>
            ← Voltar
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            {listing.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.image_url}
                alt={`${listing.brand ?? ""} ${listing.model_name ?? ""}`}
                className="aspect-video w-full rounded object-cover bg-muted"
              />
            ) : (
              <div className="aspect-video bg-muted rounded" />
            )}

            <div className="text-xl font-semibold">
              {listing.brand} — {listing.model_name}
            </div>
            <div className="text-sm text-muted-foreground">
              Tipo: {listing.listing_type}
            </div>

            {listing.listing_type !== "auction" && listing.sale_price != null && (
              <div>Preço: R$ {listing.sale_price.toFixed(2)}</div>
            )}
            {listing.listing_type === "trade" && (
              <div>Aceito: {listing.trade_accepts || "combinar"}</div>
            )}
            {listing.listing_type === "auction" && (
              <>
                <div>
                  Inicial:{" "}
                  {listing.auction_starting_price
                    ? `R$ ${listing.auction_starting_price.toFixed(2)}`
                    : "—"}
                </div>
                <div>
                  Início:{" "}
                  {listing.auction_start
                    ? new Date(listing.auction_start).toLocaleString()
                    : "—"}
                </div>
                <div>
                  Fim:{" "}
                  {listing.auction_end
                    ? new Date(listing.auction_end).toLocaleString()
                    : "—"}
                </div>
              </>
            )}

            <div className="flex gap-2">
              {listing.listing_type === "auction" &&
                listing.status === "open" && (
                  <Button onClick={() => setOpenBid(true)}>Dar lance</Button>
                )}
              {isOwner && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/trading/${listing.id}/edit`)}
                >
                  Editar anúncio
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Painel de lances ao vivo (apenas para leilão) */}
        {listing.listing_type === "auction" && (
          <BidsPanel
            tradeId={listing.id}
            allowCents={listing.auction_allow_cents}
            startingPrice={listing.auction_starting_price}
          />
        )}

        {listing.listing_type === "auction" && (
          <BidDialog
            open={openBid}
            onOpenChange={setOpenBid}
            tradeId={listing.id}
            allowCents={listing.auction_allow_cents}
            onPlaced={load}
          />
        )}
      </div>
    </div>
  );
}
