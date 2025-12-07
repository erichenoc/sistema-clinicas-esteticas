import { z } from 'zod'

// =============================================
// VALIDACIONES - Sesiones Clínicas
// =============================================

const treatedZoneSchema = z.object({
  zone: z.string().min(1, 'Selecciona una zona'),
  notes: z.string().max(500).optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
})

const productUsedSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  productName: z.string().optional(),
  lotNumber: z.string().optional(),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  unit: z.string(),
})

export const sessionSchema = z.object({
  appointmentId: z.string().uuid().optional().nullable(),
  patientId: z.string().uuid('Selecciona un paciente'),
  professionalId: z.string().uuid('Selecciona un profesional'),
  treatmentId: z.string().uuid().optional().nullable(),
  treatmentName: z.string().min(1, 'El nombre del tratamiento es requerido'),
  treatedZones: z.array(treatedZoneSchema),
  technicalParameters: z.record(z.string(), z.unknown()),
  observations: z.string().max(5000).optional().nullable(),
  patientFeedback: z.string().max(2000).optional().nullable(),
  adverseReactions: z.string().max(2000).optional().nullable(),
  followUpRequired: z.boolean(),
  followUpNotes: z.string().max(1000).optional().nullable(),
  nextSessionRecommendedAt: z.string().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
})

export type SessionFormData = z.infer<typeof sessionSchema>

// Schema para completar sesión
export const completeSessionSchema = z.object({
  observations: z.string().max(5000).optional().nullable(),
  patientFeedback: z.string().max(2000).optional().nullable(),
  adverseReactions: z.string().max(2000).optional().nullable(),
  resultRating: z.number().int().min(1).max(5).optional().nullable(),
  resultNotes: z.string().max(1000).optional().nullable(),
  followUpRequired: z.boolean(),
  followUpNotes: z.string().max(1000).optional().nullable(),
  nextSessionRecommendedAt: z.string().optional().nullable(),
  patientSignatureUrl: z.string().url().optional().nullable(),
  professionalSignatureUrl: z.string().url().optional().nullable(),
})

export type CompleteSessionFormData = z.infer<typeof completeSessionSchema>

// =============================================
// VALIDACIONES - Notas Clínicas
// =============================================

export const clinicalNoteSchema = z.object({
  sessionId: z.string().uuid().optional().nullable(),
  patientId: z.string().uuid('Selecciona un paciente'),
  type: z.enum([
    'general',
    'pre_treatment',
    'post_treatment',
    'follow_up',
    'adverse_reaction',
    'private',
  ]),
  title: z.string().max(200).optional().nullable(),
  content: z.string().min(1, 'El contenido es requerido').max(10000),
  isImportant: z.boolean(),
  isPrivate: z.boolean(),
})

export type ClinicalNoteFormData = z.infer<typeof clinicalNoteSchema>

// =============================================
// VALIDACIONES - Prescripciones
// =============================================

const prescriptionItemSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  instructions: z.string().max(500).optional(),
})

export const prescriptionSchema = z.object({
  sessionId: z.string().uuid().optional().nullable(),
  patientId: z.string().uuid('Selecciona un paciente'),
  type: z.enum(['treatment', 'medication', 'care_instructions', 'referral']),
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().max(1000).optional().nullable(),
  items: z.array(prescriptionItemSchema).min(1, 'Agrega al menos un item'),
  instructions: z.string().max(2000).optional().nullable(),
  warnings: z.string().max(1000).optional().nullable(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional().nullable(),
})

export type PrescriptionFormData = z.infer<typeof prescriptionSchema>

// =============================================
// VALIDACIONES - Imágenes de Sesión
// =============================================

export const sessionImageSchema = z.object({
  type: z.enum(['before', 'during', 'after']),
  bodyZone: z.string().max(50).optional().nullable(),
  imageUrl: z.string().url('URL de imagen inválida'),
  thumbnailUrl: z.string().url().optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  takenAt: z.string().datetime().optional(),
  sortOrder: z.number().int().min(0),
  isConsentImage: z.boolean(),
})

export type SessionImageFormData = z.infer<typeof sessionImageSchema>

// =============================================
// VALIDACIONES - Productos de Sesión
// =============================================

export const sessionProductSchema = z.object({
  productId: z.string().uuid('Selecciona un producto'),
  lotId: z.string().uuid().optional().nullable(),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  unit: z.string(),
  unitCost: z.number().min(0).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type SessionProductFormData = z.infer<typeof sessionProductSchema>

// =============================================
// VALIDACIONES - Parámetros Técnicos
// =============================================

export const laserParametersSchema = z.object({
  wavelength: z.number().positive().optional(),
  fluence: z.number().positive().optional(),
  pulse_duration: z.number().positive().optional(),
  spot_size: z.number().positive().optional(),
  frequency: z.number().positive().optional(),
  passes: z.number().int().positive().optional(),
})

export const injectableParametersSchema = z.object({
  product: z.string().optional(),
  batch: z.string().optional(),
  units: z.number().positive().optional(),
  volume: z.number().positive().optional(),
  dilution: z.string().optional(),
  needle_gauge: z.string().optional(),
  technique: z.string().optional(),
})

export const rfParametersSchema = z.object({
  power: z.number().positive().optional(),
  temperature: z.number().positive().optional(),
  time_per_zone: z.number().positive().optional(),
  passes: z.number().int().positive().optional(),
})

// =============================================
// VALIDACIONES - Filtros
// =============================================

export const sessionFiltersSchema = z.object({
  patientId: z.string().uuid().optional(),
  professionalId: z.string().uuid().optional(),
  treatmentId: z.string().uuid().optional(),
  status: z.enum(['all', 'in_progress', 'completed', 'cancelled', 'incomplete']).default('all'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['startedAt', 'patientName', 'treatmentName']).default('startedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export type SessionFilters = z.infer<typeof sessionFiltersSchema>
