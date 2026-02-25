'use server'

import { createAdminClient } from '@/lib/supabase/server'

export type SearchResultType = 'patient' | 'treatment' | 'appointment'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle: string
  href: string
}

export interface GlobalSearchResponse {
  patients: SearchResult[]
  treatments: SearchResult[]
  appointments: SearchResult[]
  error: string | null
}

export async function globalSearch(query: string): Promise<GlobalSearchResponse> {
  if (!query || query.trim().length < 2) {
    return { patients: [], treatments: [], appointments: [], error: null }
  }

  const supabase = createAdminClient()
  const sanitizedQuery = query.trim()

  const [patientsResult, treatmentsResult, appointmentsResult] = await Promise.allSettled([
    // Search patients by name, email, or phone
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('patients')
      .select('id, first_name, last_name, email, phone, status')
      .or(
        `first_name.ilike.%${sanitizedQuery}%,last_name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%,phone.ilike.%${sanitizedQuery}%`
      )
      .eq('status', 'active')
      .order('first_name', { ascending: true })
      .limit(5),

    // Search treatments by name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('treatments')
      .select('id, name, duration_minutes, is_active')
      .ilike('name', `%${sanitizedQuery}%`)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(5),

    // Search appointments by treatment name or patient name (via join)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('appointments')
      .select(
        'id, scheduled_at, treatment_name, status, patients!inner(first_name, last_name)'
      )
      .or(
        `treatment_name.ilike.%${sanitizedQuery}%`
      )
      .order('scheduled_at', { ascending: false })
      .limit(5),
  ])

  // Process patients
  const patients: SearchResult[] = []
  if (patientsResult.status === 'fulfilled' && !patientsResult.value.error) {
    const rows = patientsResult.value.data || []
    for (const row of rows) {
      patients.push({
        id: row.id,
        type: 'patient',
        title: `${row.first_name} ${row.last_name}`,
        subtitle: row.email || row.phone || 'Sin contacto registrado',
        href: `/pacientes/${row.id}`,
      })
    }
  }

  // Process treatments
  const treatments: SearchResult[] = []
  if (treatmentsResult.status === 'fulfilled' && !treatmentsResult.value.error) {
    const rows = treatmentsResult.value.data || []
    for (const row of rows) {
      treatments.push({
        id: row.id,
        type: 'treatment',
        title: row.name,
        subtitle: row.duration_minutes ? `${row.duration_minutes} minutos` : 'Duracion variable',
        href: `/tratamientos/${row.id}`,
      })
    }
  }

  // Process appointments
  const appointments: SearchResult[] = []
  if (appointmentsResult.status === 'fulfilled' && !appointmentsResult.value.error) {
    const rows = appointmentsResult.value.data || []
    for (const row of rows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const patient = (row as any).patients
      const patientName = patient
        ? `${patient.first_name} ${patient.last_name}`
        : 'Paciente desconocido'
      const scheduledDate = row.scheduled_at
        ? new Date(row.scheduled_at).toLocaleDateString('es-DO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : ''

      appointments.push({
        id: row.id,
        type: 'appointment',
        title: row.treatment_name || 'Cita sin tratamiento',
        subtitle: `${patientName} · ${scheduledDate}`,
        href: '/agenda',
      })
    }
  }

  return { patients, treatments, appointments, error: null }
}
