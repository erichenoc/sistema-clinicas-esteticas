// =============================================
// TIPOS - Módulo de Consentimientos Informados
// =============================================

// Enums
export type ConsentCategory = 'general' | 'facial' | 'corporal' | 'inyectable' | 'laser' | 'quirurgico' | 'otro'
export type ConsentStatus = 'signed' | 'revoked' | 'expired' | 'superseded'
export type ConsentAuditAction = 'created' | 'viewed' | 'downloaded' | 'emailed' | 'revoked' | 'expired'

// =============================================
// CONSENT TEMPLATE - Plantilla de Consentimiento
// =============================================
export interface ConsentTemplate {
  id: string
  clinicId: string
  name: string
  code: string | null
  description: string | null
  category: ConsentCategory
  treatmentIds: string[]
  content: string
  risksSection: string | null
  alternativesSection: string | null
  contraindicationsSection: string | null
  aftercareSection: string | null
  requiredFields: RequiredField[]
  version: number
  isCurrent: boolean
  previousVersionId: string | null
  isActive: boolean
  isRequired: boolean
  requiresWitness: boolean
  requiresPhotoId: boolean
  expiryDays: number | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

export interface RequiredField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select'
  required: boolean
  options?: string[] // Para tipo select
  placeholder?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface ConsentTemplateInput {
  name: string
  code?: string | null
  description?: string | null
  category: ConsentCategory
  treatmentIds?: string[]
  content: string
  risksSection?: string | null
  alternativesSection?: string | null
  contraindicationsSection?: string | null
  aftercareSection?: string | null
  requiredFields?: RequiredField[]
  isActive?: boolean
  isRequired?: boolean
  requiresWitness?: boolean
  requiresPhotoId?: boolean
  expiryDays?: number | null
}

// Vista con estadísticas
export interface ConsentTemplateWithStats extends ConsentTemplate {
  totalSigned: number
  activeSigned: number
  lastSignedAt: string | null
}

// =============================================
// SIGNED CONSENT - Consentimiento Firmado
// =============================================
export interface SignedConsent {
  id: string
  clinicId: string
  branchId: string | null
  templateId: string
  patientId: string
  sessionId: string | null
  appointmentId: string | null
  treatmentId: string | null
  obtainedBy: string
  templateVersion: number
  contentSnapshot: string
  additionalFields: Record<string, unknown>
  patientSignatureUrl: string
  patientSignatureData: SignatureData | null
  patientSignedAt: string
  professionalSignatureUrl: string | null
  professionalSignedAt: string | null
  witnessName: string | null
  witnessIdNumber: string | null
  witnessSignatureUrl: string | null
  witnessSignedAt: string | null
  patientIdPhotoUrl: string | null
  ipAddress: string | null
  userAgent: string | null
  deviceInfo: Record<string, unknown> | null
  pdfUrl: string | null
  pdfGeneratedAt: string | null
  status: ConsentStatus
  revokedAt: string | null
  revokedBy: string | null
  revocationReason: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SignatureData {
  width: number
  height: number
  dataUrl?: string
  points?: number[][]
  timestamp: string
}

export interface SignedConsentInput {
  templateId: string
  patientId: string
  sessionId?: string | null
  appointmentId?: string | null
  treatmentId?: string | null
  branchId?: string | null
  additionalFields?: Record<string, unknown>
  patientSignatureUrl: string
  patientSignatureData?: SignatureData | null
  professionalSignatureUrl?: string | null
  witnessName?: string | null
  witnessIdNumber?: string | null
  witnessSignatureUrl?: string | null
  patientIdPhotoUrl?: string | null
}

// Vista expandida
export interface SignedConsentDetails extends SignedConsent {
  templateName: string
  templateCategory: ConsentCategory
  templateCode: string | null
  patientName: string
  patientDocument: string | null
  obtainedByName: string
  treatmentName: string | null
  isValid: boolean
}

// =============================================
// CONSENT AUDIT LOG - Log de Auditoría
// =============================================
export interface ConsentAuditLog {
  id: string
  signedConsentId: string
  action: ConsentAuditAction
  details: Record<string, unknown> | null
  performedBy: string | null
  ipAddress: string | null
  createdAt: string
}

// =============================================
// CONSTANTES Y OPCIONES
// =============================================

export const CONSENT_CATEGORIES: {
  value: ConsentCategory
  label: string
  description: string
}[] = [
  { value: 'general', label: 'General', description: 'Consentimiento general de tratamiento' },
  { value: 'facial', label: 'Facial', description: 'Tratamientos faciales' },
  { value: 'corporal', label: 'Corporal', description: 'Tratamientos corporales' },
  { value: 'inyectable', label: 'Inyectable', description: 'Botox, rellenos, mesoterapia' },
  { value: 'laser', label: 'Láser', description: 'Tratamientos con láser' },
  { value: 'quirurgico', label: 'Quirúrgico', description: 'Procedimientos quirúrgicos' },
  { value: 'otro', label: 'Otro', description: 'Otros procedimientos' },
]

export const CONSENT_STATUS_OPTIONS: {
  value: ConsentStatus
  label: string
  color: string
}[] = [
  { value: 'signed', label: 'Firmado', color: '#22c55e' },
  { value: 'revoked', label: 'Revocado', color: '#ef4444' },
  { value: 'expired', label: 'Expirado', color: '#f59e0b' },
  { value: 'superseded', label: 'Reemplazado', color: '#6b7280' },
]

export const CONSENT_AUDIT_ACTIONS: {
  value: ConsentAuditAction
  label: string
  icon: string
}[] = [
  { value: 'created', label: 'Creado', icon: 'plus-circle' },
  { value: 'viewed', label: 'Visualizado', icon: 'eye' },
  { value: 'downloaded', label: 'Descargado', icon: 'download' },
  { value: 'emailed', label: 'Enviado por email', icon: 'mail' },
  { value: 'revoked', label: 'Revocado', icon: 'x-circle' },
  { value: 'expired', label: 'Expirado', icon: 'clock' },
]

// Variables disponibles para plantillas
export const TEMPLATE_VARIABLES = [
  { key: '{{patient_name}}', label: 'Nombre del paciente', example: 'María García López' },
  { key: '{{patient_id}}', label: 'ID del paciente', example: 'PAC-001' },
  { key: '{{patient_document}}', label: 'Documento del paciente', example: '12345678A' },
  { key: '{{patient_birthdate}}', label: 'Fecha de nacimiento', example: '15/03/1990' },
  { key: '{{patient_age}}', label: 'Edad del paciente', example: '34 años' },
  { key: '{{treatment_name}}', label: 'Nombre del tratamiento', example: 'Botox - Frente' },
  { key: '{{professional_name}}', label: 'Nombre del profesional', example: 'Dra. Ana López' },
  { key: '{{professional_license}}', label: 'Cédula profesional', example: '12345678' },
  { key: '{{date}}', label: 'Fecha actual', example: '07/12/2025' },
  { key: '{{time}}', label: 'Hora actual', example: '14:30' },
  { key: '{{clinic_name}}', label: 'Nombre de la clínica', example: 'Clínica Estética Bella' },
  { key: '{{branch_name}}', label: 'Nombre de la sucursal', example: 'Sucursal Centro' },
  { key: '{{branch_address}}', label: 'Dirección de la sucursal', example: 'Av. Principal 123' },
]

// Campos adicionales predefinidos comunes
export const COMMON_REQUIRED_FIELDS: RequiredField[] = [
  { key: 'weight', label: 'Peso (kg)', type: 'number', required: false, placeholder: 'Ej: 65' },
  { key: 'height', label: 'Altura (cm)', type: 'number', required: false, placeholder: 'Ej: 165' },
  { key: 'allergies_confirmed', label: 'Confirmo que he informado sobre mis alergias', type: 'boolean', required: true },
  { key: 'medications_confirmed', label: 'Confirmo que he informado sobre mis medicamentos', type: 'boolean', required: true },
  { key: 'pregnant', label: '¿Está embarazada o en lactancia?', type: 'boolean', required: true },
  { key: 'previous_treatments', label: 'Tratamientos previos en la zona', type: 'text', required: false },
  { key: 'expectations', label: 'Expectativas del tratamiento', type: 'text', required: false },
]

// =============================================
// HELPERS
// =============================================

export function getConsentCategoryConfig(category: ConsentCategory) {
  return CONSENT_CATEGORIES.find((c) => c.value === category)
}

export function getConsentStatusConfig(status: ConsentStatus) {
  return CONSENT_STATUS_OPTIONS.find((s) => s.value === status)
}

export function isConsentExpired(consent: SignedConsent): boolean {
  if (consent.status !== 'signed') return true
  if (!consent.expiresAt) return false
  return new Date(consent.expiresAt) < new Date()
}

export function replaceTemplateVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
  }
  return result
}

