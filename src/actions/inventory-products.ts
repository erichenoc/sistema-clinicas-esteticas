'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeError } from '@/lib/error-utils'

// Tipos
export type ProductType = 'consumable' | 'retail' | 'equipment' | 'injectable' | 'topical'
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'over_stock' | 'not_tracked'

export interface ProductCategoryData {
  id: string
  clinic_id: string
  name: string
  description: string | null
  color: string
  icon: string | null
  type: string
  parent_id: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProductData {
  id: string
  clinic_id: string
  category_id: string | null
  sku: string | null
  barcode: string | null
  name: string
  description: string | null
  type: ProductType
  unit: string
  unit_label: string | null
  cost_price: number | null
  sell_price: number | null
  tax_rate: number
  track_stock: boolean
  min_stock: number
  max_stock: number | null
  reorder_point: number | null
  reorder_quantity: number | null
  requires_lot_tracking: boolean
  requires_refrigeration: boolean
  shelf_life_days: number | null
  image_url: string | null
  thumbnail_url: string | null
  is_active: boolean
  is_sellable: boolean
  default_supplier_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ProductListItemData extends ProductData {
  category_name: string | null
  category_color: string | null
  current_stock: number
  reserved_stock: number
  available_stock: number
  stock_status: StockStatus
  nearest_expiry: string | null
}

export interface InventoryStats {
  total_products: number
  low_stock_count: number
  out_of_stock_count: number
  expiring_soon_count: number
  total_value: number
}

export interface CreateProductInput {
  category_id?: string
  sku?: string
  barcode?: string
  name: string
  description?: string
  type?: ProductType
  unit?: string
  unit_label?: string
  cost_price?: number
  sell_price?: number
  tax_rate?: number
  track_stock?: boolean
  min_stock?: number
  max_stock?: number
  reorder_point?: number
  reorder_quantity?: number
  requires_lot_tracking?: boolean
  requires_refrigeration?: boolean
  shelf_life_days?: number
  image_url?: string
  is_active?: boolean
  is_sellable?: boolean
  default_supplier_id?: string
  notes?: string
}

// =============================================
// CATEGORIAS DE PRODUCTOS
// =============================================

// Categorias por defecto para inicializar
const DEFAULT_PRODUCT_CATEGORIES = [
  { name: 'Productos para Venta', description: 'Productos que se venden directamente a pacientes (filtros solares, cremas, etc.)', color: '#22c55e', type: 'retail', sort_order: 1 },
  { name: 'Uso Interno / Consumibles', description: 'Productos de uso interno en tratamientos (jeringas, gasas, etc.)', color: '#3b82f6', type: 'consumable', sort_order: 2 },
  { name: 'Inyectables', description: 'Toxinas, acido hialuronico y otros inyectables', color: '#a855f7', type: 'consumable', sort_order: 3 },
  { name: 'Equipos', description: 'Equipos y maquinaria para tratamientos', color: '#f59e0b', type: 'equipment', sort_order: 4 },
  { name: 'Desechables', description: 'Materiales desechables de un solo uso', color: '#6b7280', type: 'disposable', sort_order: 5 },
]

export async function getProductCategories(): Promise<ProductCategoryData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('product_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Error fetching product categories:', error)
    return []
  }

  return (data || []) as ProductCategoryData[]
}

