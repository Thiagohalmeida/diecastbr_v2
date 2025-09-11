"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/layout/Navbar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tag,
  Search,
  Phone,
  Mail,
  MessageSquare,
  Handshake,
  Filter,
  SortAsc,
  SortDesc,
  User,
  Calendar,
  DollarSign,
  Plus,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Tables } from "@/lib/supabase/types"

type TradingMiniature = Tables<"user_miniatures"> & {
  miniatures_master: Tables<"miniatures_master"> & {
    disponivel_para_negocio?: boolean
    preco_negociacao?: number | null
    contato_negociacao?: string | null
    observacoes_negociacao?: string | null
  }
  profiles: {
    display_name: string | null
    city: string | null
  } | null
}

export function TradingContent() {
  const router = useRouter()
  const [miniatures, setMiniatures] = useState<TradingMiniature[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredMiniatures, setFilteredMiniatures] = useState<TradingMiniature[]>([])
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price_low" | "price_high">("newest")
  const [filterBrand, setFilterBrand] = useState("all")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      await fetchTradingMiniatures()
    }

    getUser()
  }, [])

  useEffect(() => {
    filterAndSortMiniatures()
  }, [searchTerm, miniatures, sortBy, filterBrand])

  const fetchTradingMiniatures = async () => {
    const supabase = createClient()

    try {
      setLoading(true)

      // Buscar miniaturas de usuários que têm pelo menos uma disponível para negociação
      const { data, error } = await supabase
        .from("user_miniatures")
        .select(`
          *,
          miniatures_master (*),
          profiles (display_name, city)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar miniaturas para negociação:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as miniaturas disponíveis para negociação.",
          variant: "destructive",
        })
        return
      }

      // Filtrar apenas miniaturas que estão disponíveis para negociação
      // (simulando que algumas estão disponíveis - na implementação real isso viria do banco)
      const tradingMiniatures = (data || []).filter((item, index) => {
        // Simulando que 30% das miniaturas estão disponíveis para negociação
        return index % 3 === 0
      })

      setMiniatures(tradingMiniatures)
    } catch (error) {
      console.error("Erro:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar as miniaturas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortMiniatures = () => {
    let filtered = miniatures

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (miniature) =>
          miniature.miniatures_master?.model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          miniature.miniatures_master?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          miniature.miniatures_master?.series?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro de marca
    if (filterBrand !== "all") {
      filtered = filtered.filter((miniature) => miniature.miniatures_master?.brand === filterBrand)
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "price_low":
          const priceA = a.price_paid || 0
          const priceB = b.price_paid || 0
          return priceA - priceB
        case "price_high":
          const priceA2 = a.price_paid || 0
          const priceB2 = b.price_paid || 0
          return priceB2 - priceA2
        default:
          return 0
      }
    })

    setFilteredMiniatures(filtered)
  }

  const getUniqueValues = (key: keyof NonNullable<TradingMiniature["miniatures_master"]>) => {
    const values = miniatures
      .map((m) => m.miniatures_master?.[key])
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .map((v) => String(v))
    return values.sort()
  }

  const getContactIcon = (contactInfo: string) => {
    if (contactInfo.includes("@")) {
      return <Mail className="h-4 w-4" />
    } else if (contactInfo.includes("whatsapp") || /^\d+$/.test(contactInfo)) {
      return <Phone className="h-4 w-4" />
    } else {
      return <MessageSquare className="h-4 w-4" />
    }
  }

  const handleContactSeller = (miniature: TradingMiniature) => {
    // Simular informações de contato
    const contactInfo = miniature.profiles?.display_name
      ? `${miniature.profiles.display_name}@email.com`
      : "contato@exemplo.com"

    toast({
      title: "Informações de Contato",
      description: `Entre em contato: ${contactInfo}`,
    })
  }

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <Handshake className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sistema de Trocas</h1>
              <p className="text-muted-foreground text-lg">
                Encontre miniaturas que outros colecionadores estão dispostos a negociar
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Filtros e Busca</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por modelo, marca..."
                  className="pl-10 border-0 bg-muted/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Brand Filter */}
              <Select value={filterBrand} onValueChange={setFilterBrand}>
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

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="border-0 bg-muted/50">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <div className="flex items-center">
                      <SortDesc className="mr-2 h-4 w-4" />
                      Mais recentes
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center">
                      <SortAsc className="mr-2 h-4 w-4" />
                      Mais antigos
                    </div>
                  </SelectItem>
                  <SelectItem value="price_low">
                    <div className="flex items-center">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Menor preço
                    </div>
                  </SelectItem>
                  <SelectItem value="price_high">
                    <div className="flex items-center">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Maior preço
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Add your miniature button */}
              <Button
                onClick={() => router.push("/add")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Miniatura
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {loading ? "Carregando..." : `${filteredMiniatures.length} miniatura(s) disponível(is) para negociação`}
          </p>
        </div>

        {/* Miniatures Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="border-0 shadow-lg animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMiniatures.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMiniatures.map((miniature) => (
              <Card
                key={miniature.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-card/50 backdrop-blur-sm group"
              >
                <div className="relative h-48 bg-muted/30 rounded-t-lg overflow-hidden">
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
                    <div className="flex items-center justify-center h-full">
                      <span className="text-muted-foreground">Sem imagem</span>
                    </div>
                  )}

                  {/* Trading badge */}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                      <Handshake className="w-3 h-3 mr-1" />
                      Disponível
                    </Badge>
                  </div>

                  {/* Treasure Hunt badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {miniature.is_super_treasure_hunt && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs shadow-lg">
                        STH
                      </Badge>
                    )}
                    {miniature.is_treasure_hunt && !miniature.is_super_treasure_hunt && (
                      <Badge className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-xs shadow-lg">
                        TH
                      </Badge>
                    )}
                  </div>
                </div>

                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-green-600 transition-colors">
                    {miniature.miniatures_master?.model_name || "Modelo não identificado"}
                  </CardTitle>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="font-medium">{miniature.miniatures_master?.brand}</span>
                    {miniature.miniatures_master?.launch_year && <span>{miniature.miniatures_master.launch_year}</span>}
                  </div>
                  {miniature.miniatures_master?.series && (
                    <div className="flex items-center mt-1">
                      <Tag className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {miniature.miniatures_master.series}
                      </span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    {/* Price */}
                    <div className="font-bold text-lg text-green-600">
                      {miniature.price_paid ? `R$ ${miniature.price_paid.toFixed(2)}` : "Preço a combinar"}
                    </div>

                    {/* Owner info */}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-3 w-3 mr-1" />
                      <span>{miniature.profiles?.display_name || "Colecionador"}</span>
                      {miniature.profiles?.city && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{miniature.profiles.city}</span>
                        </>
                      )}
                    </div>

                    {/* Acquisition date */}
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Adquirido em {new Date(miniature.acquisition_date || "").toLocaleDateString("pt-BR")}</span>
                    </div>

                    {/* Condition */}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          miniature.condition === "sealed"
                            ? "border-green-200 text-green-600"
                            : miniature.condition === "loose"
                              ? "border-yellow-200 text-yellow-600"
                              : "border-red-200 text-red-600"
                        }`}
                      >
                        {miniature.condition === "sealed"
                          ? "Lacrado"
                          : miniature.condition === "loose"
                            ? "Solto"
                            : "Danificado"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    onClick={() => handleContactSeller(miniature)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Entrar em Contato
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="p-6 bg-muted/20 rounded-full w-fit mx-auto mb-6">
              <Handshake className="h-16 w-16 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchTerm || filterBrand !== "all"
                ? "Nenhuma miniatura encontrada"
                : "Nenhuma miniatura disponível para negociação"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm || filterBrand !== "all"
                ? "Tente ajustar os filtros ou fazer uma nova busca."
                : "Seja o primeiro a disponibilizar suas miniaturas para negociação!"}
            </p>
            <Button
              onClick={() => router.push("/add")}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Miniatura para Troca
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
