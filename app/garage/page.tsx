import { Suspense } from "react"
import { GarageContent } from "@/components/garage/GarageContent"
import { GarageSkeleton } from "@/components/garage/GarageSkeleton"

export default function GaragePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Suspense fallback={<GarageSkeleton />}>
        <GarageContent />
      </Suspense>
    </div>
  )
}
