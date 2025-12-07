// =============================================
// TIPOS - Módulo de Profesionales
// =============================================

// Enums
export type EmploymentType = 'employee' | 'contractor' | 'partner' | 'owner'
export type ProfessionalStatus = 'active' | 'inactive' | 'vacation' | 'suspended' | 'terminated'
export type CommissionType = 'percentage' | 'fixed' | 'tiered'
export type CommissionCategory = 'treatment' | 'product' | 'package' | 'all'
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled' | 'disputed'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave' | 'vacation' | 'sick' | 'holiday' | 'work_from_home' | 'partial'
export type GoalType = 'revenue' | 'appointments' | 'new_patients' | 'retention' | 'treatments' | 'products' | 'rating' | 'custom'
export type GoalStatus = 'active' | 'achieved' | 'missed' | 'cancelled'
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type BlockType = 'vacation' | 'sick_leave' | 'personal' | 'training' | 'meeting' | 'maintenance' | 'holiday' | 'other'
export type DocumentStatus = 'valid' | 'expired' | 'pending_renewal' | 'revoked'
export type SalaryType = 'hourly' | 'daily' | 'weekly' | 'biweekly' | 'monthly'

// =============================================
// PERFIL PROFESIONAL
// =============================================
export interface ProfessionalProfile {
  id: string
  clinicId: string
  userId: string

  // Información profesional
  professionalCode: string | null
  licenseNumber: string | null
  licenseExpiry: string | null
  specialties: string[]
  title: string | null
  bio: string | null

  // Configuración laboral
  employmentType: EmploymentType
  hireDate: string | null
  terminationDate: string | null
  baseSalary: number | null
  salaryType: SalaryType

  // Comisiones
  defaultCommissionRate: number
  commissionType: CommissionType

  // Disponibilidad
  maxDailyAppointments: number
  appointmentBufferMinutes: number
  acceptsWalkIns: boolean

  // Permisos
  canViewAllPatients: boolean
  canModifyPrices: boolean
  canGiveDiscounts: boolean
  maxDiscountPercent: number

  // Estado
  status: ProfessionalStatus

  // Presentación
  profileImageUrl: string | null
  signatureImageUrl: string | null
  displayOrder: number
  showOnBooking: boolean

  createdAt: string
  updatedAt: string
}

export interface ProfessionalWithUser extends ProfessionalProfile {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  fullName: string
}

export interface ProfessionalSummary extends ProfessionalWithUser {
  appointmentsThisMonth: number
  revenueThisMonth: number
  averageRating: number
  totalRatings: number
  treatmentsCount: number
}

export interface ProfessionalInput {
  userId: string
  professionalCode?: string | null
  licenseNumber?: string | null
  licenseExpiry?: string | null
  specialties?: string[]
  title?: string | null
  bio?: string | null
  employmentType?: EmploymentType
  hireDate?: string | null
  baseSalary?: number | null
  salaryType?: SalaryType
  defaultCommissionRate?: number
  commissionType?: CommissionType
  maxDailyAppointments?: number
  appointmentBufferMinutes?: number
  acceptsWalkIns?: boolean
  canViewAllPatients?: boolean
  canModifyPrices?: boolean
  canGiveDiscounts?: boolean
  maxDiscountPercent?: number
  status?: ProfessionalStatus
  profileImageUrl?: string | null
  signatureImageUrl?: string | null
  showOnBooking?: boolean
}

