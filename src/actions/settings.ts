'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Default clinic ID - En produccion esto vendria del usuario autenticado
const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001'

// Tipos
export interface ClinicSettings {
  id: string
  name: string
  legal_name: string | null
  logo_url: string | null
  tax_id: string | null // RNC
  email: string | null
  phone: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  timezone: string
  currency: string
  settings: {
    allow_online_booking?: boolean
    auto_reminders?: boolean
    [key: string]: unknown
  } | null
  created_at: string
  updated_at: string
}

export interface UpdateClinicSettingsInput {
  name?: string
  legal_name?: string
  logo_url?: string
  tax_id?: string
  email?: string
  phone?: string
  website?: string
  instagram?: string
  facebook?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  timezone?: string
  currency?: string
  settings?: {
    allow_online_booking?: boolean
    auto_reminders?: boolean
    [key: string]: unknown
  }
}

export interface Branch {
  id: string
  clinic_id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  manager_id: string | null
  rooms_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateBranchInput {
  name: string
  address?: string
  phone?: string
  email?: string
  manager_id?: string
  rooms_count?: number
}

export interface UpdateBranchInput extends Partial<CreateBranchInput> {
  is_active?: boolean
}

// =============================================
// CLINIC SETTINGS
// =============================================

// Obtener configuracion de la clinica
export async function getClinicSettings(): Promise<ClinicSettings | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('clinics')
    .select('*')
    .eq('id', DEFAULT_CLINIC_ID)
    .single()

  if (error) {
    console.error('Error fetching clinic settings:', error)

    // Si no existe, crear la clinica por defecto
    if (error.code === 'PGRST116') {
      return await createDefaultClinic()
    }
    return null
  }

  return data as ClinicSettings
}

// Crear clinica por defecto si no existe
async function createDefaultClinic(): Promise<ClinicSettings | null> {
  const supabase = createAdminClient()

  const defaultClinic = {
    id: DEFAULT_CLINIC_ID,
    name: 'Mi Clinica',
    legal_name: null,
    logo_url: null,
    tax_id: null,
    email: null,
    phone: null,
    website: null,
    instagram: null,
    facebook: null,
    address: null,
    city: 'Santo Domingo',
    state: 'Distrito Nacional',
    postal_code: null,
    country: 'Republica Dominicana',
    timezone: 'America/Santo_Domingo',
    currency: 'DOP',
    settings: {
      allow_online_booking: true,
      auto_reminders: true,
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('clinics')
    .insert(defaultClinic)
    .select()
    .single()

  if (error) {
    console.error('Error creating default clinic:', error)
    return null
  }

  return data as ClinicSettings
}

// Actualizar configuracion de la clinica
export async function updateClinicSettings(
  input: UpdateClinicSettingsInput
): Promise<{ data: ClinicSettings | null; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('clinics')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', DEFAULT_CLINIC_ID)
    .select()
    .single()

  if (error) {
    console.error('Error updating clinic settings:', error)
    return { data: null, error: 'Error al guardar la configuracion' }
  }

  revalidatePath('/configuracion')
  revalidatePath('/')
  return { data: data as ClinicSettings, error: null }
}

// =============================================
// BRANCHES (SUCURSALES)
// =============================================

// Obtener todas las sucursales
export async function getBranches(): Promise<Branch[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('branches')
    .select('*')
    .eq('clinic_id', DEFAULT_CLINIC_ID)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching branches:', error)
    return []
  }

  return (data || []) as Branch[]
}

// Obtener una sucursal por ID
export async function getBranchById(id: string): Promise<Branch | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('branches')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching branch:', error)
    return null
  }

  return data as Branch
}

// Crear una nueva sucursal
export async function createBranch(
  input: CreateBranchInput
): Promise<{ data: Branch | null; error: string | null }> {
  const supabase = createAdminClient()

  const branchData = {
    ...input,
    clinic_id: DEFAULT_CLINIC_ID,
    rooms_count: input.rooms_count || 1,
    is_active: true,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('branches')
    .insert(branchData)
    .select()
    .single()

  if (error) {
    console.error('Error creating branch:', error)
    return { data: null, error: 'Error al crear la sucursal' }
  }

  revalidatePath('/configuracion')
  return { data: data as Branch, error: null }
}

// Actualizar una sucursal
export async function updateBranch(
  id: string,
  input: UpdateBranchInput
): Promise<{ data: Branch | null; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('branches')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating branch:', error)
    return { data: null, error: 'Error al actualizar la sucursal' }
  }

  revalidatePath('/configuracion')
  return { data: data as Branch, error: null }
}

// Eliminar una sucursal
export async function deleteBranch(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('branches')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting branch:', error)
    return { success: false, error: 'Error al eliminar la sucursal' }
  }

  revalidatePath('/configuracion')
  return { success: true, error: null }
}

// Cambiar estado de una sucursal (activar/desactivar)
export async function toggleBranchStatus(
  id: string,
  isActive: boolean
): Promise<{ data: Branch | null; error: string | null }> {
  return updateBranch(id, { is_active: isActive })
}
