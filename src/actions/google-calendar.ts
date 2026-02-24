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
