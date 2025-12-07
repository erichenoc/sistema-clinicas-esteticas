// =============================================
// TIPOS - Módulo de Tratamientos
// =============================================

export interface TreatmentCategory {
  id: string
  clinicId: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TreatmentConsumable {
  productId: string
  quantity: number
}

export interface TreatmentProtocolStep {
  order: number
  title: string
  description: string
  durationMinutes?: number
}

export interface Treatment {
  id: string
  clinicId: string
  categoryId: string | null

  // Información básica
  name: string
  slug: string
  description: string | null
  descriptionInternal: string | null

  // Duración y tiempos
  durationMinutes: number
  bufferMinutes: number

  // Precios
  price: number
  priceFrom: number | null
  cost: number

  // Sesiones
  recommendedSessions: number
  sessionIntervalDays: number | null

  // Información clínica
  contraindications: string[]
  aftercareInstructions: string | null

  // Relaciones
  requiredConsentId: string | null
  allowedProfessionalIds: string[]
  requiredRoomTypes: string[]
  requiredEquipmentIds: string[]

  // Consumibles
  consumables: TreatmentConsumable[]

  // Protocolo
  protocolSteps: TreatmentProtocolStep[]

  // Imágenes
  imageUrl: string | null
  galleryUrls: string[]

  // Configuración
  isPublic: boolean
  isActive: boolean

  createdAt: string
  updatedAt: string

  // Relaciones expandidas
  category?: TreatmentCategory
}

export interface PackageItem {
  treatmentId: string
  quantity: number
  priceOverride?: number
  treatment?: Treatment // Para display
}

export interface Package {
  id: string
  clinicId: string

  name: string
  description: string | null
  type: 'bundle' | 'sessions_pack'

  items: PackageItem[]

  regularPrice: number
  salePrice: number

  validityDays: number | null
  validFrom: string | null
  validUntil: string | null

  maxSales: number | null
  salesCount: number

  isActive: boolean
  createdAt: string
  updatedAt: string
}

// =============================================
// TIPOS PARA FORMULARIOS Y TABLAS
// =============================================

export interface TreatmentWithCategory extends Omit<Treatment, 'category'> {
  category: TreatmentCategory | null
}

export interface TreatmentListItem {
  id: string
  name: string
  categoryName: string | null
  categoryColor: string | null
  price: number
  durationMinutes: number
  isActive: boolean
  imageUrl: string | null
}

export interface CategoryWithCount extends TreatmentCategory {
  treatmentCount: number
}

// =============================================
// TIPOS PARA FILTROS
// =============================================

export interface TreatmentFilters {
  search?: string
  categoryId?: string
  isActive?: boolean
  isPublic?: boolean
}

export interface PackageFilters {
  search?: string
  type?: 'bundle' | 'sessions_pack'
  isActive?: boolean
}
