"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Car, Menu, X, LogOut, Settings, Handshake, Plus, Home } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

        setProfile(profile)
      }
    }

    getUser()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth")
  }

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Minha Garagem", path: "/garage", icon: Car },
    { name: "Adicionar", path: "/add", icon: Plus },
    { name: "Negociação", path: "/trading", icon: Handshake },
  ]

  const isActive = (path: string) => pathname === path

  if (!user) return null

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer group" onClick={() => router.push("/dashboard")}>
            <div className="relative">
              <img
                src="/Thumb DIECAST BR - Atualizada.png"
                alt="Diecast BR Logo"
                className="h-10 w-auto mr-3 transition-transform group-hover:scale-105"
              />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Diecast BR
              </span>
              <div className="text-xs text-muted-foreground -mt-1">Garage</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Button
                  key={item.path}
                  variant={active ? "default" : "ghost"}
                  onClick={() => router.push(item.path)}
                  className={`flex items-center space-x-2 transition-all duration-200 ${
                    active ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md" : "hover:bg-muted/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Button>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {profile?.total_miniatures && (
              <Badge variant="secondary" className="hidden sm:flex">
                {profile.total_miniatures} miniaturas
              </Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-muted transition-all"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {(profile?.display_name || user?.email)?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-3">
                  <p className="text-sm font-medium leading-none">
                    {profile?.display_name || user?.email?.split("@")[0]}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  {profile?.total_miniatures && (
                    <Badge variant="outline" className="w-fit mt-2">
                      {profile.total_miniatures} miniaturas
                    </Badge>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Button
                    key={item.path}
                    variant={active ? "default" : "ghost"}
                    onClick={() => {
                      router.push(item.path)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full justify-start flex items-center space-x-2 ${
                      active ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
