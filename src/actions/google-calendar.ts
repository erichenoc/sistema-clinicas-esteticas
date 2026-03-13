'use server'

import { createAdminClient } from '@/lib/supabase/server'
import {
  getAuthUrl,
  getCalendarClient,
  refreshTokens,
  appointmentToGoogleEvent,
} from '@/lib/google-calendar'

// Get the Google Calendar connection URL for a user
export async function getGoogleCalendarAuthUrl(userId: string): Promise<string> {
  return getAuthUrl(userId)
}

// Check if a user has Google Calendar connected
export async function isGoogleCalendarConnected(userId: string): Promise<boolean> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('google_calendar_tokens')
    .select('id, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error || !data) return false
  return true
}

// Get tokens for a user (internal use)
async function getUserTokens(userId: string) {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error || !data) return null

  // Check if token is expired and refresh if needed
  if (data.token_expiry && new Date(data.token_expiry) < new Date()) {
    try {
      const newTokens = await refreshTokens(data.refresh_token)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('google_calendar_tokens')
        .update({
          access_token: newTokens.access_token,
          token_expiry: newTokens.expiry_date
            ? new Date(newTokens.expiry_date).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      return {
        access_token: newTokens.access_token as string,
        refresh_token: data.refresh_token as string,
      }
    } catch {
      console.error('Failed to refresh Google Calendar token for user:', userId)
      return null
    }
  }

  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string,
  }
}

// Disconnect Google Calendar for a user
export async function disconnectGoogleCalendar(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('google_calendar_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (error) {
    console.error('Error disconnecting Google Calendar:', error)
    return { success: false, error: 'Error al desconectar Google Calendar' }
  }

  return { success: true }
}

// Create a Google Calendar event when an appointment is created
export async function createGoogleCalendarEvent(
  professionalId: string,
  appointmentData: {
    treatmentName?: string | null
    patientName: string
    scheduledAt: string
    durationMinutes: number
    notes?: string | null
    professionalName?: string
  }
): Promise<{ eventId?: string; error?: string }> {
  const tokens = await getUserTokens(professionalId)
  if (!tokens) return { error: 'Google Calendar no conectado' }

  try {
    const calendar = await getCalendarClient(tokens)
    const event = appointmentToGoogleEvent(appointmentData)

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    })

    return { eventId: response.data.id || undefined }
  } catch (err) {
    console.error('Error creating Google Calendar event:', err)
    return { error: 'Error al crear evento en Google Calendar' }
  }
}

