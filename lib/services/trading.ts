// lib/services/trading.ts
import { createClient } from "@/lib/supabase/client";

export async function upsertListingForItem(
  userMiniatureId: string,
  data: {
    listing_type: "sell" | "trade" | "auction" | "sell_or_trade";
    sale_price?: number | null;
    trade_accepts?: string | null;
    auction_starting_price?: number | null;
    auction_start?: string | null;
    auction_end?: string | null;
    auction_allow_cents?: boolean;
  }
) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // se já existe anúncio para esse item e está 'open', atualiza; senão, cria
  const { data: exists } = await supabase
    .from("trade_listings")
    .select("id")
    .eq("user_miniature_id", userMiniatureId)
    .eq("status", "open")
    .maybeSingle();

  const payload: any = {
    owner_user_id: user.id,
    user_miniature_id: userMiniatureId,
    listing_type: data.listing_type,
    sale_price: data.sale_price ?? null,
    trade_accepts: data.trade_accepts ?? null,
    auction_starting_price: data.auction_starting_price ?? null,
    auction_start: data.auction_start ?? null,
    auction_end: data.auction_end ?? null,
    auction_allow_cents: data.auction_allow_cents ?? true,
    status: "open",
  };

  if (exists?.id) {
    const { error } = await supabase
      .from("trade_listings")
      .update(payload)
      .eq("id", exists.id);
    if (error) throw error;
    return exists.id;
  } else {
    const { data: ins, error } = await supabase
      .from("trade_listings")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    return ins.id;
  }
}

export async function placeBid(tradeId: string, amount: number) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase não configurado");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { error } = await supabase
    .from("trade_bids")
    .insert({ trade_id: tradeId, bidder_user_id: user.id, amount });
  if (error) throw error;
}
