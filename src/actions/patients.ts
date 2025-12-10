'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipos
export interface PatientData {
  id: string
  clinic_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string
  phone_secondary: string | null
  date_of_birth: string | null
  gender: string | null
  document_type: string | null
  document_number: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  preferred_contact: string | null
  source: string | null
  tags: string[] | null
  status: string
  notes: string | null
  avatar_url: string | null
  total_spent: number
  visit_count: number
  last_visit_at: string | null
  created_at: string
  updated_at: string
}

export interface CreatePatientInput {
  first_name: string
  last_name: string
  email?: string
  phone: string
  phone_secondary?: string
  date_of_birth?: string
  gender?: string
  document_type?: string
  document_number?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  preferred_contact?: string
  source?: string
  tags?: string[]
  notes?: string
}

export interface UpdatePatientInput extends Partial<CreatePatientInput> {
  status?: string
}

export interface PatientStats {
  total: number
  active: number
  vip: number
  inactive: number
}

// Obtener todos los pacientes
export async function getPatients(): Promise<PatientData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('patients')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching patients:', error)
    return []
  }

  return (data || []) as PatientData[]
}

// Obtener estadísticas de pacientes
export async function getPatientStats(): Promise<PatientStats> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('patients')
    .select('status, tags')
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching patient stats:', error)
    return { total: 0, active: 0, vip: 0, inactive: 0 }
  }

  const patients = data as { status: string; tags: string[] | null }[]

  return {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    vip: patients.filter(p => p.tags?.includes('VIP')).length,
    inactive: patients.filter(p => p.status === 'inactive').length,
  }
}

// Obtener un paciente por ID
export async function getPatientById(id: string): Promise<PatientData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching patient:', error)
    return null
  }

  return data as PatientData
}

// Crear un nuevo paciente
export async function createPatient(input: CreatePatientInput): Promise<{ data: PatientData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Mapear campos al esquema real de la tabla patients
  const patientData = {
    clinic_id: '00000000-0000-0000-0000-000000000001', // TODO: Obtener del usuario actual
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email || null,
    phone: input.phone || null,
    phone_secondary: input.phone_secondary || null,
    date_of_birth: input.date_of_birth || null,
    gender: input.gender || null,
    document_type: input.document_type || 'cedula',
    document_number: input.document_number || null,
    // Direccion - usa nombres simples
    address: input.address || null,
    city: input.city || null,
    state: input.state || null,
    postal_code: input.postal_code || null,
    emergency_contact_name: input.emergency_contact_name || null,
    emergency_contact_phone: input.emergency_contact_phone || null,
    source: input.source || null,
    tags: input.tags || [],
    notes: input.notes || null,
    status: 'active',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('patients')
    .insert(patientData)
    .select()
    .single()

  if (error) {
    console.error('Error creating patient:', error)
    return { data: null, error: `Error al crear el paciente: ${error.message}` }
  }

  revalidatePath('/pacientes')
  return { data: data as PatientData, error: null }
}

// Actualizar un paciente
export async function updatePatient(id: string, input: UpdatePatientInput): Promise<{ data: PatientData | null; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('patients')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating patient:', error)
    return { data: null, error: 'Error al actualizar el paciente' }
  }

  revalidatePath('/pacientes')
  revalidatePath(`/pacientes/${id}`)
  return { data: data as PatientData, error: null }
}

// Eliminar un paciente (soft delete)
export async function deletePatient(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('patients')
    .update({
      deleted_at: new Date().toISOString(),
      status: 'inactive',
    })
    .eq('id', id)

  if (error) {
    console.error('Error deleting patient:', error)
    return { success: false, error: 'Error al eliminar el paciente' }
  }

  revalidatePath('/pacientes')
  return { success: true, error: null }
}

// Buscar pacientes
export async function searchPatients(query: string): Promise<PatientData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('patients')
    .select('*')
    .is('deleted_at', null)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error searching patients:', error)
    return []
  }

  return (data || []) as PatientData[]
}

// Obtener pacientes por estado
export async function getPatientsByStatus(status: string): Promise<PatientData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('patients')
    .select('*')
    .eq('status', status)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching patients by status:', error)
    return []
  }

  return (data || []) as PatientData[]
}

// Obtener pacientes VIP
export async function getVIPPatients(): Promise<PatientData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('patients')
    .select('*')
    .contains('tags', ['VIP'])
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching VIP patients:', error)
    return []
  }

  return (data || []) as PatientData[]
}
