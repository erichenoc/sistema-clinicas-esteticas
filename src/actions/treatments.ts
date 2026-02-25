'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail, generatePackageEmailHTML } from '@/lib/email'
import { sanitizeError } from '@/lib/error-utils'

// =============================================
// DATOS DE DEMO - 39 Tratamientos de Dra. Pamela Moquete
// =============================================

const DEMO_CATEGORIES = [
  {
    id: 'cat-facial-001',
    clinic_id: '00000000-0000-0000-0000-000000000001',
    name: 'Tratamientos Faciales',
    slug: 'tratamientos-faciales',
    description: 'Tratamientos estéticos para el rostro',
    icon: 'sparkles',
    color: '#EC4899',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-corporal-001',
    clinic_id: '00000000-0000-0000-0000-000000000001',
    name: 'Tratamientos Corporales',
    slug: 'tratamientos-corporales',
    description: 'Tratamientos estéticos para el cuerpo',
    icon: 'activity',
    color: '#8B5CF6',
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const DEMO_TREATMENTS: TreatmentListItemData[] = [
  // TRATAMIENTOS FACIALES (17)
  { id: 'trat-001', name: 'HIFU Facial', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 15000, duration_minutes: 60, is_active: true, image_url: 'https://images.unsplash.com/photo-1643685276743-1b52832c58d5?w=400&h=300&fit=crop' },
  { id: 'trat-002', name: 'Limpieza Facial Profunda', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 2500, duration_minutes: 60, is_active: true, image_url: 'https://plus.unsplash.com/premium_photo-1661255439358-f919d18088b2?w=400&h=300&fit=crop' },
  { id: 'trat-003', name: 'Microdermoabrasión Facial', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 3500, duration_minutes: 45, is_active: true, image_url: 'https://images.unsplash.com/photo-1611169035510-f9af52e6dbe2?w=400&h=300&fit=crop' },
  { id: 'trat-004', name: 'Transdermoterapia', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 4000, duration_minutes: 45, is_active: true, image_url: 'https://images.unsplash.com/photo-1693004925174-d9e06209d0ee?w=400&h=300&fit=crop' },
  { id: 'trat-005', name: 'Dermapen', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 5000, duration_minutes: 45, is_active: true, image_url: 'https://plus.unsplash.com/premium_photo-1661668899324-3549b48e58a6?w=400&h=300&fit=crop' },
  { id: 'trat-006', name: 'Mesoterapia Facial', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 4500, duration_minutes: 30, is_active: true, image_url: 'https://images.unsplash.com/photo-1654430343142-2d6157e69887?w=400&h=300&fit=crop' },
  { id: 'trat-007', name: 'Peelings Faciales', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 3000, duration_minutes: 45, is_active: true, image_url: 'https://images.unsplash.com/photo-1643684460412-76908d8e5a25?w=400&h=300&fit=crop' },
  { id: 'trat-008', name: 'Tratamiento para Espinillas', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 3500, duration_minutes: 60, is_active: true, image_url: 'https://images.unsplash.com/photo-1693004927824-f2623bbedc8b?w=400&h=300&fit=crop' },
  { id: 'trat-009', name: 'Tratamiento para Manchas', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 4000, duration_minutes: 45, is_active: true, image_url: 'https://plus.unsplash.com/premium_photo-1723708995578-dfdbecf03c33?w=400&h=300&fit=crop' },
  { id: 'trat-010', name: 'Rejuvenecimiento Lifting Facial', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 8000, duration_minutes: 90, is_active: true, image_url: 'https://images.unsplash.com/photo-1616117690865-1aadc7aa6666?w=400&h=300&fit=crop' },
  { id: 'trat-011', name: 'Rellenos Faciales', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 12000, duration_minutes: 45, is_active: true, image_url: 'https://images.unsplash.com/photo-1510511293580-9d525c6d8913?w=400&h=300&fit=crop' },
  { id: 'trat-012', name: 'Toxina Botulínica', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 10000, duration_minutes: 30, is_active: true, image_url: 'https://images.unsplash.com/photo-1635187103184-6601bdd547b5?w=400&h=300&fit=crop' },
  { id: 'trat-013', name: 'Hilos Tensores Facial', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 25000, duration_minutes: 60, is_active: true, image_url: 'https://images.unsplash.com/photo-1637904145523-2b598dab9e62?w=400&h=300&fit=crop' },
  { id: 'trat-014', name: 'Terapia de Inducción de Colágeno', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 5500, duration_minutes: 45, is_active: true, image_url: 'https://images.unsplash.com/photo-1642980596802-08bf6172d993?w=400&h=300&fit=crop' },
  { id: 'trat-015', name: 'Radiofrecuencia Facial', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 4000, duration_minutes: 45, is_active: true, image_url: 'https://plus.unsplash.com/premium_photo-1734468932556-bd0a107c182a?w=400&h=300&fit=crop' },
  { id: 'trat-016', name: 'Aumento de Labios', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 8000, duration_minutes: 30, is_active: true, image_url: 'https://plus.unsplash.com/premium_photo-1661295770914-090b07d3e92d?w=400&h=300&fit=crop' },
  { id: 'trat-017', name: 'Perfilado de Nariz', category_name: 'Tratamientos Faciales', category_color: '#EC4899', price: 10000, duration_minutes: 30, is_active: true, image_url: 'https://images.unsplash.com/photo-1654374504608-67c4cfe65fca?w=400&h=300&fit=crop' },
  // TRATAMIENTOS CORPORALES (22)
  { id: 'trat-018', name: 'Emsculpt', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 8000, duration_minutes: 30, is_active: true, image_url: 'https://plus.unsplash.com/premium_photo-1682097032813-79ba61ff791f?w=400&h=300&fit=crop' },
  { id: 'trat-019', name: 'Tratamiento para Estrías', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 4000, duration_minutes: 45, is_active: true, image_url: 'https://images.unsplash.com/photo-1632057828761-4944fab0600e?w=400&h=300&fit=crop' },
  { id: 'trat-020', name: 'Tratamiento para Celulitis', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 4500, duration_minutes: 60, is_active: true, image_url: 'https://images.unsplash.com/photo-1743404024609-b61890122df7?w=400&h=300&fit=crop' },
  { id: 'trat-021', name: 'Tratamiento para Varices', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 3500, duration_minutes: 30, is_active: true, image_url: 'https://plus.unsplash.com/premium_photo-1661505071420-1f10ce4108e0?w=400&h=300&fit=crop' },
  { id: 'trat-022', name: 'Lipoláser', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 6000, duration_minutes: 45, is_active: true, image_url: 'https://images.unsplash.com/photo-1541752857837-f8a0154fd092?w=400&h=300&fit=crop' },
  { id: 'trat-023', name: 'Tratamiento para Alopecia', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 5000, duration_minutes: 45, is_active: true, image_url: 'https://images.unsplash.com/photo-1670201203116-26644750a726?w=400&h=300&fit=crop' },
  { id: 'trat-024', name: 'Tratamiento para Hiperhidrosis', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 12000, duration_minutes: 30, is_active: true, image_url: 'https://images.unsplash.com/photo-1610103410996-db632ef921aa?w=400&h=300&fit=crop' },
  { id: 'trat-025', name: 'Vacuumterapia', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 2500, duration_minutes: 45, is_active: true, image_url: 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400&h=300&fit=crop' },
  { id: 'trat-026', name: 'Tratamiento Flacidez Corporal', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 4500, duration_minutes: 60, is_active: true, image_url: 'https://images.unsplash.com/photo-1728497872607-fa0b98a3eb79?w=400&h=300&fit=crop' },
  { id: 'trat-027', name: 'Drenaje Linfático', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 2500, duration_minutes: 60, is_active: true, image_url: 'https://plus.unsplash.com/premium_photo-1675502958231-2afa30d16d23?w=400&h=300&fit=crop' },
  { id: 'trat-028', name: 'Peelings Corporales', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 3500, duration_minutes: 60, is_active: true, image_url: 'https://images.unsplash.com/photo-1649751295468-953038600bef?w=400&h=300&fit=crop' },
  { id: 'trat-029', name: 'Eliminación de Cicatrices', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 4500, duration_minutes: 45, is_active: true, image_url: 'https://images.unsplash.com/photo-1665703156181-b92723e119a2?w=400&h=300&fit=crop' },
  { id: 'trat-030', name: 'Ultracavitación Corporal', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 3500, duration_minutes: 45, is_active: true, image_url: 'https://plus.unsplash.com/premium_photo-1661598127858-a74fb8879140?w=400&h=300&fit=crop' },
  { id: 'trat-031', name: 'Blanqueamiento Corporal', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 4000, duration_minutes: 60, is_active: true, image_url: 'https://images.unsplash.com/photo-1620051844584-15ac31d5fccd?w=400&h=300&fit=crop' },
  { id: 'trat-032', name: 'Radiofrecuencia Corporal', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 4000, duration_minutes: 45, is_active: true, image_url: 'https://images.unsplash.com/photo-1677682693087-711e24efaa69?w=400&h=300&fit=crop' },
  { id: 'trat-033', name: 'Eliminación de Queloides', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 5000, duration_minutes: 30, is_active: true, image_url: 'https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=400&h=300&fit=crop' },
  { id: 'trat-034', name: 'Exfoliaciones y Envolturas', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 3500, duration_minutes: 75, is_active: true, image_url: 'https://images.unsplash.com/photo-1542848285-4777eb2a621e?w=400&h=300&fit=crop' },
  { id: 'trat-035', name: 'Microdermoabrasión Corporal', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 4000, duration_minutes: 60, is_active: true, image_url: 'https://images.unsplash.com/photo-1591343395082-e120087004b4?w=400&h=300&fit=crop' },
  { id: 'trat-036', name: 'Tratamientos Reductores de Grasa', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 4500, duration_minutes: 60, is_active: true, image_url: 'https://images.unsplash.com/photo-1611073615452-4889cb93422e?w=400&h=300&fit=crop' },
  { id: 'trat-037', name: 'Masajes Relajantes y Terapéuticos', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 2000, duration_minutes: 60, is_active: true, image_url: 'https://plus.unsplash.com/premium_photo-1661600526264-764fb2c40f56?w=400&h=300&fit=crop' },
  { id: 'trat-038', name: 'Electrocauterización de Verrugas', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 1500, duration_minutes: 30, is_active: true, image_url: 'https://images.unsplash.com/photo-1672454158574-5f978761d872?w=400&h=300&fit=crop' },
  { id: 'trat-039', name: 'Regeneración con Factores de Crecimiento', category_name: 'Tratamientos Corporales', category_color: '#8B5CF6', price: 8000, duration_minutes: 45, is_active: true, image_url: 'https://images.unsplash.com/photo-1650044252595-cacd425982ff?w=400&h=300&fit=crop' },
]

// Tipos
export interface TreatmentCategoryData {
  id: string
  clinic_id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TreatmentData {
  id: string
  clinic_id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  description_internal: string | null
  duration_minutes: number
  buffer_minutes: number
  price: number
  price_from: number | null
  cost: number
  currency: 'DOP' | 'USD'
  recommended_sessions: number
  session_interval_days: number | null
  contraindications: string[] | null
  aftercare_instructions: string | null
  required_consent_id: string | null
  allowed_professional_ids: string[] | null
  required_room_types: string[] | null
  required_equipment_ids: string[] | null
  consumables: { product_id: string; quantity: number }[] | null
  protocol_steps: { order: number; title: string; description: string; duration_minutes?: number }[] | null
  image_url: string | null
  gallery_urls: string[] | null
  is_public: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TreatmentListItemData {
  id: string
  name: string
  category_name: string | null
  category_color: string | null
  price: number
  duration_minutes: number
  is_active: boolean
  image_url: string | null
}

export interface CategoryWithCountData extends TreatmentCategoryData {
  treatment_count: number
}

export interface CreateTreatmentInput {
  category_id?: string
  name: string
  slug?: string
  description?: string
  description_internal?: string
  duration_minutes: number
  buffer_minutes?: number
  price: number
  price_from?: number
  cost?: number
  currency?: 'DOP' | 'USD'
  recommended_sessions?: number
  session_interval_days?: number
  contraindications?: string[]
  aftercare_instructions?: string
  required_consent_id?: string
  allowed_professional_ids?: string[]
  required_room_types?: string[]
  required_equipment_ids?: string[]
  consumables?: { product_id: string; quantity: number }[]
  protocol_steps?: { order: number; title: string; description: string; duration_minutes?: number }[]
  image_url?: string
  gallery_urls?: string[]
  is_public?: boolean
  is_active?: boolean
}

export interface UpdateTreatmentInput extends Partial<CreateTreatmentInput> {}

export interface CreateCategoryInput {
  name: string
  slug?: string
  description?: string
  icon?: string
  color?: string
  sort_order?: number
  is_active?: boolean
}

// =============================================
// CATEGORIAS
// =============================================

// Obtener todas las categorias con conteo de tratamientos
export async function getCategories(): Promise<CategoryWithCountData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: categories, error } = await (supabase as any)
    .from('treatment_categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Error fetching categories:', error)
    // Retornar datos de demo si hay error de BD
    return DEMO_CATEGORIES.map(cat => ({
      ...cat,
      treatment_count: DEMO_TREATMENTS.filter(t => t.category_name === cat.name).length,
    })) as CategoryWithCountData[]
  }

  // Si no hay categorías en la BD, retornar datos de demo
  if (!categories || categories.length === 0) {
    return DEMO_CATEGORIES.map(cat => ({
      ...cat,
      treatment_count: DEMO_TREATMENTS.filter(t => t.category_name === cat.name).length,
    })) as CategoryWithCountData[]
  }

  // Obtener conteo de tratamientos por categoria
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: treatments } = await (supabase as any)
    .from('treatments')
    .select('category_id')
    .eq('is_active', true)
    .limit(500)

  const treatmentCounts: Record<string, number> = {}
  if (treatments) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    treatments.forEach((t: any) => {
      if (t.category_id) {
        treatmentCounts[t.category_id] = (treatmentCounts[t.category_id] || 0) + 1
      }
    })
  }

  return (categories || []).map((cat: TreatmentCategoryData) => ({
    ...cat,
    treatment_count: treatmentCounts[cat.id] || 0,
  }))
}

