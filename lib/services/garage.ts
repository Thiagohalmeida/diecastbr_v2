// lib/services/garage.ts
import { createClient } from "@/lib/supabase/client";

export type ListingType = "none" | "sell" | "trade" | "auction" | "sell_or_trade";

export type AddMiniatureInput = {
  // master
  brand: string;
  model_name: string;
  launch_year?: number | null;
  base_color?: string | null;
  upc?: string | null;
  image_url?: string | null;

  // user_miniatures
  acquisition_date?: string | null;   // YYYY-MM-DD
  price_paid?: number | null;
  condition?: string | null;
  variants?: string | null;
  is_treasure_hunt?: boolean;
  is_super_treasure_hunt?: boolean;
  personal_notes?: string | null;

  // negócios
  listing_type?: ListingType;         // 'sell' | 'trade' | 'auction' | 'sell_or_trade' | 'none'
  sale_price?: number | null;         // se 'sell'
  trade_accepts?: string | null;      // se 'trade'
  auction_starting_price?: number | null; // se 'auction'
  auction_start?: string | null;      // ISO
  auction_end?: string | null;        // ISO
  auction_allow_cents?: boolean;      // se 'auction'
};

export async function addToGarage(input: AddMiniatureInput) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // 1) master
  let miniatureId: string | null = null;
  if (input.upc) {
    const { data: found } = await supabase
      .from("miniatures_master")
      .select("id")
      .eq("upc", input.upc)
      .eq("brand", input.brand)
      .maybeSingle();
    if (found?.id) miniatureId = found.id;
  }
  if (!miniatureId) {
    const { data: ins, error: e1 } = await supabase
      .from("miniatures_master")
      .insert({
        brand: input.brand,
        model_name: input.model_name,
        launch_year: input.launch_year ?? null,
        base_color: input.base_color ?? null,
        upc: input.upc ?? null,
        image_url: input.image_url ?? null,
      })
      .select("id")
      .single();
    if (e1) throw e1;
    miniatureId = ins.id;
  }

  // 2) garagem
  const { data: um, error: e2 } = await supabase
    .from("user_miniatures")
    .insert({
      user_id: user.id,
      miniature_id: miniatureId,
      acquisition_date: input.acquisition_date ?? null,
      price_paid: input.price_paid ?? null,
      condition: input.condition ?? null,
      variants: input.variants ?? null,
      is_treasure_hunt: !!input.is_treasure_hunt,
      is_super_treasure_hunt: !!input.is_super_treasure_hunt,
      personal_notes: input.personal_notes ?? null,
      for_sale: input.listing_type === "sell" || input.listing_type === "sell_or_trade",
      for_trade: input.listing_type === "trade" || input.listing_type === "sell_or_trade",
    })
    .select("id")
    .single();
  if (e2) throw e2;

  // 3) anúncio (se solicitado)
  if (input.listing_type && input.listing_type !== "none") {
    const payload: any = {
      owner_user_id: user.id,
      user_miniature_id: um.id,
      listing_type: input.listing_type,
      status: "open",
    };

    if (input.listing_type === "sell" || input.listing_type === "sell_or_trade") {
      payload.sale_price = input.sale_price ?? null;
    }
    if (input.listing_type === "trade") {
      payload.trade_accepts = input.trade_accepts ?? null;
    }
    if (input.listing_type === "auction") {
      payload.auction_starting_price = input.auction_starting_price ?? null;
      payload.auction_start = input.auction_start ?? null;
      payload.auction_end = input.auction_end ?? null;
      payload.auction_allow_cents = input.auction_allow_cents ?? true;
    }

    const { error: e3 } = await supabase.from("trade_listings").insert(payload);
    if (e3) throw e3;
  }

  return { userMiniatureId: um.id, miniatureId };
}