// Update a Google Calendar event when an appointment is modified
export async function updateGoogleCalendarEvent(
  professionalId: string,
  googleEventId: string,
  appointmentData: {
    treatmentName?: string | null
    patientName: string
    scheduledAt: string
    durationMinutes: number
    notes?: string | null
    professionalName?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const tokens = await getUserTokens(professionalId)
  if (!tokens) return { success: false, error: 'Google Calendar no conectado' }

  try {
    const calendar = await getCalendarClient(tokens)
    const event = appointmentToGoogleEvent(appointmentData)

    await calendar.events.update({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: event,
    })

    return { success: true }
  } catch (err) {
    console.error('Error updating Google Calendar event:', err)
    return { success: false, error: 'Error al actualizar evento en Google Calendar' }
  }
}

// Sync events FROM Google Calendar INTO the system
export async function syncFromGoogleCalendar(userId: string): Promise<{
  imported: number
  skipped: number
  errors: number
  error?: string
}> {
  const tokens = await getUserTokens(userId)
  if (!tokens) {
    console.error('[GCal Sync] No tokens for userId:', userId)
    return { imported: 0, skipped: 0, errors: 0, error: 'Google Calendar no conectado' }
  }

  try {
    const calendar = await getCalendarClient(tokens)
    const supabase = createAdminClient()

    // Fetch events from 30 days ago to 90 days ahead
    const timeMin = new Date()
    timeMin.setDate(timeMin.getDate() - 30)
    const timeMax = new Date()
    timeMax.setDate(timeMax.getDate() + 90)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 500,
    })

    const events = response.data.items || []
    console.log(`[GCal Sync] userId=${userId} found ${events.length} events`)
    let imported = 0
    let skipped = 0
    let errors = 0

    for (const event of events) {
      // Skip all-day events (no dateTime) and events without ID
      if (!event.start?.dateTime || !event.id) {
        skipped++
        continue
      }

      // Check if this event already exists in our system by google_event_id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from('appointments')
        .select('id')
        .eq('google_event_id', event.id)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }

      // Calculate duration
      const startTime = new Date(event.start.dateTime)
      const endTime = event.end?.dateTime
        ? new Date(event.end.dateTime)
        : new Date(startTime.getTime() + 60 * 60000)
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

      // Try to extract patient/treatment from description
      let patientName: string | null = null
      let patientPhone: string | null = null
      let patientEmail: string | null = null
      let treatmentName: string | null = null

      if (event.description) {
        const patientMatch = event.description.match(/Paciente:\s*(.+)/i)
        if (patientMatch) patientName = patientMatch[1].trim()
        const treatmentMatch = event.description.match(/(?:Tratamiento|Servicio):\s*(.+)/i)
        if (treatmentMatch) treatmentName = treatmentMatch[1].trim()
        const phoneMatch = event.description.match(/Tel[eé]fono:\s*(.+)/i)
        if (phoneMatch) patientPhone = phoneMatch[1].trim()
        const emailMatch = event.description.match(/Email:\s*(.+)/i)
        if (emailMatch) patientEmail = emailMatch[1].trim()
      }

      // Fallback: parse summary like "Cita - Rellenos Faciales" or "Botox - María García"
      if (!treatmentName && event.summary) {
        const parts = event.summary.split(' - ')
        if (parts.length >= 2) {
          // "Cita - Rellenos Faciales" → treatment = Rellenos Faciales
          treatmentName = parts[parts.length - 1].trim()
          if (!patientName) patientName = parts[0] !== 'Cita' ? parts[0].trim() : null
        } else {
          treatmentName = event.summary
        }
      }

      // Try to find existing patient by name or email
      let patientId: string | null = null
      if (patientEmail) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: patient } = await (supabase as any)
          .from('patients')
          .select('id')
          .ilike('email', patientEmail)
          .maybeSingle()
        if (patient) patientId = patient.id
      }
      if (!patientId && patientName) {
        const nameParts = patientName.trim().split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: patient } = await (supabase as any)
          .from('patients')
          .select('id')
          .ilike('first_name', `%${firstName}%`)
          .ilike('last_name', `%${lastName}%`)
          .maybeSingle()
        if (patient) patientId = patient.id
      }

      // If patient not found, create one from event data
      if (!patientId && patientName) {
        const nameParts = patientName.trim().split(' ')
        const firstName = nameParts[0] || 'Paciente'
        const lastName = nameParts.slice(1).join(' ') || 'Importado'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newPatient } = await (supabase as any)
          .from('patients')
          .insert({
            clinic_id: '00000000-0000-0000-0000-000000000001',
            first_name: firstName,
            last_name: lastName,
            phone: patientPhone,
            email: patientEmail,
          })
          .select('id')
          .single()
        if (newPatient) patientId = newPatient.id
      }

      // Skip if we still have no patient (can't insert — patient_id is NOT NULL)
      if (!patientId) {
        skipped++
        continue
      }

      const notes = event.description || null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('appointments')
        .insert({
          clinic_id: '00000000-0000-0000-0000-000000000001',
          patient_id: patientId,
          professional_id: userId,  // userId is the users.id, appointments references users(id)
          treatment_name: treatmentName || event.summary || 'Evento de Google Calendar',
          scheduled_at: startTime.toISOString(),
          duration_minutes: durationMinutes > 0 ? durationMinutes : 60,
          status: 'scheduled',
          notes,
          google_event_id: event.id,
        })

      if (insertError) {
        console.error('[GCal Sync] Error inserting event:', event.id, insertError)
        errors++
      } else {
        imported++
      }
    }

    return { imported, skipped, errors }
  } catch (err) {
    console.error('[GCal Sync] Error syncing from Google Calendar:', err)
    return { imported: 0, skipped: 0, errors: 0, error: 'Error al sincronizar con Google Calendar' }
  }
}

// Delete a Google Calendar event when an appointment is cancelled
export async function deleteGoogleCalendarEvent(
  professionalId: string,
  googleEventId: string
): Promise<{ success: boolean; error?: string }> {
  const tokens = await getUserTokens(professionalId)
  if (!tokens) return { success: false, error: 'Google Calendar no conectado' }

  try {
    const calendar = await getCalendarClient(tokens)

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    })

    return { success: true }
  } catch (err) {
    console.error('Error deleting Google Calendar event:', err)
    return { success: false, error: 'Error al eliminar evento en Google Calendar' }
  }
}
