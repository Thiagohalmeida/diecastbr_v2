"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Ouve mudanças de autenticação
    const { data } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, sess: Session | null) => {
        setSession(sess ?? null);
        setUser(sess?.user ?? null);
        setLoading(false);
      }
    );

    // Sessão inicial
    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        const sess = data.session ?? null;
        setSession(sess);
        setUser(sess?.user ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      // segurança para evitar undefined
      data?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    if (!supabase) return { error: new Error("Supabase não configurado") };

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      setSession(data.session ?? null);
      setUser(data.user ?? null);
    }

    // TS aceita porque o AuthError do supabase herda de Error
    return { error: (error as unknown as Error) ?? null };
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    const supabase = createClient();
    if (!supabase) return { error: new Error("Supabase não configurado") };

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: displayName ? { display_name: displayName } : undefined },
    });

    if (!error) {
      setSession(data.session ?? null);
      setUser(data.user ?? null);
    }

    return { error: (error as unknown as Error) ?? null };
  };

  const signOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
