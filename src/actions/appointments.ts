'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AppointmentStatus } from '@/types/appointments'

// Tipos
export interface AppointmentData {
  id: string
  clinic_id: string
  branch_id: string | null
  patient_id: string
  professional_id: string
  room_id: string | null
  treatment_id: string | null
  treatment_name: string | null
  package_session_id: string | null
  scheduled_at: string
  duration_minutes: number
  buffer_minutes: number
  status: AppointmentStatus
  status_changed_at: string | null
  status_changed_by: string | null
  notes: string | null
  patient_notes: string | null
  cancellation_reason: string | null
  reminder_sent_at: string | null
  confirmation_sent_at: string | null
  is_recurring: boolean
  recurrence_rule: string | null
  parent_appointment_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

// Vista expandida con joins
export interface AppointmentListItemData extends AppointmentData {
  patient_name: string
  patient_phone: string | null
  patient_email: string | null
  patient_avatar: string | null
  professional_name: string
  room_name: string | null
  room_color: string | null
  treatment_display_name: string | null
  treatment_price: number | null
  category_name: string | null
  category_color: string | null
  end_at: string
}

export interface CreateAppointmentInput {
  patient_id: string
  professional_id: string
  treatment_id?: string
  treatment_name?: string
  scheduled_at: string
  duration_minutes: number
  room_id?: string
  buffer_minutes?: number
  notes?: string
  patient_notes?: string
  is_recurring?: boolean
  recurrence_rule?: string
  branch_id?: string
}

export interface UpdateAppointmentInput {
  patient_id?: string
  professional_id?: string
  treatment_id?: string
  treatment_name?: string
  scheduled_at?: string
  duration_minutes?: number
  room_id?: string
  buffer_minutes?: number
  status?: AppointmentStatus
  notes?: string
  patient_notes?: string
  cancellation_reason?: string
}

export interface ProfessionalData {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: string
  avatar_url: string | null
  is_active: boolean
}

export interface RoomData {
  id: string
  name: string
  description: string | null
  type: string
  color: string
  is_active: boolean
}

// Obtener todas las citas con datos expandidos
export async function getAppointments(options?: {
  startDate?: string
  endDate?: string
  professionalId?: string
  status?: AppointmentStatus
}): Promise<AppointmentListItemData[]> {
  const supabase = createAdminClient()

  // Construir query base con joins manuales
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('appointments')
    .select(`
      *,
      patients!inner (
        first_name,
        last_name,
        phone,
        email,
        avatar_url
      ),
      users!appointments_professional_id_fkey (
        first_name,
        last_name,
        full_name
      ),
      rooms (
        name,
        color
      ),
      treatments (
        name,
        price,
        treatment_categories (
          name,
          color
        )
      )
    `)
    .order('scheduled_at', { ascending: true })

  // Aplicar filtros
  if (options?.startDate) {
    query = query.gte('scheduled_at', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('scheduled_at', options.endDate)
  }
  if (options?.professionalId) {
    query = query.eq('professional_id', options.professionalId)
  }
  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching appointments:', error)
    return []
  }

  // Transformar datos a formato esperado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((apt: any) => {
    const endAt = new Date(
      new Date(apt.scheduled_at).getTime() + apt.duration_minutes * 60000
    ).toISOString()

    return {
      ...apt,
      patient_name: `${apt.patients?.first_name || ''} ${apt.patients?.last_name || ''}`.trim(),
      patient_phone: apt.patients?.phone || null,
      patient_email: apt.patients?.email || null,
      patient_avatar: apt.patients?.avatar_url || null,
      professional_name: apt.users?.full_name || `${apt.users?.first_name || ''} ${apt.users?.last_name || ''}`.trim(),
      room_name: apt.rooms?.name || null,
      room_color: apt.rooms?.color || null,
      treatment_display_name: apt.treatments?.name || apt.treatment_name,
      treatment_price: apt.treatments?.price || null,
      category_name: apt.treatments?.treatment_categories?.name || null,
      category_color: apt.treatments?.treatment_categories?.color || null,
      end_at: endAt,
    } as AppointmentListItemData
  })
}

// Obtener citas del dia
export async function getTodayAppointments(): Promise<AppointmentListItemData[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return getAppointments({
    startDate: today.toISOString(),
    endDate: tomorrow.toISOString(),
  })
}

// Obtener estadisticas de citas
export async function getAppointmentStats(date?: Date): Promise<{
  total: number
  scheduled: number
  confirmed: number
  waiting: number
  in_progress: number
  completed: number
  cancelled: number
  no_show: number
}> {
  const supabase = createAdminClient()

  const targetDate = date || new Date()
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('appointments')
    .select('status')
    .gte('scheduled_at', startOfDay.toISOString())
    .lte('scheduled_at', endOfDay.toISOString())

  if (error) {
    console.error('Error fetching appointment stats:', error)
    return {
      total: 0,
      scheduled: 0,
      confirmed: 0,
      waiting: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    }
  }

  const appointments = data as { status: AppointmentStatus }[]

  return {
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === 'scheduled').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    waiting: appointments.filter((a) => a.status === 'waiting').length,
    in_progress: appointments.filter((a) => a.status === 'in_progress').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    no_show: appointments.filter((a) => a.status === 'no_show').length,
  }
}

