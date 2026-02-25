export const revalidate = 30

import { getConsentTemplates, getSignedConsents, getConsentStats } from '@/actions/consents'
import { ConsentimientosClient } from './_components/consentimientos-client'
import type {
  ConsentTemplateWithStats,
  SignedConsentDetails,
  ConsentCategory,
  ConsentStatus,
  RequiredField,
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
    treatmentIds: t.treatment_ids || [],
    content: t.content,
    risksSection: t.risks_section,
    alternativesSection: t.alternatives_section,
    contraindicationsSection: t.contraindications_section,
    aftercareSection: t.aftercare_section,
    requiredFields: (t.required_fields || []) as RequiredField[],
    version: t.version || 1,
    isCurrent: t.is_current,
    previousVersionId: t.previous_version_id,
    isActive: t.is_active,
    isRequired: t.is_required,
    requiresWitness: t.requires_witness,
    requiresPhotoId: t.requires_photo_id,
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
    branchId: c.branch_id,
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
    patientSignatureData: c.patient_signature_data ? JSON.parse(c.patient_signature_data) : null,
    patientSignedAt: c.patient_signed_at,
    professionalSignatureUrl: c.professional_signature_url,
    professionalSignedAt: c.professional_signed_at,
    witnessName: c.witness_name,
    witnessIdNumber: c.witness_id_number,
    witnessSignatureUrl: c.witness_signature_url,
    witnessSignedAt: c.witness_signed_at,
    patientIdPhotoUrl: c.patient_id_photo_url,
    ipAddress: c.ip_address,
    userAgent: c.user_agent,
    deviceInfo: c.device_info ? (typeof c.device_info === 'string' ? JSON.parse(c.device_info) : c.device_info) : null,
    pdfUrl: c.pdf_url,
    pdfGeneratedAt: c.pdf_generated_at,
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
