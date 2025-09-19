"use client";

import { useEffect, useState } from "react";
import { getPublicContacts, type PublicContacts } from "@/lib/services/profile";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Mail, Phone, Instagram, Facebook, AtSign, Copy } from "lucide-react";

type Props = { sellerId?: string | null };

function openWhatsappLink(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const withDDI = digits.startsWith("55") ? digits : `55${digits}`;
  window.open(`https://wa.me/${withDDI}`, "_blank");
}

export function SellerContactPanel({ sellerId }: Props) {
  const [c, setC] = useState<PublicContacts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!sellerId) throw new Error("sellerId not provided");
        const data = await getPublicContacts(sellerId);
        setC(data);
      } catch (e) {
        console.error(e);
        toast({
          title: "Contato indisponível",
          description: "O vendedor não possui contatos públicos ou o anúncio está incorreto.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [sellerId]);

  const copy = async (txt: string) => {
    await navigator.clipboard.writeText(txt);
    toast({ title: "Copiado!", description: txt });
  };

  if (loading) return null;

  const nothing =
    !c?.email && !c?.whatsapp && !c?.instagram && !c?.facebook && !c?.tiktok;

  return (
    <Card className="mt-6">
      <CardHeader><CardTitle>Contato do vendedor</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {nothing && (
          <p className="text-sm text-muted-foreground">
            O vendedor ainda não disponibilizou contatos públicos no perfil.
          </p>
        )}

        {c?.whatsapp && (
          <div className="flex items-center justify-between rounded-md border p-2">
            <div className="flex items-center gap-2"><Phone className="h-4 w-4" /><span>{c.whatsapp}</span></div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => copy(c.whatsapp!)}><Copy className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => openWhatsappLink(c.whatsapp!)}>Abrir WhatsApp</Button>
            </div>
          </div>
        )}

        {c?.email && (
          <div className="flex items-center justify-between rounded-md border p-2">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span>{c.email}</span></div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => copy(c.email!)}><Copy className="h-4 w-4" /></Button>
              <Button size="sm" asChild><a href={`mailto:${c.email}`}>Enviar e-mail</a></Button>
            </div>
          </div>
        )}

        {c?.instagram && (
          <div className="flex items-center justify-between rounded-md border p-2">
            <div className="flex items-center gap-2"><Instagram className="h-4 w-4" /><span>@{c.instagram.replace(/^@/,"")}</span></div>
            <Button size="sm" asChild><a target="_blank" href={`https://instagram.com/${c.instagram.replace(/^@/,"")}`}>Abrir Instagram</a></Button>
          </div>
        )}

        {c?.facebook && (
          <div className="flex items-center justify-between rounded-md border p-2">
            <div className="flex items-center gap-2"><Facebook className="h-4 w-4" /><span>{c.facebook}</span></div>
            <Button size="sm" asChild><a target="_blank" href={`https://facebook.com/${c.facebook}`}>Abrir Facebook</a></Button>
          </div>
        )}

        {c?.tiktok && (
          <div className="flex items-center justify-between rounded-md border p-2">
            <div className="flex items-center gap-2"><AtSign className="h-4 w-4" /><span>@{c.tiktok.replace(/^@/,"")}</span></div>
            <Button size="sm" asChild><a target="_blank" href={`https://tiktok.com/@${c.tiktok.replace(/^@/,"")}`}>Abrir TikTok</a></Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
