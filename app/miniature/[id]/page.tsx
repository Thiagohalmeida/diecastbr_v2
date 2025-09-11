"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { supabase } from "@/integrations/supabase/client"
import { Navbar } from "@/components/layout/Navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Save, Loader2, X, ArrowLeft, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface MiniatureData {
  id?: string
  model_name: string
  brand: string
  launch_year: number | null
  series: string
  collection_number: string
  base_color: string
  upc: string
  acquisition_date: string
  condition: string
  is_treasure_hunt: boolean
  is_super_treasure_hunt: boolean
  price_paid: number | null
  variants: string
  personal_notes: string
  user_photos_urls: string[]
  official_blister_photo_url: string
  disponivel_para_negocio: boolean
  preco_negociacao: number | null
  contato_negociacao: string
  observacoes_negociacao: string
}

export default function MiniatureDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [miniature, setMiniature] = useState<MiniatureData | null>(null)
  const [formData, setFormData] = useState<MiniatureData | null>(null)
  const [userPhotos, setUserPhotos] = useState<string[]>([])
  const [deletingMiniature, setDeletingMiniature] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchMiniatureDetails = async () => {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from("user_miniatures")
          .select(`
            id,
            acquisition_date,
            condition,
            is_treasure_hunt,
            is_super_treasure_hunt,
            price_paid,
            variants,
            personal_notes,
            user_photos_urls,
            disponivel_para_negocio,
            preco_negociacao,
            contato_negociacao,
            observacoes_negociacao,
            miniatures_master (
              id, 
              model_name, 
              brand, 
              launch_year, 
              series, 
              collection_number, 
              base_color, 
              upc, 
              official_blister_photo_url
            )
          `)
          .eq("id", id)
          .eq("user_id", user?.id)
          .single()

        if (error) {
          throw error
        }

        if (data) {
          const miniatureData: MiniatureData = {
            id: data.id,
            model_name: data.miniatures_master.model_name,
            brand: data.miniatures_master.brand,
            launch_year: data.miniatures_master.launch_year,
            series: data.miniatures_master.series,
            collection_number: data.miniatures_master.collection_number,
            base_color: data.miniatures_master.base_color,
            upc: data.miniatures_master.upc || "",
            acquisition_date: data.acquisition_date || "",
            condition: data.condition || "",
            is_treasure_hunt: data.is_treasure_hunt || false,
            is_super_treasure_hunt: data.is_super_treasure_hunt || false,
            price_paid: data.price_paid || null,
            variants: data.variants || "",
            personal_notes: data.personal_notes || "",
            user_photos_urls: data.user_photos_urls || [],
            official_blister_photo_url: data.miniatures_master.official_blister_photo_url || "",
            disponivel_para_negocio: data.disponivel_para_negocio || false,
            preco_negociacao: data.preco_negociacao || null,
            contato_negociacao: data.contato_negociacao || "",
            observacoes_negociacao: data.observacoes_negociacao || "",
          }

          setMiniature(miniatureData)
          setFormData(miniatureData)
          setUserPhotos(miniatureData.user_photos_urls || [])
        }
      } catch (error: any) {
        console.error("Erro ao buscar detalhes da miniatura:", error.message)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes da miniatura.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMiniatureDetails()
  }, [id, user, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!formData) return

    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    if (!formData) return

    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleNumberChange = (name: string, value: string) => {
    if (!formData) return

    setFormData({
      ...formData,
      [name]: value === "" ? null : Number.parseFloat(value),
    })
  }

  const handleSave = async () => {
    if (!formData || !id || !user || !miniature) return

    try {
      setSaving(true)

      const { error: userMiniatureError } = await supabase
        .from("user_miniatures")
        .update({
          acquisition_date: formData.acquisition_date,
          condition: formData.condition,
          is_treasure_hunt: formData.is_treasure_hunt,
          is_super_treasure_hunt: formData.is_super_treasure_hunt,
          price_paid: formData.price_paid,
          variants: formData.variants,
          personal_notes: formData.personal_notes,
          user_photos_urls: userPhotos,
          disponivel_para_negocio: formData.disponivel_para_negocio,
          preco_negociacao: formData.preco_negociacao,
          contato_negociacao: formData.contato_negociacao,
          observacoes_negociacao: formData.observacoes_negociacao,
        })
        .eq("id", id)
        .eq("user_id", user.id)

      if (userMiniatureError) {
        throw userMiniatureError
      }

      toast({
        title: "Sucesso",
        description: "Miniatura atualizada com sucesso!",
      })

      router.push("/garage")
    } catch (error: any) {
      console.error("Erro ao atualizar miniatura:", error.message)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a miniatura.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !user) return

    try {
      setDeletingMiniature(true)

      const { error } = await supabase.from("user_miniatures").delete().eq("id", id).eq("user_id", user.id)

      if (error) {
        throw error
      }

      toast({
        title: "Sucesso",
        description: "Miniatura removida com sucesso!",
      })

      router.push("/garage")
    } catch (error: any) {
      console.error("Erro ao excluir miniatura:", error.message)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a miniatura.",
        variant: "destructive",
      })
    } finally {
      setDeletingMiniature(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const newPhotos = [...userPhotos]

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `${user?.id}/${fileName}`

        const { error: uploadError, data } = await supabase.storage.from("miniatures").upload(filePath, file)

        if (uploadError) {
          throw uploadError
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("miniatures").getPublicUrl(filePath)

        newPhotos.push(publicUrl)
      }

      setUserPhotos(newPhotos)
    } catch (error: any) {
      console.error("Erro ao fazer upload de foto:", error.message)
      toast({
        title: "Erro",
        description: "Não foi possível fazer o upload da foto.",
        variant: "destructive",
      })
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = [...userPhotos]
    newPhotos.splice(index, 1)
    setUserPhotos(newPhotos)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Carregando detalhes da miniatura...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-lg mb-4">Miniatura não encontrada ou você não tem permissão para visualizá-la.</p>
            <Button onClick={() => router.push("/garage")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a Garagem
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="outline" onClick={() => router.push("/garage")} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Editar Miniatura</h1>
          </div>
          <Button variant="destructive" onClick={handleDelete} disabled={deletingMiniature}>
            {deletingMiniature ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Excluir Miniatura
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna da esquerda - Fotos */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Fotos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Foto oficial */}
                  {formData.official_blister_photo_url && (
                    <div>
                      <Label className="mb-2 block">Foto Oficial</Label>
                      <div className="relative aspect-square bg-surface rounded-lg overflow-hidden">
                        <img
                          src={formData.official_blister_photo_url || "/placeholder.svg"}
                          alt={formData.model_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Fotos do usuário */}
                  <div>
                    <Label className="mb-2 block">Suas Fotos</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {userPhotos.map((photo, index) => (
                        <div key={index} className="relative aspect-square bg-surface rounded-lg overflow-hidden">
                          <img
                            src={photo || "/placeholder.svg"}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => removePhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      {/* Botão de upload */}
                      <div className="aspect-square bg-surface rounded-lg flex flex-col items-center justify-center p-4 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer">
                        <Label
                          htmlFor="photo-upload"
                          className="cursor-pointer flex flex-col items-center justify-center h-full w-full"
                        >
                          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                          <span className="text-xs text-center text-muted-foreground">Adicionar foto</span>
                          <Input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handlePhotoUpload}
                          />
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna da direita - Formulário */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Miniatura</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informações Básicas</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="model_name">Nome do Modelo</Label>
                        <Input
                          id="model_name"
                          name="model_name"
                          value={formData.model_name}
                          onChange={handleInputChange}
                          disabled
                        />
                      </div>

                      <div>
                        <Label htmlFor="brand">Marca</Label>
                        <Input id="brand" name="brand" value={formData.brand} onChange={handleInputChange} disabled />
                      </div>

                      <div>
                        <Label htmlFor="launch_year">Ano de Lançamento</Label>
                        <Input
                          id="launch_year"
                          name="launch_year"
                          type="number"
                          value={formData.launch_year || ""}
                          onChange={handleInputChange}
                          disabled
                        />
                      </div>

                      <div>
                        <Label htmlFor="series">Série</Label>
                        <Input
                          id="series"
                          name="series"
                          value={formData.series}
                          onChange={handleInputChange}
                          disabled
                        />
                      </div>

                      <div>
                        <Label htmlFor="collection_number">Número na Coleção</Label>
                        <Input
                          id="collection_number"
                          name="collection_number"
                          value={formData.collection_number}
                          onChange={handleInputChange}
                          disabled
                        />
                      </div>

                      <div>
                        <Label htmlFor="base_color">Cor Base</Label>
                        <Input
                          id="base_color"
                          name="base_color"
                          value={formData.base_color}
                          onChange={handleInputChange}
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  {/* Informações de Aquisição */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informações de Aquisição</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="acquisition_date">Data de Aquisição</Label>
                        <Input
                          id="acquisition_date"
                          name="acquisition_date"
                          type="date"
                          value={formData.acquisition_date}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div>
                        <Label htmlFor="condition">Condição</Label>
                        <Select
                          name="condition"
                          value={formData.condition}
                          onValueChange={(value) => handleInputChange({ target: { name: "condition", value } } as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a condição" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mint">Mint (Nova na Embalagem)</SelectItem>
                            <SelectItem value="near_mint">Near Mint (Como Nova)</SelectItem>
                            <SelectItem value="excellent">Excelente</SelectItem>
                            <SelectItem value="good">Boa</SelectItem>
                            <SelectItem value="fair">Regular</SelectItem>
                            <SelectItem value="poor">Ruim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="price_paid">Preço Pago</Label>
                        <Input
                          id="price_paid"
                          name="price_paid"
                          type="number"
                          step="0.01"
                          value={formData.price_paid || ""}
                          onChange={(e) => handleNumberChange("price_paid", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_treasure_hunt"
                          checked={formData.is_treasure_hunt}
                          onCheckedChange={(checked) => handleCheckboxChange("is_treasure_hunt", checked as boolean)}
                        />
                        <Label htmlFor="is_treasure_hunt">Treasure Hunt</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_super_treasure_hunt"
                          checked={formData.is_super_treasure_hunt}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("is_super_treasure_hunt", checked as boolean)
                          }
                        />
                        <Label htmlFor="is_super_treasure_hunt">Super Treasure Hunt</Label>
                      </div>
                    </div>
                  </div>

                  {/* Variantes e Notas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Variantes e Notas</h3>

                    <div>
                      <Label htmlFor="variants">Variantes</Label>
                      <Input
                        id="variants"
                        name="variants"
                        value={formData.variants}
                        onChange={handleInputChange}
                        placeholder="Ex: Azul, Edição Especial, etc."
                      />
                    </div>

                    <div>
                      <Label htmlFor="personal_notes">Notas Pessoais</Label>
                      <Textarea
                        id="personal_notes"
                        name="personal_notes"
                        value={formData.personal_notes}
                        onChange={handleInputChange}
                        placeholder="Adicione notas pessoais sobre esta miniatura..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Informações de Negociação */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informações de Negociação</h3>

                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="disponivel_para_negocio"
                        checked={formData.disponivel_para_negocio}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("disponivel_para_negocio", checked as boolean)
                        }
                      />
                      <Label htmlFor="disponivel_para_negocio">Disponível para Negociação</Label>
                    </div>

                    {formData.disponivel_para_negocio && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="preco_negociacao">Preço de Negociação</Label>
                          <Input
                            id="preco_negociacao"
                            name="preco_negociacao"
                            type="number"
                            step="0.01"
                            value={formData.preco_negociacao || ""}
                            onChange={(e) => handleNumberChange("preco_negociacao", e.target.value)}
                            placeholder="Valor para venda ou troca"
                          />
                        </div>

                        <div>
                          <Label htmlFor="contato_negociacao">Contato para Negociação</Label>
                          <Input
                            id="contato_negociacao"
                            name="contato_negociacao"
                            value={formData.contato_negociacao}
                            onChange={handleInputChange}
                            placeholder="Telefone, WhatsApp, etc."
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="observacoes_negociacao">Observações de Negociação</Label>
                          <Textarea
                            id="observacoes_negociacao"
                            name="observacoes_negociacao"
                            value={formData.observacoes_negociacao}
                            onChange={handleInputChange}
                            placeholder="Detalhes sobre a negociação, preferências de troca, etc."
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button variant="outline" onClick={() => router.push("/garage")}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
