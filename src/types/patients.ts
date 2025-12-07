// =============================================
// TIPOS - Módulo de Pacientes
// =============================================

// Tipos de enums
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_say'
export type DocumentType = 'ine' | 'passport' | 'curp' | 'other'
export type ContactMethod = 'whatsapp' | 'sms' | 'email' | 'phone'
export type PatientStatus = 'active' | 'inactive' | 'vip' | 'blocked'
export type FitzpatrickType = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI'
export type ImageType = 'before' | 'after' | 'progress' | 'document'

// =============================================
// PATIENT - Paciente
// =============================================
export interface Patient {
  id: string
  clinicId: string

  // Datos personales
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  phoneSecondary: string | null
  dateOfBirth: string | null // ISO date
  gender: Gender | null

  // Documento de identidad
  documentType: DocumentType
  documentNumber: string | null

  // Dirección
  addressStreet: string | null
  addressCity: string | null
  addressState: string | null
  addressZip: string | null
  addressCountry: string

  // Contacto de emergencia
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  emergencyContactRelationship: string | null

  // Preferencias
  preferredContactMethod: ContactMethod
  preferredLanguage: string
  preferredProfessionalId: string | null

  // Segmentación
  status: PatientStatus
  tags: string[]
  source: string | null
  referredByPatientId: string | null

  // Información adicional
  notes: string | null
  avatarUrl: string | null

  // Auditoría
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

// Para mostrar en listas
export interface PatientListItem {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  dateOfBirth: string | null
  status: PatientStatus
  tags: string[]
  avatarUrl: string | null
  totalAppointments: number
  lastAppointmentAt: string | null
  totalSpent: number
}

// Para creación/edición
export interface PatientInput {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  phoneSecondary?: string | null
  dateOfBirth?: string | null
  gender?: Gender | null
  documentType?: DocumentType
  documentNumber?: string | null
  addressStreet?: string | null
  addressCity?: string | null
  addressState?: string | null
  addressZip?: string | null
  addressCountry?: string
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  emergencyContactRelationship?: string | null
  preferredContactMethod?: ContactMethod
  preferredLanguage?: string
  preferredProfessionalId?: string | null
  status?: PatientStatus
  tags?: string[]
  source?: string | null
  referredByPatientId?: string | null
  notes?: string | null
  avatarUrl?: string | null
}

// =============================================
// PATIENT MEDICAL HISTORY - Historial Médico
// =============================================
export interface PatientMedicalHistory {
  id: string
  patientId: string

  // Tipo de piel
  skinTypeFitzpatrick: FitzpatrickType | null

  // Alergias
  allergies: string[]
  allergiesNotes: string | null

  // Enfermedades crónicas
  chronicConditions: string[]
  chronicConditionsNotes: string | null

  // Medicamentos
  currentMedications: string[]
  medicationsNotes: string | null

  // Condiciones especiales
  isPregnant: boolean
  isBreastfeeding: boolean
  hasPacemaker: boolean
  hasMetalImplants: boolean
  hasKeloidTendency: boolean
  isSmoker: boolean

  // Cirugías previas
  previousSurgeries: string[]
  previousSurgeriesNotes: string | null

  // Tratamientos estéticos previos
  previousTreatments: string[]
  previousTreatmentsNotes: string | null

  // Notas adicionales
  additionalNotes: string | null

  // Control
  lastUpdatedAt: string
  lastUpdatedBy: string | null
}

export interface MedicalHistoryInput {
  skinTypeFitzpatrick?: FitzpatrickType | null
  allergies?: string[]
  allergiesNotes?: string | null
  chronicConditions?: string[]
  chronicConditionsNotes?: string | null
  currentMedications?: string[]
  medicationsNotes?: string | null
  isPregnant?: boolean
  isBreastfeeding?: boolean
  hasPacemaker?: boolean
  hasMetalImplants?: boolean
  hasKeloidTendency?: boolean
  isSmoker?: boolean
  previousSurgeries?: string[]
  previousSurgeriesNotes?: string | null
  previousTreatments?: string[]
  previousTreatmentsNotes?: string | null
  additionalNotes?: string | null
}

// =============================================
// PATIENT IMAGES - Fotos
// =============================================
export interface PatientImage {
  id: string
  patientId: string
  sessionId: string | null
  type: ImageType
  bodyZone: string | null
  imageUrl: string
  thumbnailUrl: string | null
  caption: string | null
  takenAt: string
  isPrivate: boolean
  sortOrder: number
  createdAt: string
  createdBy: string | null
}

export interface PatientImageInput {
  type: ImageType
  bodyZone?: string | null
  imageUrl: string
  thumbnailUrl?: string | null
  caption?: string | null
  takenAt?: string
  isPrivate?: boolean
  sortOrder?: number
  sessionId?: string | null
}

// =============================================
// PATIENT DOCUMENTS - Documentos
// =============================================
export interface PatientDocument {
  id: string
  patientId: string
  documentType: string
  name: string
  description: string | null
  fileUrl: string
  fileType: string | null
  fileSize: number | null
  signedConsentId: string | null
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  createdBy: string | null
}

export interface PatientDocumentInput {
  documentType: string
  name: string
  description?: string | null
  fileUrl: string
  fileType?: string | null
  fileSize?: number | null
  signedConsentId?: string | null
  isActive?: boolean
  expiresAt?: string | null
}

// =============================================
// PATIENT INTERACTIONS - Timeline
// =============================================
export interface PatientInteraction {
  id: string
  patientId: string
  type: string
  title: string
  description: string | null
  referenceType: string | null
  referenceId: string | null
  metadata: Record<string, unknown>
  createdAt: string
  createdBy: string | null
}

// =============================================
// CONSTANTES ÚTILES
// =============================================

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Femenino' },
  { value: 'male', label: 'Masculino' },
  { value: 'other', label: 'Otro' },
  { value: 'prefer_not_say', label: 'Prefiero no decir' },
]