// Obtener una cita por ID
export async function getAppointmentById(id: string): Promise<AppointmentListItemData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('appointments')
    .select(`
      *,
      patients!inner (
        first_name,
        last_name,
        phone,
        email,
        avatar_url
      ),
      users!appointments_professional_id_fkey (
        first_name,
        last_name,
        full_name
      ),
      rooms (
        name,
        color
      ),
      treatments (
        name,
        price,
        treatment_categories (
          name,
          color
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching appointment:', error)
    return null
  }

  const apt = data
  const endAt = new Date(
    new Date(apt.scheduled_at).getTime() + apt.duration_minutes * 60000
  ).toISOString()

  return {
    ...apt,
    patient_name: `${apt.patients?.first_name || ''} ${apt.patients?.last_name || ''}`.trim(),
    patient_phone: apt.patients?.phone || null,
    patient_email: apt.patients?.email || null,
    patient_avatar: apt.patients?.avatar_url || null,
    professional_name: apt.users?.full_name || `${apt.users?.first_name || ''} ${apt.users?.last_name || ''}`.trim(),
    room_name: apt.rooms?.name || null,
    room_color: apt.rooms?.color || null,
    treatment_display_name: apt.treatments?.name || apt.treatment_name,
    treatment_price: apt.treatments?.price || null,
    category_name: apt.treatments?.treatment_categories?.name || null,
    category_color: apt.treatments?.treatment_categories?.color || null,
    end_at: endAt,
  } as AppointmentListItemData
}

// Crear una nueva cita
export async function createAppointment(
  input: CreateAppointmentInput
): Promise<{ data: AppointmentData | null; error: string | null }> {
  const supabase = createAdminClient()

  const appointmentData = {
    ...input,
    clinic_id: '00000000-0000-0000-0000-000000000001', // TODO: Obtener del usuario
    status: 'scheduled' as AppointmentStatus,
    buffer_minutes: input.buffer_minutes || 0,
    is_recurring: input.is_recurring || false,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('appointments')
    .insert(appointmentData)
    .select()
    .single()

  if (error) {
    console.error('Error creating appointment:', error)
    return { data: null, error: 'Error al crear la cita' }
  }

  revalidatePath('/agenda')
  return { data: data as AppointmentData, error: null }
}

// Actualizar una cita
export async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput
): Promise<{ data: AppointmentData | null; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('appointments')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating appointment:', error)
    return { data: null, error: 'Error al actualizar la cita' }
  }

  revalidatePath('/agenda')
  revalidatePath(`/agenda/${id}`)
  return { data: data as AppointmentData, error: null }
}

// Actualizar estado de una cita
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  cancellationReason?: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    status,
    status_changed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (status === 'cancelled' && cancellationReason) {
    updateData.cancellation_reason = cancellationReason
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('appointments')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating appointment status:', error)
    return { success: false, error: 'Error al actualizar el estado de la cita' }
  }

  revalidatePath('/agenda')
  revalidatePath(`/agenda/${id}`)
  return { success: true, error: null }
}

// Cancelar una cita
export async function cancelAppointment(
  id: string,
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  return updateAppointmentStatus(id, 'cancelled', reason)
}

// Eliminar una cita (solo para admins)
export async function deleteAppointment(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('appointments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting appointment:', error)
    return { success: false, error: 'Error al eliminar la cita' }
  }

  revalidatePath('/agenda')
  return { success: true, error: null }
}

// Obtener profesionales activos
export async function getProfessionals(): Promise<ProfessionalData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('users')
    .select('*')
    .in('role', ['doctor', 'nurse', 'admin', 'owner'])
    .eq('is_active', true)
    .order('first_name')

  if (error) {
    console.error('Error fetching professionals:', error)
    return []
  }

  return (data || []) as ProfessionalData[]
}

// Obtener salas activas
export async function getRooms(): Promise<RoomData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('rooms')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    console.error('Error fetching rooms:', error)
    return []
  }

  return (data || []) as RoomData[]
}

// Buscar citas
export async function searchAppointments(query: string): Promise<AppointmentListItemData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('appointments')
    .select(`
      *,
      patients!inner (
        first_name,
        last_name,
        phone,
        email,
        avatar_url
      ),
      users!appointments_professional_id_fkey (
        first_name,
        last_name,
        full_name
      ),
      rooms (
        name,
        color
      ),
      treatments (
        name,
        price,
        treatment_categories (
          name,
          color
        )
      )
    `)
    .or(`patients.first_name.ilike.%${query}%,patients.last_name.ilike.%${query}%,treatment_name.ilike.%${query}%`)
    .order('scheduled_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error searching appointments:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((apt: any) => {
    const endAt = new Date(
      new Date(apt.scheduled_at).getTime() + apt.duration_minutes * 60000
    ).toISOString()

    return {
      ...apt,
      patient_name: `${apt.patients?.first_name || ''} ${apt.patients?.last_name || ''}`.trim(),
      patient_phone: apt.patients?.phone || null,
      patient_email: apt.patients?.email || null,
      patient_avatar: apt.patients?.avatar_url || null,
      professional_name: apt.users?.full_name || `${apt.users?.first_name || ''} ${apt.users?.last_name || ''}`.trim(),
      room_name: apt.rooms?.name || null,
      room_color: apt.rooms?.color || null,
      treatment_display_name: apt.treatments?.name || apt.treatment_name,
      treatment_price: apt.treatments?.price || null,
      category_name: apt.treatments?.treatment_categories?.name || null,
      category_color: apt.treatments?.treatment_categories?.color || null,
      end_at: endAt,
    } as AppointmentListItemData
  })
}
