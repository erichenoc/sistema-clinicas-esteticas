import { z } from 'zod'

// =============================================
// VALIDACIONES - Módulo de Consentimientos
// =============================================

// Campo adicional requerido
const requiredFieldSchema = z.object({
  key: z.string().min(1, 'La clave es requerida').regex(/^[a-z_]+$/, 'Solo letras minúsculas y guiones bajos'),
  label: z.string().min(1, 'La etiqueta es requerida').max(100),
  type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().max(100).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
})

// =============================================
// PLANTILLA DE CONSENTIMIENTO
// =============================================

export const consentTemplateSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  code: z.string().max(50).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  category: z.enum(['general', 'facial', 'corporal', 'inyectable', 'laser', 'quirurgico', 'otro']),
  treatmentIds: z.array(z.string().uuid()),
  content: z.string().min(50, 'El contenido debe tener al menos 50 caracteres').max(50000),
  risksSection: z.string().max(10000).optional().nullable(),
  alternativesSection: z.string().max(5000).optional().nullable(),
  contraindicationsSection: z.string().max(5000).optional().nullable(),
  aftercareSection: z.string().max(5000).optional().nullable(),
  requiredFields: z.array(requiredFieldSchema),
  isActive: z.boolean(),
  isRequired: z.boolean(),
  requiresWitness: z.boolean(),
  requiresPhotoId: z.boolean(),
  expiryDays: z.number().int().min(1).max(3650).optional().nullable(),
})

export type ConsentTemplateFormData = z.infer<typeof consentTemplateSchema>

// =============================================
// DATOS DE FIRMA
// =============================================

const signatureDataSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  dataUrl: z.string().optional(),
  points: z.array(z.array(z.number())).optional(),
  timestamp: z.string().datetime(),
})

// =============================================
// CONSENTIMIENTO FIRMADO
// =============================================

export const signedConsentSchema = z.object({
  templateId: z.string().uuid('Selecciona una plantilla'),
  patientId: z.string().uuid('Selecciona un paciente'),
  sessionId: z.string().uuid().optional().nullable(),
  appointmentId: z.string().uuid().optional().nullable(),
  treatmentId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  additionalFields: z.record(z.string(), z.unknown()),
  patientSignatureUrl: z.string().url('Firma del paciente requerida'),
  patientSignatureData: signatureDataSchema.optional().nullable(),
  professionalSignatureUrl: z.string().url().optional().nullable(),
  witnessName: z.string().max(200).optional().nullable(),
  witnessIdNumber: z.string().max(50).optional().nullable(),
  witnessSignatureUrl: z.string().url().optional().nullable(),
  patientIdPhotoUrl: z.string().url().optional().nullable(),
})

export type SignedConsentFormData = z.infer<typeof signedConsentSchema>

// Schema para capturar firma
export const captureSignatureSchema = z.object({
  signatureDataUrl: z.string().min(1, 'La firma es requerida'),
  signatureWidth: z.number().positive(),
  signatureHeight: z.number().positive(),
})

export type CaptureSignatureData = z.infer<typeof captureSignatureSchema>

// =============================================
// REVOCACIÓN DE CONSENTIMIENTO
// =============================================

export const revokeConsentSchema = z.object({
  consentId: z.string().uuid(),
  reason: z.string().min(10, 'El motivo debe tener al menos 10 caracteres').max(1000),
})

export type RevokeConsentFormData = z.infer<typeof revokeConsentSchema>

// =============================================
// FILTROS
// =============================================

export const consentFiltersSchema = z.object({
  patientId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  category: z.enum(['all', 'general', 'facial', 'corporal', 'inyectable', 'laser', 'quirurgico', 'otro']).default('all'),
  status: z.enum(['all', 'signed', 'revoked', 'expired', 'superseded']).default('all'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  onlyValid: z.boolean().default(false),
  sortBy: z.enum(['patientSignedAt', 'patientName', 'templateName']).default('patientSignedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export type ConsentFilters = z.infer<typeof consentFiltersSchema>

// =============================================
// VALIDACIÓN DE CAMPOS ADICIONALES DINÁMICOS
// =============================================

export function validateAdditionalFields(
  fields: Record<string, unknown>,
  requiredFields: { key: string; type: string; required: boolean; validation?: { min?: number; max?: number; pattern?: string } }[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  for (const field of requiredFields) {
    const value = fields[field.key]

    // Verificar requerido
    if (field.required && (value === undefined || value === null || value === '')) {
      errors[field.key] = 'Este campo es requerido'
      continue
    }

    // Si no hay valor y no es requerido, continuar
    if (value === undefined || value === null || value === '') continue

    // Validar tipo
    switch (field.type) {
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          errors[field.key] = 'Debe ser un número'
        } else if (field.validation) {
          const numValue = Number(value)
          if (field.validation.min !== undefined && numValue < field.validation.min) {
            errors[field.key] = `El valor mínimo es ${field.validation.min}`
          }
          if (field.validation.max !== undefined && numValue > field.validation.max) {
            errors[field.key] = `El valor máximo es ${field.validation.max}`
          }
        }
        break

      case 'text':
        if (typeof value !== 'string') {
          errors[field.key] = 'Debe ser texto'
        } else if (field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern)
          if (!regex.test(value)) {
            errors[field.key] = 'Formato inválido'
          }
        }
        break

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors[field.key] = 'Debe ser verdadero o falso'
        }
        break

      case 'date':
        if (typeof value !== 'string' || isNaN(Date.parse(value))) {
          errors[field.key] = 'Fecha inválida'
        }
        break
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
