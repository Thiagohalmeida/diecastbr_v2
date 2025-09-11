import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"

let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClient() {
  // Não criar cliente durante SSR
  if (typeof window === "undefined") {
    return null
  }

  // Verificar se as variáveis de ambiente estão definidas
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Erro crítico: Variáveis de ambiente do Supabase não encontradas")
    return null
  }

  // Criar cliente apenas uma vez (singleton)
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  
  return supabaseClient
}

// Não exportar instância direta para evitar uso inconsistente
// Sempre use createClient() para obter a instância
