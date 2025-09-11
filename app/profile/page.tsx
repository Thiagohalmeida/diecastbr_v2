"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { supabase } from "@/integrations/supabase/client"
import { Navbar } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save, User, Mail, MapPin, Hash, Instagram, Facebook, AtSign } from "lucide-react"

export const dynamic = "force-dynamic"

interface ProfileFormData {
  display_name: string
  email: string
  city: string
  postal_code: string
  instagram: string
  facebook: string
  tiktok: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState<ProfileFormData>({
    display_name: "",
    email: "",
    city: "",
    postal_code: "",
    instagram: "",
    facebook: "",
    tiktok: "",
  })

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user?.id).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error)
        toast({
          title: "Erro ao carregar perfil",
          description: "Não foi possível carregar os dados do perfil.",
          variant: "destructive",
        })
        return
      }

      if (data) {
        setProfileData({
          display_name: data.display_name || user?.user_metadata?.display_name || "",
          email: user?.email || "",
          city: data.city || "",
          postal_code: data.postal_code || "",
          instagram: data.instagram || "",
          facebook: data.facebook || "",
          tiktok: data.tiktok || "",
        })
      } else {
        setProfileData({
          display_name: user?.user_metadata?.display_name || "",
          email: user?.email || "",
          city: "",
          postal_code: "",
          instagram: "",
          facebook: "",
          tiktok: "",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os dados do perfil.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: user?.id,
          display_name: profileData.display_name,
          city: profileData.city,
          postal_code: profileData.postal_code,
          instagram: profileData.instagram,
          facebook: profileData.facebook,
          tiktok: profileData.tiktok,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )

      if (error) throw error

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Seu Perfil</h1>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Atualize suas informações pessoais e de contato.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_name">
                        <User className="h-4 w-4 inline mr-2" />
                        Nome
                      </Label>
                      <Input
                        id="display_name"
                        name="display_name"
                        value={profileData.display_name}
                        onChange={handleInputChange}
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        <Mail className="h-4 w-4 inline mr-2" />
                        Email
                      </Label>
                      <Input id="email" name="email" value={profileData.email} disabled placeholder="seu@email.com" />
                      <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Localização</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">
                        <MapPin className="h-4 w-4 inline mr-2" />
                        Cidade
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        value={profileData.city}
                        onChange={handleInputChange}
                        placeholder="Sua cidade"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal_code">
                        <Hash className="h-4 w-4 inline mr-2" />
                        CEP
                      </Label>
                      <Input
                        id="postal_code"
                        name="postal_code"
                        value={profileData.postal_code}
                        onChange={handleInputChange}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Redes Sociais</h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram">
                        <Instagram className="h-4 w-4 inline mr-2" />
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        value={profileData.instagram}
                        onChange={handleInputChange}
                        placeholder="@seu_instagram"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebook">
                        <Facebook className="h-4 w-4 inline mr-2" />
                        Facebook
                      </Label>
                      <Input
                        id="facebook"
                        name="facebook"
                        value={profileData.facebook}
                        onChange={handleInputChange}
                        placeholder="seu_facebook"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tiktok">
                        <AtSign className="h-4 w-4 inline mr-2" />
                        TikTok
                      </Label>
                      <Input
                        id="tiktok"
                        name="tiktok"
                        value={profileData.tiktok}
                        onChange={handleInputChange}
                        placeholder="@seu_tiktok"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={saving}>
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
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
