export interface Miniature {
  name: string
  brand: string
  year: string
  image_url: string
  description: string
}

export const buscaPorCodigo = async (codigo: string): Promise<Miniature | null> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock data for testing - in production this would call a real API
  const mockData: Record<string, Miniature> = {
    "123456": {
      name: "Lamborghini Huracán",
      brand: "Hot Wheels",
      year: "2024",
      image_url: "/hot-wheels-lamborghini.jpg",
      description: "Supercar esportivo em escala 1:64",
    },
    "789012": {
      name: "Ford Mustang GT",
      brand: "Hot Wheels",
      year: "2023",
      image_url: "/hot-wheels-mustang.jpg",
      description: "Muscle car clássico americano",
    },
  }

  return mockData[codigo] || null
}