// =============================================
// DOCUMENTOS DEL PROFESIONAL
// =============================================
export interface ProfessionalDocument {
  id: string
  clinicId: string
  professionalId: string
  documentType: string
  documentName: string
  documentNumber: string | null
  issuedBy: string | null
  issuedDate: string | null
  expiryDate: string | null
  fileUrl: string | null
  notes: string | null
  status: DocumentStatus
  verifiedAt: string | null
  verifiedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface ProfessionalDocumentInput {
  documentType: string
  documentName: string
  documentNumber?: string | null
  issuedBy?: string | null
  issuedDate?: string | null
  expiryDate?: string | null
  fileUrl?: string | null
  notes?: string | null
}

// =============================================
// HORARIOS DE TRABAJO
// =============================================
export interface ProfessionalSchedule {
  id: string
  clinicId: string
  professionalId: string
  branchId: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  breakStart: string | null
  breakEnd: string | null
  isActive: boolean
  effectiveFrom: string | null
  effectiveUntil: string | null
  createdAt: string
  updatedAt: string
}

export interface ProfessionalScheduleWithDetails extends ProfessionalSchedule {
  professionalName: string
  branchName: string | null
  dayName: string
}

export interface ProfessionalScheduleInput {
  branchId?: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  breakStart?: string | null
  breakEnd?: string | null
  isActive?: boolean
  effectiveFrom?: string | null
  effectiveUntil?: string | null
}

// =============================================
// BLOQUEOS DE HORARIO
// =============================================
export interface ScheduleBlock {
  id: string
  clinicId: string
  professionalId: string | null
  branchId: string | null
  roomId: string | null
  blockType: BlockType
  title: string | null
  description: string | null
  startDatetime: string
  endDatetime: string
  allDay: boolean
  recurrenceRule: string | null
  createdAt: string
  createdBy: string | null
}

export interface ScheduleBlockInput {
  professionalId?: string | null
  branchId?: string | null
  roomId?: string | null
  blockType: BlockType
  title?: string | null
  description?: string | null
  startDatetime: string
  endDatetime: string
  allDay?: boolean
  recurrenceRule?: string | null
}

// =============================================
// TRATAMIENTOS HABILITADOS
// =============================================
export interface ProfessionalTreatment {
  id: string
  clinicId: string
  professionalId: string
  treatmentId: string
  customDurationMinutes: number | null
  customPrice: number | null
  commissionRate: number | null
  isPrimary: boolean
  isActive: boolean
  createdAt: string
}

export interface ProfessionalTreatmentWithDetails extends ProfessionalTreatment {
  treatmentName: string
  treatmentCategory: string
  basePrice: number
  baseDuration: number
}

// =============================================
// REGLAS DE COMISIONES
// =============================================
export interface TieredRate {
  from: number
  to: number | null
  rate: number
}

export interface CommissionRule {
  id: string
  clinicId: string
  professionalId: string | null
  name: string
  description: string | null
  commissionType: CommissionCategory
  calculationType: CommissionType
  rate: number | null
  tieredRates: TieredRate[] | null
  treatmentCategoryId: string | null
  treatmentId: string | null
  productCategoryId: string | null
  minAmount: number | null
  maxAmount: number | null
  appliesToDiscounted: boolean
  effectiveFrom: string
  effectiveUntil: string | null
  priority: number
  isActive: boolean
  createdAt: string
  createdBy: string | null
}

export interface CommissionRuleInput {
  professionalId?: string | null
  name: string
  description?: string | null
  commissionType: CommissionCategory
  calculationType: CommissionType
  rate?: number | null
  tieredRates?: TieredRate[] | null
  treatmentCategoryId?: string | null
  treatmentId?: string | null
  productCategoryId?: string | null
  minAmount?: number | null
  maxAmount?: number | null
  appliesToDiscounted?: boolean
  effectiveFrom: string
  effectiveUntil?: string | null
  priority?: number
  isActive?: boolean
}

// =============================================
// COMISIONES GENERADAS
// =============================================
export interface Commission {
  id: string
  clinicId: string
  professionalId: string
  referenceType: 'session' | 'sale' | 'sale_item' | 'package'
  referenceId: string
  commissionRuleId: string | null
  baseAmount: number
  commissionRate: number
  commissionAmount: number
  status: CommissionStatus
  periodStart: string | null
  periodEnd: string | null
  paymentDate: string | null
  paymentReference: string | null
  notes: string | null
  createdAt: string
  approvedAt: string | null
  approvedBy: string | null
  paidAt: string | null
  paidBy: string | null
}

export interface CommissionWithDetails extends Commission {
  professionalName: string
  referenceDescription: string
}

// =============================================
// ASISTENCIA
// =============================================
export interface AttendanceLog {
  id: string
  clinicId: string
  professionalId: string
  branchId: string | null
  date: string
  clockIn: string | null
  clockInMethod: string | null
  clockInNotes: string | null
  clockOut: string | null
  clockOutMethod: string | null
  clockOutNotes: string | null
  breakMinutes: number
  scheduledHours: number | null
  workedHours: number | null
  overtimeHours: number
  status: AttendanceStatus
  notes: string | null
  createdAt: string
  updatedAt: string
  approvedBy: string | null
}

export interface AttendanceLogWithDetails extends AttendanceLog {
  professionalName: string
  branchName: string | null
}

export interface AttendanceInput {
  date: string
  clockIn?: string | null
  clockOut?: string | null
  breakMinutes?: number
  status?: AttendanceStatus
  notes?: string | null
}

// =============================================
// METAS Y OBJETIVOS
// =============================================
export interface ProfessionalGoal {
  id: string
  clinicId: string
  professionalId: string
  goalType: GoalType
  name: string
  description: string | null
  periodType: PeriodType
  periodStart: string
  periodEnd: string
  targetValue: number
  currentValue: number
  bonusAmount: number | null
  bonusPercentage: number | null
  status: GoalStatus
  achievedAt: string | null
  createdAt: string
  createdBy: string | null
}

export interface ProfessionalGoalWithDetails extends ProfessionalGoal {
  professionalName: string
  progressPercent: number
}

export interface ProfessionalGoalInput {
  goalType: GoalType
  name: string
  description?: string | null
  periodType: PeriodType
  periodStart: string
  periodEnd: string
  targetValue: number
  bonusAmount?: number | null
  bonusPercentage?: number | null
}

// =============================================
// CALIFICACIONES
// =============================================
export interface ProfessionalRating {
  id: string
  clinicId: string
  professionalId: string
  patientId: string
  sessionId: string | null
  appointmentId: string | null
  overallRating: number
  punctualityRating: number | null
  professionalismRating: number | null
  communicationRating: number | null
  resultsRating: number | null
  comment: string | null
  isPublic: boolean
  isVerified: boolean
  isFlagged: boolean
  flagReason: string | null
  response: string | null
  responseAt: string | null
  createdAt: string
}

export interface ProfessionalRatingWithPatient extends ProfessionalRating {
  patientName: string
  treatmentName: string | null
}

// =============================================
// CONSTANTES Y OPCIONES
// =============================================

export const EMPLOYMENT_TYPE_OPTIONS: {
  value: EmploymentType
  label: string
}[] = [
  { value: 'employee', label: 'Empleado' },
  { value: 'contractor', label: 'Contratista' },
  { value: 'partner', label: 'Socio' },
  { value: 'owner', label: 'Propietario' },
]

export const PROFESSIONAL_STATUS_OPTIONS: {
  value: ProfessionalStatus
  label: string
  color: string
}[] = [
  { value: 'active', label: 'Activo', color: '#22c55e' },
  { value: 'inactive', label: 'Inactivo', color: '#6b7280' },
  { value: 'vacation', label: 'Vacaciones', color: '#3b82f6' },
  { value: 'suspended', label: 'Suspendido', color: '#f59e0b' },
  { value: 'terminated', label: 'Terminado', color: '#ef4444' },
]

export const COMMISSION_STATUS_OPTIONS: {
  value: CommissionStatus
  label: string
  color: string
}[] = [
  { value: 'pending', label: 'Pendiente', color: '#f59e0b' },
  { value: 'approved', label: 'Aprobada', color: '#3b82f6' },
  { value: 'paid', label: 'Pagada', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelada', color: '#6b7280' },
  { value: 'disputed', label: 'Disputada', color: '#ef4444' },
]

export const ATTENDANCE_STATUS_OPTIONS: {
  value: AttendanceStatus
  label: string
  color: string
}[] = [
  { value: 'present', label: 'Presente', color: '#22c55e' },
  { value: 'absent', label: 'Ausente', color: '#ef4444' },
  { value: 'late', label: 'Tardanza', color: '#f59e0b' },
  { value: 'early_leave', label: 'Salida temprana', color: '#f97316' },
  { value: 'vacation', label: 'Vacaciones', color: '#3b82f6' },
  { value: 'sick', label: 'Enfermedad', color: '#8b5cf6' },
  { value: 'holiday', label: 'Feriado', color: '#06b6d4' },
  { value: 'work_from_home', label: 'Trabajo remoto', color: '#14b8a6' },
  { value: 'partial', label: 'Parcial', color: '#6b7280' },
]

export const GOAL_TYPE_OPTIONS: {
  value: GoalType
  label: string
  icon: string
}[] = [
  { value: 'revenue', label: 'Ingresos', icon: 'dollar-sign' },
  { value: 'appointments', label: 'Citas', icon: 'calendar' },
  { value: 'new_patients', label: 'Nuevos pacientes', icon: 'user-plus' },
  { value: 'retention', label: 'Retención', icon: 'repeat' },
  { value: 'treatments', label: 'Tratamientos', icon: 'activity' },
  { value: 'products', label: 'Productos', icon: 'package' },
  { value: 'rating', label: 'Calificación', icon: 'star' },
  { value: 'custom', label: 'Personalizado', icon: 'target' },
]

export const BLOCK_TYPE_OPTIONS: {
  value: BlockType
  label: string
  color: string
}[] = [
  { value: 'vacation', label: 'Vacaciones', color: '#3b82f6' },
  { value: 'sick_leave', label: 'Enfermedad', color: '#ef4444' },
  { value: 'personal', label: 'Personal', color: '#8b5cf6' },
  { value: 'training', label: 'Capacitación', color: '#06b6d4' },
  { value: 'meeting', label: 'Reunión', color: '#f59e0b' },
  { value: 'maintenance', label: 'Mantenimiento', color: '#6b7280' },
  { value: 'holiday', label: 'Feriado', color: '#22c55e' },
  { value: 'other', label: 'Otro', color: '#9ca3af' },
]

export const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
]

// =============================================
// HELPERS
// =============================================

export function getProfessionalStatusConfig(status: ProfessionalStatus) {
  return PROFESSIONAL_STATUS_OPTIONS.find((s) => s.value === status)
}

export function getCommissionStatusConfig(status: CommissionStatus) {
  return COMMISSION_STATUS_OPTIONS.find((s) => s.value === status)
}

export function getAttendanceStatusConfig(status: AttendanceStatus) {
  return ATTENDANCE_STATUS_OPTIONS.find((s) => s.value === status)
}

export function formatCurrency(amount: number, currency = 'DOP'): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export function getDayName(dayOfWeek: number): string {
  return DAY_OF_WEEK_OPTIONS.find(d => d.value === dayOfWeek)?.label || ''
}

export function calculateGoalProgress(goal: ProfessionalGoal): number {
  if (goal.targetValue <= 0) return 0
  return Math.min(100, (goal.currentValue / goal.targetValue) * 100)
}

export function getFullName(firstName: string, lastName: string, title?: string | null): string {
  const name = `${firstName} ${lastName}`.trim()
  return title ? `${title} ${name}` : name
}
