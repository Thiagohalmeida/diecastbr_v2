import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Verificar se as variáveis de ambiente estão definidas
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Erro crítico: Variáveis de ambiente do Supabase não encontradas no middleware")
    // Em desenvolvimento, permitir acesso mesmo sem as variáveis de ambiente
    // Em produção, isso não deve acontecer, mas evita tela em branco
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createMiddlewareClient(
    { req: request, res: supabaseResponse },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: {name: string; value: string; options?: {path?: string; maxAge?: number; domain?: string; secure?: boolean}}[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  try {
    // Refresh session if expired
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Lista de rotas protegidas
    const protectedRoutes = ["/dashboard", "/garage", "/add", "/profile", "/trading", "/miniature"]
    
    // Verificar se a rota atual está protegida
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`)
    )

    // Proteger rotas privadas
    if (isProtectedRoute && !user) {
      return NextResponse.redirect(new URL("/auth", request.url))
    }

    // Redirect authenticated users away from auth page
    if (request.nextUrl.pathname === "/auth" && user) {
      console.log("Middleware: Usuário autenticado tentando acessar /auth, redirecionando para /dashboard")
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    if (request.nextUrl.pathname === "/auth") {
      console.log("Middleware: Usuário não autenticado acessando /auth, permitindo acesso")
    }
  } catch (error) {
    console.error("Erro no middleware:", error)
    // Em caso de erro, permitir acesso para evitar bloqueio total
    return NextResponse.next()
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
