'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { hasPermission, type UserRole, type Permission } from '@/lib/auth/roles'

export interface AuthContext {
  userId: string
  role: UserRole
  clinicId: string
}

/**
 * Obtiene el contexto de autenticación del usuario actual (id, rol, clinic_id)
 * leyendo SIEMPRE desde el servidor (cookie de sesión + tabla `users`).
 * Devuelve null si no hay sesión válida.
 *
 * Úsalo al inicio de cada Server Action para no confiar en datos del cliente.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dbUser } = await (adminClient as any)
    .from('users')
    .select('role, clinic_id, is_active')
    .eq('id', user.id)
    .single()

  if (!dbUser || dbUser.is_active === false) return null

  return {
    userId: user.id,
    role: (dbUser.role as UserRole) || 'receptionist',
    clinicId: dbUser.clinic_id as string,
  }
}

/**
 * Igual que getAuthContext pero lanza un Error si no hay sesión.
 * Útil cuando quieres cortar la ejecución inmediatamente.
 */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext()
  if (!ctx) throw new Error('No autorizado')
  return ctx
}

/**
 * Verifica que el usuario actual tenga un permiso específico.
 * Devuelve el AuthContext si lo tiene, o un objeto de error si no.
 */
export async function requirePermission(
  permission: Permission
): Promise<{ ctx: AuthContext; error: null } | { ctx: null; error: string }> {
  const ctx = await getAuthContext()
  if (!ctx) return { ctx: null, error: 'No autorizado' }
  if (!hasPermission(ctx.role, permission)) {
    return { ctx: null, error: 'No tienes permiso para realizar esta acción' }
  }
  return { ctx, error: null }
}
