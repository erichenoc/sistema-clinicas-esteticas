// =============================================
// TIPOS - Módulo de Agenda y Citas
// =============================================

// Enums
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type RoomType = 'cabin' | 'surgery' | 'consultation'
export type BlockType = 'vacation' | 'personal' | 'maintenance' | 'break' | 'holiday'
export type ReminderType = 'reminder' | 'confirmation' | 'followup'
export type ReminderChannel = 'whatsapp' | 'sms' | 'email'
export type ReminderStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
export type WaitlistStatus = 'waiting' | 'contacted' | 'scheduled' | 'cancelled'
export type TimePreference = 'morning' | 'afternoon' | 'evening'

// =============================================
// ROOM - Salas/Cabinas
// =============================================
export interface Room {
  id: string
  clinicId: string
  branchId: string | null
  name: string
  description: string | null
  type: RoomType
  capacity: number
  equipmentIds: string[]
  features: string[]
  color: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface RoomInput {
  name: string
  description?: string | null
  type?: RoomType
  capacity?: number
  equipmentIds?: string[]
  features?: string[]
  color?: string
  isActive?: boolean
  sortOrder?: number
  branchId?: string | null
}

// =============================================
// PROFESSIONAL SCHEDULE - Horarios
// =============================================
export interface ProfessionalSchedule {
  id: string
  clinicId: string
  professionalId: string
  branchId: string | null
  dayOfWeek: number // 0-6 (Domingo-Sábado)
  startTime: string // HH:mm
  endTime: string // HH:mm
  breakStart: string | null
  breakEnd: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProfessionalScheduleInput {
  professionalId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  breakStart?: string | null
  breakEnd?: string | null
  isActive?: boolean
  branchId?: string | null
}

// =============================================
// SCHEDULE BLOCK - Bloqueos
// =============================================
export interface ScheduleBlock {
  id: string
  clinicId: string
  professionalId: string | null
  roomId: string | null
  branchId: string | null
  type: BlockType
  title: string
  notes: string | null
  startAt: string
  endAt: string
  isRecurring: boolean
  recurrenceRule: string | null
  isAllDay: boolean
  createdAt: string
  createdBy: string | null
}

export interface ScheduleBlockInput {
  type: BlockType
  title: string
  notes?: string | null
  startAt: string
  endAt: string
  professionalId?: string | null
  roomId?: string | null
  isRecurring?: boolean
  recurrenceRule?: string | null
  isAllDay?: boolean
  branchId?: string | null
}

// =============================================
// APPOINTMENT - Citas
// =============================================
export interface Appointment {
  id: string
  clinicId: string
  branchId: string | null
  patientId: string
  professionalId: string
  roomId: string | null
  treatmentId: string | null
  treatmentName: string | null
  packageSessionId: string | null
  scheduledAt: string
  durationMinutes: number
  bufferMinutes: number
  status: AppointmentStatus
  statusChangedAt: string | null
  statusChangedBy: string | null
  notes: string | null
  patientNotes: string | null
  cancellationReason: string | null
  reminderSentAt: string | null
  confirmationSentAt: string | null
  isRecurring: boolean
  recurrenceRule: string | null
  parentAppointmentId: string | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

// Vista expandida para mostrar en calendario/lista
export interface AppointmentListItem extends Appointment {
  patientName: string
  patientPhone: string | null
  patientEmail: string | null
  patientAvatar: string | null
  professionalName: string
  roomName: string | null
  roomColor: string | null
  treatmentDisplayName: string | null
  treatmentPrice: number | null
  categoryName: string | null
  categoryColor: string | null
  endAt: string
}

export interface AppointmentInput {
  patientId: string
  professionalId: string
  treatmentId?: string | null
  treatmentName?: string | null
  scheduledAt: string
  durationMinutes: number
  roomId?: string | null
  bufferMinutes?: number
  notes?: string | null
  patientNotes?: string | null
  isRecurring?: boolean
  recurrenceRule?: string | null
  branchId?: string | null
}

// =============================================
// WAITLIST - Lista de Espera
// =============================================
export interface WaitlistEntry {
  id: string
  clinicId: string
  branchId: string | null
  patientId: string
  treatmentId: string | null
  professionalId: string | null
  preferredDates: string[] | null
  preferredTimes: TimePreference[] | null
  flexible: boolean
  notes: string | null
  priority: number
  status: WaitlistStatus
  scheduledAppointmentId: string | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

export interface WaitlistInput {
  patientId: string
  treatmentId?: string | null
  professionalId?: string | null
  preferredDates?: string[] | null
  preferredTimes?: TimePreference[] | null
  flexible?: boolean
  notes?: string | null
  priority?: number
  branchId?: string | null
}

// =============================================
// APPOINTMENT REMINDER - Recordatorios
// =============================================
export interface AppointmentReminder {
  id: string
  appointmentId: string
  type: ReminderType
  channel: ReminderChannel
  status: ReminderStatus
  messageTemplateId: string | null
  messageContent: string | null
  scheduledFor: string
  sentAt: string | null
  deliveredAt: string | null
  readAt: string | null
  errorMessage: string | null
  createdAt: string
}

// =============================================
// CONSTANTES Y OPCIONES
// =============================================

export const APPOINTMENT_STATUS_OPTIONS: {
  value: AppointmentStatus
  label: string
  color: string
  icon: string
}[] = [
  { value: 'scheduled', label: 'Programada', color: '#3b82f6', icon: 'calendar' },
  { value: 'confirmed', label: 'Confirmada', color: '#22c55e', icon: 'check-circle' },
  { value: 'waiting', label: 'En espera', color: '#f59e0b', icon: 'clock' },
  { value: 'in_progress', label: 'En atención', color: '#8b5cf6', icon: 'user' },
  { value: 'completed', label: 'Completada', color: '#10b981', icon: 'check' },
  { value: 'cancelled', label: 'Cancelada', color: '#ef4444', icon: 'x-circle' },
  { value: 'no_show', label: 'No asistió', color: '#6b7280', icon: 'user-x' },
]

export const ROOM_TYPE_OPTIONS: { value: RoomType; label: string }[] = [
  { value: 'cabin', label: 'Cabina' },
  { value: 'surgery', label: 'Quirófano' },
  { value: 'consultation', label: 'Consultorio' },
]

export const BLOCK_TYPE_OPTIONS: { value: BlockType; label: string; color: string }[] = [
  { value: 'vacation', label: 'Vacaciones', color: '#f59e0b' },
  { value: 'personal', label: 'Personal', color: '#8b5cf6' },
  { value: 'maintenance', label: 'Mantenimiento', color: '#6b7280' },
  { value: 'break', label: 'Descanso', color: '#06b6d4' },
  { value: 'holiday', label: 'Día festivo', color: '#ec4899' },
]

export const DAYS_OF_WEEK: { value: number; label: string; short: string }[] = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
]

export const TIME_PREFERENCES: { value: TimePreference; label: string; range: string }[] = [
  { value: 'morning', label: 'Mañana', range: '9:00 - 12:00' },
  { value: 'afternoon', label: 'Tarde', range: '12:00 - 17:00' },
  { value: 'evening', label: 'Noche', range: '17:00 - 20:00' },
]

export const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
  { value: 240, label: '4 horas' },
]

// =============================================
// HELPERS
// =============================================

export function getStatusConfig(status: AppointmentStatus) {
  return APPOINTMENT_STATUS_OPTIONS.find((s) => s.value === status)
}

export function formatAppointmentTime(scheduledAt: string, durationMinutes: number): string {
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + durationMinutes * 60000)

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  return `${formatTime(start)} - ${formatTime(end)}`
}

export function formatAppointmentDate(scheduledAt: string): string {
  return new Date(scheduledAt).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function isAppointmentToday(scheduledAt: string): boolean {
  const today = new Date()
  const appointmentDate = new Date(scheduledAt)
  return (
    today.getFullYear() === appointmentDate.getFullYear() &&
    today.getMonth() === appointmentDate.getMonth() &&
    today.getDate() === appointmentDate.getDate()
  )
}

export function getAppointmentEndTime(scheduledAt: string, durationMinutes: number): Date {
  return new Date(new Date(scheduledAt).getTime() + durationMinutes * 60000)
}