export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'ine', label: 'INE' },
  { value: 'passport', label: 'Pasaporte' },
  { value: 'curp', label: 'CURP' },
  { value: 'other', label: 'Otro' },
]

export const CONTACT_METHOD_OPTIONS: { value: ContactMethod; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Llamada' },
]

export const PATIENT_STATUS_OPTIONS: { value: PatientStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Activo', color: '#22c55e' },
  { value: 'inactive', label: 'Inactivo', color: '#6b7280' },
  { value: 'vip', label: 'VIP', color: '#eab308' },
  { value: 'blocked', label: 'Bloqueado', color: '#ef4444' },
]

export const FITZPATRICK_OPTIONS: { value: FitzpatrickType; label: string; description: string }[] = [
  { value: 'I', label: 'Tipo I', description: 'Piel muy clara, siempre se quema, nunca se broncea' },
  { value: 'II', label: 'Tipo II', description: 'Piel clara, se quema fácilmente, se broncea poco' },
  { value: 'III', label: 'Tipo III', description: 'Piel intermedia, a veces se quema, se broncea gradualmente' },
  { value: 'IV', label: 'Tipo IV', description: 'Piel oliva, rara vez se quema, se broncea fácilmente' },
  { value: 'V', label: 'Tipo V', description: 'Piel morena, muy rara vez se quema, se broncea muy fácilmente' },
  { value: 'VI', label: 'Tipo VI', description: 'Piel muy oscura, nunca se quema' },
]

export const CHRONIC_CONDITIONS_OPTIONS: string[] = [
  'Diabetes',
  'Hipertensión',
  'Enfermedades cardíacas',
  'Enfermedades autoinmunes',
  'Trastornos de coagulación',
  'Enfermedades de tiroides',
  'Cáncer (historial)',
  'VIH/SIDA',
  'Hepatitis',
  'Epilepsia',
  'Asma',
  'Enfermedades renales',
]

export const COMMON_ALLERGIES: string[] = [
  'Látex',
  'Lidocaína',
  'Anestésicos locales',
  'Penicilina',
  'Aspirina/AINEs',
  'Yodo',
  'Retinol/Ácido retinoico',
  'Ácido hialurónico',
  'Hidroquinona',
]

export const BODY_ZONES: { value: string; label: string }[] = [
  { value: 'face_full', label: 'Rostro completo' },
  { value: 'face_forehead', label: 'Frente' },
  { value: 'face_eyes', label: 'Contorno de ojos' },
  { value: 'face_nose', label: 'Nariz' },
  { value: 'face_cheeks', label: 'Mejillas' },
  { value: 'face_lips', label: 'Labios' },
  { value: 'face_chin', label: 'Mentón' },
  { value: 'face_jawline', label: 'Línea de mandíbula' },
  { value: 'neck', label: 'Cuello' },
  { value: 'decollete', label: 'Escote' },
  { value: 'arms', label: 'Brazos' },
  { value: 'hands', label: 'Manos' },
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'back', label: 'Espalda' },
  { value: 'buttocks', label: 'Glúteos' },
  { value: 'legs', label: 'Piernas' },
  { value: 'scalp', label: 'Cuero cabelludo' },
]

export const PATIENT_SOURCES: { value: string; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'website', label: 'Sitio Web' },
  { value: 'referral', label: 'Referido' },
  { value: 'walk_in', label: 'Visita espontánea' },
  { value: 'advertisement', label: 'Publicidad' },
  { value: 'event', label: 'Evento' },
  { value: 'other', label: 'Otro' },
]
