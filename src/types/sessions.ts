// =============================================
// TIPOS - Módulo de Sesiones Clínicas
// =============================================

import type { TreatmentTemplateData } from './treatment-templates'

// Enums
export type SessionStatus = 'in_progress' | 'completed' | 'cancelled' | 'incomplete'
export type ClinicalNoteType = 'general' | 'pre_treatment' | 'post_treatment' | 'follow_up' | 'adverse_reaction' | 'private'
export type PrescriptionType = 'treatment' | 'medication' | 'care_instructions' | 'referral'
export type SessionImageType = 'before' | 'during' | 'after'

// =============================================
// TECHNICAL PARAMETERS - Parámetros Técnicos
// =============================================
export interface TechnicalParameters {
  skinType?: string
  protocol?: string
  products?: string
  treatmentTemplate?: TreatmentTemplateData
  [key: string]: unknown
}

// =============================================
// SESSION - Sesión Clínica
// =============================================
export interface Session {
  id: string
  clinicId: string
  branchId: string | null
  appointmentId: string | null
  patientId: string
  professionalId: string
  treatmentId: string | null
  treatmentName: string
  packageSessionId: string | null
  startedAt: string
  endedAt: string | null
  durationMinutes: number | null
  status: SessionStatus
  treatedZones: TreatedZone[]
  technicalParameters: TechnicalParameters
  productsUsed: ProductUsed[]
  observations: string | null
  patientFeedback: string | null
  adverseReactions: string | null
  resultRating: number | null
  resultNotes: string | null
  patientSignatureUrl: string | null
  professionalSignatureUrl: string | null
  signedAt: string | null
  followUpRequired: boolean
  followUpNotes: string | null
  nextSessionRecommendedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

export interface TreatedZone {
  zone: string
  notes?: string
  parameters?: Record<string, unknown>
}

export interface ProductUsed {
  productId: string
  productName?: string
  lotNumber?: string
  quantity: number
  unit: string
}

// Vista expandida de sesión
export interface SessionListItem extends Session {
  patientName: string
  patientPhone: string | null
  patientAvatar: string | null
  professionalName: string
  treatmentDisplayName: string | null
  treatmentPrice: number | null
  categoryName: string | null
  categoryColor: string | null
  appointmentScheduledAt: string | null
  imageCount: number
  totalProductCost: number
}

export interface SessionInput {
  appointmentId?: string | null
  patientId: string
  professionalId: string
  treatmentId?: string | null
  treatmentName: string
  treatedZones?: TreatedZone[]
  technicalParameters?: TechnicalParameters
  observations?: string | null
  patientFeedback?: string | null
  adverseReactions?: string | null
  followUpRequired?: boolean
  followUpNotes?: string | null
  nextSessionRecommendedAt?: string | null
  branchId?: string | null
}

// =============================================
// CLINICAL NOTE - Nota Clínica
// =============================================
export interface ClinicalNote {
  id: string
  clinicId: string
  sessionId: string | null
  patientId: string
  type: ClinicalNoteType
  title: string | null
  content: string
  isImportant: boolean
  isPrivate: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface ClinicalNoteInput {
  sessionId?: string | null
  patientId: string
  type: ClinicalNoteType
  title?: string | null
  content: string
  isImportant?: boolean
  isPrivate?: boolean
}

// =============================================
// PRESCRIPTION - Receta/Prescripción
// =============================================
export interface Prescription {
  id: string
  clinicId: string
  sessionId: string | null
  patientId: string
  professionalId: string
  type: PrescriptionType
  title: string
  description: string | null
  items: PrescriptionItem[]
  instructions: string | null
  warnings: string | null
  validFrom: string
  validUntil: string | null
  pdfUrl: string | null
  status: 'active' | 'completed' | 'cancelled'
  createdAt: string
  createdBy: string | null
}

export interface PrescriptionItem {
  name: string
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
}

export interface PrescriptionInput {
  sessionId?: string | null
  patientId: string
  type: PrescriptionType
  title: string
  description?: string | null
  items: PrescriptionItem[]
  instructions?: string | null
  warnings?: string | null
  validFrom?: string
  validUntil?: string | null
}

// =============================================
// SESSION IMAGE - Foto de Sesión
// =============================================
export interface SessionImage {
  id: string
  sessionId: string
  patientId: string
  type: SessionImageType
  bodyZone: string | null
  imageUrl: string
  thumbnailUrl: string | null
  caption: string | null
  takenAt: string
  sortOrder: number
  isConsentImage: boolean
  createdAt: string
  createdBy: string | null
}

export interface SessionImageInput {
  type: SessionImageType
  bodyZone?: string | null
  imageUrl: string
  thumbnailUrl?: string | null
  caption?: string | null
  takenAt?: string
  sortOrder?: number
  isConsentImage?: boolean
}

// =============================================
// SESSION PRODUCT - Producto Usado
// =============================================
export interface SessionProduct {
  id: string
  sessionId: string
  productId: string
  lotId: string | null
  quantity: number
  unit: string
  unitCost: number | null
  totalCost: number | null
  notes: string | null
  createdAt: string
}

export interface SessionProductInput {
  productId: string
  lotId?: string | null
  quantity: number
  unit?: string
  unitCost?: number | null
  notes?: string | null
}

// =============================================
// CONSTANTES Y OPCIONES
// =============================================

export const SESSION_STATUS_OPTIONS: {
  value: SessionStatus
  label: string
  color: string
}[] = [
  { value: 'in_progress', label: 'En progreso', color: '#3b82f6' },
  { value: 'completed', label: 'Completada', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelada', color: '#ef4444' },
  { value: 'incomplete', label: 'Incompleta', color: '#f59e0b' },
]

export const CLINICAL_NOTE_TYPES: {
  value: ClinicalNoteType
  label: string
  icon: string
}[] = [
  { value: 'general', label: 'General', icon: 'file-text' },
  { value: 'pre_treatment', label: 'Pre-tratamiento', icon: 'clipboard' },
  { value: 'post_treatment', label: 'Post-tratamiento', icon: 'check-circle' },
  { value: 'follow_up', label: 'Seguimiento', icon: 'refresh-cw' },
  { value: 'adverse_reaction', label: 'Reacción adversa', icon: 'alert-triangle' },
  { value: 'private', label: 'Privada', icon: 'lock' },
]

export const PRESCRIPTION_TYPES: {
  value: PrescriptionType
  label: string
}[] = [
  { value: 'treatment', label: 'Tratamiento' },
  { value: 'medication', label: 'Medicación' },
  { value: 'care_instructions', label: 'Instrucciones de cuidado' },
  { value: 'referral', label: 'Derivación' },
]

// Parámetros técnicos por tipo de tratamiento
export const LASER_PARAMETERS = [
  { key: 'wavelength', label: 'Longitud de onda (nm)', type: 'number' },
  { key: 'fluence', label: 'Fluencia (J/cm²)', type: 'number' },
  { key: 'pulse_duration', label: 'Duración de pulso (ms)', type: 'number' },
  { key: 'spot_size', label: 'Tamaño de spot (mm)', type: 'number' },
  { key: 'frequency', label: 'Frecuencia (Hz)', type: 'number' },
  { key: 'passes', label: 'Número de pasadas', type: 'number' },
]

export const INJECTABLE_PARAMETERS = [
  { key: 'product', label: 'Producto', type: 'text' },
  { key: 'batch', label: 'Lote', type: 'text' },
  { key: 'units', label: 'Unidades', type: 'number' },
  { key: 'volume', label: 'Volumen (ml)', type: 'number' },
  { key: 'dilution', label: 'Dilución', type: 'text' },
  { key: 'needle_gauge', label: 'Calibre de aguja', type: 'text' },
  { key: 'technique', label: 'Técnica', type: 'text' },
]

export const RF_PARAMETERS = [
  { key: 'power', label: 'Potencia (W)', type: 'number' },
  { key: 'temperature', label: 'Temperatura (°C)', type: 'number' },
  { key: 'time_per_zone', label: 'Tiempo por zona (min)', type: 'number' },
  { key: 'passes', label: 'Pasadas', type: 'number' },
]

// Resultado/Rating
export const RESULT_RATINGS = [
  { value: 1, label: 'Muy malo', emoji: '😞' },
  { value: 2, label: 'Malo', emoji: '😕' },
  { value: 3, label: 'Regular', emoji: '😐' },
  { value: 4, label: 'Bueno', emoji: '😊' },
  { value: 5, label: 'Excelente', emoji: '😍' },
]

// =============================================
// HELPERS
// =============================================

export function getSessionStatusConfig(status: SessionStatus) {
  return SESSION_STATUS_OPTIONS.find((s) => s.value === status)
}

export function formatSessionDuration(minutes: number | null): string {
  if (!minutes) return '-'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

export function getParametersForTreatmentType(type: string) {
  switch (type.toLowerCase()) {
    case 'laser':
    case 'láser':
      return LASER_PARAMETERS
    case 'injectable':
    case 'inyectable':
    case 'inyectables':
      return INJECTABLE_PARAMETERS
    case 'radiofrequency':
    case 'radiofrecuencia':
      return RF_PARAMETERS
    default:
      return []
  }
}
