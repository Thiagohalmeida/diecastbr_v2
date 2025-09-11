import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { AuthProvider } from "@/components/providers/AuthProvider"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "DIECAST BR - Sua Coleção de Miniaturas",
  description:
    "Gerencie sua coleção de miniaturas Hot Wheels e outras marcas com facilidade. Sistema completo com OCR, catálogo automático e sistema de trocas.",
  generator: "v0.app",
  keywords: ["Hot Wheels", "miniaturas", "coleção", "diecast", "carrinhos", "brinquedos"],
  authors: [{ name: "DIECAST BR" }],
  creator: "DIECAST BR",
  publisher: "DIECAST BR",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://diecastbr.vercel.app"),
  openGraph: {
    title: "DIECAST BR - Sua Coleção de Miniaturas",
    description: "Gerencie sua coleção de miniaturas Hot Wheels e outras marcas com facilidade",
    type: "website",
    locale: "pt_BR",
    siteName: "DIECAST BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "DIECAST BR - Sua Coleção de Miniaturas",
    description: "Gerencie sua coleção de miniaturas Hot Wheels e outras marcas com facilidade",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DIECAST BR" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <QueryProvider>
              <AuthProvider>
                <TooltipProvider>
                  <Suspense
                    fallback={
                      <div className="min-h-screen flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    }
                  >
                    {children}
                    <Toaster />
                    <Sonner />
                  </Suspense>
                </TooltipProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
