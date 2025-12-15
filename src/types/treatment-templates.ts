// =============================================
// TIPOS - Plantillas de Tratamiento
// =============================================

// Tipo de plantilla de tratamiento
export type TreatmentTemplateType = 'facial' | 'injectable'

// =============================================
// PLANTILLA 1: TRATAMIENTOS FACIALES
// =============================================
// Para: Limpieza Facial, Dermapen, Mesoterapia, Peelings Químicos

export type FacialTreatmentSubtype =
  | 'limpieza_facial'
  | 'dermapen'
  | 'mesoterapia'
  | 'peeling_quimico'

export interface FacialSessionRecord {
  sessionNumber: number
  date: string
  facialType: FacialTreatmentSubtype
  facialTypeOther?: string // Para especificar si es otro tipo
  peelingUsed: string
  peelingTime: number // minutos
  mesotherapyProducts: string
  maskUsed: string
  maskTime: number // minutos
  otherProducts: string
  observations: string
  nextVisitDate?: string
}

export interface FacialTreatmentData {
  templateType: 'facial'
  patientName: string
  patientAllergies: string
  treatmentArea: string // Zona tratada (rostro, cuello, escote, etc.)
  sessions: FacialSessionRecord[]
}

// =============================================
// PLANTILLA 2: INYECTABLES
// =============================================
// Para: Rellenos HA, Bioestimuladores, Hilos tensores, Botox

export type InjectableTreatmentSubtype =
  | 'relleno_ha' // Ácido Hialurónico
  | 'bioestimulador' // Radiesse, Facetem, Long Lasting, Profhilo
  | 'hilos_tensores'
  | 'botox'

export type BioestimulatorBrand =
  | 'radiesse'
  | 'facetem'
  | 'long_lasting'
  | 'profhilo'
  | 'otro'

// Zonas del rostro para inyectables (mapeadas al SVG)
export type FacialZone =
  | 'frente'
  | 'entrecejo'
  | 'patas_gallo_izq'
  | 'patas_gallo_der'
  | 'nariz'
  | 'pomulo_izq'
  | 'pomulo_der'
  | 'surco_nasogeniano_izq'
  | 'surco_nasogeniano_der'
  | 'labio_superior'
  | 'labio_inferior'
  | 'comisuras'
  | 'menton'
  | 'linea_mandibular_izq'
  | 'linea_mandibular_der'
  | 'cuello'
  | 'sien_izq'
  | 'sien_der'

// Registro de aplicación en una zona específica
export interface InjectionPoint {
  id: string
  zone: FacialZone
  x: number // Posición X en el SVG (0-100)
  y: number // Posición Y en el SVG (0-100)
  view: 'frontal' | 'lateral_izq' | 'lateral_der'
  product: string
  brand?: BioestimulatorBrand
  dilution?: string
  lot: string
  dose: string // Unidades o ml
  units?: number // Para botox
  volume?: number // Para rellenos en ml
  technique?: string // Técnica de aplicación
  needleGauge?: string // Calibre de aguja
  notes?: string
}

export interface InjectableSessionRecord {
  sessionNumber: number
  date: string
  treatmentSubtype: InjectableTreatmentSubtype
  injectionPoints: InjectionPoint[]
  totalUnits?: number // Total de unidades (botox)
  totalVolume?: number // Total de ml (rellenos)
  productBrand: string
  productLot: string
  expirationDate?: string
  observations: string
  recommendations: string
  nextVisitDate?: string
  // Campos adicionales del formulario original
  labelPhoto?: string // URL de foto de etiqueta del producto
}

export interface InjectableTreatmentData {
  templateType: 'injectable'
  patientName: string
  professionalName: string
  sessions: InjectableSessionRecord[]
}

// =============================================
// UNIÓN DE DATOS DE PLANTILLA
// =============================================

export type TreatmentTemplateData = FacialTreatmentData | InjectableTreatmentData

