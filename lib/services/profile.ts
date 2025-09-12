// lib/services/profile.ts
import { createClient } from "@/lib/supabase/client";

export type Profile = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  city: string | null;
  cep: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  avatar_url?: string | null;
};

export async function getOrCreateMyProfile(): Promise<Profile> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Usuário não autenticado");

  const { data, error, status } = await supabase
    .from("profiles")
    .select("user_id,email,full_name,city,cep,instagram,facebook,tiktok,avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error && status !== 406) throw error;

  if (!data) {
    const payload: Profile = {
      user_id: user.id,
      email: user.email ?? null,
      full_name: (user.user_metadata?.display_name as string) ?? null,
      city: null,
      cep: null,
      instagram: null,
      facebook: null,
      tiktok: null,
      avatar_url: null,
    };
    const { error: insErr } = await supabase.from("profiles").insert(payload);
    if (insErr) throw insErr;
    return payload;
  }

  return data as Profile;
}

export async function upsertMyProfile(patch: Partial<Profile>) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const payload: Profile = {
    user_id: user.id,
    email: patch.email ?? user.email ?? null,
    full_name: patch.full_name ?? null,
    city: patch.city ?? null,
    cep: patch.cep ?? null,
    instagram: patch.instagram ?? null,
    facebook: patch.facebook ?? null,
    tiktok: patch.tiktok ?? null,
    avatar_url: patch.avatar_url ?? null,
  };

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}
