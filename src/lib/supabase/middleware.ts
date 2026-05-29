import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type UserRole, canAccessRoute } from '@/lib/auth/roles'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Rutas /api que deben ser públicas (callbacks externos / assets).
  // El resto de /api ya NO se excluye del chequeo de autenticación.
  const publicApiRoutes = ['/api/auth/callback', '/api/logo']
  const isPublicApiRoute = publicApiRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // If no user and trying to access protected route, redirect to login
  if (!user && !isPublicRoute && !isPublicApiRoute) {
    const url = request.nextUrl.clone()
    // Para rutas API protegidas devolvemos 401 en vez de redirigir a HTML
    if (request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (user && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // RBAC: Verificar permisos de ruta si el usuario está autenticado
  if (user && !isPublicRoute && !request.nextUrl.pathname.startsWith('/api')) {
    // Fuente de verdad del rol/estado: la tabla `users` (no user_metadata, que es editable).
    let userRole: UserRole = 'receptionist'
    let isActive = true
    try {
      const { createAdminClient } = await import('@/lib/supabase/server')
      const adminClient = createAdminClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dbUser } = await (adminClient as any)
        .from('users')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

      const VALID_ROLES = ['owner', 'admin', 'doctor', 'nurse', 'professional', 'assistant', 'receptionist']
      if (dbUser?.role && VALID_ROLES.includes(dbUser.role)) {
        userRole = dbUser.role as UserRole
      }
      isActive = dbUser?.is_active ?? true
    } catch {
      // Si falla la lectura, mantener rol mínimo (receptionist) y permitir (is_active=true)
    }

    // Verificar si el usuario está activo
    if (!isActive) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'account_disabled')
      await supabase.auth.signOut()
      return NextResponse.redirect(url)
    }

    // Verificar permisos de ruta
    const pathname = request.nextUrl.pathname
    if (!canAccessRoute(userRole, pathname)) {
      // Usuario no tiene permisos - redirigir a dashboard con mensaje
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }

    // Agregar headers con información del usuario para uso en server components
    supabaseResponse.headers.set('x-user-role', userRole)
    supabaseResponse.headers.set('x-user-id', user.id)
  }

  return supabaseResponse
}
