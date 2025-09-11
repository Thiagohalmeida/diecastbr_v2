import miniatures from "@/data/miniatures_db.json"

interface MiniatureData {
  name?: string
  series?: string
  collection_number?: string
  year?: string
  brand?: string
}

export function autoFillByModelOrUpc(searchTerm: string): MiniatureData | null {
  if (!searchTerm) return null

  const term = searchTerm.toLowerCase().trim()

  // Search in miniatures database
  const found = miniatures.find(
    (item: any) =>
      item.name?.toLowerCase().includes(term) || item.upc?.includes(term) || item.model?.toLowerCase().includes(term),
  )

  if (found) {
    return {
      name: found.name,
      series: found.series,
      collection_number: found.collection_number,
      year: found.year,
      brand: found.brand || "Hot Wheels",
    }
  }

  return null
}
