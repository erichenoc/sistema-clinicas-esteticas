import { z } from 'zod'

// =============================================
// VALIDACIONES - Categorías de Tratamientos
// =============================================

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'Máximo 100 caracteres'),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .max(100, 'Máximo 100 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido'),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
})

export type CategoryFormData = z.infer<typeof categorySchema>

// =============================================
// VALIDACIONES - Tratamientos
// =============================================

const consumableSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  quantity: z.number().positive('La cantidad debe ser positiva'),
})

const protocolStepSchema = z.object({
  order: z.number().int().min(1),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
})

export const treatmentSchema = z.object({
  // Información básica
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(200, 'Máximo 200 caracteres'),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .max(200, 'Máximo 200 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  categoryId: z.string().uuid('Selecciona una categoría').optional().nullable(),
  description: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  descriptionInternal: z.string().max(5000, 'Máximo 5000 caracteres').optional(),

  // Duración y tiempos
  durationMinutes: z
    .number()
    .int('Debe ser un número entero')
    .min(5, 'Mínimo 5 minutos')
    .max(480, 'Máximo 8 horas'),
  bufferMinutes: z
    .number()
    .int()
    .min(0, 'No puede ser negativo')
    .max(60, 'Máximo 60 minutos'),

  // Precios
  price: z
    .number()
    .min(0, 'El precio no puede ser negativo'),
  priceFrom: z
    .number()
    .min(0, 'El precio no puede ser negativo')
    .optional()
    .nullable(),
  cost: z
    .number()
    .min(0, 'El costo no puede ser negativo'),
  currency: z
    .enum(['DOP', 'USD'], {
      message: 'Selecciona una moneda válida',
    }),

  // Sesiones
  recommendedSessions: z
    .number()
    .int()
    .min(1, 'Mínimo 1 sesión'),
  sessionIntervalDays: z
    .number()
    .int()
    .min(1)
    .optional()
    .nullable(),

  // Información clínica
  contraindications: z.array(z.string()),
  aftercareInstructions: z.string().max(5000).optional(),

  // Relaciones
  requiredConsentId: z.string().uuid().optional().nullable(),
  allowedProfessionalIds: z.array(z.string().uuid()),
  requiredRoomTypes: z.array(z.string()),
  requiredEquipmentIds: z.array(z.string().uuid()),

  // Consumibles
  consumables: z.array(consumableSchema),

  // Protocolo
  protocolSteps: z.array(protocolStepSchema),

  // Imágenes
  imageUrl: z.string().url('URL inválida').optional().nullable(),
  galleryUrls: z.array(z.string().url()),

  // Configuración
  isPublic: z.boolean(),
  isActive: z.boolean(),
})

export type TreatmentFormData = z.infer<typeof treatmentSchema>

// Schema simplificado para creación rápida
export const treatmentQuickSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(200, 'Máximo 200 caracteres'),
  categoryId: z.string().uuid('Selecciona una categoría').optional().nullable(),
  durationMinutes: z
    .number()
    .int('Debe ser un número entero')
    .min(5, 'Mínimo 5 minutos')
    .max(480, 'Máximo 8 horas'),
  price: z
    .number()
    .min(0, 'El precio no puede ser negativo'),
  description: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
})

export type TreatmentQuickFormData = z.infer<typeof treatmentQuickSchema>

// =============================================
// VALIDACIONES - Paquetes
// =============================================

const packageItemSchema = z.object({
  treatmentId: z.string().uuid('ID de tratamiento inválido'),
  quantity: z.number().int().min(1, 'Mínimo 1'),
  priceOverride: z.number().min(0).optional(),
})

export const packageSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(200, 'Máximo 200 caracteres'),
  description: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  type: z.enum(['bundle', 'sessions_pack'], {
    message: 'Selecciona el tipo de paquete',
  }),

  items: z
    .array(packageItemSchema)
    .min(1, 'Agrega al menos un tratamiento'),

  regularPrice: z
    .number()
    .positive('El precio debe ser mayor a 0'),
  salePrice: z
    .number()
    .positive('El precio debe ser mayor a 0'),

  validityDays: z
    .number()
    .int()
    .min(1, 'Mínimo 1 día')
    .optional()
    .nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),

  maxSales: z.number().int().min(1).optional().nullable(),

  isActive: z.boolean(),
}).refine(
  (data) => data.salePrice <= data.regularPrice,
  {
    message: 'El precio de venta no puede ser mayor al precio regular',
    path: ['salePrice'],
  }
)

export type PackageFormData = z.infer<typeof packageSchema>

// =============================================
// HELPERS
// =============================================

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo alfanuméricos
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .trim()
}