// Obtener categoria por ID
export async function getCategoryById(id: string): Promise<TreatmentCategoryData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatment_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching category:', error)
    return null
  }

  return data as TreatmentCategoryData
}

// Crear categoria
export async function createCategory(
  input: CreateCategoryInput
): Promise<{ data: TreatmentCategoryData | null; error: string | null }> {
  const supabase = createAdminClient()

  const slug = input.slug || input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const categoryData = {
    ...input,
    slug,
    clinic_id: '00000000-0000-0000-0000-000000000001', // TODO: Obtener del usuario
    color: input.color || '#6366f1',
    sort_order: input.sort_order || 0,
    is_active: input.is_active ?? true,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatment_categories')
    .insert(categoryData)
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    return { data: null, error: 'Error al crear la categoria' }
  }

  revalidatePath('/tratamientos')
  revalidatePath('/tratamientos/categorias')
  return { data: data as TreatmentCategoryData, error: null }
}

// Actualizar categoria
export async function updateCategory(
  id: string,
  input: Partial<CreateCategoryInput>
): Promise<{ data: TreatmentCategoryData | null; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatment_categories')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating category:', error)
    return { data: null, error: 'Error al actualizar la categoria' }
  }

  revalidatePath('/tratamientos')
  revalidatePath('/tratamientos/categorias')
  return { data: data as TreatmentCategoryData, error: null }
}

