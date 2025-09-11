import { Suspense } from "react"
import { DashboardContent } from "@/components/dashboard/DashboardContent"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
