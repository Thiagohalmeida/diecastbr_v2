"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  Save,
  User,
  Mail,
  MapPin,
  Hash,
  Instagram,
  Facebook,
  AtSign,
  Phone,
} from "lucide-react";

import {
  getOrCreateMyProfile,
  upsertMyProfile,
  type Profile,
} from "@/lib/services/profile";

export const dynamic = "force-dynamic";

type ProfileFormData = {
  display_name: string;
  email: string;
  city: string;
  postal_code: string;
  instagram: string;
  facebook: string;
  tiktok: string;

  // novos
  contact_email: string;
  whatsapp: string;
  share_contact_email: boolean;
  share_whatsapp: boolean;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    display_name: "",
    email: "",
    city: "",
    postal_code: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    contact_email: "",
    whatsapp: "",
    share_contact_email: false,
    share_whatsapp: true,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const p: Profile = await getOrCreateMyProfile();
        setProfileData({
          display_name:
            (p.full_name as string) ||
            (user.user_metadata?.display_name as string) ||
            "",
          email: user.email ?? "",
          city: p.city ?? "",
          postal_code: p.cep ?? "",
          instagram: p.instagram ?? "",
          facebook: p.facebook ?? "",
          tiktok: p.tiktok ?? "",

          contact_email: p.contact_email ?? user.email ?? "",
          whatsapp: p.whatsapp ?? "",
          share_contact_email: !!p.share_contact_email,
          share_whatsapp: p.share_whatsapp ?? true,
        });
      } catch (e) {
        console.error(e);
        toast({
          title: "Erro ao carregar perfil",
          description: "Não foi possível carregar os dados do perfil.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertMyProfile({
        full_name: profileData.display_name || null,
        city: profileData.city || null,
        cep: profileData.postal_code || null,
        instagram: profileData.instagram || null,
        facebook: profileData.facebook || null,
        tiktok: profileData.tiktok || null,
        contact_email: profileData.contact_email || null,
        whatsapp: profileData.whatsapp || null,
        share_contact_email: profileData.share_contact_email,
        share_whatsapp: profileData.share_whatsapp,
      });
      toast({ title: "Perfil atualizado", description: "Dados salvos com sucesso." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
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
                <CardDescription>
                  Atualize suas informações pessoais e de contato.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
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
                    <Input id="email" name="email" value={profileData.email} disabled readOnly />
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado
                    </p>
                  </div>
                </div>

                <Separator />

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

                <Separator />

                {/* Contato para negociação */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contato para Negociação</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">
                        <Phone className="h-4 w-4 inline mr-2" />
                        WhatsApp
                      </Label>
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        value={profileData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="(11) 90000-0000 ou 5511900000000"
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          id="share_whatsapp"
                          checked={profileData.share_whatsapp}
                          onCheckedChange={(v) =>
                            setProfileData((p) => ({ ...p, share_whatsapp: v }))
                          }
                        />
                        <Label htmlFor="share_whatsapp">Exibir publicamente</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_email">
                        <Mail className="h-4 w-4 inline mr-2" />
                        E-mail de contato
                      </Label>
                      <Input
                        id="contact_email"
                        name="contact_email"
                        value={profileData.contact_email}
                        onChange={handleInputChange}
                        placeholder="seu@email.com"
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          id="share_contact_email"
                          checked={profileData.share_contact_email}
                          onCheckedChange={(v) =>
                            setProfileData((p) => ({ ...p, share_contact_email: v }))
                          }
                        />
                        <Label htmlFor="share_contact_email">Exibir publicamente</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Redes sociais */}
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
  );
}
