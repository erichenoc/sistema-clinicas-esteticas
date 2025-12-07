import { z } from 'zod'

// =============================================
// VALIDACIONES - Módulo de Profesionales
// =============================================

// =============================================
// PERFIL PROFESIONAL
// =============================================

export const professionalProfileSchema = z.object({
  userId: z.string().uuid('Selecciona un usuario'),
  professionalCode: z.string().max(50).optional().nullable(),
  licenseNumber: z.string().max(100).optional().nullable(),
  licenseExpiry: z.string().optional().nullable(),
  specialties: z.array(z.string()).default([]),
  title: z.string().max(100).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),

  employmentType: z.enum(['employee', 'contractor', 'partner', 'owner']).default('employee'),
  hireDate: z.string().optional().nullable(),
  baseSalary: z.number().min(0).optional().nullable(),
  salaryType: z.enum(['hourly', 'daily', 'weekly', 'biweekly', 'monthly']).default('monthly'),

  defaultCommissionRate: z.number().min(0).max(100).default(0),
  commissionType: z.enum(['percentage', 'fixed', 'tiered']).default('percentage'),

  maxDailyAppointments: z.number().int().min(1).max(50).default(20),
  appointmentBufferMinutes: z.number().int().min(0).max(60).default(0),
  acceptsWalkIns: z.boolean().default(true),

  canViewAllPatients: z.boolean().default(false),
  canModifyPrices: z.boolean().default(false),
  canGiveDiscounts: z.boolean().default(false),
  maxDiscountPercent: z.number().min(0).max(100).default(0),

  status: z.enum(['active', 'inactive', 'vacation', 'suspended', 'terminated']).default('active'),

  profileImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  signatureImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  showOnBooking: z.boolean().default(true),
})

export type ProfessionalProfileFormData = z.infer<typeof professionalProfileSchema>

// =============================================
// DOCUMENTOS
// =============================================

export const professionalDocumentSchema = z.object({
  documentType: z.string().min(1, 'Selecciona el tipo de documento'),
  documentName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  documentNumber: z.string().max(100).optional().nullable(),
  issuedBy: z.string().max(200).optional().nullable(),
  issuedDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  fileUrl: z.string().url().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type ProfessionalDocumentFormData = z.infer<typeof professionalDocumentSchema>

// =============================================
// HORARIOS
// =============================================

export const professionalScheduleSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM'),
  breakStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM').optional().nullable(),
  breakEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM').optional().nullable(),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().optional().nullable(),
  effectiveUntil: z.string().optional().nullable(),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: 'La hora de fin debe ser posterior a la de inicio', path: ['endTime'] }
).refine(
  (data) => {
    if (data.breakStart && data.breakEnd) {
      return data.breakEnd > data.breakStart
    }
    return true
  },
  { message: 'La hora de fin del descanso debe ser posterior al inicio', path: ['breakEnd'] }
)

export type ProfessionalScheduleFormData = z.infer<typeof professionalScheduleSchema>

// Horario semanal completo
export const weeklyScheduleSchema = z.object({
  professionalId: z.string().uuid(),
  branchId: z.string().uuid().optional().nullable(),
  schedules: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    isActive: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    breakStart: z.string().optional().nullable(),
    breakEnd: z.string().optional().nullable(),
  })),
})

export type WeeklyScheduleFormData = z.infer<typeof weeklyScheduleSchema>

// =============================================
// BLOQUEOS DE HORARIO
// =============================================

export const scheduleBlockSchema = z.object({
  professionalId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  roomId: z.string().uuid().optional().nullable(),
  blockType: z.enum(['vacation', 'sick_leave', 'personal', 'training', 'meeting', 'maintenance', 'holiday', 'other']),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  startDatetime: z.string(),
  endDatetime: z.string(),
  allDay: z.boolean().default(false),
  recurrenceRule: z.string().optional().nullable(),
}).refine(
  (data) => new Date(data.endDatetime) > new Date(data.startDatetime),
  { message: 'La fecha de fin debe ser posterior a la de inicio', path: ['endDatetime'] }
)

export type ScheduleBlockFormData = z.infer<typeof scheduleBlockSchema>

// =============================================
// TRATAMIENTOS HABILITADOS
// =============================================

