import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StatsProps {
  total: number
  treasureHunts: number
  brands: string[]
}

export function TotalMiniaturesStats({ total, treasureHunts, brands }: StatsProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
          📊 Estatísticas da Coleção
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{total}</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Total de Miniaturas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{treasureHunts}</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Treasure Hunts</div>
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Marcas na Coleção:</div>
          <div className="flex flex-wrap gap-1">
            {brands.map((brand) => (
              <Badge key={brand} variant="secondary" className="text-xs">
                {brand}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
