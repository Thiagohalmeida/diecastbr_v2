// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (typeof window === "undefined") return null;

  if (!url || !anon) {
    console.error("[Supabase] Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local");
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createBrowserClient(url, anon);
  }

  return supabaseClient;
}
