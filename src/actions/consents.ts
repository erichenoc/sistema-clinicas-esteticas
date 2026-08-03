'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/lib/auth/guards'

// Tipos
export type ConsentStatus = 'pending' | 'signed' | 'revoked' | 'expired'
// Debe coincidir con ConsentCategory de @/types/consents, que alimenta la UI
export type ConsentCategory = 'general' | 'facial' | 'corporal' | 'inyectable' | 'laser' | 'quirurgico' | 'otro'

// Refleja las columnas REALES de consent_templates en Supabase.
export interface ConsentTemplateData {
  id: string
  clinic_id: string | null
  name: string
  code: string | null
  description: string | null
  category: ConsentCategory
  treatment_id: string | null
  content: string
  version: number
  is_active: boolean
  is_required: boolean
  requires_witness: boolean
  expiry_days: number | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Calculados, no son columnas
  total_signed: number
  active_signed: number
  last_signed_at: string | null
}

// Refleja las columnas REALES de signed_consents en Supabase.
// La firma se guarda en patient_signature_url como data URI.
export interface SignedConsentData {
  id: string
  clinic_id: string | null
  template_id: string
  patient_id: string
  session_id: string | null
  appointment_id: string | null
  treatment_id: string | null
  obtained_by: string | null
  template_version: number
  content_snapshot: string | null
  additional_fields: Record<string, unknown> | null
  patient_signature_url: string | null
  witness_signature_url: string | null
  signed_at: string
  ip_address: string | null
  pdf_url: string | null
  status: ConsentStatus
  revoked_at: string | null
  revoked_by: string | null
  revocation_reason: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  // Calculados / unidos, no son columnas
  template_name: string
  template_category: ConsentCategory
  template_code: string | null
  patient_name: string
  patient_document: string | null
  obtained_by_name: string
  treatment_name: string | null
  is_valid: boolean
}

// =============================================
// PLANTILLAS DE CONSENTIMIENTO
// =============================================

export async function getConsentTemplates(options?: {
  category?: ConsentCategory
  isActive?: boolean
}): Promise<ConsentTemplateData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('consent_templates')
    .select('*')
    .order('name', { ascending: true })

  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching consent templates:', error)
    return []
  }

  // Get signed counts for each template
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: signedCounts } = await (supabase as any)
    .from('signed_consents')
    .select('template_id, status')
    .limit(500)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((t: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const templateSigned = (signedCounts || []).filter((s: any) => s.template_id === t.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeSigned = templateSigned.filter((s: any) => s.status === 'signed').length

    return {
      ...t,
      total_signed: templateSigned.length,
      active_signed: activeSigned,
      last_signed_at: null, // TODO: Get from query
    }
  })
}

export async function getConsentTemplateById(id: string): Promise<ConsentTemplateData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('consent_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching consent template:', error)
    return null
  }

  return {
    ...data,
    total_signed: 0,
    active_signed: 0,
    last_signed_at: null,
  }
}

export interface ConsentTemplateInput {
  name: string
  content: string
  category?: ConsentCategory
  code?: string | null
  description?: string | null
  treatment_id?: string | null
  expiry_days?: number | null
  requires_witness?: boolean
  is_required?: boolean
  is_active?: boolean
}

