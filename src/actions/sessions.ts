'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { InjectionPoint } from '@/types/treatment-templates'

// Tipos
export type SessionStatus = 'in_progress' | 'completed' | 'cancelled' | 'incomplete'

export interface SessionData {
  id: string
  clinic_id: string
  branch_id: string | null
  appointment_id: string | null
  patient_id: string
  professional_id: string
  treatment_id: string | null
  treatment_name: string
  package_session_id: string | null
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  status: SessionStatus
  treated_zones: unknown[]
  technical_parameters: Record<string, unknown>
  products_used: unknown[]
  observations: string | null
  patient_feedback: string | null
  adverse_reactions: string | null
  result_rating: number | null
  result_notes: string | null
  patient_signature_url: string | null
  professional_signature_url: string | null
  signed_at: string | null
  follow_up_required: boolean
  follow_up_notes: string | null
  next_session_recommended_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface SessionListItemData extends SessionData {
  patient_name: string
  patient_phone: string | null
  patient_avatar: string | null
  professional_name: string
  treatment_display_name: string | null
  treatment_price: number | null
  category_name: string | null
  category_color: string | null
  image_count: number
  total_product_cost: number
}

export interface CreateSessionInput {
  appointment_id?: string
  patient_id: string
  professional_id: string
  treatment_id?: string
  treatment_name: string
  observations?: string
  treated_zones?: unknown[]
  technical_parameters?: Record<string, unknown>
}

export interface UpdateSessionInput {
  ended_at?: string
  duration_minutes?: number
  status?: SessionStatus
  treated_zones?: unknown[]
  technical_parameters?: Record<string, unknown>
  products_used?: unknown[]
  observations?: string
  patient_feedback?: string
  adverse_reactions?: string
  result_rating?: number
  result_notes?: string
  patient_signature_url?: string
  professional_signature_url?: string
  follow_up_required?: boolean
  follow_up_notes?: string
  next_session_recommended_at?: string
}

// =============================================
// SESIONES
// =============================================

// Obtener todas las sesiones con datos expandidos
export async function getSessions(options?: {
  patientId?: string
  professionalId?: string
  status?: SessionStatus
  startDate?: string
  endDate?: string
}): Promise<SessionListItemData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('sessions')
    .select(`
      *,
      patients (
        first_name,
        last_name,
        phone,
        avatar_url
      ),
      users!sessions_professional_id_fkey (
        full_name
      ),
      treatments (
        name,
        price,
        treatment_categories (
          name,
          color
        )
      ),
      session_images (id),
      session_products (total_cost)
    `)
    .order('started_at', { ascending: false })
    .limit(500)

  if (options?.patientId) {
    query = query.eq('patient_id', options.patientId)
  }
  if (options?.professionalId) {
    query = query.eq('professional_id', options.professionalId)
  }
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.startDate) {
    query = query.gte('started_at', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('started_at', options.endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching sessions:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((session: any) => ({
    ...session,
    patient_name: session.patients
      ? `${session.patients.first_name || ''} ${session.patients.last_name || ''}`.trim()
      : 'Paciente',
    patient_phone: session.patients?.phone || null,
    patient_avatar: session.patients?.avatar_url || null,
    professional_name: session.users?.full_name || 'Profesional',
    treatment_display_name: session.treatments?.name || session.treatment_name,
    treatment_price: session.treatments?.price || null,
    category_name: session.treatments?.treatment_categories?.name || null,
    category_color: session.treatments?.treatment_categories?.color || null,
    image_count: session.session_images?.length || 0,
    total_product_cost: session.session_products?.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, p: any) => sum + (p.total_cost || 0),
      0
    ) || 0,
  }))
}

