import type React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  description: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ icon: Icon, title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 animate-slide-up", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground text-balance">{title}</h1>
            <p className="text-muted-foreground text-lg text-balance">{description}</p>
          </div>
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
