// Types for Treatment Templates

// 3D Coordinate Types
export interface Point3D {
  x: number
  y: number
  z: number
}

// 3D Facial Zone Definition
export interface FacialZone3D {
  id: InjectionZone
  label: string
  center: Point3D
  color: string
  // Bounding sphere for zone detection
  radius: number
}

// Facial Treatment Template Types
export interface FacialSession {
  id: string
  sessionNumber: number
  date: string
  facialType: string
  peelingType: string | null
  peelingTime: number | null // in minutes
  mesotherapyProducts: string[]
  maskUsed: string | null
  maskTime: number | null // in minutes
  otherProducts: string[]
  observations: string
  nextVisit: string | null
}

export interface FacialTreatmentData {
  templateType: 'facial'
  sessions: FacialSession[]
  generalNotes: string
}

// Injectable Treatment Template Types
export type FaceView = 'frontal' | 'left' | 'right'

export interface InjectionPoint {
  id: string
  // 3D coordinates (primary for new data)
  position3D: Point3D
  normal3D?: Point3D // Surface normal at injection point
  // Legacy 2D coordinates (for backward compatibility)
  x?: number // percentage 0-100
  y?: number // percentage 0-100
  view?: FaceView
  // Zone and treatment details
  zone: InjectionZone
  product: string
  dilution: string | null
  lot: string | null
  dose: string
  technique: string
  notes: string
  // History tracking (for showing previous session points)
  sessionId?: string
  sessionDate?: string
}

export type InjectionZone =
  | 'frente'
  | 'entrecejo'
  | 'patas_gallo_der'
  | 'patas_gallo_izq'
  | 'nariz'
  | 'surco_nasogeniano_der'
  | 'surco_nasogeniano_izq'
  | 'labio_superior'
  | 'labio_inferior'
  | 'comisuras'
  | 'menton'
  | 'linea_mandibular_der'
  | 'linea_mandibular_izq'
  | 'mejilla_der'
  | 'mejilla_izq'
  | 'sien_der'
  | 'sien_izq'
  | 'cuello'

export const INJECTION_ZONES: { value: InjectionZone; label: string }[] = [
  { value: 'frente', label: 'Frente' },
  { value: 'entrecejo', label: 'Entrecejo' },
  { value: 'patas_gallo_der', label: 'Patas de Gallo (Der)' },
  { value: 'patas_gallo_izq', label: 'Patas de Gallo (Izq)' },
  { value: 'nariz', label: 'Nariz' },
  { value: 'surco_nasogeniano_der', label: 'Surco Nasogeniano (Der)' },
  { value: 'surco_nasogeniano_izq', label: 'Surco Nasogeniano (Izq)' },
  { value: 'labio_superior', label: 'Labio Superior' },
  { value: 'labio_inferior', label: 'Labio Inferior' },
  { value: 'comisuras', label: 'Comisuras' },
  { value: 'menton', label: 'Mentón' },
  { value: 'linea_mandibular_der', label: 'Línea Mandibular (Der)' },
  { value: 'linea_mandibular_izq', label: 'Línea Mandibular (Izq)' },
  { value: 'mejilla_der', label: 'Mejilla (Der)' },
  { value: 'mejilla_izq', label: 'Mejilla (Izq)' },
  { value: 'sien_der', label: 'Sien (Der)' },
  { value: 'sien_izq', label: 'Sien (Izq)' },
  { value: 'cuello', label: 'Cuello' },
]

export interface InjectableTreatmentData {
  templateType: 'injectable'
  injectionPoints: InjectionPoint[]
  observations: string
  recommendations: string
  totalDose: string
  productUsed: string
  lotNumber: string
}

// Common peeling types for facial treatments
export const PEELING_TYPES = [
  'Ácido Glicólico 20%',
  'Ácido Glicólico 35%',
  'Ácido Glicólico 50%',
  'Ácido Glicólico 70%',
  'Ácido Mandélico',
  'Ácido Salicílico',
  'Ácido Láctico',
  'Jessner',
  'TCA 10%',
  'TCA 15%',
  'TCA 20%',
  'TCA 25%',
  'TCA 35%',
  'Fenol',
  'Pyruvico',
  'Retinol',
  'Combinado',
]

// Common facial types
export const FACIAL_TYPES = [
  'Limpieza Facial Profunda',
  'Limpieza Facial Express',
  'Dermapen',
  'Dermapen con PRP',
  'Mesoterapia Facial',
  'Mesoterapia Capilar',
  'Peeling Químico',
  'Hidrafacial',
  'Radiofrecuencia',
  'Microdermoabrasión',
  'Oxigenoterapia',
  'LED Therapy',
]

// Common injection techniques
export const INJECTION_TECHNIQUES = [
  'Bolo',
  'Microbolo',
  'Lineal Retrograda',
  'Lineal Anterógrada',
  'Abanico',
  'Punto por Punto',
  'Canula',
  'Nappage',
  'Blanching',
  'Intradérmica',
  'Subcutánea',
  'Supraperióstica',
]

// Common injectable products
export const INJECTABLE_PRODUCTS = [
  // Toxina Botulínica
  'Botox (onabotulinumtoxinA)',
  'Dysport (abobotulinumtoxinA)',
  'Xeomin (incobotulinumtoxinA)',
  'Jeuveau (prabotulinumtoxinA)',
  // Rellenos HA
  'Juvederm Ultra',
  'Juvederm Ultra Plus',
  'Juvederm Voluma',
  'Juvederm Volbella',
  'Juvederm Volift',
  'Restylane',
  'Restylane Lyft',
  'Restylane Silk',
  'Belotero Balance',
  'Belotero Volume',
  'Teosyal RHA',
  'Stylage',
  // Bioestimuladores
  'Radiesse',
  'Radiesse (+)',
  'Sculptra',
  'Ellanse S',
  'Ellanse M',
  'Ellanse L',
  'Profhilo',
  'Sunekos',
  'Facetem',
  'Long Lasting',
  // Hilos
  'Hilos PDO Lisos',
  'Hilos PDO Espiculados',
  'Hilos PDO COG',
  'Silhouette Soft',
]

// Template type union
export type TreatmentTemplateData = FacialTreatmentData | InjectableTreatmentData

// Function to determine template type based on treatment name
export function getTemplateType(treatmentName: string): 'facial' | 'injectable' | null {
  const name = treatmentName.toLowerCase()

  // Injectable treatments
  const injectableKeywords = [
    'botox', 'toxina', 'relleno', 'filler', 'ácido hialurónico',
    'radiesse', 'sculptra', 'profhilo', 'bioestimulador',
    'hilo', 'tensor', 'facetem', 'long lasting', 'inyectable'
  ]

  if (injectableKeywords.some(keyword => name.includes(keyword))) {
    return 'injectable'
  }

  // Facial treatments
  const facialKeywords = [
    'facial', 'limpieza', 'dermapen', 'mesoterapia', 'peeling',
    'hidrafacial', 'microdermoabrasión', 'radiofrecuencia',
    'oxigenoterapia', 'led', 'mascarilla'
  ]

  if (facialKeywords.some(keyword => name.includes(keyword))) {
    return 'facial'
  }

  return null
}
