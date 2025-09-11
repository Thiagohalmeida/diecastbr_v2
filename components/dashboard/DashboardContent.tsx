"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/layout/Navbar"
import { Plus, Car, Trophy, Calendar, TrendingUp, Sparkles } from "lucide-react"
import type { Tables } from "@/lib/supabase/types"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton" // Import DashboardSkeleton

type Profile = Tables<"profiles">
type UserMiniature = Tables<"user_miniatures"> & {
  miniatures_master: Tables<"miniatures_master"> | null
}

export function DashboardContent() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recentMiniatures, setRecentMiniatures] = useState<UserMiniature[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("Iniciando carregamento de dados do dashboard...")
        const supabase = createClient()
        if (!supabase) {
          console.error("Supabase client not initialized")
          setLoading(false)
          return
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error("Error fetching user:", userError)
          setLoading(false)
          return
        }

        if (!user) {
          console.error("No user found")
          setLoading(false)
          return
        }

        console.log("Usuário autenticado encontrado, carregando dados do perfil...")
        setUser(user)

        await fetchUserProfile(user.id)
        await fetchRecentMiniatures(user.id)
        console.log("Dados do dashboard carregados com sucesso")
      } catch (error) {
        console.error("Error in fetchUserData:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    const supabase = createClient()
    
    // Verificar se o cliente foi criado com sucesso
    if (!supabase) {
      console.error("Erro crítico: Não foi possível criar cliente Supabase ao buscar perfil")
      return
    }

    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
      throw error // Propagar erro para ser tratado no useEffect
    }
  }

  const fetchRecentMiniatures = async (userId: string) => {
    const supabase = createClient()
    
    // Verificar se o cliente foi criado com sucesso
    if (!supabase) {
      console.error("Erro crítico: Não foi possível criar cliente Supabase ao buscar miniaturas")
      return
    }

    try {
      const { data, error } = await supabase
        .from("user_miniatures")
        .select(`
          *,
          miniatures_master (*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) {
        console.error("Error fetching recent miniatures:", error)
        return
      }

      setRecentMiniatures(data || [])
    } catch (error) {
      console.error("Error fetching miniatures:", error)
      throw error // Propagar erro para ser tratado no useEffect
    }
  }

  const stats = [
    {
      title: "Total de Miniaturas",
      value: profile?.total_miniatures || 0,
      icon: Car,
      description: "Em sua coleção",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Treasure Hunts",
      value: recentMiniatures.filter((m) => m.is_treasure_hunt || m.is_super_treasure_hunt).length,
      icon: Trophy,
      description: "TH e STH encontrados",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Dias Coletando",
      value: profile?.created_at
        ? Math.floor((new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      icon: Calendar,
      description: "Desde que se cadastrou",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Este Mês",
      value: recentMiniatures.filter((m) => {
        const now = new Date()
        const created = new Date(m.created_at)
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length,
      icon: TrendingUp,
      description: "Novas adições",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ]

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Car className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Bem-vindo, {profile?.display_name || user?.email?.split("@")[0] || "Colecionador"}!
              </h1>
              <p className="text-muted-foreground text-lg">Gerencie sua coleção de miniaturas die-cast</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => router.push("/add")}
            >
              <Plus className="mr-2 h-5 w-5" />
              Adicionar Miniatura
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/garage")}
              className="border-2 hover:bg-muted/50"
            >
              <Car className="mr-2 h-5 w-5" />
              Ver Minha Garagem
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/trading")}
              className="border-2 hover:bg-muted/50"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Sistema de Trocas
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card
                key={index}
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
            )
          })}
        </div>

        {/* Recent Activity & Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
  )
}