// Eliminar categoria
export async function deleteCategory(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('treatment_categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    return { success: false, error: 'Error al eliminar la categoria' }
  }

  revalidatePath('/tratamientos')
  revalidatePath('/tratamientos/categorias')
  return { success: true, error: null }
}

// =============================================
// TRATAMIENTOS
// =============================================

// Obtener todos los tratamientos con categoria
export async function getTreatments(options?: {
  categoryId?: string
  isActive?: boolean
  isPublic?: boolean
}): Promise<TreatmentListItemData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('treatments')
    .select(`
      id,
      name,
      price,
      duration_minutes,
      is_active,
      image_url,
      treatment_categories (
        name,
        color
      )
    `)
    .order('name', { ascending: true })
    .limit(500)

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId)
  }
  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive)
  }
  if (options?.isPublic !== undefined) {
    query = query.eq('is_public', options.isPublic)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching treatments:', error)
    // Retornar datos de demo si hay error de BD
    return DEMO_TREATMENTS
  }

  // Si no hay tratamientos en la BD, retornar datos de demo
  if (!data || data.length === 0) {
    return DEMO_TREATMENTS
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    category_name: t.treatment_categories?.name || null,
    category_color: t.treatment_categories?.color || null,
    price: t.price,
    duration_minutes: t.duration_minutes,
    is_active: t.is_active,
    image_url: t.image_url,
  }))
}

