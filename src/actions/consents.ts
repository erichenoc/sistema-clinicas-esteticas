'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipos
export type ConsentStatus = 'pending' | 'signed' | 'revoked' | 'expired'
export type ConsentCategory = 'general' | 'inyectable' | 'laser' | 'cirugia' | 'estetica' | 'medico' | 'otro'

export interface ConsentTemplateData {
  id: string
  clinic_id: string
  name: string
  code: string | null
  description: string | null
  category: ConsentCategory
  treatment_ids: string[] | null
  content: string
  risks_section: string | null
  alternatives_section: string | null
  contraindications_section: string | null
  aftercare_section: string | null
  required_fields: unknown[]
  version: number
  is_current: boolean
  previous_version_id: string | null
  is_active: boolean
  is_required: boolean
  requires_witness: boolean
  requires_photo_id: boolean
  expiry_days: number | null
  created_at: string
  updated_at: string
  created_by: string | null
  total_signed: number
  active_signed: number
  last_signed_at: string | null
}

export interface SignedConsentData {
  id: string
  clinic_id: string
  branch_id: string | null
  template_id: string
  patient_id: string
  session_id: string | null
  appointment_id: string | null
  treatment_id: string | null
  obtained_by: string
  template_version: number
  content_snapshot: string | null
  additional_fields: Record<string, unknown> | null
  patient_signature_url: string | null
  patient_signature_data: string | null
  patient_signed_at: string
  professional_signature_url: string | null
  professional_signed_at: string | null
  witness_name: string | null
  witness_id_number: string | null
  witness_signature_url: string | null
  witness_signed_at: string | null
  patient_id_photo_url: string | null
  ip_address: string | null
  user_agent: string | null
  device_info: string | null
  pdf_url: string | null
  pdf_generated_at: string | null
  status: ConsentStatus
  revoked_at: string | null
  revoked_by: string | null
  revocation_reason: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
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
    .eq('is_current', true)
    .order('name', { ascending: true })

  if (options?.category) {
    query = query.eq('category', options.category)
  }
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
        category,
        code
      ),
      patients (
        first_name,
        last_name,
        document_number
      ),
      users!signed_consents_obtained_by_fkey (
        full_name
      ),
      treatments (
        name
      )
    `)
    .order('patient_signed_at', { ascending: false })
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
    query = query.gte('patient_signed_at', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('patient_signed_at', options.endDate)
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
      template_category: c.consent_templates?.category || 'general',
      template_code: c.consent_templates?.code || null,
      patient_name: c.patients
        ? `${c.patients.first_name || ''} ${c.patients.last_name || ''}`.trim()
        : 'Paciente',
      patient_document: c.patients?.document_number || null,
      obtained_by_name: c.users?.full_name || 'Usuario',
      treatment_name: c.treatments?.name || null,
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
        category,
        code,
        content
      ),
      patients (
        first_name,
        last_name,
        document_number
      ),
      users!signed_consents_obtained_by_fkey (
        full_name
      ),
      treatments (
        name
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
    template_category: data.consent_templates?.category || 'general',
    template_code: data.consent_templates?.code || null,
    patient_name: data.patients
      ? `${data.patients.first_name || ''} ${data.patients.last_name || ''}`.trim()
      : 'Paciente',
    patient_document: data.patients?.document_number || null,
    obtained_by_name: data.users?.full_name || 'Usuario',
    treatment_name: data.treatments?.name || null,
    is_valid: isValid,
  }
}

export async function signConsent(input: {
  templateId: string
  patientId: string
  obtainedBy: string
  patientSignatureData: string
  additionalFields?: Record<string, unknown>
  treatmentId?: string
  sessionId?: string
  appointmentId?: string
}): Promise<{ data: SignedConsentData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Get template for expiry calculation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: template } = await (supabase as any)
    .from('consent_templates')
    .select('content, version, expiry_days')
    .eq('id', input.templateId)
    .single()

  let expiresAt = null
  if (template?.expiry_days) {
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + template.expiry_days)
    expiresAt = expiry.toISOString().split('T')[0]
  }

  const consentData = {
    clinic_id: '00000000-0000-0000-0000-000000000001',
    template_id: input.templateId,
    patient_id: input.patientId,
    obtained_by: input.obtainedBy,
    template_version: template?.version || 1,
    content_snapshot: template?.content,
    additional_fields: input.additionalFields || {},
    patient_signature_data: input.patientSignatureData,
    patient_signed_at: new Date().toISOString(),
    treatment_id: input.treatmentId,
    session_id: input.sessionId,
    appointment_id: input.appointmentId,
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
    .eq('is_current', true)
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
