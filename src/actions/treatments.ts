'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  // Obtener conteo de tratamientos por categoria
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: treatments } = await (supabase as any)
    .from('treatments')
    .select('category_id')
    .eq('is_active', true)

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

  const slug = input.slug || input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const treatmentData = {
    ...input,
    slug,
    clinic_id: '00000000-0000-0000-0000-000000000001', // TODO: Obtener del usuario
    buffer_minutes: input.buffer_minutes || 0,
    cost: input.cost || 0,
    recommended_sessions: input.recommended_sessions || 1,
    is_public: input.is_public ?? true,
    is_active: input.is_active ?? true,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatments')
    .insert(treatmentData)
    .select()
    .single()

  if (error) {
    console.error('Error creating treatment:', error)
    return { data: null, error: 'Error al crear el tratamiento' }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatments')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating treatment:', error)
    return { data: null, error: 'Error al actualizar el tratamiento' }
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
    .from('treatment_packages')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching packages:', error)
    return []
  }

  // Obtener tratamientos para mapear nombres
  const treatments = await getTreatmentsForPackages()
  const treatmentMap = new Map(treatments.map(t => [t.id, t]))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (packages || []).map((p: any) => {
    // items puede ser JSONB o array, asegurar que sea array
    const rawItems = p.items || []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: PackageItemData[] = rawItems.map((item: any) => {
      const treatment = treatmentMap.get(item.treatmentId || item.treatment_id)
      return {
        treatmentId: item.treatmentId || item.treatment_id,
        treatmentName: item.treatmentName || item.treatment_name || treatment?.name || 'Tratamiento',
        quantity: item.quantity || 1,
        price: item.price || treatment?.price || 0,
      }
    })

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      type: p.type || 'sessions_pack',
      items,
      regularPrice: p.original_price || p.regular_price || 0,
      salePrice: p.price || p.sale_price || 0,
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
    .from('treatment_packages')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching package:', error)
    return null
  }

  const treatments = await getTreatmentsForPackages()
  const treatmentMap = new Map(treatments.map(t => [t.id, t]))

  const rawItems = data.items || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: PackageItemData[] = rawItems.map((item: any) => {
    const treatment = treatmentMap.get(item.treatmentId || item.treatment_id)
    return {
      treatmentId: item.treatmentId || item.treatment_id,
      treatmentName: item.treatmentName || item.treatment_name || treatment?.name || 'Tratamiento',
      quantity: item.quantity || 1,
      price: item.price || treatment?.price || 0,
    }
  })

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    type: data.type || 'sessions_pack',
    items,
    regularPrice: data.original_price || data.regular_price || 0,
    salePrice: data.price || data.sale_price || 0,
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
      treatmentName: treatment?.name || 'Tratamiento',
      quantity: item.quantity,
      price: treatment?.price || 0,
    }
  })

  const totalSessions = items.reduce((sum, item) => sum + item.quantity, 0)

  const packageData = {
    clinic_id: '00000000-0000-0000-0000-000000000001', // TODO: Obtener del usuario
    name: input.name,
    description: input.description || null,
    type: input.type,
    items,
    price: input.salePrice,
    original_price: input.regularPrice,
    validity_days: input.validityDays || 90,
    total_sessions: totalSessions,
    is_active: input.isActive ?? true,
    sales_count: 0,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatment_packages')
    .insert(packageData)
    .select()
    .single()

  if (error) {
    console.error('Error creating package:', error)
    return { data: null, error: 'Error al crear el paquete' }
  }

  revalidatePath('/tratamientos/paquetes')
  revalidatePath('/pos')

  return {
    data: {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      items,
      regularPrice: data.original_price,
      salePrice: data.price,
      validityDays: data.validity_days,
      salesCount: data.sales_count || 0,
      isActive: data.is_active,
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
        treatmentName: treatment?.name || 'Tratamiento',
        quantity: item.quantity,
        price: treatment?.price || 0,
      }
    })

    totalSessions = items.reduce((sum, item) => sum + item.quantity, 0)
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.name !== undefined) updateData.name = input.name
  if (input.description !== undefined) updateData.description = input.description
  if (input.type !== undefined) updateData.type = input.type
  if (items !== undefined) updateData.items = items
  if (input.regularPrice !== undefined) updateData.original_price = input.regularPrice
  if (input.salePrice !== undefined) updateData.price = input.salePrice
  if (input.validityDays !== undefined) updateData.validity_days = input.validityDays
  if (totalSessions !== undefined) updateData.total_sessions = totalSessions
  if (input.isActive !== undefined) updateData.is_active = input.isActive

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatment_packages')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating package:', error)
    return { data: null, error: 'Error al actualizar el paquete' }
  }

  revalidatePath('/tratamientos/paquetes')
  revalidatePath('/pos')

  // Reconstruir items del resultado si no los tenemos
  const finalItems = items || (data.items || []).map((item: PackageItemData) => ({
    treatmentId: item.treatmentId,
    treatmentName: item.treatmentName,
    quantity: item.quantity,
    price: item.price,
  }))

  return {
    data: {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      items: finalItems,
      regularPrice: data.original_price,
      salePrice: data.price,
      validityDays: data.validity_days,
      salesCount: data.sales_count || 0,
      isActive: data.is_active,
    },
    error: null,
  }
}

// Eliminar paquete (soft delete)
export async function deletePackage(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('treatment_packages')
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