// Obtener tratamiento por ID
export async function getTreatmentById(id: string): Promise<TreatmentData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching treatment:', error)
    return null
  }

  return data as TreatmentData
}

// Obtener tratamiento con categoria expandida
export async function getTreatmentWithCategory(id: string): Promise<(TreatmentData & { category: TreatmentCategoryData | null }) | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatments')
    .select(`
      *,
      treatment_categories (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching treatment with category:', error)
    return null
  }

  return {
    ...data,
    category: data.treatment_categories || null,
  }
}

// Crear tratamiento
export async function createTreatment(
  input: CreateTreatmentInput
): Promise<{ data: TreatmentData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Build insert object with only valid DB columns
  const treatmentData = {
    clinic_id: '00000000-0000-0000-0000-000000000001', // TODO: Obtener del usuario
    name: input.name,
    category_id: input.category_id || null,
    description: input.description || null,
    duration_minutes: input.duration_minutes,
    price: input.price,
    cost: input.cost || 0,
    is_active: input.is_active ?? true,
    contraindications: input.contraindications || [],
    image_url: input.image_url || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatments')
    .insert(treatmentData)
    .select()
    .single()

  if (error) {
    return { data: null, error: sanitizeError(error, 'Error al crear el tratamiento') }
  }

  revalidatePath('/tratamientos')
  return { data: data as TreatmentData, error: null }
}

// Actualizar tratamiento
export async function updateTreatment(
  id: string,
  input: UpdateTreatmentInput
): Promise<{ data: TreatmentData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Build update object with only valid DB columns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  // Map input fields to actual DB columns
  if (input.name !== undefined) updateData.name = input.name
  if (input.category_id !== undefined) updateData.category_id = input.category_id
  if (input.description !== undefined) updateData.description = input.description
  if (input.duration_minutes !== undefined) updateData.duration_minutes = input.duration_minutes
  if (input.price !== undefined) updateData.price = input.price
  if (input.cost !== undefined) updateData.cost = input.cost
  if (input.is_active !== undefined) updateData.is_active = input.is_active
  if (input.contraindications !== undefined) updateData.contraindications = input.contraindications
  if (input.image_url !== undefined) updateData.image_url = input.image_url

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: sanitizeError(error, 'Error al actualizar el tratamiento') }
  }

  revalidatePath('/tratamientos')
  revalidatePath(`/tratamientos/${id}`)
  return { data: data as TreatmentData, error: null }
}

// Eliminar tratamiento (soft delete - desactivar)
export async function deleteTreatment(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('treatments')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error deleting treatment:', error)
    return { success: false, error: 'Error al eliminar el tratamiento' }
  }

  revalidatePath('/tratamientos')
  return { success: true, error: null }
}

// Buscar tratamientos
export async function searchTreatments(query: string): Promise<TreatmentListItemData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatments')
    .select(`
      id,
      name,
      price,
      duration_minutes,
      is_active,
      image_url,
      treatment_categories (
        name,
        color
      )
    `)
    .ilike('name', `%${query}%`)
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(20)

  if (error) {
    console.error('Error searching treatments:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    category_name: t.treatment_categories?.name || null,
    category_color: t.treatment_categories?.color || null,
    price: t.price,
    duration_minutes: t.duration_minutes,
    is_active: t.is_active,
    image_url: t.image_url,
  }))
}

// Obtener estadisticas de tratamientos
export async function getTreatmentStats(): Promise<{
  total: number
  active: number
  inactive: number
  byCategory: { name: string; count: number; color: string }[]
}> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: treatments, error } = await (supabase as any)
    .from('treatments')
    .select(`
      is_active,
      treatment_categories (
        name,
        color
      )
    `)
    .limit(500)

  if (error) {
    console.error('Error fetching treatment stats:', error)
    return { total: 0, active: 0, inactive: 0, byCategory: [] }
  }

  const total = treatments?.length || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const active = treatments?.filter((t: any) => t.is_active).length || 0
  const inactive = total - active

  // Contar por categoria
  const categoryMap: Record<string, { count: number; color: string }> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  treatments?.forEach((t: any) => {
    const catName = t.treatment_categories?.name || 'Sin categoria'
    const catColor = t.treatment_categories?.color || '#6b7280'
    if (!categoryMap[catName]) {
      categoryMap[catName] = { count: 0, color: catColor }
    }
    categoryMap[catName].count++
  })

  const byCategory = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    count: data.count,
    color: data.color,
  }))

  return { total, active, inactive, byCategory }
}

// =============================================
// PAQUETES
// =============================================

export interface PackageItemData {
  treatmentId: string
  treatmentName: string
  quantity: number
  price: number
}

export interface PackageData {
  id: string
  name: string
  description: string | null
  type: 'bundle' | 'sessions_pack'
  items: PackageItemData[]
  regularPrice: number
  salePrice: number
  validityDays: number
  salesCount: number
  isActive: boolean
}

export interface TreatmentForPackage {
  id: string
  name: string
  price: number
  durationMinutes: number
  categoryName: string | null
}

export interface CreatePackageInput {
  name: string
  description?: string
  type: 'bundle' | 'sessions_pack'
  items: { treatmentId: string; quantity: number }[]
  regularPrice: number
  salePrice: number
  validityDays?: number
  isActive?: boolean
}

// Obtener tratamientos para selector de paquetes
export async function getTreatmentsForPackages(): Promise<TreatmentForPackage[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatments')
    .select(`
      id,
      name,
      price,
      duration_minutes,
      treatment_categories (
        name
      )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(500)

  if (error) {
    console.error('Error fetching treatments for packages:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    price: t.price || 0,
    durationMinutes: t.duration_minutes || 0,
    categoryName: t.treatment_categories?.name || null,
  }))
}

