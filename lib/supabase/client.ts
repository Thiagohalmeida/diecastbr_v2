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
    supabaseClient = createBrowserClient(url, anon, {
      cookies: {
        getAll() {
          return document.cookie
            .split(';')
            .map(cookie => cookie.trim())
            .filter(cookie => cookie.length > 0)
            .map(cookie => {
              const [name, ...rest] = cookie.split('=');
              return { name: name.trim(), value: rest.join('=') };
            });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options = {} }) => {
            let cookieString = `${name}=${value}`;
            
            if (options.maxAge) {
              cookieString += `; max-age=${options.maxAge}`;
            }
            if (options.path) {
              cookieString += `; path=${options.path}`;
            }
            if (options.domain) {
              cookieString += `; domain=${options.domain}`;
            }
            if (options.secure) {
              cookieString += '; secure';
            }
            if (options.httpOnly) {
              cookieString += '; httponly';
            }
            if (options.sameSite) {
              cookieString += `; samesite=${options.sameSite}`;
            }
            
            document.cookie = cookieString;
          });
        },
      },
    });
  }

  return supabaseClient;
}
