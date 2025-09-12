"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import {
  Plus,
  Car,
  Trophy,
  Calendar,
  TrendingUp,
  Sparkles,
  Gavel,
  Clock,
} from "lucide-react";
import type { Tables } from "@/lib/supabase/types";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

type Profile = Tables<"profiles">;
type UserMiniature = Tables<"user_miniatures"> & {
  miniatures_master: Tables<"miniatures_master"> | null;
};

type OpenAuctionCard = {
  id: string;
  auction_end: string | null;
  auction_starting_price: number | null;
  brand: string | null;
  model_name: string | null;
  image_url: string | null;
};

export function DashboardContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentMiniatures, setRecentMiniatures] = useState<UserMiniature[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // contagens corretas
  const [totalCount, setTotalCount] = useState(0);
  const [thCount, setThCount] = useState(0);
  const [monthAdds, setMonthAdds] = useState(0);
  const [daysCollecting, setDaysCollecting] = useState(0);

  // leilões
  const [activeAuctionsCount, setActiveAuctionsCount] = useState(0);
  const [featuredAuctions, setFeaturedAuctions] = useState<OpenAuctionCard[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setLoading(false);
          return;
        }

        setUser(user);

        await Promise.all([
          fetchUserProfile(user.id),
          fetchRecentMiniatures(user.id),
          fetchCounts(user.id),
          fetchAuctions(), // conta e top 3 leilões
        ]);

        // dias coletando pela data de criação do user (mais estável)
        if (user.created_at) {
          const created = new Date(user.created_at);
          const now = new Date();
          const diffMs = now.getTime() - created.getTime();
          const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          setDaysCollecting(days);
        } else {
          setDaysCollecting(0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!error) setProfile(data);
  };

  const fetchRecentMiniatures = async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_miniatures")
      .select(`*, miniatures_master (*)`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (!error) setRecentMiniatures((data ?? []) as UserMiniature[]);
  };

  const fetchCounts = async (userId: string) => {
    const supabase = createClient();

    // total
    const { count: total } = await supabase
      .from("user_miniatures")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    // TH / STH
    const { count: th } = await supabase
      .from("user_miniatures")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .or("is_treasure_hunt.eq.true,is_super_treasure_hunt.eq.true");

    // adições no mês (por created_at para manter consistência com listagem)
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const { count: month } = await supabase
      .from("user_miniatures")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", start.toISOString());

    setTotalCount(total ?? 0);
    setThCount(th ?? 0);
    setMonthAdds(month ?? 0);
  };

  const fetchAuctions = async () => {
    const supabase = createClient();

    // count de leilões ativos (globais)
    const { count: activeCount } = await supabase
      .from("trade_listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .eq("listing_type", "auction");

    setActiveAuctionsCount(activeCount ?? 0);

    // top 3 leilões (ordena por fim mais próximo)
    const { data: list } = await supabase
      .from("trade_listings")
      .select("id, user_miniature_id, auction_end, auction_starting_price")
      .eq("status", "open")
      .eq("listing_type", "auction")
      .order("auction_end", { ascending: true })
      .limit(3);

    const listings = (list ?? []) as {
      id: string;
      user_miniature_id: string;
      auction_end: string | null;
      auction_starting_price: number | null;
    }[];

    if (listings.length === 0) {
      setFeaturedAuctions([]);
      return;
    }

    // 2-pass join (estável e rápido)
    const umIds = listings.map((l) => l.user_miniature_id);
    const { data: ums } = await supabase
      .from("user_miniatures")
      .select("id, miniature_id")
      .in("id", umIds);

    const umMap = new Map<string, string>();
    (ums ?? []).forEach((u: any) => u.miniature_id && umMap.set(u.id, u.miniature_id));

    const miniIds = Array.from(umMap.values());
    const { data: masters } = await supabase
      .from("miniatures_master")
      .select("id, brand, model_name, image_url")
      .in("id", miniIds);

    const mMap = new Map<string, { brand: string | null; model_name: string | null; image_url: string | null }>();
    (masters ?? []).forEach((m: any) =>
      mMap.set(m.id, { brand: m.brand ?? null, model_name: m.model_name ?? null, image_url: m.image_url ?? null })
    );

    const merged: OpenAuctionCard[] = listings.map((l) => {
      const mid = umMap.get(l.user_miniature_id);
      const meta = (mid && mMap.get(mid)) || { brand: null, model_name: null, image_url: null };
      return {
        id: l.id,
        auction_end: l.auction_end,
        auction_starting_price: l.auction_starting_price,
        brand: meta.brand,
        model_name: meta.model_name,
        image_url: meta.image_url,
      };
    });

    setFeaturedAuctions(merged);
  };

  const stats = [
    {
      title: "Total de Miniaturas",
      value: totalCount,
      icon: Car,
      description: "Em sua coleção",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Treasure Hunts",
      value: thCount,
      icon: Trophy,
      description: "TH e STH encontrados",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Dias Coletando",
      value: daysCollecting,
      icon: Calendar,
      description: "Desde que se cadastrou",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Este Mês",
      value: monthAdds,
      icon: TrendingUp,
      description: "Novas adições",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Leilões Ativos",
      value: activeAuctionsCount,
      icon: Gavel,
      description: "Em andamento agora",
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
  ];

  if (loading) return <DashboardSkeleton />;

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Boas-vindas + Ações rápidas */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Car className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Bem-vindo, {profile?.display_name || user?.email?.split("@")[0] || "colecionador"}!
              </h1>
              <p className="text-muted-foreground text-lg">Gerencie sua coleção de miniaturas diecast</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => router.push("/add")}
            >
              <Plus className="mr-2 h-5 w-5" />
              Adicionar Miniatura
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push("/garage")} className="border-2">
              <Car className="mr-2 h-5 w-5" />
              Ver Minha Garagem
            </Button>
          </div>
        </div>

        {/* Cards de estatística (agora com 5 colunas no LG) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card
                key={i}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-card/50 backdrop-blur-sm"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Três colunas: Adições Recentes • Leilões em andamento • Dicas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Adições Recentes (mantido) */}
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                Adições Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentMiniatures.length > 0 ? (
                <div className="space-y-4">
                  {recentMiniatures.map((miniature) => (
                    <div
                      key={miniature.id}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Car className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {miniature.miniatures_master?.model_name || "Modelo não identificado"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {miniature.miniatures_master?.brand || "Marca não identificada"} •{" "}
                          {new Date(miniature.created_at).toLocaleDateString("pt-BR")}
                        </p>
                        {(miniature.is_treasure_hunt || miniature.is_super_treasure_hunt) && (
                          <div className="flex items-center mt-1">
                            <Trophy className="h-3 w-3 text-yellow-500 mr-1" />
                            <span className="text-xs text-yellow-600 font-medium">
                              {miniature.is_super_treasure_hunt ? "Super TH" : "Treasure Hunt"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhuma miniatura ainda.</p>
                  <Button variant="outline" onClick={() => router.push("/add")}>
                    Adicionar primeira miniatura
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leilões em andamento (novo) */}
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gavel className="mr-2 h-5 w-5 text-amber-600" />
                Leilões em andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {featuredAuctions.length > 0 ? (
                <div className="space-y-4">
                  {featuredAuctions.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      {a.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.image_url}
                          alt={`${a.brand ?? ""} ${a.model_name ?? ""}`}
                          className="w-16 h-12 rounded object-cover bg-muted"
                        />
                      ) : (
                        <div className="w-16 h-12 rounded bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {a.brand} — {a.model_name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>Inicial: {a.auction_starting_price != null ? `R$ ${a.auction_starting_price.toFixed(2)}` : "—"}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {a.auction_end ? new Date(a.auction_end).toLocaleString() : "—"}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => router.push(`/trading/${a.id}`)}>
                        Ver
                      </Button>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button variant="outline" className="w-full" onClick={() => router.push("/trading?tab=auction")}>
                      Ver todos os leilões
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Não há leilões em andamento no momento.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dicas para Colecionadores (mantido) */}
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                Dicas para Colecionadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-200/20">
                  <h4 className="font-semibold text-blue-600 mb-2 flex items-center">
                    <span className="mr-2">📸</span>
                    Fotografe o blister
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Use a função de leitura automática para catalogar rapidamente suas miniaturas
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-200/20">
                  <h4 className="font-semibold text-yellow-600 mb-2 flex items-center">
                    <span className="mr-2">🔍</span>
                    Treasure Hunts
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Marque suas TH e STH para acompanhar essas peças especiais
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-200/20">
                  <h4 className="font-semibold text-green-600 mb-2 flex items-center">
                    <span className="mr-2">📊</span>
                    Acompanhe valores
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Registre o valor pago para ter controle dos seus investimentos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
