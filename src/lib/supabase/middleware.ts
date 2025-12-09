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

  // If no user and trying to access protected route, redirect to login
  if (!user && !isPublicRoute && !request.nextUrl.pathname.startsWith('/api')) {
    const url = request.nextUrl.clone()
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
    // Obtener el rol del usuario desde user_metadata o profiles
    const userMetaRole = user.user_metadata?.role as string | undefined

    // Verificar si hay perfil del usuario
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .single()

    // Determinar el rol - priorizar user_metadata ya que es donde se configura el admin
    let userRole: UserRole = 'receptionist'
    if (userMetaRole === 'admin' || userMetaRole === 'owner' || userMetaRole === 'doctor' || userMetaRole === 'nurse') {
      userRole = userMetaRole as UserRole
    }

    const isActive = profileData?.is_active ?? true

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
