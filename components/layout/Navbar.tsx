"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/constants/brand";
import { User } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/garage", label: "Minha Garagem" },
  { href: "/add", label: "Adicionar" },
  { href: "/trading", label: "Negociação" },
];

export function Navbar() {
  const pathname = usePathname();
  const supabase = createClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const isProfileActive = pathname?.startsWith("/profile");

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container h-14 flex items-center justify-between gap-4">
        {/* Logo / marca */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src={BRAND.logoSrc}
            alt={BRAND.logoAlt}
            width={28}
            height={28}
            priority
          />
          <span className="font-semibold">{BRAND.name}</span>
        </Link>

        {/* navegação central */}
        <nav className="hidden md:flex items-center gap-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                isActive(l.href)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* ações à direita */}
        <div className="flex items-center gap-2">
          {/* Perfil ao lado de Sair (apenas linka; proteção via middleware/rota) */}
          <Link href="/profile">
            <Button
              variant={isProfileActive ? "default" : "outline"}
              size="sm"
              className="gap-1"
            >
              <User className="h-4 w-4" />
              Perfil
            </Button>
          </Link>

          <Button variant="outline" size="sm" onClick={signOut}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
