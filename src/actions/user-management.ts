'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipos
export type UserRole = 'admin' | 'owner' | 'doctor' | 'nurse' | 'receptionist' | 'professional'
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended'

export interface UserData {
  id: string
  clinicId: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  role: UserRole
  isProfessional: boolean
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  isProfessional?: boolean
  sendInvite?: boolean
}

export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  phone?: string
  role?: UserRole
  isProfessional?: boolean
  isActive?: boolean
}

const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001'

// =============================================
// OBTENER USUARIOS
// =============================================

export async function getUsers(options?: {
  role?: UserRole
  isActive?: boolean
  isProfessional?: boolean
  search?: string
}): Promise<UserData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('users')
    .select('*')
    .eq('clinic_id', DEFAULT_CLINIC_ID)
    .order('first_name', { ascending: true })

  if (options?.role) {
    query = query.eq('role', options.role)
  }
  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive)
  }
  if (options?.isProfessional !== undefined) {
    query = query.eq('is_professional', options.isProfessional)
  }
  if (options?.search) {
    query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,email.ilike.%${options.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return (data || []).map(transformUser)
}

export async function getUserById(id: string): Promise<UserData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return transformUser(data)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformUser(data: any): UserData {
  return {
    id: data.id,
    clinicId: data.clinic_id,
    email: data.email || '',
    firstName: data.first_name || '',
    lastName: data.last_name || '',
    fullName: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Usuario',
    phone: data.phone,
    avatarUrl: data.avatar_url,
    role: data.role || 'receptionist',
    isProfessional: data.is_professional || false,
    isActive: data.is_active ?? true,
    lastLoginAt: data.last_login_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// =============================================
// CREAR USUARIO
// =============================================

export async function createUser(
  input: CreateUserInput
): Promise<{ data: UserData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Verificar si el email ya existe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('users')
    .select('id')
    .eq('email', input.email)
    .single()

  if (existing) {
    return { data: null, error: 'Ya existe un usuario con este email' }
  }

  const userId = crypto.randomUUID()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('users')
    .insert({
      id: userId,
      clinic_id: DEFAULT_CLINIC_ID,
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone || null,
      role: input.role,
      is_professional: input.isProfessional || input.role === 'doctor' || input.role === 'professional',
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user:', error)
    return { data: null, error: 'Error al crear el usuario' }
  }

  revalidatePath('/configuracion')
  return { data: transformUser(data), error: null }
}

// =============================================
// ACTUALIZAR USUARIO
// =============================================

export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<{ data: UserData | null; error: string | null }> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.firstName !== undefined) updateData.first_name = input.firstName
  if (input.lastName !== undefined) updateData.last_name = input.lastName
  if (input.phone !== undefined) updateData.phone = input.phone
  if (input.role !== undefined) updateData.role = input.role
  if (input.isProfessional !== undefined) updateData.is_professional = input.isProfessional
  if (input.isActive !== undefined) updateData.is_active = input.isActive

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating user:', error)
    return { data: null, error: 'Error al actualizar el usuario' }
  }

  revalidatePath('/configuracion')
  return { data: transformUser(data), error: null }
}

// =============================================
// CAMBIAR ESTADO DEL USUARIO
// =============================================

export async function toggleUserStatus(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // Obtener estado actual
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: current } = await (supabase as any)
    .from('users')
    .select('is_active')
    .eq('id', id)
    .single()

  if (!current) {
    return { success: false, error: 'Usuario no encontrado' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('users')
    .update({
      is_active: !current.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error toggling user status:', error)
    return { success: false, error: 'Error al cambiar el estado' }
  }

  revalidatePath('/configuracion')
  return { success: true, error: null }
}

// =============================================
// ELIMINAR USUARIO
// =============================================

export async function deleteUser(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('users')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: 'Error al eliminar el usuario' }
  }

  revalidatePath('/configuracion')
  return { success: true, error: null }
}

// =============================================
// ESTADÍSTICAS DE USUARIOS
// =============================================

export async function getUserStats(): Promise<{
  total: number
  active: number
  inactive: number
  byRole: Record<string, number>
}> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('users')
    .select('id, is_active, role')
    .eq('clinic_id', DEFAULT_CLINIC_ID)

  const users = data || []
  const byRole: Record<string, number> = {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users.forEach((u: any) => {
    byRole[u.role] = (byRole[u.role] || 0) + 1
  })

  return {
    total: users.length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    active: users.filter((u: any) => u.is_active).length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inactive: users.filter((u: any) => !u.is_active).length,
    byRole,
  }
}

// =============================================
// ROLES
// =============================================

export interface RoleInfo {
  id: UserRole
  name: string
  description: string
  permissions: string[]
  color: string
}

export function getRoles(): RoleInfo[] {
  return [
    {
      id: 'admin',
      name: 'Administrador',
      description: 'Acceso completo al sistema',
      permissions: ['all'],
      color: 'bg-red-500',
    },
    {
      id: 'owner',
      name: 'Propietario',
      description: 'Acceso total excepto configuracion tecnica',
      permissions: ['patients', 'appointments', 'billing', 'reports', 'staff'],
      color: 'bg-purple-500',
    },
    {
      id: 'doctor',
      name: 'Doctor/Profesional',
      description: 'Pacientes, tratamientos, sesiones, agenda',
      permissions: ['patients', 'appointments', 'sessions', 'treatments'],
      color: 'bg-blue-500',
    },
    {
      id: 'nurse',
      name: 'Enfermera/Asistente',
      description: 'Pacientes, sesiones, agenda',
      permissions: ['patients', 'appointments', 'sessions'],
      color: 'bg-green-500',
    },
    {
      id: 'receptionist',
      name: 'Recepcionista',
      description: 'Agenda, pacientes (lectura), facturacion',
      permissions: ['appointments', 'patients_read', 'billing'],
      color: 'bg-amber-500',
    },
    {
      id: 'professional',
      name: 'Profesional',
      description: 'Perfil profesional con agenda y pacientes',
      permissions: ['patients', 'appointments', 'sessions'],
      color: 'bg-cyan-500',
    },
  ]
}

export function getRoleById(roleId: UserRole): RoleInfo | undefined {
  return getRoles().find(r => r.id === roleId)
}
