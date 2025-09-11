import { Suspense } from "react"
import { TradingContent } from "@/components/trading/TradingContent"
import { TradingSkeleton } from "@/components/trading/TradingSkeleton"

export default function TradingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Suspense fallback={<TradingSkeleton />}>
        <TradingContent />
      </Suspense>
    </div>
  )
}
