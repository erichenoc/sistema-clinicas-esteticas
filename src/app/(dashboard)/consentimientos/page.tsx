// Datos en vivo detras de login: no se prerenderiza ni se cachea
export const dynamic = 'force-dynamic'

import { getConsentTemplates, getSignedConsents, getConsentStats } from '@/actions/consents'
import { ConsentimientosClient } from './_components/consentimientos-client'
import type {
  ConsentTemplateWithStats,
  SignedConsentDetails,
  ConsentCategory,
  ConsentStatus,
  } from '@/types/consents'

export default async function ConsentimientosPage() {
  const [dbTemplates, dbConsents, dbStats] = await Promise.all([
    getConsentTemplates(),
    getSignedConsents(),
    getConsentStats(),
  ])

  // Transform templates data
  const templates: ConsentTemplateWithStats[] = dbTemplates.map((t) => ({
    id: t.id,
    clinicId: t.clinic_id,
    name: t.name,
    code: t.code,
    description: t.description,
    category: (t.category || 'general') as ConsentCategory,
    treatmentId: t.treatment_id,
    content: t.content,
    version: t.version || 1,
    isActive: t.is_active,
    isRequired: t.is_required,
    requiresWitness: t.requires_witness,
    expiryDays: t.expiry_days,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    createdBy: t.created_by,
    totalSigned: t.total_signed || 0,
    activeSigned: t.active_signed || 0,
    lastSignedAt: t.last_signed_at,
  }))

  // Transform signed consents data
  const signedConsents: SignedConsentDetails[] = dbConsents.map((c) => ({
    id: c.id,
    clinicId: c.clinic_id,
    templateId: c.template_id,
    patientId: c.patient_id,
    sessionId: c.session_id,
    appointmentId: c.appointment_id,
    treatmentId: c.treatment_id,
    obtainedBy: c.obtained_by,
    templateVersion: c.template_version || 1,
    contentSnapshot: c.content_snapshot || '',
    additionalFields: (c.additional_fields || {}) as Record<string, unknown>,
    patientSignatureUrl: c.patient_signature_url || '',
    witnessSignatureUrl: c.witness_signature_url,
    signedAt: c.signed_at,
    ipAddress: c.ip_address,
    pdfUrl: c.pdf_url,
    status: (c.status || 'signed') as ConsentStatus,
    revokedAt: c.revoked_at,
    revokedBy: c.revoked_by,
    revocationReason: c.revocation_reason,
    expiresAt: c.expires_at,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    templateName: c.template_name,
    templateCategory: (c.template_category || 'general') as ConsentCategory,
    templateCode: c.template_code,
    patientName: c.patient_name,
    patientDocument: c.patient_document,
    obtainedByName: c.obtained_by_name,
    treatmentName: c.treatment_name,
    isValid: c.is_valid,
  }))

  // Transform stats
  const stats = {
    totalTemplates: dbStats.total_templates,
    activeTemplates: dbStats.active_templates,
    totalSigned: dbStats.total_signed,
    validSigned: dbStats.valid_signed,
    expiredOrRevoked: dbStats.expired_signed + dbStats.revoked_signed,
  }

  return (
    <ConsentimientosClient
      templates={templates}
      signedConsents={signedConsents}
      stats={stats}
    />
  )
}
