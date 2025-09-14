"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

type Master = {
  id: string;
  brand: string | null;
  model_name: string | null;
  image_url: string | null;
  series?: string | null;
  launch_year?: number | null;
  base_color?: string | null;
};

type UM = {
  id: string;
  user_id: string;
  purchase_price?: number | null;
  acquisition_date?: string | null;
  condition?: string | null;
  is_treasure_hunt: boolean;
  is_super_treasure_hunt: boolean;
  notes?: string | null;
  miniature_id?: string | null; // FK para miniatures_master (se existir no seu schema)
  miniatures_master: Master | null;
};

export default function MiniatureDetailPage() {
  const { id } = useParams<{ id: string }>(); // <- parâmetro da rota
  const router = useRouter();
  const { user, loading: authLoading } = useAuth() as any;

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<UM | null>(null);

  useEffect(() => {
    if (authLoading) return;           // 1) só consulta depois do auth carregar
    if (!user) return;                 // se não logado, não consulta
    if (!id) return;

    const supabase = createClient();
    let cancelled = false;

    async function load() {
      setLoading(true);

      // SELECT pelo ID da tabela user_miniatures (o mais comum)
      const baseSelect = `
        id, user_id, purchase_price, acquisition_date, condition,
        is_treasure_hunt, is_super_treasure_hunt, notes, miniature_id,
        miniatures_master:miniatures_master (*)
      `;

      let { data, error } = await supabase
        .from("user_miniatures")
        .select(baseSelect)
        .eq("id", id)
        .eq("user_id", user.id) // reforça RLS
        .maybeSingle();

      // Se não achou, tenta como fallback pelo FK (caso a rota esteja recebendo o id do master)
      if (!error && !data) {
        const alt = await supabase
          .from("user_miniatures")
          .select(baseSelect)
          .eq("miniature_id", id)
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        data = alt.data ?? null;
      }

      if (cancelled) return;

      if (error) {
        console.error("Erro ao buscar miniatura:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes da miniatura.",
          variant: "destructive",
        });
        setRow(null);
      } else {
        setRow((data as unknown as UM) ?? null);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading]);

  if (authLoading || loading) {
    return <div className="container py-10">Carregando…</div>;
  }

  if (!row) {
    return (
      <div className="container py-24 text-center">
        <p className="text-lg mb-6">
          Miniatura não encontrada ou você não tem permissão para visualizá-la.
        </p>
        <Button onClick={() => router.push("/garage")}>
          ← Voltar para a Garagem
        </Button>
      </div>
    );
  }

  const m = row.miniatures_master;

  return (
    <div className="container py-8">
      <div className="mb-4">
        <Button variant="outline" onClick={() => router.back()}>
          ← Voltar
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <img
          src={m?.image_url ?? "/placeholder.svg"}
          alt={m?.model_name ?? "Miniatura"}
          className="w-full md:w-80 rounded-lg bg-muted object-cover"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">
            {m?.brand} — {m?.model_name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {m?.series ?? "—"} • {m?.launch_year ?? "—"}
          </p>

          <div className="mt-4 space-y-1 text-sm">
            <div>Condição: {row.condition ?? "—"}</div>
            <div>
              TH/STH:{" "}
              {row.is_super_treasure_hunt
                ? "Super Treasure Hunt"
                : row.is_treasure_hunt
                ? "Treasure Hunt"
                : "—"}
            </div>
            <div>
              Pago:{" "}
              {row.purchase_price != null
                ? `R$ ${Number(row.purchase_price).toFixed(2)}`
                : "—"}
            </div>
            <div>
              Data de aquisição:{" "}
              {row.acquisition_date
                ? new Date(row.acquisition_date).toLocaleDateString("pt-BR")
                : "—"}
            </div>
            <div>Cor: {m?.base_color ?? "—"}</div>
          </div>

          {row.notes && (
            <div className="mt-4 p-3 rounded bg-muted/40">
              <div className="text-xs text-muted-foreground mb-1">
                Notas pessoais
              </div>
              <div className="text-sm">{row.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