export async function createConsentTemplate(
  input: ConsentTemplateInput
): Promise<{ data: ConsentTemplateData | null; error: string | null }> {
  const ctx = await getAuthContext()
  if (!ctx) return { data: null, error: 'No autorizado' }

  if (!input.name?.trim()) return { data: null, error: 'El nombre es requerido' }
  if (!input.content?.trim()) return { data: null, error: 'El texto del consentimiento es requerido' }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('consent_templates')
    .insert({
      clinic_id: ctx.clinicId,
      name: input.name.trim(),
      content: input.content.trim(),
      category: input.category || 'general',
      code: input.code?.trim() || null,
      description: input.description?.trim() || null,
      treatment_id: input.treatment_id || null,
      expiry_days: input.expiry_days ?? null,
      requires_witness: input.requires_witness ?? false,
      is_required: input.is_required ?? false,
      is_active: input.is_active ?? true,
      version: 1,
      created_by: ctx.userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating consent template:', error)
    return { data: null, error: 'Error al crear la plantilla' }
  }

  revalidatePath('/consentimientos/plantillas')
  revalidatePath('/consentimientos')
  return { data: { ...data, total_signed: 0, active_signed: 0, last_signed_at: null }, error: null }
}

// Editar el texto de una plantilla sube su version. Los consentimientos ya
// firmados guardan su propio content_snapshot, asi que no se ven afectados.
export async function updateConsentTemplate(
  id: string,
  input: Partial<ConsentTemplateInput>
): Promise<{ error: string | null }> {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'No autorizado' }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: current } = await (supabase as any)
    .from('consent_templates')
    .select('content, version')
    .eq('id', id)
    .single()

  if (!current) return { error: 'La plantilla no existe' }

  const contentChanged =
    input.content !== undefined && input.content.trim() !== current.content

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) updateData.name = input.name.trim()
  if (input.content !== undefined) updateData.content = input.content.trim()
  if (input.category !== undefined) updateData.category = input.category
  if (input.code !== undefined) updateData.code = input.code?.trim() || null
  if (input.description !== undefined) updateData.description = input.description?.trim() || null
  if (input.treatment_id !== undefined) updateData.treatment_id = input.treatment_id || null
  if (input.expiry_days !== undefined) updateData.expiry_days = input.expiry_days
  if (input.requires_witness !== undefined) updateData.requires_witness = input.requires_witness
  if (input.is_required !== undefined) updateData.is_required = input.is_required
  if (input.is_active !== undefined) updateData.is_active = input.is_active
  if (contentChanged) updateData.version = (current.version || 1) + 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('consent_templates')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating consent template:', error)
    return { error: 'Error al actualizar la plantilla' }
  }

  revalidatePath('/consentimientos/plantillas')
  revalidatePath('/consentimientos')
  return { error: null }
}

// Nunca se borra fisicamente: una plantilla con firmas es evidencia legal.
// Se desactiva para que deje de ofrecerse al firmar.
export async function deactivateConsentTemplate(id: string): Promise<{ error: string | null }> {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'No autorizado' }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('consent_templates')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deactivating consent template:', error)
    return { error: 'Error al desactivar la plantilla' }
  }

  revalidatePath('/consentimientos/plantillas')
  return { error: null }
}

// =============================================
// CONSENTIMIENTOS FIRMADOS
// =============================================

