// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Em dev, se as envs não estiverem definidas, não bloqueia nada (evita tela branca)
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  let user = null;

  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    
    // If there's a validation error, clear auth cookies and continue as unauthenticated
    if (error && error.message?.includes('validation_failed')) {
      console.log('[Middleware] Clearing invalid auth cookies due to validation error:', error.message);
      
      // Clear all auth-related cookies
      const authCookies = request.cookies.getAll().filter(cookie => 
        cookie.name.startsWith('sb-') || 
        cookie.name.includes('auth-token') ||
        cookie.name.includes('supabase')
      );
      
      authCookies.forEach(cookie => {
        response.cookies.delete(cookie.name);
      });
      
      user = null;
    } else if (error) {
      console.error('[Middleware] Auth error:', error.message);
      user = null;
    } else {
      user = authUser;
    }
  } catch (error) {
    console.error('[Middleware] Unexpected auth error:', error);
    user = null;
  }

  const pathname = request.nextUrl.pathname;

  // Defina aqui as rotas privadas do seu app
  const isProtected =
    /^\/(dashboard|garage|add|profile|trading|miniature|novo)(\/|$)/.test(pathname);

  // Sem login tentando acessar rota privada -> vai para /auth
  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Se já estiver logado e for para /auth, manda para /dashboard
  if (pathname === "/auth" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  // ignora assets estáticos
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
