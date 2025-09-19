import { createClient } from "@/lib/supabase/client";

export type Profile = {
  user_id: string;
  full_name: string | null;
  city: string | null;
  cep: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  contact_email: string | null;
  whatsapp: string | null;
  share_contact_email: boolean;
  share_whatsapp: boolean;
};

export async function getOrCreateMyProfile(): Promise<Profile> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && (error as any).code !== "PGRST116") throw error;

  if (!data) {
    const { data: inserted, error: insErr } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        full_name: user.user_metadata?.full_name ?? null,
        contact_email: user.email ?? null,
      })
      .select("*")
      .single();
    if (insErr) throw insErr;
    return inserted as Profile;
  }

  return data as Profile;
}

export async function upsertMyProfile(patch: Partial<Profile>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });

  if (error) throw error;
}

export type PublicContacts = {
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
};

export async function getPublicContacts(userId: string): Promise<PublicContacts> {
  const supabase = createClient();
  if (!userId) throw new Error("sellerId is empty");
  const { data, error } = await supabase
    .rpc("get_public_contacts", { p_user_id: userId })
    .single();
  if (error) throw error;
  return (data ?? {
    email: null, whatsapp: null, instagram: null, facebook: null, tiktok: null
  }) as PublicContacts;
}
