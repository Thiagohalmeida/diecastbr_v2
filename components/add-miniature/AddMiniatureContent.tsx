"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/layout/Navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, Car, Save, Loader2, X, ImageIcon, Wand2, Search, Sparkles, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { OCRService } from "@/lib/ocr/tesseract"

interface MiniatureData {
  model_name: string
  brand: string
  launch_year: number | null
  series: string
  collection_number: string
  base_color: string
  acquisition_date: string
  price_paid: number | null
  condition: string
  variants: string
  is_treasure_hunt: boolean
  is_super_treasure_hunt: boolean
  personal_notes: string
  upc?: string
}

export function AddMiniatureContent() {
  const router = useRouter()
  const frontFileInputRef = useRef<HTMLInputElement>(null)
  const frontCameraInputRef = useRef<HTMLInputElement>(null)
  const backFileInputRef = useRef<HTMLInputElement>(null)
  const backCameraInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const [searchingDatabase, setSearchingDatabase] = useState(false)
  const [frontBlisterImage, setFrontBlisterImage] = useState<File | null>(null)
  const [frontBlisterImagePreview, setFrontBlisterImagePreview] = useState<string>("")
  const [backBlisterImage, setBackBlisterImage] = useState<File | null>(null)
  const [backBlisterImagePreview, setBackBlisterImagePreview] = useState<string>("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [ocrResults, setOcrResults] = useState<string>("")
  const [user, setUser] = useState<any>(null)

  const emptyForm: MiniatureData = {
    model_name: "",
    brand: "Hot Wheels",
    launch_year: null,
    series: "",
    collection_number: "",
    base_color: "",
    acquisition_date: new Date().toISOString().split("T")[0],
    price_paid: null,
    condition: "sealed",
    variants: "",
    is_treasure_hunt: false,
    is_super_treasure_hunt: false,
    personal_notes: "",
    upc: "",
  }

  const [formData, setFormData] = useState<MiniatureData>(emptyForm)

  const parseMiniatureInfoFromText = (text: string) => {
    const normText = text.toUpperCase()
    const lines = normText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    // Buscar possíveis nomes de modelos
    const possibleNames = lines.filter(
      (line) =>
        /^[A-Z0-9 -]{3,25}$/.test(line) &&
        !line.includes("HOT WHEELS") &&
        !line.includes("MATTEL") &&
        !line.includes("WARNING") &&
        !line.includes("SEGURANCA") &&
        !line.match(/(EMPOWERING|MADE IN|INMETRO|INDICADO|FABRICADO|PARTS|FOR AGES|CAUTION|WARNING)/),
    )

    // Nome/modelo
    const nameMatch = possibleNames[0]

    // Série
    const seriesMatch = lines.find((line) => /ART|CARS|ART CARS|HW ART CARS/.test(line))

    // Número da coleção
    const collectionNumberMatch = normText.match(/(\d{1,3}\s*[\\/]?\s*\d{1,3})/)

    // UPC
    const upcMatch = normText.match(/(\d{12,13})/)

    // Ano
    const yearMatch = normText.match(/(19|20)\d{2}/)

    return {
      model_name: nameMatch ? nameMatch.trim() : "",
      series: seriesMatch ? seriesMatch.trim() : "",
      collection_number: collectionNumberMatch ? collectionNumberMatch[0].replace(/\s+/g, "").replace("\\", "/") : "",
      upc: upcMatch ? upcMatch[1] : "",
      launch_year: yearMatch ? Number.parseInt(yearMatch[0]) : null,
    }
  }

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>, type: "front" | "back") => {
    const file = event.target.files?.[0]
    if (file) {
      if (type === "front") {
        setFrontBlisterImage(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setFrontBlisterImagePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setBackBlisterImage(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setBackBlisterImagePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const analyzeBlisterImages = async () => {
    if (!frontBlisterImage && !backBlisterImage) {
      toast({
        title: "Nenhuma imagem selecionada",
        description: "Por favor, tire pelo menos uma foto da frente ou verso do blister.",
        variant: "destructive",
      })
      return
    }

    setAnalyzingImage(true)
    setOcrResults("")

    try {
      const ocrService = new OCRService()
      const texts: string[] = []

      if (frontBlisterImage) {
        const frontText = await ocrService.extractText(frontBlisterImage)
        texts.push(frontText)
      }

      if (backBlisterImage) {
        const backText = await ocrService.extractText(backBlisterImage)
        texts.push(backText)
      }

      const fullText = texts.join("\n")
      setOcrResults(fullText)

      const info = parseMiniatureInfoFromText(fullText)

      // Atualizar formulário com dados extraídos
      setFormData((prev) => ({
        ...prev,
        ...info,
      }))

      toast({
        title: "Análise concluída!",
        description: "Texto extraído das imagens. Verifique e complete os campos.",
      })
    } catch (error) {
      console.error("Erro na análise OCR:", error)
      toast({
        title: "Erro na análise",
        description: "Falha ao processar a imagem. Tente novamente ou preencha manualmente.",
        variant: "destructive",
      })
    } finally {
      setAnalyzingImage(false)
    }
  }

  const searchInDatabase = async (modelName: string) => {
    if (!modelName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o nome do modelo para buscar.",
        variant: "destructive",
      })
      return
    }

    setSearchingDatabase(true)
    const supabase = createClient()

    if (!supabase) {
      toast({
        title: "Erro de configuração",
        description: "Cliente Supabase não está disponível. Verifique as configurações.",
        variant: "destructive",
      })
      setSearchingDatabase(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("miniatures_master")
        .select("*")
        .ilike("model_name", `%${modelName}%`)
        .limit(10)

      if (error) throw error

      setSearchResults(data || [])

      if (data && data.length > 0) {
        toast({
          title: "Modelos encontrados!",
          description: `Encontrados ${data.length} modelo(s) na base de dados.`,
        })
      } else {
        toast({
          title: "Nenhum modelo encontrado",
          description: "Não foram encontrados modelos com esse nome na base de dados.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message || "Erro ao buscar na base de dados.",
        variant: "destructive",
      })
    } finally {
      setSearchingDatabase(false)
    }
  }

  const fillFormWithCarData = (carData: any) => {
    setFormData({
      ...formData,
      model_name: carData.model_name || "",
      brand: carData.brand || "Hot Wheels",
      launch_year: carData.launch_year || null,
      series: carData.series || "",
      collection_number: carData.collection_number || "",
      base_color: carData.base_color || "",
    })

    setSearchResults([])

    toast({
      title: "Formulário preenchido!",
      description: "Os dados do modelo foram carregados. Complete as informações restantes.",
    })
  }

  const handleInputChange = (field: keyof MiniatureData, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.model_name || !formData.brand) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome do modelo e marca são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const supabase = createClient()

    if (!supabase) {
      toast({
        title: "Erro de configuração",
        description: "Cliente Supabase não está disponível. Verifique as configurações.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      // Verificar se miniatura já existe
      let miniatureId: string | undefined
      const { data: existingMiniature } = await supabase
        .from("miniatures_master")
        .select("id")
        .eq("model_name", formData.model_name)
        .eq("brand", formData.brand)
        .maybeSingle()

      if (existingMiniature) {
        miniatureId = existingMiniature.id
      } else {
        // Criar nova miniatura
        const { data: newMiniature, error: createError } = await supabase
          .from("miniatures_master")
          .insert({
            model_name: formData.model_name,
            brand: formData.brand,
            launch_year: formData.launch_year,
            series: formData.series,
            collection_number: formData.collection_number,
            base_color: formData.base_color,
          })
          .select("id")
          .single()

        if (createError) throw createError
        miniatureId = newMiniature.id
      }

      // Adicionar à coleção do usuário
      const { error: userMiniatureError } = await supabase.from("user_miniatures").insert({
        user_id: user.id,
        miniature_id: miniatureId,
        acquisition_date: formData.acquisition_date,
        price_paid: formData.price_paid,
        condition: formData.condition,
        variants: formData.variants,
        is_treasure_hunt: formData.is_treasure_hunt,
        is_super_treasure_hunt: formData.is_super_treasure_hunt,
        personal_notes: formData.personal_notes,
      })

      if (userMiniatureError) throw userMiniatureError

      toast({
        title: "Miniatura adicionada!",
        description: "Sua nova miniatura foi adicionada à coleção com sucesso.",
      })

      router.push("/garage")
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar miniatura",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Car className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Adicionar Miniatura</h1>
              <p className="text-muted-foreground text-lg">Fotografe o blister ou preencha os dados manualmente</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="camera" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotografar Blister
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Preencher Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="space-y-6">
            {/* Front Image Section */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="mr-2 h-5 w-5 text-blue-500" />
                  Foto da Frente do Blister
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {frontBlisterImagePreview ? (
                  <div className="relative">
                    <img
                      src={frontBlisterImagePreview || "/placeholder.svg"}
                      alt="Frente do blister"
                      className="w-full max-w-md mx-auto rounded-lg border border-border shadow-md"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 shadow-lg"
                      onClick={() => {
                        setFrontBlisterImage(null)
                        setFrontBlisterImagePreview("")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center bg-muted/20">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">Tire uma foto da frente do blister (com o carro)</p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 border-2 bg-transparent"
                    onClick={() => frontCameraInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Usar Câmera
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-2 bg-transparent"
                    onClick={() => frontFileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Escolher Arquivo
                  </Button>
                </div>
                <input
                  ref={frontCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageCapture(e, "front")}
                />
                <input
                  ref={frontFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageCapture(e, "front")}
                />
              </CardContent>
            </Card>

            {/* Back Image Section */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="mr-2 h-5 w-5 text-purple-500" />
                  Foto do Verso do Blister
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {backBlisterImagePreview ? (
                  <div className="relative">
                    <img
                      src={backBlisterImagePreview || "/placeholder.svg"}
                      alt="Verso do blister"
                      className="w-full max-w-md mx-auto rounded-lg border border-border shadow-md"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 shadow-lg"
                      onClick={() => {
                        setBackBlisterImage(null)
                        setBackBlisterImagePreview("")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center bg-muted/20">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Tire uma foto do verso do blister (com dados detalhados)
                    </p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 border-2 bg-transparent"
                    onClick={() => backCameraInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Usar Câmera
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-2 bg-transparent"
                    onClick={() => backFileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Escolher Arquivo
                  </Button>
                </div>
                <input
                  ref={backCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageCapture(e, "back")}
                />
                <input
                  ref={backFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageCapture(e, "back")}
                />
              </CardContent>
            </Card>

            {/* OCR Analysis Button */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/20">
              <CardContent className="pt-6">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                  onClick={analyzeBlisterImages}
                  disabled={(!frontBlisterImage && !backBlisterImage) || analyzingImage}
                >
                  {analyzingImage ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analisando imagens...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Analisar com IA
                    </>
                  )}
                </Button>

                {ocrResults && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <Label className="text-sm font-medium mb-2 block">Texto extraído:</Label>
                    <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {ocrResults}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wand2 className="mr-2 h-5 w-5 text-green-500" />
                  Preenchimento Manual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Preencha os dados manualmente ou use a busca na base de dados abaixo
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Database Search */}
        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5 text-green-500" />
              Buscar na Base de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Busque por modelos já cadastrados para preenchimento automático</p>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o nome do modelo (ex: Datsun 240Z)"
                value={formData.model_name}
                onChange={(e) => handleInputChange("model_name", e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    searchInDatabase(formData.model_name)
                  }
                }}
                className="border-0 bg-muted/50"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => searchInDatabase(formData.model_name)}
                disabled={searchingDatabase}
                className="border-2"
              >
                {searchingDatabase ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Modelos encontrados:</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((car, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors bg-card/50"
                      onClick={() => fillFormWithCarData(car)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{car.model_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {car.brand} • {car.launch_year} • {car.series}
                          </p>
                          {car.base_color && <Badge variant="outline">{car.base_color}</Badge>}
                        </div>
                        <Button size="sm" variant="ghost">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model_name">Nome do Modelo *</Label>
                  <Input
                    id="model_name"
                    value={formData.model_name}
                    onChange={(e) => handleInputChange("model_name", e.target.value)}
                    required
                    className="border-0 bg-muted/50"
                  />
                </div>
                <div>
                  <Label htmlFor="brand">Marca *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                    required
                    className="border-0 bg-muted/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="launch_year">Ano de Lançamento</Label>
                  <Input
                    id="launch_year"
                    type="number"
                    value={formData.launch_year || ""}
                    onChange={(e) =>
                      handleInputChange("launch_year", e.target.value ? Number.parseInt(e.target.value) : null)
                    }
                    className="border-0 bg-muted/50"
                  />
                </div>
                <div>
                  <Label htmlFor="series">Série</Label>
                  <Input
                    id="series"
                    value={formData.series}
                    onChange={(e) => handleInputChange("series", e.target.value)}
                    className="border-0 bg-muted/50"
                  />
                </div>
                <div>
                  <Label htmlFor="collection_number">Número na Coleção</Label>
                  <Input
                    id="collection_number"
                    value={formData.collection_number}
                    onChange={(e) => handleInputChange("collection_number", e.target.value)}
                    className="border-0 bg-muted/50"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="base_color">Cor Principal</Label>
                <Input
                  id="base_color"
                  value={formData.base_color}
                  onChange={(e) => handleInputChange("base_color", e.target.value)}
                  className="border-0 bg-muted/50"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Dados da sua Coleção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="acquisition_date">Data de Aquisição</Label>
                  <Input
                    id="acquisition_date"
                    type="date"
                    value={formData.acquisition_date}
                    onChange={(e) => handleInputChange("acquisition_date", e.target.value)}
                    className="border-0 bg-muted/50"
                  />
                </div>
                <div>
                  <Label htmlFor="price_paid">Valor Pago (R$)</Label>
                  <Input
                    id="price_paid"
                    type="number"
                    step="0.01"
                    value={formData.price_paid || ""}
                    onChange={(e) =>
                      handleInputChange("price_paid", e.target.value ? Number.parseFloat(e.target.value) : null)
                    }
                    className="border-0 bg-muted/50"
                  />
                </div>
                <div>
                  <Label htmlFor="condition">Condição</Label>
                  <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                    <SelectTrigger className="border-0 bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sealed">Lacrado</SelectItem>
                      <SelectItem value="loose">Solto</SelectItem>
                      <SelectItem value="damaged">Danificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="variants">Variantes</Label>
                <Input
                  id="variants"
                  value={formData.variants}
                  onChange={(e) => handleInputChange("variants", e.target.value)}
                  className="border-0 bg-muted/50"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_treasure_hunt"
                    checked={formData.is_treasure_hunt}
                    onCheckedChange={(checked) => handleInputChange("is_treasure_hunt", checked)}
                  />
                  <Label htmlFor="is_treasure_hunt">É um Treasure Hunt?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_super_treasure_hunt"
                    checked={formData.is_super_treasure_hunt}
                    onCheckedChange={(checked) => handleInputChange("is_super_treasure_hunt", checked)}
                  />
                  <Label htmlFor="is_super_treasure_hunt">É um Super Treasure Hunt?</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="personal_notes">Notas Pessoais</Label>
                <Textarea
                  id="personal_notes"
                  value={formData.personal_notes}
                  onChange={(e) => handleInputChange("personal_notes", e.target.value)}
                  rows={3}
                  className="border-0 bg-muted/50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-2 bg-transparent"
              onClick={() => router.push("/garage")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Adicionar à Coleção
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