export const professionalTreatmentSchema = z.object({
  treatmentId: z.string().uuid('Selecciona un tratamiento'),
  customDurationMinutes: z.number().int().positive().optional().nullable(),
  customPrice: z.number().min(0).optional().nullable(),
  commissionRate: z.number().min(0).max(100).optional().nullable(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export type ProfessionalTreatmentFormData = z.infer<typeof professionalTreatmentSchema>

// =============================================
// REGLAS DE COMISIONES
// =============================================

const tieredRateSchema = z.object({
  from: z.number().min(0),
  to: z.number().min(0).nullable(),
  rate: z.number().min(0).max(100),
})

export const commissionRuleSchema = z.object({
  professionalId: z.string().uuid().optional().nullable(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  description: z.string().max(500).optional().nullable(),
  commissionType: z.enum(['treatment', 'product', 'package', 'all']),
  calculationType: z.enum(['percentage', 'fixed', 'tiered']),
  rate: z.number().min(0).optional().nullable(),
  tieredRates: z.array(tieredRateSchema).optional().nullable(),
  treatmentCategoryId: z.string().uuid().optional().nullable(),
  treatmentId: z.string().uuid().optional().nullable(),
  productCategoryId: z.string().uuid().optional().nullable(),
  minAmount: z.number().min(0).optional().nullable(),
  maxAmount: z.number().min(0).optional().nullable(),
  appliesToDiscounted: z.boolean().default(true),
  effectiveFrom: z.string(),
  effectiveUntil: z.string().optional().nullable(),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.calculationType === 'percentage' || data.calculationType === 'fixed') {
      return data.rate !== null && data.rate !== undefined
    }
    return true
  },
  { message: 'El porcentaje o monto es requerido', path: ['rate'] }
).refine(
  (data) => {
    if (data.calculationType === 'tiered') {
      return data.tieredRates && data.tieredRates.length > 0
    }
    return true
  },
  { message: 'Agrega al menos un rango de comisión', path: ['tieredRates'] }
)

export type CommissionRuleFormData = z.infer<typeof commissionRuleSchema>

// =============================================
// ASISTENCIA
// =============================================

export const attendanceLogSchema = z.object({
  date: z.string(),
  clockIn: z.string().optional().nullable(),
  clockOut: z.string().optional().nullable(),
  breakMinutes: z.number().int().min(0).default(0),
  status: z.enum([
    'present', 'absent', 'late', 'early_leave', 'vacation',
    'sick', 'holiday', 'work_from_home', 'partial'
  ]).default('present'),
  notes: z.string().max(500).optional().nullable(),
})

export type AttendanceLogFormData = z.infer<typeof attendanceLogSchema>

// Clock in/out rápido
export const clockInOutSchema = z.object({
  professionalId: z.string().uuid(),
  action: z.enum(['clock_in', 'clock_out']),
  notes: z.string().max(200).optional().nullable(),
})

export type ClockInOutFormData = z.infer<typeof clockInOutSchema>

// =============================================
// METAS Y OBJETIVOS
// =============================================

export const professionalGoalSchema = z.object({
  goalType: z.enum(['revenue', 'appointments', 'new_patients', 'retention', 'treatments', 'products', 'rating', 'custom']),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  description: z.string().max(500).optional().nullable(),
  periodType: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  periodStart: z.string(),
  periodEnd: z.string(),
  targetValue: z.number().positive('El objetivo debe ser mayor a 0'),
  bonusAmount: z.number().min(0).optional().nullable(),
  bonusPercentage: z.number().min(0).max(100).optional().nullable(),
}).refine(
  (data) => new Date(data.periodEnd) > new Date(data.periodStart),
  { message: 'La fecha de fin debe ser posterior a la de inicio', path: ['periodEnd'] }
)

export type ProfessionalGoalFormData = z.infer<typeof professionalGoalSchema>

// =============================================
// CALIFICACIONES
// =============================================

export const professionalRatingSchema = z.object({
  patientId: z.string().uuid('Selecciona un paciente'),
  sessionId: z.string().uuid().optional().nullable(),
  appointmentId: z.string().uuid().optional().nullable(),
  overallRating: z.number().int().min(1).max(5),
  punctualityRating: z.number().int().min(1).max(5).optional().nullable(),
  professionalismRating: z.number().int().min(1).max(5).optional().nullable(),
  communicationRating: z.number().int().min(1).max(5).optional().nullable(),
  resultsRating: z.number().int().min(1).max(5).optional().nullable(),
  comment: z.string().max(1000).optional().nullable(),
  isPublic: z.boolean().default(false),
})

export type ProfessionalRatingFormData = z.infer<typeof professionalRatingSchema>

// Respuesta a calificación
export const ratingResponseSchema = z.object({
  ratingId: z.string().uuid(),
  response: z.string().min(10, 'La respuesta debe tener al menos 10 caracteres').max(1000),
})

export type RatingResponseFormData = z.infer<typeof ratingResponseSchema>

// =============================================
// FILTROS
// =============================================

export const professionalsFiltersSchema = z.object({
  status: z.enum(['all', 'active', 'inactive', 'vacation', 'suspended', 'terminated']).default('all'),
  employmentType: z.enum(['all', 'employee', 'contractor', 'partner', 'owner']).default('all'),
  specialty: z.string().optional(),
  search: z.string().optional(),
  branchId: z.string().uuid().optional(),
  showOnBooking: z.boolean().optional(),
  sortBy: z.enum(['name', 'hireDate', 'rating', 'appointments']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export type ProfessionalsFilters = z.infer<typeof professionalsFiltersSchema>

export const commissionsFiltersSchema = z.object({
  professionalId: z.string().uuid().optional(),
  status: z.enum(['all', 'pending', 'approved', 'paid', 'cancelled', 'disputed']).default('all'),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  sortBy: z.enum(['createdAt', 'amount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export type CommissionsFilters = z.infer<typeof commissionsFiltersSchema>

export const attendanceFiltersSchema = z.object({
  professionalId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  status: z.enum([
    'all', 'present', 'absent', 'late', 'early_leave', 'vacation',
    'sick', 'holiday', 'work_from_home', 'partial'
  ]).default('all'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export type AttendanceFilters = z.infer<typeof attendanceFiltersSchema>

// =============================================
// TIPOS DE DOCUMENTOS
// =============================================

export const DOCUMENT_TYPES = [
  { value: 'cedula', label: 'Cédula Profesional' },
  { value: 'titulo', label: 'Título Universitario' },
  { value: 'certificacion', label: 'Certificación' },
  { value: 'licencia', label: 'Licencia/Permiso' },
  { value: 'curso', label: 'Curso/Diplomado' },
  { value: 'seguro', label: 'Seguro de Responsabilidad' },
  { value: 'contrato', label: 'Contrato Laboral' },
  { value: 'identificacion', label: 'Identificación Oficial' },
  { value: 'otro', label: 'Otro' },
] as const

export const SPECIALTIES = [
  'Medicina Estética',
  'Dermatología',
  'Cirugía Plástica',
  'Nutrición',
  'Cosmetología',
  'Fisioterapia',
  'Estética Facial',
  'Estética Corporal',
  'Depilación Láser',
  'Tratamientos Capilares',
  'Masoterapia',
  'Podología',
] as const