// Obtener todos los paquetes
export async function getPackages(): Promise<PackageData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: packages, error } = await (supabase as any)
    .from('packages')
    .select('*')
    .order('name', { ascending: true })
    .limit(200)

  if (error) {
    console.error('Error fetching packages:', error)
    return []
  }

  // Obtener tratamientos para mapear nombres y precios
  const treatments = await getTreatmentsForPackages()
  const treatmentMap = new Map(treatments.map(t => [t.id, t]))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (packages || []).map((p: any) => {
    // La BD puede tener 'treatments' o 'items' dependiendo de como se creo
    const rawItems = p.items || p.treatments || []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: PackageItemData[] = rawItems.map((item: any) => {
      const treatmentId = item.treatmentId || item.treatment_id
      const treatment = treatmentMap.get(treatmentId)
      return {
        treatmentId,
        treatmentName: item.treatmentName || item.treatment_name || treatment?.name || 'Tratamiento',
        quantity: item.quantity || 1,
        price: item.price ?? treatment?.price ?? 0,
      }
    })

    // Calcular precio regular desde los items si no existe
    const calculatedRegularPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    // La BD puede tener 'sale_price', 'price', o 'regular_price'
    const salePrice = p.sale_price ?? p.price ?? 0
    const regularPrice = p.regular_price ?? calculatedRegularPrice ?? salePrice

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      type: p.type || 'sessions_pack',
      items,
      regularPrice,
      salePrice,
      validityDays: p.validity_days || 90,
      salesCount: p.sales_count || 0,
      isActive: p.is_active ?? true,
    }
  })
}

