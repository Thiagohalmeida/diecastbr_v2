"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface FloatingActionButtonProps {
  icon: LucideIcon
  onClick: () => void
  className?: string
  size?: "sm" | "md" | "lg"
}

export function FloatingActionButton({ icon: Icon, onClick, className, size = "md" }: FloatingActionButtonProps) {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-14 w-14",
    lg: "h-16 w-16",
  }

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-7 w-7",
  }

  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 button-gradient",
        sizeClasses[size],
        "md:hidden", // Só mostra em mobile
        className,
      )}
    >
      <Icon className={iconSizes[size]} />
    </Button>
  )
}
