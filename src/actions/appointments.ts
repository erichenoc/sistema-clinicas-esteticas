'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AppointmentStatus } from '@/types/appointments'
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  isGoogleCalendarConnected,
} from '@/actions/google-calendar'

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
  google_event_id: string | null
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

// Helper: resolve patient name and professional name from their IDs
async function resolveAppointmentNames(
  patientId: string,
  professionalId: string
): Promise<{ patientName: string; professionalName: string }> {
  const supabase = createAdminClient()

  const [patientResult, professionalResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('patients')
      .select('first_name, last_name')
      .eq('id', patientId)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('users')
      .select('first_name, last_name, full_name')
      .eq('id', professionalId)
      .single(),
  ])

  const patientName = patientResult.data
    ? `${patientResult.data.first_name || ''} ${patientResult.data.last_name || ''}`.trim()
    : 'Paciente'

  const professionalName = professionalResult.data
    ? professionalResult.data.full_name ||
      `${professionalResult.data.first_name || ''} ${professionalResult.data.last_name || ''}`.trim()
    : 'Profesional'

  return { patientName, professionalName }
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
    .limit(500)

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

  // Build insert object with only valid DB columns
  const appointmentData = {
    clinic_id: '00000000-0000-0000-0000-000000000001', // TODO: Obtener del usuario
    patient_id: input.patient_id,
    professional_id: input.professional_id,
    treatment_id: input.treatment_id || null,
    room_id: input.room_id || null,
    branch_id: input.branch_id || null,
    scheduled_at: input.scheduled_at,
    duration_minutes: input.duration_minutes,
    status: 'scheduled' as AppointmentStatus,
    notes: input.notes || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('appointments')
    .insert(appointmentData)
    .select()
    .single()

  if (error) {
    console.error('Error creating appointment:', error)
    return { data: null, error: `Error al crear la cita: ${error.message}` }
  }

  const created = data as AppointmentData

  // Google Calendar sync - non-blocking
  try {
    const calendarConnected = await isGoogleCalendarConnected(input.professional_id)

    if (calendarConnected) {
      const { patientName, professionalName } = await resolveAppointmentNames(
        input.patient_id,
        input.professional_id
      )

      const gcalResult = await createGoogleCalendarEvent(input.professional_id, {
        treatmentName: input.treatment_name || null,
        patientName,
        scheduledAt: input.scheduled_at,
        durationMinutes: input.duration_minutes,
        notes: input.notes || null,
        professionalName,
      })

      if (gcalResult.eventId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('appointments')
          .update({ google_event_id: gcalResult.eventId })
          .eq('id', created.id)

        created.google_event_id = gcalResult.eventId
      } else if (gcalResult.error) {
        console.error('Google Calendar sync failed on create:', gcalResult.error)
      }
    }
  } catch (gcalError) {
    console.error('Google Calendar sync error on create (non-blocking):', gcalError)
  }

  revalidatePath('/agenda')
  return { data: created, error: null }
}