// =============================================
// CONSTANTES Y OPCIONES
// =============================================

export const FACIAL_TREATMENT_SUBTYPES: {
  value: FacialTreatmentSubtype
  label: string
  description: string
}[] = [
  {
    value: 'limpieza_facial',
    label: 'Limpieza Facial',
    description: 'Limpieza profunda del rostro'
  },
  {
    value: 'dermapen',
    label: 'Dermapen',
    description: 'Microagujas para rejuvenecimiento'
  },
  {
    value: 'mesoterapia',
    label: 'Mesoterapia',
    description: 'Inyección de vitaminas y nutrientes'
  },
  {
    value: 'peeling_quimico',
    label: 'Peeling Químico',
    description: 'Exfoliación química de la piel'
  },
]

export const INJECTABLE_TREATMENT_SUBTYPES: {
  value: InjectableTreatmentSubtype
  label: string
  description: string
}[] = [
  {
    value: 'relleno_ha',
    label: 'Relleno de Ácido Hialurónico',
    description: 'Restauración de volumen facial'
  },
  {
    value: 'bioestimulador',
    label: 'Bioestimuladores',
    description: 'Radiesse, Facetem, Long Lasting, Profhilo'
  },
  {
    value: 'hilos_tensores',
    label: 'Hilos Tensores',
    description: 'Lifting no quirúrgico'
  },
  {
    value: 'botox',
    label: 'Toxina Botulínica (Botox)',
    description: 'Relajación muscular para arrugas'
  },
]

export const BIOESTIMULATOR_BRANDS: {
  value: BioestimulatorBrand
  label: string
}[] = [
  { value: 'radiesse', label: 'Radiesse' },
  { value: 'facetem', label: 'Facetem' },
  { value: 'long_lasting', label: 'Long Lasting' },
  { value: 'profhilo', label: 'Profhilo' },
  { value: 'otro', label: 'Otro' },
]

export const FACIAL_ZONES: {
  value: FacialZone
  label: string
  group: 'superior' | 'medio' | 'inferior' | 'lateral'
}[] = [
  // Tercio Superior
  { value: 'frente', label: 'Frente', group: 'superior' },
  { value: 'entrecejo', label: 'Entrecejo (Glabela)', group: 'superior' },
  { value: 'sien_izq', label: 'Sien Izquierda', group: 'superior' },
  { value: 'sien_der', label: 'Sien Derecha', group: 'superior' },
  // Tercio Medio
  { value: 'patas_gallo_izq', label: 'Patas de Gallo Izq.', group: 'medio' },
  { value: 'patas_gallo_der', label: 'Patas de Gallo Der.', group: 'medio' },
  { value: 'nariz', label: 'Nariz', group: 'medio' },
  { value: 'pomulo_izq', label: 'Pómulo Izquierdo', group: 'medio' },
  { value: 'pomulo_der', label: 'Pómulo Derecho', group: 'medio' },
  { value: 'surco_nasogeniano_izq', label: 'Surco Nasogeniano Izq.', group: 'medio' },
  { value: 'surco_nasogeniano_der', label: 'Surco Nasogeniano Der.', group: 'medio' },
  // Tercio Inferior
  { value: 'labio_superior', label: 'Labio Superior', group: 'inferior' },
  { value: 'labio_inferior', label: 'Labio Inferior', group: 'inferior' },
  { value: 'comisuras', label: 'Comisuras Labiales', group: 'inferior' },
  { value: 'menton', label: 'Mentón', group: 'inferior' },
  { value: 'linea_mandibular_izq', label: 'Línea Mandibular Izq.', group: 'inferior' },
  { value: 'linea_mandibular_der', label: 'Línea Mandibular Der.', group: 'inferior' },
  // Lateral/Cuello
  { value: 'cuello', label: 'Cuello', group: 'lateral' },
]

