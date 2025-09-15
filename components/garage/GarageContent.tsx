"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/layout/Navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Car, Calendar, Trophy, Star, Plus, Grid3X3, List, SlidersHorizontal, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Tables } from "@/lib/supabase/types"
import { GarageSkeleton } from "@/components/garage/GarageSkeleton"
import { GarageError } from "./GarageError";

type Miniature = Tables<"user_miniatures"> & {
  miniatures_master: Tables<"miniatures_master"> | null
}

export function GarageContent() {
  const router = useRouter()
  const [miniatures, setMiniatures] = useState<Miniature[]>([])
  const [filteredMiniatures, setFilteredMiniatures] = useState<Miniature[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("all")
  const [selectedCondition, setSelectedCondition] = useState("all")
  const [showTreasureHunts, setShowTreasureHunts] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [user, setUser] = useState<any>(null)
  const [databaseError, setDatabaseError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase!.auth.getUser()
      setUser(user)

      if (user) {
        await fetchMiniatures(user.id)
      }
      setLoading(false)
    }

    getUser()
  }, [])

  useEffect(() => {
    filterMiniatures()
  }, [miniatures, searchTerm, selectedBrand, selectedCondition, showTreasureHunts])

  const fetchMiniatures = async (userId: string) => {
    const supabase = createClient()

    try {
      // Verificar se a tabela user_miniatures existe
      const { error: tableCheckError } = await supabase!
        .from("user_miniatures")
        .select("id")
        .limit(1)
        .single()

      if (tableCheckError && (tableCheckError.message.includes("relation \"user_miniatures\" does not exist") ||
          tableCheckError.message.includes("Could not find the table"))) {
        setDatabaseError("A tabela 'user_miniatures' não existe no banco de dados. Execute o script de inicialização.")
        return
      }

      // Verificar se a tabela miniatures_master existe
      const { error: masterTableCheckError } = await supabase!
        .from("miniatures_master")
        .select("id")
        .limit(1)
        .single()

      if (masterTableCheckError && (masterTableCheckError.message.includes("relation \"miniatures_master\" does not exist") ||
          masterTableCheckError.message.includes("Could not find the table"))) {
        setDatabaseError("A tabela 'miniatures_master' não existe no banco de dados. Execute o script de inicialização.")
        return
      }

      const { data, error } = await supabase!
        .from("user_miniatures")
        .select(`
          *,
          miniatures_master (*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching miniatures:", error)
        setDatabaseError(error.message)
        return
      }

      setMiniatures(data || [])
      setDatabaseError(null)
    } catch (error: any) {
      console.error("Error fetching miniatures:", error)
      setDatabaseError(error?.message || "Não foi possível carregar sua coleção")
    }
  }

  const filterMiniatures = () => {
    let filtered = miniatures

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (miniature) =>
          miniature.miniatures_master?.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          miniature.miniatures_master?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          miniature.miniatures_master?.series?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Brand filter
    if (selectedBrand !== "all") {
      filtered = filtered.filter((miniature) => miniature.miniatures_master?.brand === selectedBrand)
    }

    // Condition filter
    if (selectedCondition !== "all") {
      filtered = filtered.filter((miniature) => miniature.condition === selectedCondition)
    }

    // Treasure Hunt filter
    if (showTreasureHunts === "th") {
      filtered = filtered.filter((miniature) => miniature.is_treasure_hunt || miniature.is_super_treasure_hunt)
    } else if (showTreasureHunts === "sth") {
      filtered = filtered.filter((miniature) => miniature.is_super_treasure_hunt)
    }

    setFilteredMiniatures(filtered)
  }

  const getUniqueValues = (key: keyof NonNullable<Miniature["miniatures_master"]>) => {
    const values = miniatures
      .map((m) => m.miniatures_master?.[key])
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .map((v) => String(v))
    return values.sort()
  }

  const getConditionLabel = (condition: string) => {
    const labels = {
      sealed: "Lacrado",
      loose: "Solto",
      damaged: "Danificado",
    }
    return labels[condition as keyof typeof labels] || condition
  }

  const getConditionColor = (condition: string) => {
    const colors = {
      sealed: "bg-green-500/10 text-green-600 border-green-200/20",
      loose: "bg-yellow-500/10 text-yellow-600 border-yellow-200/20",
      damaged: "bg-red-500/10 text-red-600 border-red-200/20",
    }
    return colors[condition as keyof typeof colors] || "bg-muted"
  }

  if (loading) {
    return <GarageSkeleton />
  }

  // Renderizar o componente de erro de banco de dados se houver um erro
  if (databaseError) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[70vh]">
          <GarageError 
            errorMessage={databaseError}
            onRetry={() => {
              setDatabaseError(null);
              setLoading(true);
              if (user) fetchMiniatures(user.id);
            }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Car className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Minha Garagem</h1>
                <p className="text-muted-foreground text-lg">
                  {miniatures.length} miniatura{miniatures.length !== 1 ? "s" : ""} em sua coleção
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted/50 rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                onClick={() => router.push("/add")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar modelo, marca ou série..."
                  className="pl-10 border-0 bg-muted/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Brand Filter */}
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="border-0 bg-muted/50">
                  <SelectValue placeholder="Filtrar por marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as marcas</SelectItem>
                  {getUniqueValues("brand").map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Condition Filter */}
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger className="border-0 bg-muted/50">
                  <SelectValue placeholder="Filtrar por condição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as condições</SelectItem>
                  <SelectItem value="sealed">Lacrado</SelectItem>
                  <SelectItem value="loose">Solto</SelectItem>
                  <SelectItem value="damaged">Danificado</SelectItem>
                </SelectContent>
              </Select>

              {/* Treasure Hunt Filter */}
              <Select value={showTreasureHunts} onValueChange={setShowTreasureHunts}>
                <SelectTrigger className="border-0 bg-muted/50">
                  <SelectValue placeholder="Treasure Hunts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="th">Treasure Hunts</SelectItem>
                  <SelectItem value="sth">Super Treasure Hunts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {searchTerm || selectedBrand !== "all" || selectedCondition !== "all" || showTreasureHunts !== "all" ? (
          <div className="mb-6">
            <p className="text-muted-foreground">
              Mostrando {filteredMiniatures.length} de {miniatures.length} miniaturas
            </p>
          </div>
        ) : null}

        {/* Miniatures Grid/List */}
        {filteredMiniatures.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-6 bg-muted/20 rounded-full w-fit mx-auto mb-6">
              <Car className="h-16 w-16 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {miniatures.length === 0 ? "Sua garagem está vazia" : "Nenhuma miniatura encontrada"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {miniatures.length === 0
                ? "Adicione sua primeira miniatura para começar sua coleção!"
                : "Tente ajustar os filtros ou fazer uma nova busca."}
            </p>
            {miniatures.length === 0 && (
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={() => router.push("/add")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeira Miniatura
              </Button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
            }
          >
            {filteredMiniatures.map((miniature) => (
              <Card
                key={miniature.id}
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group bg-card/50 backdrop-blur-sm ${
                  viewMode === "list" ? "p-4" : ""
                }`}
              onClick={() => router.push(`/miniature/${miniature.miniatures_master?.id ?? miniature.id}`)}
              >
                <CardContent className={viewMode === "grid" ? "p-4" : "p-0"}>
                  <div className={viewMode === "list" ? "flex items-center gap-4" : ""}>
                    {/* Image */}
                    <div
                      className={`relative bg-muted/30 rounded-lg overflow-hidden ${
                        viewMode === "list" ? "w-20 h-20 flex-shrink-0" : "aspect-square mb-4"
                      }`}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        {miniature.miniatures_master?.official_blister_photo_url ||
                        (miniature.user_photos_urls && miniature.user_photos_urls.length > 0) ? (
                          <img
                            src={
                              miniature.user_photos_urls?.[0] ||
                              miniature.miniatures_master?.official_blister_photo_url ||
                              "/placeholder.svg" ||
                              "/placeholder.svg"
                            }
                            alt={miniature.miniatures_master?.model_name || "Miniatura"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <Car className="h-8 w-8 text-muted-foreground/50" />
                        )}
                      </div>

                      {/* Badges overlay */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {miniature.is_super_treasure_hunt && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs shadow-lg">
                            <Star className="w-3 h-3 mr-1" />
                            STH
                          </Badge>
                        )}
                        {miniature.is_treasure_hunt && !miniature.is_super_treasure_hunt && (
                          <Badge className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-xs shadow-lg">
                            <Trophy className="w-3 h-3 mr-1" />
                            TH
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className={`space-y-2 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {miniature.miniatures_master?.model_name || "Modelo não identificado"}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium">{miniature.miniatures_master?.brand}</span>
                        <span>{miniature.miniatures_master?.launch_year}</span>
                      </div>

                      {miniature.miniatures_master?.series && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {miniature.miniatures_master.series}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <Badge className={`text-xs border ${getConditionColor(miniature.condition || "")}`}>
                          {getConditionLabel(miniature.condition || "")}
                        </Badge>

                        {miniature.acquisition_date && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(miniature.acquisition_date).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </div>

                      {viewMode === "list" && miniature.price_paid && (
                        <div className="text-sm font-semibold text-green-600">R$ {miniature.price_paid.toFixed(2)}</div>
                      )}
                    </div>

                    {viewMode === "list" && (
                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