// Actualizar una cita
export async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput
): Promise<{ data: AppointmentData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Fetch existing appointment to retrieve google_event_id and current field values
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('appointments')
    .select('google_event_id, patient_id, professional_id, treatment_name, scheduled_at, duration_minutes, notes')
    .eq('id', id)
    .single()

  // Build update object with only valid DB columns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (input.patient_id !== undefined) updateData.patient_id = input.patient_id
  if (input.professional_id !== undefined) updateData.professional_id = input.professional_id
  if (input.treatment_id !== undefined) updateData.treatment_id = input.treatment_id
  if (input.scheduled_at !== undefined) updateData.scheduled_at = input.scheduled_at
  if (input.duration_minutes !== undefined) updateData.duration_minutes = input.duration_minutes
  if (input.room_id !== undefined) updateData.room_id = input.room_id
  if (input.status !== undefined) updateData.status = input.status
  if (input.notes !== undefined) updateData.notes = input.notes
  if (input.cancellation_reason !== undefined) updateData.cancellation_reason = input.cancellation_reason

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('appointments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating appointment:', error)
    return { data: null, error: `Error al actualizar la cita: ${error.message}` }
  }

  const updated = data as AppointmentData

  // Google Calendar sync - non-blocking
  try {
    const professionalId = input.professional_id ?? existing?.professional_id
    const googleEventId: string | null = existing?.google_event_id ?? null

    if (professionalId && googleEventId) {
      const calendarConnected = await isGoogleCalendarConnected(professionalId)

      if (calendarConnected) {
        const patientId = input.patient_id ?? existing?.patient_id
        const { patientName, professionalName } = await resolveAppointmentNames(
          patientId,
          professionalId
        )

        const gcalResult = await updateGoogleCalendarEvent(professionalId, googleEventId, {
          treatmentName: input.treatment_name ?? existing?.treatment_name ?? null,
          patientName,
          scheduledAt: input.scheduled_at ?? existing?.scheduled_at,
          durationMinutes: input.duration_minutes ?? existing?.duration_minutes,
          notes: input.notes ?? existing?.notes ?? null,
          professionalName,
        })

        if (!gcalResult.success && gcalResult.error) {
          console.error('Google Calendar sync failed on update:', gcalResult.error)
        }
      }
    }
  } catch (gcalError) {
    console.error('Google Calendar sync error on update (non-blocking):', gcalError)
  }

  revalidatePath('/agenda')
  revalidatePath(`/agenda/${id}`)
  return { data: updated, error: null }
}

// Actualizar estado de una cita
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  cancellationReason?: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // Fetch existing appointment to retrieve google_event_id and professional_id for GCal sync
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('appointments')
    .select('google_event_id, professional_id')
    .eq('id', id)
    .single()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  // Set timestamp based on status change
  if (status === 'confirmed') {
    updateData.confirmed_at = new Date().toISOString()
  } else if (status === 'in_progress') {
    updateData.started_at = new Date().toISOString()
  } else if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  } else if (status === 'cancelled' && cancellationReason) {
    updateData.cancellation_reason = cancellationReason
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('appointments')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating appointment status:', error)
    return { success: false, error: `Error al actualizar el estado de la cita: ${error.message}` }
  }

  // Google Calendar sync on cancellation - non-blocking
  if (status === 'cancelled') {
    try {
      const googleEventId: string | null = existing?.google_event_id ?? null
      const professionalId: string | null = existing?.professional_id ?? null

      if (professionalId && googleEventId) {
        const calendarConnected = await isGoogleCalendarConnected(professionalId)

        if (calendarConnected) {
          const gcalResult = await deleteGoogleCalendarEvent(professionalId, googleEventId)

          if (!gcalResult.success && gcalResult.error) {
            console.error('Google Calendar sync failed on cancellation:', gcalResult.error)
          }
        }
      }
    } catch (gcalError) {
      console.error('Google Calendar sync error on cancellation (non-blocking):', gcalError)
    }
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

  // Fetch existing appointment to retrieve google_event_id before deletion
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('appointments')
    .select('google_event_id, professional_id')
    .eq('id', id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('appointments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting appointment:', error)
    return { success: false, error: 'Error al eliminar la cita' }
  }

  // Google Calendar sync - non-blocking
  try {
    const googleEventId: string | null = existing?.google_event_id ?? null
    const professionalId: string | null = existing?.professional_id ?? null

    if (professionalId && googleEventId) {
      const calendarConnected = await isGoogleCalendarConnected(professionalId)

      if (calendarConnected) {
        const gcalResult = await deleteGoogleCalendarEvent(professionalId, googleEventId)

        if (!gcalResult.success && gcalResult.error) {
          console.error('Google Calendar sync failed on delete:', gcalResult.error)
        }
      }
    }
  } catch (gcalError) {
    console.error('Google Calendar sync error on delete (non-blocking):', gcalError)
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
