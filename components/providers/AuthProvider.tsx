"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("[v1] AuthProvider useEffect - setting up auth listener")
    
    // Obter cliente Supabase centralizado
    const supabase = createClient()
    
    // Se não conseguir criar o cliente, definir erro e parar carregamento
    if (!supabase) {
      console.error("Erro crítico: Não foi possível criar cliente Supabase")
      setError("Erro de configuração do Supabase. Verifique as variáveis de ambiente.")
      setLoading(false)
      return
    }

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      console.log("[v1] Auth state change:", event, "session:", !!session, "user:", !!session?.user)
      if (session) {
        setUser(session.user)
        setSession(session)
      } else {
        setUser(null)
        setSession(null)
      }
      setLoading(false)
    })

    // Check for existing session
    const initSession = async () => {
      try {
        console.log("Inicializando sessão...")
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error("Erro ao obter sessão:", error)
          setError(error.message)
        } else if (data?.session) {
          console.log("Sessão encontrada durante inicialização")
          setUser(data.session.user)
          setSession(data.session)
        } else {
          console.log("Nenhuma sessão encontrada durante inicialização")
        }
      } catch (err) {
        console.error("Erro na inicialização da sessão:", err)
        setError("Falha ao inicializar sessão")
      } finally {
        setLoading(false)
      }
    }

    initSession()

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const supabase = createClient()
    if (!supabase) {
      return { error: new Error("Erro de configuração do Supabase") }
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (err) {
      console.error("Erro ao fazer login:", err)
      return { error: err instanceof Error ? err : new Error("Erro desconhecido ao fazer login") }
    }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    const supabase = createClient()
    if (!supabase) {
      return { error: new Error("Erro de configuração do Supabase") }
    }
    
    const redirectUrl =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: displayName ? { display_name: displayName } : undefined,
        },
      })
      return { error }
    } catch (err) {
      console.error("Erro ao criar conta:", err)
      return { error: err instanceof Error ? err : new Error("Erro desconhecido ao criar conta") }
    }
  }

  const signOut = async () => {
    const supabase = createClient()
    if (!supabase) {
      console.error("Erro de configuração do Supabase ao tentar fazer logout")
      return
    }
    
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error("Erro ao fazer logout:", err)
    }
  }

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