export function formatConsentDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatConsentDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Plantilla de consentimiento general de ejemplo
export const DEFAULT_CONSENT_TEMPLATE = `
# CONSENTIMIENTO INFORMADO

## Datos del Paciente
- **Nombre:** {{patient_name}}
- **Documento:** {{patient_document}}
- **Fecha de nacimiento:** {{patient_birthdate}}

## Datos del Tratamiento
- **Tratamiento:** {{treatment_name}}
- **Profesional:** {{professional_name}}
- **Fecha:** {{date}}

## Declaración

Yo, **{{patient_name}}**, identificado(a) con documento **{{patient_document}}**, declaro que:

1. He sido informado(a) de manera clara y comprensible sobre el procedimiento **{{treatment_name}}** que se me va a realizar.

2. He tenido la oportunidad de hacer preguntas y todas mis dudas han sido resueltas satisfactoriamente.

3. Entiendo los riesgos, beneficios y alternativas del procedimiento.

4. Autorizo al profesional **{{professional_name}}** y al equipo de **{{clinic_name}}** a realizar el procedimiento indicado.

5. He informado sobre todas mis condiciones médicas, alergias y medicamentos que estoy tomando.

## Firma

Al firmar este documento, confirmo que he leído y entendido toda la información proporcionada y doy mi consentimiento para proceder con el tratamiento.

---

**Lugar:** {{branch_name}}
**Fecha y hora:** {{date}} - {{time}}
`
