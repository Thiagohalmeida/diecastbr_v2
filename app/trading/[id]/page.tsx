"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { BidDialog } from "@/components/trading/BidDialog";
import { BidsPanel } from "@/components/trading/BidsPanel";
import { SellerContactPanel } from "@/components/trading/SellerContactPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
// se você tiver o Badge do shadcn:
import { Badge } from "@/components/ui/badge";

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
    const { data: l, error: e1 } = await supabase
      .from("trade_listings")
      .select(
        [
          "id",
          "listing_type",
          "status",
          "sale_price",
          "trade_accepts",
          "auction_start",
          "auction_end",
          "auction_starting_price",
          "auction_allow_cents",
          "owner_user_id",
          "user_miniature_id",
        ].join(",")
      )
      .eq("id", id)
      .single();

    if (e1 || !l) {
      toast({ title: "Anúncio não encontrado", variant: "destructive" });
      router.replace("/trading");
      return;
    }

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

  const now = new Date();

  const statusLabel = useMemo(() => {
    if (!listing) return null;
    if (listing.listing_type !== "auction") return null;

    const start = listing.auction_start ? new Date(listing.auction_start) : null;
    const end = listing.auction_end ? new Date(listing.auction_end) : null;

    const hasStarted = start ? now >= start : true;
    const hasEnded = end ? now > end : false;

    if (listing.status !== "open") return { text: "Encerrado", color: "destructive" as const };
    if (hasEnded) return { text: "Encerrado", color: "destructive" as const };
    if (hasStarted) return { text: "Aceitando lances", color: "success" as const };
    return { text: "Aguardando início", color: "secondary" as const };
  }, [listing]);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">Carregando…</div>
      </div>
    );
  }

  const isOwner = user?.id === listing.owner_user_id;
  const isSale =
    listing.listing_type === "sell" || listing.listing_type === "sell_or_trade";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push("/trading")}>
            ← Voltar
          </Button>

          {statusLabel && (
            <Badge
              // shadcn badge variants: default / secondary / destructive … crie um "success" no seu tailwind se quiser
              variant={statusLabel.color === "destructive" ? "destructive" : "secondary"}
              className={
                statusLabel.color === "success"
                  ? "bg-green-600 text-white"
                  : statusLabel.color === "secondary"
                  ? ""
                  : ""
              }
            >
              {statusLabel.text}
            </Badge>
          )}
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
              {listing.brand} {listing.brand && listing.model_name ? "—" : ""}{" "}
              {listing.model_name}
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
                listing.status === "open" &&
                !(
                  listing.auction_end && now > new Date(listing.auction_end)
                ) && // evita lance depois do fim
                !isOwner && (
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
            startingPrice={listing.auction_starting_price}
            onPlaced={load}
          />
        )}

        {isSale && <SellerContactPanel sellerId={listing.owner_user_id} />}
      </div>
    </div>
  );
}