export async function createProductCategory(
  input: {
    name: string
    description?: string
    color?: string
    type?: string
    parent_id?: string
  }
): Promise<{ data: ProductCategoryData | null; error: string | null }> {
  const supabase = createAdminClient()

  const categoryData = {
    clinic_id: '00000000-0000-0000-0000-000000000001',
    name: input.name,
    description: input.description || null,
    color: input.color || '#6366f1',
    type: input.type || 'consumable',
    parent_id: input.parent_id || null,
    is_active: true,
    sort_order: 0,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('product_categories')
    .insert(categoryData)
    .select()
    .single()

  if (error) {
    return { data: null, error: sanitizeError(error, 'Error al crear la categoria') }
  }

  revalidatePath('/inventario')
  return { data: data as ProductCategoryData, error: null }
}

export async function initializeDefaultCategories(): Promise<{ created: number; error: string | null }> {
  const supabase = createAdminClient()
  let created = 0

  // Check existing categories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('product_categories')
    .select('name')
    .limit(100)

  const existingNames = new Set((existing || []).map((c: { name: string }) => c.name))

  for (const cat of DEFAULT_PRODUCT_CATEGORIES) {
    if (!existingNames.has(cat.name)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('product_categories')
        .insert({
          clinic_id: '00000000-0000-0000-0000-000000000001',
          ...cat,
          is_active: true,
        })

      if (!error) {
        created++
      } else {
        console.error(`Error creating category ${cat.name}:`, error)
      }
    }
  }

  if (created > 0) {
    revalidatePath('/inventario')
  }

  return { created, error: null }
}

// =============================================
// PRODUCTOS
// =============================================

export async function getProducts(options?: {
  categoryId?: string
  type?: ProductType
  isActive?: boolean
  stockStatus?: StockStatus
}): Promise<ProductListItemData[]> {
  const supabase = createAdminClient()

  // Production schema: id, clinic_id, code, name, description, category, unit,
  // cost, price, min_stock, is_consumable, is_for_sale, is_active, image_url
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('products')
    .select('*')
    .order('name', { ascending: true })
    .limit(500)

  if (options?.categoryId) {
    query = query.eq('category', options.categoryId)
  }
  if (options?.type) {
    // Map type to is_consumable boolean
    if (options.type === 'consumable' || options.type === 'injectable') {
      query = query.eq('is_consumable', true)
    } else if (options.type === 'retail') {
      query = query.eq('is_consumable', false)
    }
  }
  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((p: any) => {
    // Production doesn't have inventory/stock tracking tables yet
    // So we use 0 for stock values
    const currentStock = 0
    const stockStatus: StockStatus = 'not_tracked'

    // Map production columns to expected interface
    // Production: code, cost, price, is_consumable, is_for_sale
    // Interface expects: sku, cost_price, sell_price, type, is_sellable
    return {
      id: p.id,
      clinic_id: p.clinic_id,
      category_id: p.category || null,
      sku: p.code || null, // production uses 'code'
      barcode: null,
      name: p.name,
      description: p.description,
      type: p.is_consumable ? 'consumable' : 'retail', // derive type from is_consumable
      unit: p.unit || 'unit',
      unit_label: null,
      cost_price: p.cost || 0, // production uses 'cost'
      sell_price: p.price || 0, // production uses 'price'
      tax_rate: 16,
      track_stock: false, // production doesn't have track_stock
      min_stock: p.min_stock || 0,
      max_stock: null,
      reorder_point: null,
      reorder_quantity: null,
      requires_lot_tracking: false,
      requires_refrigeration: false,
      shelf_life_days: null,
      image_url: p.image_url || null,
      thumbnail_url: null,
      is_active: p.is_active,
      is_sellable: p.is_for_sale, // production uses 'is_for_sale'
      default_supplier_id: null,
      notes: null,
      created_at: p.created_at,
      updated_at: p.updated_at,
      category_name: p.category || null,
      category_color: null,
      current_stock: currentStock,
      reserved_stock: 0,
      available_stock: currentStock,
      stock_status: stockStatus,
      nearest_expiry: null,
    }
  }) as ProductListItemData[]
}

export async function getProductById(id: string): Promise<ProductListItemData | null> {
  const supabase = createAdminClient()

  // Production schema: id, clinic_id, code, name, description, category, unit,
  // cost, price, min_stock, is_consumable, is_for_sale, is_active, image_url
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  const p = data
  // Map production columns to expected interface
  return {
    id: p.id,
    clinic_id: p.clinic_id,
    category_id: p.category || null,
    sku: p.code || null,
    barcode: null,
    name: p.name,
    description: p.description,
    type: p.is_consumable ? 'consumable' : 'retail',
    unit: p.unit || 'unit',
    unit_label: null,
    cost_price: p.cost || 0,
    sell_price: p.price || 0,
    tax_rate: 16,
    track_stock: false,
    min_stock: p.min_stock || 0,
    max_stock: null,
    reorder_point: null,
    reorder_quantity: null,
    requires_lot_tracking: false,
    requires_refrigeration: false,
    shelf_life_days: null,
    image_url: p.image_url || null,
    thumbnail_url: null,
    is_active: p.is_active,
    is_sellable: p.is_for_sale,
    default_supplier_id: null,
    notes: null,
    created_at: p.created_at,
    updated_at: p.updated_at,
    category_name: p.category || null,
    category_color: null,
    current_stock: 0,
    reserved_stock: 0,
    available_stock: 0,
    stock_status: 'not_tracked' as StockStatus,
    nearest_expiry: null,
  }
}

export async function createProduct(
  input: CreateProductInput
): Promise<{ data: ProductData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Map input fields to actual PRODUCTION database columns
  // Production schema: id, clinic_id, code, name, description, category, unit,
  // cost, price, min_stock, is_consumable, is_for_sale, is_active, image_url
  const productData = {
    clinic_id: '00000000-0000-0000-0000-000000000001',
    name: input.name,
    code: input.sku || null, // production uses 'code' not 'sku'
    description: input.description || null,
    category: input.category_id || null, // production uses 'category' not 'category_id'
    unit: input.unit || 'unit',
    cost: input.cost_price || 0, // production uses 'cost' not 'cost_price'
    price: input.sell_price || 0, // production uses 'price' not 'sell_price'
    min_stock: input.min_stock || 0,
    is_consumable: input.type === 'consumable' || input.type === 'injectable', // production uses 'is_consumable' not 'type'
    is_for_sale: input.is_sellable ?? (input.type === 'retail'), // production uses 'is_for_sale' not 'is_sellable'
    is_active: input.is_active ?? true,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('products')
    .insert(productData)
    .select()
    .single()

  if (error) {
    return { data: null, error: sanitizeError(error, 'Error al crear el producto') }
  }

  revalidatePath('/inventario')
  return { data: data as ProductData, error: null }
}

export async function updateProduct(
  id: string,
  input: Partial<CreateProductInput>
): Promise<{ data: ProductData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Map input fields to actual PRODUCTION database columns
  // Production schema: code, name, description, category, unit, cost, price,
  // min_stock, is_consumable, is_for_sale, is_active
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.name !== undefined) updateData.name = input.name
  if (input.sku !== undefined) updateData.code = input.sku // production uses 'code'
  if (input.description !== undefined) updateData.description = input.description
  if (input.category_id !== undefined) updateData.category = input.category_id // production uses 'category'
  if (input.type !== undefined) {
    updateData.is_consumable = input.type === 'consumable' || input.type === 'injectable'
  }
  if (input.unit !== undefined) updateData.unit = input.unit
  if (input.cost_price !== undefined) updateData.cost = input.cost_price // production uses 'cost'
  if (input.sell_price !== undefined) updateData.price = input.sell_price // production uses 'price'
  if (input.min_stock !== undefined) updateData.min_stock = input.min_stock
  if (input.is_active !== undefined) updateData.is_active = input.is_active
  if (input.is_sellable !== undefined) updateData.is_for_sale = input.is_sellable // production uses 'is_for_sale'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: sanitizeError(error, 'Error al actualizar el producto') }
  }

  revalidatePath('/inventario')
  return { data: data as ProductData, error: null }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // Soft delete - desactivar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('products')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    return { success: false, error: 'Error al eliminar el producto' }
  }

  revalidatePath('/inventario')
  return { success: true, error: null }
}

