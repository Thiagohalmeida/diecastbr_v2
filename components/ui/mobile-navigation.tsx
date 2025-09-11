"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Car, Home, Plus, Handshake } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: Home },
  { name: "Garagem", path: "/garage", icon: Car },
  { name: "Adicionar", path: "/add", icon: Plus },
  { name: "Trocas", path: "/trading", icon: Handshake },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass-effect border-t">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path

            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => router.push(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-2 px-3 transition-all duration-200",
                  isActive
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("transition-all duration-200", isActive ? "h-5 w-5" : "h-4 w-4")} />
                <span
                  className={cn(
                    "text-xs font-medium transition-all duration-200",
                    isActive ? "text-blue-600 dark:text-blue-400" : "",
                  )}
                >
                  {item.name}
                </span>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
