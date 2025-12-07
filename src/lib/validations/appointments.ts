import { z } from 'zod'

// =============================================
// VALIDACIONES - Salas
// =============================================

export const roomSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(['cabin', 'surgery', 'consultation']).default('cabin'),
  capacity: z.number().int().min(1).default(1),
  equipmentIds: z.array(z.string().uuid()).default([]),
  features: z.array(z.string()).default([]),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido')
    .default('#6366f1'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  branchId: z.string().uuid().optional().nullable(),
})

export type RoomFormData = z.infer<typeof roomSchema>

// =============================================
// VALIDACIONES - Horarios de Profesionales
// =============================================

export const professionalScheduleSchema = z.object({
  professionalId: z.string().uuid('Selecciona un profesional'),
  dayOfWeek: z
    .number()
    .int()
    .min(0, 'Día inválido')
    .max(6, 'Día inválido'),
  startTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  endTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  breakStart: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido')
    .optional()
    .nullable(),
  breakEnd: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido')
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  branchId: z.string().uuid().optional().nullable(),
}).refine(
  (data) => data.startTime < data.endTime,
  {
    message: 'La hora de inicio debe ser menor a la hora de fin',
    path: ['endTime'],
  }
).refine(
  (data) => {
    if (data.breakStart && data.breakEnd) {
      return data.breakStart < data.breakEnd
    }
    return true
  },
  {
    message: 'El inicio del descanso debe ser menor al fin',
    path: ['breakEnd'],
  }
)

export type ProfessionalScheduleFormData = z.infer<typeof professionalScheduleSchema>

// =============================================
// VALIDACIONES - Bloqueos de Agenda
// =============================================

export const scheduleBlockSchema = z.object({
  type: z.enum(['vacation', 'personal', 'maintenance', 'break', 'holiday']),
  title: z
    .string()
    .min(1, 'El título es requerido')
    .max(200, 'Máximo 200 caracteres'),
  notes: z.string().max(1000).optional().nullable(),
  startAt: z.string().datetime('Fecha/hora de inicio inválida'),
  endAt: z.string().datetime('Fecha/hora de fin inválida'),
  professionalId: z.string().uuid().optional().nullable(),
  roomId: z.string().uuid().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().max(500).optional().nullable(),
  isAllDay: z.boolean().default(false),
  branchId: z.string().uuid().optional().nullable(),
}).refine(
  (data) => new Date(data.startAt) < new Date(data.endAt),
  {
    message: 'La fecha de inicio debe ser menor a la fecha de fin',
    path: ['endAt'],
  }
).refine(
  (data) => data.professionalId || data.roomId,
  {
    message: 'Debe seleccionar al menos un profesional o sala',
    path: ['professionalId'],
  }
)

export type ScheduleBlockFormData = z.infer<typeof scheduleBlockSchema>

// =============================================
// VALIDACIONES - Citas
// =============================================

export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Selecciona un paciente'),
  professionalId: z.string().min(1, 'Selecciona un profesional'),
  treatmentId: z.string().optional().nullable(),
  treatmentName: z.string().max(200).optional().nullable(),
  scheduledAt: z.string().min(1, 'Selecciona fecha y hora'),
  durationMinutes: z
    .number()
    .int()
    .min(5, 'Mínimo 5 minutos')
    .max(480, 'Máximo 8 horas'),
  roomId: z.string().optional().nullable(),
  bufferMinutes: z.number().int().min(0).max(60),
  notes: z.string().max(2000).optional().nullable(),
  patientNotes: z.string().max(1000).optional().nullable(),
  isRecurring: z.boolean(),
  recurrenceRule: z.string().max(500).optional().nullable(),
  branchId: z.string().optional().nullable(),
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>

// Schema para creación rápida de cita
export const appointmentQuickSchema = z.object({
  patientId: z.string().uuid('Selecciona un paciente'),
  professionalId: z.string().uuid('Selecciona un profesional'),
  treatmentId: z.string().uuid('Selecciona un tratamiento'),
  scheduledAt: z.string().datetime('Fecha/hora inválida'),
  durationMinutes: z.number().int().min(5).max(480),
  roomId: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type AppointmentQuickFormData = z.infer<typeof appointmentQuickSchema>

// Schema para cambio de estado
export const appointmentStatusChangeSchema = z.object({
  status: z.enum([
    'scheduled',
    'confirmed',
    'waiting',
    'in_progress',
    'completed',
    'cancelled',
    'no_show',
  ]),
  cancellationReason: z.string().max(500).optional().nullable(),
})

export type AppointmentStatusChangeData = z.infer<typeof appointmentStatusChangeSchema>

// Schema para reprogramar cita
export const appointmentRescheduleSchema = z.object({
  scheduledAt: z.string().datetime('Fecha/hora inválida'),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  roomId: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type AppointmentRescheduleData = z.infer<typeof appointmentRescheduleSchema>

// =============================================
// VALIDACIONES - Lista de Espera
// =============================================

export const waitlistSchema = z.object({
  patientId: z.string().uuid('Selecciona un paciente'),
  treatmentId: z.string().uuid().optional().nullable(),
  professionalId: z.string().uuid().optional().nullable(),
  preferredDates: z.array(z.string()).optional().nullable(),
  preferredTimes: z
    .array(z.enum(['morning', 'afternoon', 'evening']))
    .optional()
    .nullable(),
  flexible: z.boolean().default(false),
  notes: z.string().max(500).optional().nullable(),
  priority: z.number().int().min(0).max(10).default(0),
  branchId: z.string().uuid().optional().nullable(),
})

export type WaitlistFormData = z.infer<typeof waitlistSchema>

// =============================================
// VALIDACIONES - Filtros de Agenda
// =============================================

export const calendarFiltersSchema = z.object({
  view: z.enum(['day', 'week', 'month']).default('week'),
  date: z.string().optional(),
  professionalIds: z.array(z.string().uuid()).optional(),
  roomIds: z.array(z.string().uuid()).optional(),
  treatmentIds: z.array(z.string().uuid()).optional(),
  statuses: z.array(z.enum([
    'scheduled',
    'confirmed',
    'waiting',
    'in_progress',
    'completed',
    'cancelled',
    'no_show',
  ])).optional(),
  branchId: z.string().uuid().optional().nullable(),
})

export type CalendarFilters = z.infer<typeof calendarFiltersSchema>

// =============================================
// HELPERS
// =============================================

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = []
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  let currentMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute

  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60)
    const minutes = currentMinutes % 60
    slots.push(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    )
    currentMinutes += intervalMinutes
  }

  return slots
}

export function isTimeSlotAvailable(
  slot: string,
  appointments: { scheduledAt: string; durationMinutes: number }[],
  durationMinutes: number
): boolean {
  const slotStart = new Date(slot)
  const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000)

  return !appointments.some((apt) => {
    const aptStart = new Date(apt.scheduledAt)
    const aptEnd = new Date(aptStart.getTime() + apt.durationMinutes * 60000)
    return slotStart < aptEnd && slotEnd > aptStart
  })
}

export function formatTimeSlot(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${minutes} ${period}`
}
