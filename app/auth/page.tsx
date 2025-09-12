"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

import { Mail, Lock, User, Loader2 } from "lucide-react";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // "Esqueci a senha"
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // base URL para o redirect do Supabase
  const redirectBase = useMemo(() => {
    if (typeof window !== "undefined") return window.location.origin;
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  }, []);

  useEffect(() => {
    // limpar os campos ao trocar de aba
    setEmail("");
    setPassword("");
  }, [mode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email.trim(), password);
        if (error) throw error;

        toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
        router.replace("/dashboard");
        return;
      }

      // cadastro
      const { error } = await signUp(email.trim(), password, displayName.trim() || undefined);
      if (error) throw error;

      toast({
        title: "Cadastro criado",
        description:
          "Se a confirmação por e-mail estiver ativa no projeto, verifique sua caixa de entrada.",
      });
      // opcional: já direcionar pro dashboard se não exigir confirmação
      router.replace("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast({
        title: mode === "login" ? "Erro ao entrar" : "Erro ao cadastrar",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onSendReset = async () => {
    const supabase = createClient();
    if (!supabase) {
      toast({ title: "Configuração inválida do Supabase", variant: "destructive" });
      return;
    }
    if (!forgotEmail) {
      toast({ title: "Informe seu e-mail para recuperar a senha." });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${redirectBase}/auth/reset`,
      });
      if (error) throw error;

      toast({
        title: "E-mail enviado",
        description: "Verifique sua caixa de entrada para redefinir a senha.",
      });
      setForgotOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao enviar o e-mail",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 overflow-hidden rounded-full bg-muted flex items-center justify-center">
            <Image src="/logo_512.png" width={64} height={64} alt="Diecast BR Logo" />
          </div>
          <CardTitle className="text-2xl">Diecast BR Garage</CardTitle>
          <CardDescription>Sua garagem virtual de miniaturas die-cast</CardDescription>

          {/* Abas simples */}
          <div className="mt-4 grid grid-cols-2 gap-2 p-1 rounded-md bg-muted">
            <Button
              type="button"
              variant={mode === "login" ? "default" : "ghost"}
              className="w-full"
              onClick={() => setMode("login")}
            >
              Entrar
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "ghost"}
              className="w-full"
              onClick={() => setMode("signup")}
            >
              Cadastrar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    placeholder="Seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                {mode === "login"
                  ? "Use seu e-mail e senha para entrar."
                  : "Criaremos sua conta com estes dados."}
              </span>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotOpen(true);
                }}
                className="text-xs text-primary hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Entrando..." : "Cadastrando..."}
                </>
              ) : mode === "login" ? (
                "Entrar"
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          {/* Modal simples de recuperação */}
          {forgotOpen && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-lg border bg-background p-4 shadow-xl">
                <h3 className="text-lg font-semibold mb-1">Recuperar senha</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enviaremos um link para redefinir sua senha.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setForgotOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={onSendReset}>Enviar link</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
