import { z } from 'zod'

// =============================================
// VALIDACIONES - Pacientes
// =============================================

const phoneRegex = /^[+]?[0-9]{10,15}$/

export const patientSchema = z.object({
  // Datos personales (requeridos)
  firstName: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'Máximo 100 caracteres'),
  lastName: z
    .string()
    .min(1, 'El apellido es requerido')
    .max(100, 'Máximo 100 caracteres'),

  // Contacto
  email: z
    .string()
    .email('Email inválido')
    .max(255)
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(phoneRegex, 'Número de teléfono inválido')
    .optional()
    .nullable()
    .or(z.literal('')),
  phoneSecondary: z
    .string()
    .regex(phoneRegex, 'Número de teléfono inválido')
    .optional()
    .nullable()
    .or(z.literal('')),

  // Datos demográficos
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_say']).optional().nullable(),

  // Documento de identidad
  documentType: z.enum(['ine', 'passport', 'curp', 'other']),
  documentNumber: z.string().max(50).optional().nullable(),

  // Dirección
  addressStreet: z.string().max(255).optional().nullable(),
  addressCity: z.string().max(100).optional().nullable(),
  addressState: z.string().max(100).optional().nullable(),
  addressZip: z.string().max(20).optional().nullable(),
  addressCountry: z.string().max(50),

  // Contacto de emergencia
  emergencyContactName: z.string().max(200).optional().nullable(),
  emergencyContactPhone: z
    .string()
    .regex(phoneRegex, 'Número inválido')
    .optional()
    .nullable()
    .or(z.literal('')),
  emergencyContactRelationship: z.string().max(50).optional().nullable(),

  // Preferencias
  preferredContactMethod: z.enum(['whatsapp', 'sms', 'email', 'phone']),
  preferredLanguage: z.string().max(10),
  preferredProfessionalId: z.string().uuid().optional().nullable(),

  // Segmentación
  status: z.enum(['active', 'inactive', 'vip', 'blocked']),
  tags: z.array(z.string()),
  source: z.string().max(50).optional().nullable(),
  referredByPatientId: z.string().uuid().optional().nullable(),

  // Notas
  notes: z.string().max(5000).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
})

export type PatientFormData = z.infer<typeof patientSchema>

// Schema simplificado para creación rápida
export const patientQuickSchema = z.object({
  firstName: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'Máximo 100 caracteres'),
  lastName: z
    .string()
    .min(1, 'El apellido es requerido')
    .max(100, 'Máximo 100 caracteres'),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  phone: z.string().min(10, 'Mínimo 10 dígitos').optional().nullable().or(z.literal('')),
  source: z.string().optional().nullable(),
})

export type PatientQuickFormData = z.infer<typeof patientQuickSchema>

// =============================================
// VALIDACIONES - Historial Médico
// =============================================

export const medicalHistorySchema = z.object({
  // Tipo de piel
  skinTypeFitzpatrick: z
    .enum(['I', 'II', 'III', 'IV', 'V', 'VI'])
    .optional()
    .nullable(),

  // Alergias
  allergies: z.array(z.string()),
  allergiesNotes: z.string().max(2000).optional().nullable(),

  // Enfermedades crónicas
  chronicConditions: z.array(z.string()),
  chronicConditionsNotes: z.string().max(2000).optional().nullable(),

  // Medicamentos
  currentMedications: z.array(z.string()),
  medicationsNotes: z.string().max(2000).optional().nullable(),

  // Condiciones especiales
  isPregnant: z.boolean(),
  isBreastfeeding: z.boolean(),
  hasPacemaker: z.boolean(),
  hasMetalImplants: z.boolean(),
  hasKeloidTendency: z.boolean(),
  isSmoker: z.boolean(),

  // Cirugías previas
  previousSurgeries: z.array(z.string()),
  previousSurgeriesNotes: z.string().max(2000).optional().nullable(),

  // Tratamientos estéticos previos
  previousTreatments: z.array(z.string()),
  previousTreatmentsNotes: z.string().max(2000).optional().nullable(),

  // Notas adicionales
  additionalNotes: z.string().max(5000).optional().nullable(),
})

export type MedicalHistoryFormData = z.infer<typeof medicalHistorySchema>

// =============================================
// VALIDACIONES - Imágenes del paciente
// =============================================

export const patientImageSchema = z.object({
  type: z.enum(['before', 'after', 'progress', 'document']),
  bodyZone: z.string().max(50).optional().nullable(),
  imageUrl: z.string().url('URL de imagen inválida'),
  thumbnailUrl: z.string().url().optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  takenAt: z.string().datetime().optional(),
  isPrivate: z.boolean(),
  sortOrder: z.number().int().min(0),
  sessionId: z.string().uuid().optional().nullable(),
})

export type PatientImageFormData = z.infer<typeof patientImageSchema>

// =============================================
// VALIDACIONES - Documentos del paciente
// =============================================

export const patientDocumentSchema = z.object({
  documentType: z
    .string()
    .min(1, 'El tipo de documento es requerido')
    .max(50),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(255),
  description: z.string().max(500).optional().nullable(),
  fileUrl: z.string().url('URL de archivo inválida'),
  fileType: z.string().max(50).optional().nullable(),
  fileSize: z.number().int().min(0).optional().nullable(),
  signedConsentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean(),
  expiresAt: z.string().datetime().optional().nullable(),
})

export type PatientDocumentFormData = z.infer<typeof patientDocumentSchema>

// =============================================
// VALIDACIONES - Búsqueda y filtros
// =============================================

export const patientSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['all', 'active', 'inactive', 'vip', 'blocked']).default('all'),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z
    .enum(['name', 'createdAt', 'lastAppointment', 'totalSpent'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export type PatientSearchParams = z.infer<typeof patientSearchSchema>

// =============================================
// HELPERS
// =============================================

export function formatPatientName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}

export function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null

  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

export function getPatientInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  // Formato simple: agregar espacios
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  return phone
}
