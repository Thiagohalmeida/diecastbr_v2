"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/Navbar";
import { Car, ChevronLeft, Trophy } from "lucide-react";

type MiniMaster = Tables<"miniatures_master">;

export default function MiniatureDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [mini, setMini] = useState<MiniMaster | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        // 1) tenta como ID do catálogo
        const { data: master, error: e1 } = await supabase
          .from("miniatures_master")
          .select(
            "id, model_name, brand, launch_year, series, collection_number, base_color, upc, official_blister_photo_url"
          )
          .eq("id", id)
          .maybeSingle();

        if (mounted && master && !e1) {
          setMini(master as MiniMaster);
          return;
        }

        // 2) fallback: ID de user_miniatures -> projeta para o catálogo
        // alias 'master:miniature_id(...)' garante o aninhamento correto
        const { data: um, error: e2 } = await supabase
          .from("user_miniatures")
          .select(
            `
            id,
            miniature_id,
            master:miniature_id (
              id, model_name, brand, launch_year, series, collection_number, base_color, upc, official_blister_photo_url
            )
          `
          )
          .eq("id", id)
          .maybeSingle();

        if (!e2 && um && (um as any).master) {
          setMini((um as any).master as MiniMaster);
        }
      } finally {
        mounted && setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-5xl mx-auto p-4 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!mini) {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>Miniatura não encontrada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Não localizamos os dados desta miniatura no catálogo.
              </p>
              <Button variant="outline" onClick={() => router.back()}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const title = `${mini.brand ?? "Marca"} — ${mini.model_name ?? "Modelo"}`;
  const info = [
    { label: "Ano", value: mini.launch_year ?? "—" },
    { label: "Série", value: mini.series ?? "—" },
    { label: "Coleção", value: mini.collection_number ?? "—" },
    { label: "Cor", value: mini.base_color ?? "—" },
  ];

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="px-0 text-muted-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative w-full aspect-square bg-muted">
                {mini.official_blister_photo_url ? (
                  <Image
                    src={mini.official_blister_photo_url}
                    alt={title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Car className="h-10 w-10" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
              <Badge variant="secondary">Catálogo</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {info.map((i) => (
                <div key={i.label} className="p-3 rounded-md border bg-card/50">
                  <div className="text-xs text-muted-foreground">{i.label}</div>
                  <div className="text-sm font-medium">{String(i.value)}</div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Button onClick={() => router.push(`/add?prefill=${mini.id}`)}>
                <Trophy className="mr-2 h-4 w-4" />
                Adicionar à minha garagem
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