// =============================================
// ESTADISTICAS
// =============================================

export async function getInventoryStats(): Promise<InventoryStats> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products } = await (supabase as any)
    .from('products')
    .select(`
      id,
      min_stock,
      track_stock,
      is_active,
      inventory (
        quantity,
        total_value
      )
    `)
    .eq('is_active', true)
    .limit(500)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: expiringLots } = await (supabase as any)
    .from('product_lots')
    .select('id')
    .gt('current_quantity', 0)
    .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .gt('expiry_date', new Date().toISOString().split('T')[0])
    .limit(100)

  let totalProducts = 0
  let lowStockCount = 0
  let outOfStockCount = 0
  let totalValue = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products?.forEach((p: any) => {
    totalProducts++
    const stock = p.inventory?.[0]?.quantity || 0
    const value = p.inventory?.[0]?.total_value || 0

    totalValue += value

    if (p.track_stock) {
      if (stock <= 0) {
        outOfStockCount++
      } else if (stock <= p.min_stock) {
        lowStockCount++
      }
    }
  })

  return {
    total_products: totalProducts,
    low_stock_count: lowStockCount,
    out_of_stock_count: outOfStockCount,
    expiring_soon_count: expiringLots?.length || 0,
    total_value: totalValue,
  }
}

// =============================================
// BUSQUEDA DE PRODUCTOS
// =============================================

export async function searchProducts(query: string): Promise<ProductListItemData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('products')
    .select(`
      *,
      product_categories (
        name,
        color
      ),
      inventory (
        quantity,
        reserved_quantity,
        available_quantity
      )
    `)
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`)
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(20)

  if (error) {
    console.error('Error searching products:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((p: any) => {
    const inv = p.inventory?.[0] || {}
    const currentStock = inv.quantity || 0
    const reservedStock = inv.reserved_quantity || 0

    let stockStatus: StockStatus = 'in_stock'
    if (!p.track_stock) {
      stockStatus = 'not_tracked'
    } else if (currentStock <= 0) {
      stockStatus = 'out_of_stock'
    } else if (currentStock <= p.min_stock) {
      stockStatus = 'low_stock'
    }

    return {
      ...p,
      category_name: p.product_categories?.name || null,
      category_color: p.product_categories?.color || null,
      current_stock: currentStock,
      reserved_stock: reservedStock,
      available_stock: inv.available_quantity || currentStock - reservedStock,
      stock_status: stockStatus,
      nearest_expiry: null,
    }
  }) as ProductListItemData[]
}
