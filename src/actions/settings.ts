'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper para obtener el cliente de Supabase
async function getSupabaseClient() {
  return await createClient()
}

// Default clinic ID - En produccion esto vendria del usuario autenticado
const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001'

// Tipos - Ajustados al esquema real de la base de datos
export interface ClinicSettings {
  id: string
  name: string
  legal_name: string | null
  rnc: string | null // RNC en el esquema
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  settings: {
    // Campos adicionales almacenados en JSONB
    city?: string
    state?: string
    postal_code?: string
    country?: string
    timezone?: string
    currency?: string
    website?: string
    instagram?: string
    facebook?: string
    allow_online_booking?: boolean
    auto_reminders?: boolean
    [key: string]: unknown
  } | null
  created_at: string
  updated_at: string
  // Campos virtuales para la UI (extraidos de settings)
  city?: string
  state?: string
  postal_code?: string
  country?: string
  timezone?: string
  currency?: string
  website?: string
  instagram?: string
  facebook?: string
  tax_id?: string // Alias de rnc para compatibilidad
}

export interface UpdateClinicSettingsInput {
  name?: string
  legal_name?: string
  logo_url?: string
  tax_id?: string // Se mapea a rnc
  email?: string
  phone?: string
  address?: string
  // Campos que van en settings JSONB
  website?: string
  instagram?: string
  facebook?: string
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
  is_main: boolean // El esquema usa is_main, no is_active
  settings: {
    rooms_count?: number
    manager_id?: string
    [key: string]: unknown
  } | null
  created_at: string
  updated_at: string
  // Campos virtuales
  rooms_count?: number
  manager_id?: string | null
  is_active?: boolean // Alias de is_main para compatibilidad
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

// Transformar datos de la DB a formato de la UI
function transformClinicData(data: Record<string, unknown>): ClinicSettings {
  const settings = (data.settings as ClinicSettings['settings']) || {}
  return {
    id: data.id as string,
    name: data.name as string,
    legal_name: data.legal_name as string | null,
    rnc: data.rnc as string | null,
    address: data.address as string | null,
    phone: data.phone as string | null,
    email: data.email as string | null,
    logo_url: data.logo_url as string | null,
    settings: settings,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
    // Extraer campos virtuales de settings
    city: settings?.city || null,
    state: settings?.state || null,
    postal_code: settings?.postal_code || null,
    country: settings?.country || 'Republica Dominicana',
    timezone: settings?.timezone || 'America/Santo_Domingo',
    currency: settings?.currency || 'DOP',
    website: settings?.website || null,
    instagram: settings?.instagram || null,
    facebook: settings?.facebook || null,
    tax_id: data.rnc as string | null, // Alias
  } as ClinicSettings
}

// Obtener configuracion de la clinica
export async function getClinicSettings(): Promise<ClinicSettings | null> {
  const supabase = await getSupabaseClient()

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

  return transformClinicData(data)
}

// Crear clinica por defecto si no existe
async function createDefaultClinic(): Promise<ClinicSettings | null> {
  const supabase = await getSupabaseClient()

  const defaultClinic = {
    id: DEFAULT_CLINIC_ID,
    name: 'Mi Clinica',
    legal_name: null,
    rnc: null,
    address: null,
    phone: null,
    email: null,
    logo_url: null,
    settings: {
      city: 'Santo Domingo',
      state: 'Distrito Nacional',
      postal_code: null,
      country: 'Republica Dominicana',
      timezone: 'America/Santo_Domingo',
      currency: 'DOP',
      website: null,
      instagram: null,
      facebook: null,
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

  return transformClinicData(data)
}

// Actualizar configuracion de la clinica
export async function updateClinicSettings(
  input: UpdateClinicSettingsInput
): Promise<{ data: ClinicSettings | null; error: string | null }> {
  const supabase = await getSupabaseClient()

  // Separar campos que van en la tabla vs los que van en settings JSONB
  const tableFields: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.name !== undefined) tableFields.name = input.name
  if (input.legal_name !== undefined) tableFields.legal_name = input.legal_name
  if (input.tax_id !== undefined) tableFields.rnc = input.tax_id // tax_id -> rnc
  if (input.email !== undefined) tableFields.email = input.email
  if (input.phone !== undefined) tableFields.phone = input.phone
  if (input.address !== undefined) tableFields.address = input.address
  if (input.logo_url !== undefined) tableFields.logo_url = input.logo_url

  // Campos que van en settings JSONB
  const settingsFields: Record<string, unknown> = {}
  if (input.city !== undefined) settingsFields.city = input.city
  if (input.state !== undefined) settingsFields.state = input.state
  if (input.postal_code !== undefined) settingsFields.postal_code = input.postal_code
  if (input.country !== undefined) settingsFields.country = input.country
  if (input.timezone !== undefined) settingsFields.timezone = input.timezone
  if (input.currency !== undefined) settingsFields.currency = input.currency
  if (input.website !== undefined) settingsFields.website = input.website
  if (input.instagram !== undefined) settingsFields.instagram = input.instagram
  if (input.facebook !== undefined) settingsFields.facebook = input.facebook
  if (input.settings?.allow_online_booking !== undefined) {
    settingsFields.allow_online_booking = input.settings.allow_online_booking
  }
  if (input.settings?.auto_reminders !== undefined) {
    settingsFields.auto_reminders = input.settings.auto_reminders
  }

  // Primero obtener settings actuales para hacer merge
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentData } = await (supabase as any)
    .from('clinics')
    .select('settings')
    .eq('id', DEFAULT_CLINIC_ID)
    .single()

  const currentSettings = currentData?.settings || {}
  const mergedSettings = { ...currentSettings, ...settingsFields }
  tableFields.settings = mergedSettings

  // Intentar actualizar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updateData, error: updateError } = await (supabase as any)
    .from('clinics')
    .update(tableFields)
    .eq('id', DEFAULT_CLINIC_ID)
    .select()
    .single()

  // Si el registro no existe, crear uno nuevo
  if (updateError?.code === 'PGRST116') {
    console.log('Clinic not found, creating new one...')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertData, error: insertError } = await (supabase as any)
      .from('clinics')
      .insert({
        id: DEFAULT_CLINIC_ID,
        name: input.name || 'Mi Clinica',
        legal_name: input.legal_name || null,
        rnc: input.tax_id || null,
        address: input.address || null,
        phone: input.phone || null,
        email: input.email || null,
        logo_url: null,
        settings: mergedSettings,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating clinic settings:', insertError)
      return { data: null, error: `Error al crear la configuracion: ${insertError.message}` }
    }

    revalidatePath('/configuracion')
    revalidatePath('/')
    return { data: transformClinicData(insertData), error: null }
  }

  if (updateError) {
    console.error('Error updating clinic settings:', updateError)
    return { data: null, error: `Error al guardar la configuracion: ${updateError.message}` }
  }

  revalidatePath('/configuracion')
  revalidatePath('/')
  return { data: transformClinicData(updateData), error: null }
}

// =============================================
// BRANCHES (SUCURSALES)
// =============================================

// Transformar datos de branch
function transformBranchData(data: Record<string, unknown>): Branch {
  const settings = (data.settings as Branch['settings']) || {}
  return {
    id: data.id as string,
    clinic_id: data.clinic_id as string,
    name: data.name as string,
    address: data.address as string | null,
    phone: data.phone as string | null,
    email: data.email as string | null,
    is_main: data.is_main as boolean,
    settings: settings,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
    // Campos virtuales
    rooms_count: settings?.rooms_count || 1,
    manager_id: settings?.manager_id || null,
    is_active: data.is_main as boolean, // Alias para compatibilidad
  }
}

// Obtener todas las sucursales
export async function getBranches(): Promise<Branch[]> {
  const supabase = await getSupabaseClient()

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

  return (data || []).map(transformBranchData)
}

// Obtener una sucursal por ID
export async function getBranchById(id: string): Promise<Branch | null> {
  const supabase = await getSupabaseClient()

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

  return transformBranchData(data)
}

// Crear una nueva sucursal
export async function createBranch(
  input: CreateBranchInput
): Promise<{ data: Branch | null; error: string | null }> {
  const supabase = await getSupabaseClient()

  const branchData = {
    clinic_id: DEFAULT_CLINIC_ID,
    name: input.name,
    address: input.address || null,
    phone: input.phone || null,
    email: input.email || null,
    is_main: true, // Por defecto activa
    settings: {
      rooms_count: input.rooms_count || 1,
      manager_id: input.manager_id || null,
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('branches')
    .insert(branchData)
    .select()
    .single()

  if (error) {
    console.error('Error creating branch:', error)
    return { data: null, error: `Error al crear la sucursal: ${error.message}` }
  }

  revalidatePath('/configuracion')
  return { data: transformBranchData(data), error: null }
}

// Actualizar una sucursal
export async function updateBranch(
  id: string,
  input: UpdateBranchInput
): Promise<{ data: Branch | null; error: string | null }> {
  const supabase = await getSupabaseClient()

  // Obtener settings actuales
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentData } = await (supabase as any)
    .from('branches')
    .select('settings')
    .eq('id', id)
    .single()

  const currentSettings = currentData?.settings || {}
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.name !== undefined) updateData.name = input.name
  if (input.address !== undefined) updateData.address = input.address
  if (input.phone !== undefined) updateData.phone = input.phone
  if (input.email !== undefined) updateData.email = input.email
  if (input.is_active !== undefined) updateData.is_main = input.is_active

  // Actualizar settings si hay cambios
  const settingsUpdate: Record<string, unknown> = { ...currentSettings }
  if (input.rooms_count !== undefined) settingsUpdate.rooms_count = input.rooms_count
  if (input.manager_id !== undefined) settingsUpdate.manager_id = input.manager_id
  updateData.settings = settingsUpdate

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('branches')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating branch:', error)
    return { data: null, error: `Error al actualizar la sucursal: ${error.message}` }
  }

  revalidatePath('/configuracion')
  return { data: transformBranchData(data), error: null }
}

// Eliminar una sucursal
export async function deleteBranch(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await getSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('branches')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting branch:', error)
    return { success: false, error: `Error al eliminar la sucursal: ${error.message}` }
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