// Obtener paquete por ID
export async function getPackageById(id: string): Promise<PackageData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('packages')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching package:', error)
    return null
  }

  const treatments = await getTreatmentsForPackages()
  const treatmentMap = new Map(treatments.map(t => [t.id, t]))

  // La BD puede tener 'treatments' o 'items'
  const rawItems = data.items || data.treatments || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: PackageItemData[] = rawItems.map((item: any) => {
    const treatmentId = item.treatmentId || item.treatment_id
    const treatment = treatmentMap.get(treatmentId)
    return {
      treatmentId,
      treatmentName: item.treatmentName || item.treatment_name || treatment?.name || 'Tratamiento',
      quantity: item.quantity || 1,
      price: item.price ?? treatment?.price ?? 0,
    }
  })

  // Calcular precio regular desde los items si no existe
  const calculatedRegularPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const salePrice = data.sale_price ?? data.price ?? 0
  const regularPrice = data.regular_price ?? calculatedRegularPrice ?? salePrice

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    type: data.type || 'sessions_pack',
    items,
    regularPrice,
    salePrice,
    validityDays: data.validity_days || 90,
    salesCount: data.sales_count || 0,
    isActive: data.is_active ?? true,
  }
}

// Crear paquete
export async function createPackage(
  input: CreatePackageInput
): Promise<{ data: PackageData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Obtener tratamientos para construir items con nombres y precios
  const treatments = await getTreatmentsForPackages()
  const treatmentMap = new Map(treatments.map(t => [t.id, t]))

  const items = input.items.map(item => {
    const treatment = treatmentMap.get(item.treatmentId)
    return {
      treatmentId: item.treatmentId,
      treatment_id: item.treatmentId, // Formato alternativo para compatibilidad
      treatmentName: treatment?.name || 'Tratamiento',
      quantity: item.quantity,
      price: treatment?.price || 0,
    }
  })

  const totalSessions = items.reduce((sum, item) => sum + item.quantity, 0)

  // Usar el esquema actual de la BD (treatments, price) con fallback al esperado
  const packageData = {
    clinic_id: '00000000-0000-0000-0000-000000000001', // TODO: Obtener del usuario
    name: input.name,
    description: input.description || null,
    // Guardar en ambos formatos para compatibilidad
    treatments: items.map(i => ({ treatment_id: i.treatmentId, quantity: i.quantity })),
    total_sessions: totalSessions,
    price: input.salePrice,
    validity_days: input.validityDays || 90,
    is_active: input.isActive ?? true,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('packages')
    .insert(packageData)
    .select()
    .single()

  if (error) {
    return { data: null, error: sanitizeError(error, 'Error al crear el paquete') }
  }

  revalidatePath('/tratamientos/paquetes')
  revalidatePath('/pos')

  // Calcular regularPrice desde los items
  const regularPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return {
    data: {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type || 'sessions_pack',
      items,
      regularPrice: input.regularPrice || regularPrice,
      salePrice: data.price || input.salePrice,
      validityDays: data.validity_days || 90,
      salesCount: data.sales_count || 0,
      isActive: data.is_active ?? true,
    },
    error: null,
  }
}

// Actualizar paquete
export async function updatePackage(
  id: string,
  input: Partial<CreatePackageInput>
): Promise<{ data: PackageData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Si hay items, reconstruirlos con nombres y precios
  let items: PackageItemData[] | undefined
  let totalSessions: number | undefined

  if (input.items) {
    const treatments = await getTreatmentsForPackages()
    const treatmentMap = new Map(treatments.map(t => [t.id, t]))

    items = input.items.map(item => {
      const treatment = treatmentMap.get(item.treatmentId)
      return {
        treatmentId: item.treatmentId,
        treatment_id: item.treatmentId,
        treatmentName: treatment?.name || 'Tratamiento',
        quantity: item.quantity,
        price: treatment?.price || 0,
      }
    })

    totalSessions = items.reduce((sum, item) => sum + item.quantity, 0)
  }

  const updateData: Record<string, unknown> = {}

  if (input.name !== undefined) updateData.name = input.name
  if (input.description !== undefined) updateData.description = input.description
  // Usar el esquema actual de la BD
  if (items !== undefined) {
    updateData.treatments = items.map(i => ({ treatment_id: i.treatmentId, quantity: i.quantity }))
    updateData.total_sessions = totalSessions
  }
  if (input.salePrice !== undefined) updateData.price = input.salePrice
  if (input.validityDays !== undefined) updateData.validity_days = input.validityDays
  if (input.isActive !== undefined) updateData.is_active = input.isActive

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('packages')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: sanitizeError(error, 'Error al actualizar el paquete') }
  }

  revalidatePath('/tratamientos/paquetes')
  revalidatePath('/pos')

  // Obtener tratamientos para reconstruir items
  const treatments = await getTreatmentsForPackages()
  const treatmentMap = new Map(treatments.map(t => [t.id, t]))

  // Reconstruir items del resultado
  const rawItems = data.items || data.treatments || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalItems: PackageItemData[] = rawItems.map((item: any) => {
    const treatmentId = item.treatmentId || item.treatment_id
    const treatment = treatmentMap.get(treatmentId)
    return {
      treatmentId,
      treatmentName: item.treatmentName || treatment?.name || 'Tratamiento',
      quantity: item.quantity || 1,
      price: item.price ?? treatment?.price ?? 0,
    }
  })

  // Calcular regularPrice
  const calculatedRegularPrice = finalItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const salePrice = data.sale_price ?? data.price ?? 0

  return {
    data: {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type || 'sessions_pack',
      items: finalItems,
      regularPrice: input.regularPrice || calculatedRegularPrice,
      salePrice,
      validityDays: data.validity_days || 90,
      salesCount: data.sales_count || 0,
      isActive: data.is_active ?? true,
    },
    error: null,
  }
}