// Obtener sesion por ID con todos los detalles
export async function getSessionById(id: string): Promise<SessionListItemData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('sessions')
    .select(`
      *,
      patients (
        id,
        first_name,
        last_name,
        phone,
        email,
        avatar_url
      ),
      users!sessions_professional_id_fkey (
        id,
        full_name,
        avatar_url
      ),
      treatments (
        id,
        name,
        price,
        duration_minutes,
        aftercare_instructions,
        treatment_categories (
          name,
          color
        )
      ),
      appointments (
        id,
        scheduled_at,
        status
      ),
      session_images (*),
      session_products (
        *,
        products (name, sku)
      ),
      clinical_notes (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching session:', error)
    return null
  }

  const session = data
  return {
    ...session,
    patient_name: session.patients
      ? `${session.patients.first_name || ''} ${session.patients.last_name || ''}`.trim()
      : 'Paciente',
    patient_phone: session.patients?.phone || null,
    patient_avatar: session.patients?.avatar_url || null,
    professional_name: session.users?.full_name || 'Profesional',
    treatment_display_name: session.treatments?.name || session.treatment_name,
    treatment_price: session.treatments?.price || null,
    category_name: session.treatments?.treatment_categories?.name || null,
    category_color: session.treatments?.treatment_categories?.color || null,
    image_count: session.session_images?.length || 0,
    total_product_cost: session.session_products?.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, p: any) => sum + (p.total_cost || 0),
      0
    ) || 0,
  }
}

// Crear sesion
export async function createSession(
  input: CreateSessionInput
): Promise<{ data: SessionData | null; error: string | null }> {
  const supabase = createAdminClient()

  const sessionData = {
    clinic_id: '00000000-0000-0000-0000-000000000001', // TODO: Obtener del usuario
    ...input,
    status: 'in_progress',
    started_at: new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('sessions')
    .insert(sessionData)
    .select()
    .single()

  if (error) {
    console.error('Error creating session:', error)
    return { data: null, error: 'Error al crear la sesion' }
  }

  revalidatePath('/sesiones')
  return { data: data as SessionData, error: null }
}

// Actualizar sesion
export async function updateSession(
  id: string,
  input: UpdateSessionInput
): Promise<{ data: SessionData | null; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('sessions')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating session:', error)
    return { data: null, error: 'Error al actualizar la sesion' }
  }

  revalidatePath('/sesiones')
  revalidatePath(`/sesiones/${id}`)
  return { data: data as SessionData, error: null }
}

// Completar sesion y generar comisión automáticamente
export async function completeSession(
  id: string,
  input?: {
    observations?: string
    result_rating?: number
    result_notes?: string
    follow_up_required?: boolean
    follow_up_notes?: string
    next_session_recommended_at?: string
    totalAmount?: number // Monto total del servicio (opcional, si no se pasa usa el precio del tratamiento)
  }
): Promise<{ success: boolean; error: string | null; commissionGenerated?: boolean }> {
  const supabase = createAdminClient()

  // Primero, obtener los datos de la sesión para generar la comisión
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionData, error: sessionError } = await (supabase as any)
    .from('sessions')
    .select(`
      *,
      treatments (
        id,
        name,
        price
      ),
      users!sessions_professional_id_fkey (
        id,
        commission_rate
      )
    `)
    .eq('id', id)
    .single()

  if (sessionError) {
    console.error('Error fetching session:', sessionError)
    return { success: false, error: 'Error al obtener la sesión' }
  }

  // Actualizar la sesión como completada
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('sessions')
    .update({
      ...input,
      status: 'completed',
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error completing session:', error)
    return { success: false, error: 'Error al completar la sesion' }
  }

  // Generar comisión automáticamente si el profesional tiene tasa de comisión
  let commissionGenerated = false
  const commissionRate = sessionData?.users?.commission_rate || 0
  const treatmentPrice = input?.totalAmount || sessionData?.treatments?.price || 0

  if (commissionRate > 0 && treatmentPrice > 0) {
    const commissionAmount = treatmentPrice * (commissionRate / 100)

    // Crear registro de comisión
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: commissionError } = await (supabase as any)
      .from('commissions')
      .insert({
        clinic_id: sessionData.clinic_id,
        professional_id: sessionData.professional_id,
        reference_type: 'session',
        reference_id: id,
        base_amount: treatmentPrice,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: 'pending',
        period_start: new Date().toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        notes: `Comisión automática por sesión: ${sessionData?.treatments?.name || sessionData.treatment_name}`,
      })

    if (commissionError) {
      console.error('Error creating commission:', commissionError)
      // No fallamos la operación, solo logueamos el error
    } else {
      commissionGenerated = true
    }
  }

  revalidatePath('/sesiones')
  revalidatePath(`/sesiones/${id}`)
  revalidatePath('/profesionales/comisiones')

  return { success: true, error: null, commissionGenerated }
}

// Cancelar sesion
export async function cancelSession(
  id: string,
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('sessions')
    .update({
      status: 'cancelled',
      observations: reason,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error cancelling session:', error)
    return { success: false, error: 'Error al cancelar la sesion' }
  }

  revalidatePath('/sesiones')
  return { success: true, error: null }
}

// Obtener sesiones de un paciente
export async function getPatientSessions(patientId: string): Promise<SessionListItemData[]> {
  return getSessions({ patientId })
}

// Obtener sesiones de un profesional
export async function getProfessionalSessions(
  professionalId: string,
  options?: { startDate?: string; endDate?: string }
): Promise<SessionListItemData[]> {
  return getSessions({ professionalId, ...options })
}

// Obtener estadisticas de sesiones
export async function getSessionStats(): Promise<{
  total: number
  completed: number
  inProgress: number
  cancelled: number
  todayCount: number
  weekCount: number
}> {
  const supabase = createAdminClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions } = await (supabase as any)
    .from('sessions')
    .select('id, status, started_at')
    .limit(500)

  if (!sessions) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      cancelled: 0,
      todayCount: 0,
      weekCount: 0,
    }
  }

  const total = sessions.length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completed = sessions.filter((s: any) => s.status === 'completed').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inProgress = sessions.filter((s: any) => s.status === 'in_progress').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cancelled = sessions.filter((s: any) => s.status === 'cancelled').length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todayCount = sessions.filter((s: any) => {
    const sessionDate = new Date(s.started_at)
    return sessionDate >= today
  }).length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weekCount = sessions.filter((s: any) => {
    const sessionDate = new Date(s.started_at)
    return sessionDate >= weekAgo
  }).length

  return {
    total,
    completed,
    inProgress,
    cancelled,
    todayCount,
    weekCount,
  }
}

// =============================================
// NOTAS CLINICAS
// =============================================

export interface ClinicalNoteData {
  id: string
  clinic_id: string
  session_id: string | null
  patient_id: string
  type: string
  title: string | null
  content: string
  is_important: boolean
  is_private: boolean
  created_at: string
  updated_at: string
  created_by: string
}

export async function getSessionNotes(sessionId: string): Promise<ClinicalNoteData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('clinical_notes')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching clinical notes:', error)
    return []
  }

  return (data || []) as ClinicalNoteData[]
}

export async function createClinicalNote(
  input: {
    session_id?: string
    patient_id: string
    type: string
    title?: string
    content: string
    is_important?: boolean
    is_private?: boolean
  },
  userId: string
): Promise<{ data: ClinicalNoteData | null; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('clinical_notes')
    .insert({
      clinic_id: '00000000-0000-0000-0000-000000000001', // TODO: Obtener del usuario
      ...input,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating clinical note:', error)
    return { data: null, error: 'Error al crear la nota' }
  }

  if (input.session_id) {
    revalidatePath(`/sesiones/${input.session_id}`)
  }
  return { data: data as ClinicalNoteData, error: null }
}

// =============================================
// HISTORIAL DE TRATAMIENTOS (Para modelo 3D)
// =============================================

/**
 * Obtiene el historial de puntos de inyección de sesiones anteriores de un paciente.
 * Usado para mostrar en el modelo 3D los tratamientos previos.
 */
export async function getPatientTreatmentHistory(
  patientId: string,
  options?: {
    treatmentType?: 'injectable' | 'facial'
    limit?: number
    excludeSessionId?: string // Excluir sesión actual
  }
): Promise<InjectionPoint[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('sessions')
    .select('id, started_at, technical_parameters, treatment_name')
    .eq('patient_id', patientId)
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(options?.limit || 10)

  // Excluir sesión actual si se especifica
  if (options?.excludeSessionId) {
    query = query.neq('id', options.excludeSessionId)
  }

  const { data: sessions, error } = await query

  if (error) {
    console.error('Error fetching treatment history:', error)
    return []
  }

  if (!sessions || sessions.length === 0) {
    return []
  }

  // Extraer puntos de inyección de cada sesión
  const allPoints: InjectionPoint[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const session of sessions as any[]) {
    const template = session.technical_parameters?.treatmentTemplate

    // Verificar si es un tratamiento inyectable con puntos
    if (template?.templateType === 'injectable' && template?.injectionPoints) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const points = template.injectionPoints.map((point: any) => ({
        ...point,
        sessionId: session.id,
        sessionDate: session.started_at,
      }))
      allPoints.push(...points)
    }
  }

  return allPoints
}

/**
 * Obtiene un resumen del historial de zonas tratadas de un paciente.
 * Útil para mostrar estadísticas o frecuencia de tratamiento por zona.
 */
export async function getPatientTreatmentZoneSummary(
  patientId: string
): Promise<Map<string, { count: number; lastTreated: string }>> {
  const points = await getPatientTreatmentHistory(patientId, { limit: 50 })

  const zoneSummary = new Map<string, { count: number; lastTreated: string }>()

  for (const point of points) {
    const existing = zoneSummary.get(point.zone)
    if (existing) {
      existing.count++
      // Actualizar lastTreated si esta fecha es más reciente
      if (point.sessionDate && point.sessionDate > existing.lastTreated) {
        existing.lastTreated = point.sessionDate
      }
    } else {
      zoneSummary.set(point.zone, {
        count: 1,
        lastTreated: point.sessionDate || '',
      })
    }
  }

  return zoneSummary
}

// =============================================
// SESSION IMAGES
// =============================================

export type SessionImageType = 'before' | 'during' | 'after'

export interface SessionImageData {
  id: string
  session_id: string
  patient_id: string
  type: SessionImageType
  body_zone: string | null
  image_url: string
  thumbnail_url: string | null
  caption: string | null
  taken_at: string
  sort_order: number
  is_consent_image: boolean
  created_at: string
  created_by: string | null
}

export interface CreateSessionImageInput {
  session_id: string
  patient_id: string
  type: SessionImageType
  body_zone?: string
  image_url: string
  thumbnail_url?: string
  caption?: string
  sort_order?: number
  is_consent_image?: boolean
}

/**
 * Get all images for a session
 */
export async function getSessionImages(sessionId: string): Promise<SessionImageData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('session_images')
    .select('*')
    .eq('session_id', sessionId)
    .order('type', { ascending: true })
    .order('sort_order', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Error fetching session images:', error)
    return []
  }

  return (data || []) as SessionImageData[]
}

/**
 * Get all images for a patient (across all sessions)
 */
export async function getPatientImages(
  patientId: string,
  options?: {
    type?: SessionImageType
    limit?: number
  }
): Promise<(SessionImageData & { session_treatment_name?: string; session_started_at?: string })[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('session_images')
    .select(`
      *,
      sessions (
        treatment_name,
        started_at
      )
    `)
    .eq('patient_id', patientId)
    .order('taken_at', { ascending: false })

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  query = query.limit(options?.limit || 200)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching patient images:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((img: any) => ({
    ...img,
    session_treatment_name: img.sessions?.treatment_name || null,
    session_started_at: img.sessions?.started_at || null,
  }))
}

/**
 * Create a new session image record
 */
export async function createSessionImage(
  input: CreateSessionImageInput,
  userId?: string
): Promise<{ data: SessionImageData | null; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('session_images')
    .insert({
      ...input,
      taken_at: new Date().toISOString(),
      created_by: userId || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating session image:', error)
    return { data: null, error: 'Error al guardar la imagen' }
  }

  revalidatePath(`/sesiones/${input.session_id}`)
  revalidatePath(`/pacientes/${input.patient_id}`)

  return { data: data as SessionImageData, error: null }
}

/**
 * Update a session image
 */
export async function updateSessionImage(
  id: string,
  input: Partial<Pick<SessionImageData, 'caption' | 'body_zone' | 'sort_order'>>
): Promise<{ data: SessionImageData | null; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('session_images')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating session image:', error)
    return { data: null, error: 'Error al actualizar la imagen' }
  }

  if (data) {
    revalidatePath(`/sesiones/${data.session_id}`)
  }

  return { data: data as SessionImageData, error: null }
}

/**
 * Delete a session image
 */
export async function deleteSessionImage(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // First get the image to know which session to revalidate
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: image } = await (supabase as any)
    .from('session_images')
    .select('session_id, patient_id')
    .eq('id', id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('session_images')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting session image:', error)
    return { success: false, error: 'Error al eliminar la imagen' }
  }

  if (image) {
    revalidatePath(`/sesiones/${image.session_id}`)
    revalidatePath(`/pacientes/${image.patient_id}`)
  }

  return { success: true, error: null }
}

/**
 * Get image count summary for a session
 */
export async function getSessionImageCounts(sessionId: string): Promise<{
  before: number
  during: number
  after: number
  total: number
}> {
  const images = await getSessionImages(sessionId)

  return {
    before: images.filter(img => img.type === 'before').length,
    during: images.filter(img => img.type === 'during').length,
    after: images.filter(img => img.type === 'after').length,
    total: images.length,
  }
}

/**
 * Get patient photo history grouped by session
 */
export async function getPatientPhotoHistory(
  patientId: string
): Promise<{
  sessions: Array<{
    sessionId: string
    treatmentName: string
    date: string
    images: SessionImageData[]
  }>
  totalImages: number
}> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions, error } = await (supabase as any)
    .from('sessions')
    .select(`
      id,
      treatment_name,
      started_at,
      session_images (*)
    `)
    .eq('patient_id', patientId)
    .not('session_images', 'is', null)
    .order('started_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching patient photo history:', error)
    return { sessions: [], totalImages: 0 }
  }

  let totalImages = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedSessions = (sessions || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => s.session_images && s.session_images.length > 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => {
      totalImages += s.session_images.length
      return {
        sessionId: s.id,
        treatmentName: s.treatment_name,
        date: s.started_at,
        images: s.session_images as SessionImageData[],
      }
    })

  return { sessions: groupedSessions, totalImages }
}
