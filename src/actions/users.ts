'use server'

import { createAdminClient } from '@/lib/supabase/server'

// Tipos
export type UserRole = 'admin' | 'professional' | 'receptionist' | 'assistant'

export interface UserData {
  id: string
  clinic_id: string | null
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

// Obtener todos los usuarios
export async function getUsers(options?: {
  role?: UserRole
  isActive?: boolean
}): Promise<UserData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('users')
    .select('*')
    .order('full_name', { ascending: true })

  if (options?.role) {
    query = query.eq('role', options.role)
  }
  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return (data || []) as UserData[]
}

// Obtener usuario por ID
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

  return data as UserData
}

// Obtener profesionales (rol professional o admin)
export async function getProfessionals(): Promise<UserData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('users')
    .select('*')
    .in('role', ['professional', 'admin'])
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching professionals:', error)
    return []
  }

  return (data || []) as UserData[]
}
