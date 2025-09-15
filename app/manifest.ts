import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Diecast BR",
    short_name: "Diecast BR",
    description: "Gerencie sua coleção de miniaturas diecast",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0B0F",
    theme_color: "#0B0B0F",
    icons: [{ src: "/Thumb DIECAST BR - Atualizada.png", sizes: "512x512", type: "image/png" }],
  }
}
