"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/constants/brand";

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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container h-14 flex items-center justify-between gap-4">
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

        <nav className="hidden md:flex items-center gap-3">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={signOut}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
