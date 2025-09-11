import { Suspense } from "react"
import { AddMiniatureContent } from "@/components/add-miniature/AddMiniatureContent"
import { AddMiniatureSkeleton } from "@/components/add-miniature/AddMiniatureSkeleton"

export default function AddMiniaturePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Suspense fallback={<AddMiniatureSkeleton />}>
        <AddMiniatureContent />
      </Suspense>
    </div>
  )
}