// Eliminar paquete (soft delete)
export async function deletePackage(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('packages')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error deleting package:', error)
    return { success: false, error: 'Error al eliminar el paquete' }
  }

  revalidatePath('/tratamientos/paquetes')
  revalidatePath('/pos')
  return { success: true, error: null }
}

// Enviar paquete por email
export async function sendPackageEmail(data: {
  packageId: string
  recipientEmail: string
  recipientName: string
}): Promise<{ success: boolean; error: string | null }> {
  // Obtener el paquete
  const pkg = await getPackageById(data.packageId)

  if (!pkg) {
    return { success: false, error: 'Paquete no encontrado' }
  }

  // Generar el HTML del email
  const html = generatePackageEmailHTML({
    packageName: pkg.name,
    packageType: pkg.type,
    description: pkg.description || undefined,
    clientName: data.recipientName,
    items: pkg.items.map((item) => ({
      treatmentName: item.treatmentName,
      quantity: item.quantity,
      price: item.price,
    })),
    regularPrice: pkg.regularPrice,
    salePrice: pkg.salePrice,
    validityDays: pkg.validityDays,
    currency: 'DOP',
  })

  // Enviar el email
  const result = await sendEmail({
    to: data.recipientEmail,
    subject: `Paquete: ${pkg.name} - Med Luxe Aesthetics`,
    html,
  })

  if (!result.success) {
    return { success: false, error: result.error || 'Error al enviar el email' }
  }

  return { success: true, error: null }
}
