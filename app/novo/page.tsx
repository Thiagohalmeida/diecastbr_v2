"use client"

export const dynamic = "force-dynamic"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { buscaPorCodigo, type Miniature } from "@/utils/miniatureApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function NovoCadastro() {
  const { user } = useAuth()
  const router = useRouter()
  const [codigo, setCodigo] = useState("")
  const [loading, setLoading] = useState(false)
  const [miniatura, setMiniatura] = useState<Miniature>({
    name: "",
    brand: "",
    year: "",
    image_url: "",
    description: "",
  })

  // Redirect if not authenticated
  if (!user) {
    router.push("/auth")
    return null
  }

  const handleCodigoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCodigo(value)

    if (value.length >= 6) {
      setLoading(true)
      try {
        const data = await buscaPorCodigo(value)
        if (data) {
          setMiniatura(data)
        } else {
          setMiniatura({
            name: "",
            brand: "",
            year: "",
            image_url: "",
            description: "",
          })
        }
      } catch (error) {
        console.error("Erro ao buscar miniatura:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implementar salvamento no Supabase
    console.log("Salvando miniatura:", { codigo, ...miniatura })
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Adicionar Nova Miniatura</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="codigo">Código da miniatura (UPC/EAN/Mattel)</Label>
              <Input
                id="codigo"
                type="text"
                placeholder="Digite o código da miniatura"
                value={codigo}
                onChange={handleCodigoChange}
                disabled={loading}
              />
              {loading && <p className="text-sm text-muted-foreground mt-1">Buscando...</p>}
            </div>

            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Nome"
                value={miniatura.name || ""}
                onChange={(e) => setMiniatura({ ...miniatura, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                type="text"
                placeholder="Marca"
                value={miniatura.brand || ""}
                onChange={(e) => setMiniatura({ ...miniatura, brand: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                type="text"
                placeholder="Ano"
                value={miniatura.year || ""}
                onChange={(e) => setMiniatura({ ...miniatura, year: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                type="text"
                placeholder="Descrição"
                value={miniatura.description || ""}
                onChange={(e) => setMiniatura({ ...miniatura, description: e.target.value })}
              />
            </div>

            {miniatura.image_url && (
              <div>
                <Label>Imagem</Label>
                <img
                  src={miniatura.image_url || "/placeholder.svg"}
                  alt="Foto miniatura"
                  className="w-32 h-32 object-cover rounded-md mt-2"
                />
              </div>
            )}

            <Button type="submit" className="w-full">
              Adicionar Miniatura
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