export const COMMON_PEELING_TYPES = [
  'Ácido Glicólico',
  'Ácido Salicílico',
  'Ácido Mandélico',
  'Ácido Láctico',
  'TCA (Ácido Tricloroacético)',
  'Jessner',
  'Fenol',
  'Retinol',
  'Vitamina C',
  'Otro',
]

export const COMMON_MESOTHERAPY_PRODUCTS = [
  'Ácido Hialurónico',
  'Vitaminas (Complejo B)',
  'Aminoácidos',
  'Péptidos',
  'DMAE',
  'Silicio Orgánico',
  'Coenzima Q10',
  'Ácido Ascórbico',
  'Factor de Crecimiento',
  'Otro',
]

// =============================================
// HELPERS
// =============================================

export function createEmptyFacialSession(sessionNumber: number): FacialSessionRecord {
  return {
    sessionNumber,
    date: new Date().toISOString().split('T')[0],
    facialType: 'limpieza_facial',
    peelingUsed: '',
    peelingTime: 0,
    mesotherapyProducts: '',
    maskUsed: '',
    maskTime: 0,
    otherProducts: '',
    observations: '',
  }
}

export function createEmptyInjectableSession(sessionNumber: number): InjectableSessionRecord {
  return {
    sessionNumber,
    date: new Date().toISOString().split('T')[0],
    treatmentSubtype: 'botox',
    injectionPoints: [],
    productBrand: '',
    productLot: '',
    observations: '',
    recommendations: '',
  }
}

export function createEmptyInjectionPoint(
  zone: FacialZone,
  x: number,
  y: number,
  view: 'frontal' | 'lateral_izq' | 'lateral_der'
): InjectionPoint {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    zone,
    x,
    y,
    view,
    product: '',
    lot: '',
    dose: '',
  }
}

// Determinar el tipo de plantilla basado en el nombre/categoría del tratamiento
export function inferTemplateType(
  treatmentName: string,
  categoryName: string | null
): TreatmentTemplateType | null {
  const name = treatmentName.toLowerCase()
  const category = (categoryName || '').toLowerCase()

  // Plantilla Facial
  if (
    name.includes('limpieza') ||
    name.includes('facial') ||
    name.includes('dermapen') ||
    name.includes('mesoterapia') ||
    name.includes('peeling') ||
    category.includes('facial')
  ) {
    return 'facial'
  }

  // Plantilla Inyectable
  if (
    name.includes('relleno') ||
    name.includes('hialurónico') ||
    name.includes('hialuronico') ||
    name.includes('bioestimulador') ||
    name.includes('radiesse') ||
    name.includes('profhilo') ||
    name.includes('hilo') ||
    name.includes('tensor') ||
    name.includes('botox') ||
    name.includes('toxina') ||
    category.includes('inyectable') ||
    category.includes('relleno')
  ) {
    return 'injectable'
  }

  return null
}

// Obtener el subtipo de tratamiento facial
export function inferFacialSubtype(treatmentName: string): FacialTreatmentSubtype {
  const name = treatmentName.toLowerCase()

  if (name.includes('dermapen')) return 'dermapen'
  if (name.includes('mesoterapia') || name.includes('meso')) return 'mesoterapia'
  if (name.includes('peeling')) return 'peeling_quimico'
  return 'limpieza_facial'
}

// Obtener el subtipo de tratamiento inyectable
export function inferInjectableSubtype(treatmentName: string): InjectableTreatmentSubtype {
  const name = treatmentName.toLowerCase()

  if (name.includes('botox') || name.includes('toxina')) return 'botox'
  if (name.includes('hilo') || name.includes('tensor')) return 'hilos_tensores'
  if (
    name.includes('bioestimulador') ||
    name.includes('radiesse') ||
    name.includes('profhilo') ||
    name.includes('facetem') ||
    name.includes('long lasting')
  ) return 'bioestimulador'
  return 'relleno_ha'
}