export async function getSignedConsents(options?: {
  patientId?: string
  templateId?: string
  status?: ConsentStatus
  startDate?: string
  endDate?: string
}): Promise<SignedConsentData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('signed_consents')
    .select(`
      *,
      consent_templates (
        name,
        treatments ( name )
      ),
      patients (
        first_name,
        last_name,
        document_number
      )
    `)
    .order('signed_at', { ascending: false })
    .limit(500)

  if (options?.patientId) {
    query = query.eq('patient_id', options.patientId)
  }
  if (options?.templateId) {
    query = query.eq('template_id', options.templateId)
  }
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.startDate) {
    query = query.gte('signed_at', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('signed_at', options.endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching signed consents:', error)
    return []
  }

  const now = new Date()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((c: any) => {
    const isExpired = c.expires_at && new Date(c.expires_at) < now
    const isValid = c.status === 'signed' && !isExpired

    return {
      ...c,
      template_name: c.consent_templates?.name || 'Plantilla',
      template_category: 'general',
      template_code: null,
      patient_name: c.patients
        ? `${c.patients.first_name || ''} ${c.patients.last_name || ''}`.trim()
        : 'Paciente',
      patient_document: c.patients?.document_number || null,
      obtained_by_name: 'Usuario',
      treatment_name: c.consent_templates?.treatments?.name || null,
      is_valid: isValid,
    }
  })
}

export async function getSignedConsentById(id: string): Promise<SignedConsentData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('signed_consents')
    .select(`
      *,
      consent_templates (
        name,
        content,
        treatments ( name )
      ),
      patients (
        first_name,
        last_name,
        document_number
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching signed consent:', error)
    return null
  }

  const now = new Date()
  const isExpired = data.expires_at && new Date(data.expires_at) < now
  const isValid = data.status === 'signed' && !isExpired

  return {
    ...data,
    template_name: data.consent_templates?.name || 'Plantilla',
    template_category: 'general',
    template_code: null,
    patient_name: data.patients
      ? `${data.patients.first_name || ''} ${data.patients.last_name || ''}`.trim()
      : 'Paciente',
    patient_document: data.patients?.document_number || null,
    obtained_by_name: 'Usuario',
    treatment_name: data.consent_templates?.treatments?.name || null,
    is_valid: isValid,
  }
}

export async function signConsent(input: {
  templateId: string
  patientId: string
  patientSignatureData: string
  additionalFields?: Record<string, unknown>
  treatmentId?: string
  sessionId?: string
  appointmentId?: string
}): Promise<{ data: SignedConsentData | null; error: string | null }> {
  // Quien obtiene el consentimiento SIEMPRE sale del servidor: es la persona
  // que responde legalmente por la firma, no puede venir del cliente.
  const ctx = await getAuthContext()
  if (!ctx) return { data: null, error: 'No autorizado' }

  if (!input.patientSignatureData?.trim()) {
    return { data: null, error: 'Falta la firma del paciente' }
  }

  const supabase = createAdminClient()

  // Get template for expiry calculation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: template } = await (supabase as any)
    .from('consent_templates')
    .select('content, version, expiry_days')
    .eq('id', input.templateId)
    .single()

  if (!template) {
    return { data: null, error: 'La plantilla de consentimiento no existe' }
  }

  let expiresAt = null
  if (template?.expiry_days) {
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + template.expiry_days)
    expiresAt = expiry.toISOString().split('T')[0]
  }

  const consentData = {
    clinic_id: ctx.clinicId,
    template_id: input.templateId,
    patient_id: input.patientId,
    obtained_by: ctx.userId,
    template_version: template?.version || 1,
    // Se congela el texto exacto que el paciente firmo: si la plantilla
    // cambia despues, el consentimiento firmado no puede cambiar con ella.
    content_snapshot: template?.content,
    additional_fields: input.additionalFields || {},
    patient_signature_url: input.patientSignatureData,
    signed_at: new Date().toISOString(),
    treatment_id: input.treatmentId || null,
    session_id: input.sessionId || null,
    appointment_id: input.appointmentId || null,
    status: 'signed',
    expires_at: expiresAt,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('signed_consents')
    .insert(consentData)
    .select()
    .single()

  if (error) {
    console.error('Error signing consent:', error)
    return { data: null, error: 'Error al firmar el consentimiento' }
  }

  revalidatePath('/consentimientos')
  return {
    data: {
      ...data,
      template_name: '',
      template_category: 'general',
      template_code: null,
      patient_name: '',
      patient_document: null,
      obtained_by_name: '',
      treatment_name: null,
      is_valid: true,
    },
    error: null,
  }
}

export async function revokeConsent(
  id: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('signed_consents')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: userId,
      revocation_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error revoking consent:', error)
    return { success: false, error: 'Error al revocar el consentimiento' }
  }

  revalidatePath('/consentimientos')
  return { success: true, error: null }
}

// =============================================
// ESTADISTICAS
// =============================================

export async function getConsentStats(): Promise<{
  total_templates: number
  active_templates: number
  total_signed: number
  valid_signed: number
  expired_signed: number
  revoked_signed: number
}> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: templates } = await (supabase as any)
    .from('consent_templates')
    .select('id, is_active')
    .limit(100)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: consents } = await (supabase as any)
    .from('signed_consents')
    .select('id, status, expires_at')
    .limit(500)

  const now = new Date()
  const totalTemplates = templates?.length || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeTemplates = templates?.filter((t: any) => t.is_active).length || 0

  const totalSigned = consents?.length || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const revokedSigned = consents?.filter((c: any) => c.status === 'revoked').length || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expiredSigned = consents?.filter((c: any) => {
    if (c.status === 'revoked') return false
    if (!c.expires_at) return false
    return new Date(c.expires_at) < now
  }).length || 0

  const validSigned = totalSigned - revokedSigned - expiredSigned

  return {
    total_templates: totalTemplates,
    active_templates: activeTemplates,
    total_signed: totalSigned,
    valid_signed: validSigned,
    expired_signed: expiredSigned,
    revoked_signed: revokedSigned,
  }
}
