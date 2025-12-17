'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipos
export type ProductType = 'consumable' | 'retail' | 'equipment' | 'injectable' | 'topical'
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'over_stock' | 'not_tracked'
export type LotStatus = 'active' | 'low' | 'expired' | 'depleted' | 'quarantine'

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

export interface ProductLotData {
  id: string
  clinic_id: string
  branch_id: string | null
  product_id: string
  lot_number: string
  batch_number: string | null
  manufacture_date: string | null
  expiry_date: string | null
  received_date: string
  initial_quantity: number
  current_quantity: number
  unit_cost: number | null
  supplier_id: string | null
  status: LotStatus
  notes: string | null
  created_at: string
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

// Categorías por defecto para inicializar
const DEFAULT_PRODUCT_CATEGORIES = [
  { name: 'Productos para Venta', description: 'Productos que se venden directamente a pacientes (filtros solares, cremas, etc.)', color: '#22c55e', type: 'retail', sort_order: 1 },
  { name: 'Uso Interno / Consumibles', description: 'Productos de uso interno en tratamientos (jeringas, gasas, etc.)', color: '#3b82f6', type: 'consumable', sort_order: 2 },
  { name: 'Inyectables', description: 'Toxinas, ácido hialurónico y otros inyectables', color: '#a855f7', type: 'consumable', sort_order: 3 },
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
    console.error('Error creating product category:', error)
    return { data: null, error: `Error al crear la categoría: ${error.message}` }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
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
      ),
      product_lots (
        expiry_date,
        status,
        current_quantity
      )
    `)
    .order('name', { ascending: true })

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId)
  }
  if (options?.type) {
    query = query.eq('type', options.type)
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
    const inv = p.inventory?.[0] || {}
    const currentStock = inv.quantity || 0
    const reservedStock = inv.reserved_quantity || 0
    const availableStock = inv.available_quantity || currentStock - reservedStock

    let stockStatus: StockStatus = 'in_stock'
    if (!p.track_stock) {
      stockStatus = 'not_tracked'
    } else if (currentStock <= 0) {
      stockStatus = 'out_of_stock'
    } else if (currentStock <= p.min_stock) {
      stockStatus = 'low_stock'
    } else if (p.max_stock && currentStock >= p.max_stock) {
      stockStatus = 'over_stock'
    }

    // Encontrar el vencimiento mas cercano de lotes activos
    const activeLots = p.product_lots?.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (lot: any) => lot.status === 'active' && lot.current_quantity > 0 && lot.expiry_date
    ) || []
    const nearestExpiry = activeLots.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? activeLots.reduce((min: any, lot: any) => {
          if (!min || new Date(lot.expiry_date) < new Date(min)) {
            return lot.expiry_date
          }
          return min
        }, null)
      : null

    // Filtrar por stock status si se especifica
    if (options?.stockStatus && stockStatus !== options.stockStatus) {
      return null
    }

    return {
      ...p,
      category_name: p.product_categories?.name || null,
      category_color: p.product_categories?.color || null,
      current_stock: currentStock,
      reserved_stock: reservedStock,
      available_stock: availableStock,
      stock_status: stockStatus,
      nearest_expiry: nearestExpiry,
    }
  }).filter(Boolean) as ProductListItemData[]
}

export async function getProductById(id: string): Promise<ProductListItemData | null> {
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
        available_quantity,
        average_cost,
        total_value,
        location
      ),
      product_lots (
        *
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  const p = data
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
}

export async function createProduct(
  input: CreateProductInput
): Promise<{ data: ProductData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Map input fields to actual database columns (matching migration schema)
  const productData = {
    clinic_id: '00000000-0000-0000-0000-000000000001',
    name: input.name,
    sku: input.sku || null,
    barcode: input.barcode || null,
    description: input.description || null,
    category_id: input.category_id || null,
    type: input.type || 'consumable',
    unit: input.unit || 'units',
    unit_label: input.unit_label || null,
    cost_price: input.cost_price || 0,
    sell_price: input.sell_price || 0,
    tax_rate: input.tax_rate ?? 16,
    track_stock: input.track_stock ?? true,
    min_stock: input.min_stock || 0,
    max_stock: input.max_stock || null,
    reorder_point: input.reorder_point || null,
    reorder_quantity: input.reorder_quantity || null,
    requires_lot_tracking: input.requires_lot_tracking ?? false,
    requires_refrigeration: input.requires_refrigeration ?? false,
    shelf_life_days: input.shelf_life_days || null,
    image_url: input.image_url || null,
    is_active: input.is_active ?? true,
    is_sellable: input.is_sellable ?? true,
    default_supplier_id: input.default_supplier_id || null,
    notes: input.notes || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('products')
    .insert(productData)
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return { data: null, error: `Error al crear el producto: ${error.message}` }
  }

  revalidatePath('/inventario')
  return { data: data as ProductData, error: null }
}

export async function updateProduct(
  id: string,
  input: Partial<CreateProductInput>
): Promise<{ data: ProductData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Map input fields to actual database columns (matching migration schema)
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.name !== undefined) updateData.name = input.name
  if (input.sku !== undefined) updateData.sku = input.sku
  if (input.barcode !== undefined) updateData.barcode = input.barcode
  if (input.description !== undefined) updateData.description = input.description
  if (input.category_id !== undefined) updateData.category_id = input.category_id
  if (input.type !== undefined) updateData.type = input.type
  if (input.unit !== undefined) updateData.unit = input.unit
  if (input.unit_label !== undefined) updateData.unit_label = input.unit_label
  if (input.cost_price !== undefined) updateData.cost_price = input.cost_price
  if (input.sell_price !== undefined) updateData.sell_price = input.sell_price
  if (input.tax_rate !== undefined) updateData.tax_rate = input.tax_rate
  if (input.track_stock !== undefined) updateData.track_stock = input.track_stock
  if (input.min_stock !== undefined) updateData.min_stock = input.min_stock
  if (input.max_stock !== undefined) updateData.max_stock = input.max_stock
  if (input.reorder_point !== undefined) updateData.reorder_point = input.reorder_point
  if (input.reorder_quantity !== undefined) updateData.reorder_quantity = input.reorder_quantity
  if (input.requires_lot_tracking !== undefined) updateData.requires_lot_tracking = input.requires_lot_tracking
  if (input.requires_refrigeration !== undefined) updateData.requires_refrigeration = input.requires_refrigeration
  if (input.shelf_life_days !== undefined) updateData.shelf_life_days = input.shelf_life_days
  if (input.image_url !== undefined) updateData.image_url = input.image_url
  if (input.is_active !== undefined) updateData.is_active = input.is_active
  if (input.is_sellable !== undefined) updateData.is_sellable = input.is_sellable
  if (input.default_supplier_id !== undefined) updateData.default_supplier_id = input.default_supplier_id
  if (input.notes !== undefined) updateData.notes = input.notes

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return { data: null, error: `Error al actualizar el producto: ${error.message}` }
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
// LOTES
// =============================================

export async function getProductLots(options?: {
  productId?: string
  status?: LotStatus
  expiringWithinDays?: number
}): Promise<ProductLotData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('product_lots')
    .select(`
      *,
      products (name, sku)
    `)
    .order('expiry_date', { ascending: true })

  if (options?.productId) {
    query = query.eq('product_id', options.productId)
  }
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.expiringWithinDays) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + options.expiringWithinDays)
    query = query.lte('expiry_date', futureDate.toISOString().split('T')[0])
    query = query.gt('current_quantity', 0)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching product lots:', error)
    return []
  }

  return (data || []) as ProductLotData[]
}

export async function createProductLot(
  input: {
    product_id: string
    lot_number: string
    batch_number?: string
    manufacture_date?: string
    expiry_date?: string
    initial_quantity: number
    unit_cost?: number
    supplier_id?: string
    notes?: string
  }
): Promise<{ data: ProductLotData | null; error: string | null }> {
  const supabase = createAdminClient()

  const lotData = {
    ...input,
    clinic_id: '00000000-0000-0000-0000-000000000001', // TODO: Obtener del usuario
    current_quantity: input.initial_quantity,
    received_date: new Date().toISOString().split('T')[0],
    status: 'active',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('product_lots')
    .insert(lotData)
    .select()
    .single()

  if (error) {
    console.error('Error creating product lot:', error)
    return { data: null, error: 'Error al crear el lote' }
  }

  // Actualizar stock del producto
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('inventory')
    .upsert({
      clinic_id: lotData.clinic_id,
      product_id: input.product_id,
      quantity: input.initial_quantity,
    }, {
      onConflict: 'branch_id,product_id',
    })

  revalidatePath('/inventario')
  revalidatePath('/inventario/lotes')
  return { data: data as ProductLotData, error: null }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: expiringLots } = await (supabase as any)
    .from('product_lots')
    .select('id')
    .gt('current_quantity', 0)
    .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .gt('expiry_date', new Date().toISOString().split('T')[0])

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
// LOTES PARA VISTA DE LISTA
// =============================================

export interface LotListItemData {
  id: string
  lotNumber: string
  productId: string
  productName: string
  productBrand: string | null
  quantity: number
  usedQuantity: number
  costPerUnit: number
  expirationDate: string | null
  receivedDate: string
  supplier: string | null
  status: string
}

export async function getLotsForList(): Promise<LotListItemData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('product_lots')
    .select(`
      *,
      products (
        name,
        description
      ),
      suppliers (
        name
      )
    `)
    .order('expiry_date', { ascending: true })

  if (error) {
    console.error('Error fetching lots for list:', error)
    return []
  }

  const today = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(today.getDate() + 30)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((lot: any) => {
    let status = lot.status || 'active'

    // Calcular status basado en fecha de vencimiento y cantidad
    if (lot.current_quantity <= 0) {
      status = 'depleted'
    } else if (lot.expiry_date) {
      const expiryDate = new Date(lot.expiry_date)
      if (expiryDate < today) {
        status = 'expired'
      } else if (expiryDate <= thirtyDaysFromNow) {
        status = 'expiring_soon'
      }
    }

    return {
      id: lot.id,
      lotNumber: lot.lot_number,
      productId: lot.product_id,
      productName: lot.products?.name || 'Producto',
      productBrand: lot.products?.description || null,
      quantity: lot.initial_quantity || 0,
      usedQuantity: (lot.initial_quantity || 0) - (lot.current_quantity || 0),
      costPerUnit: lot.unit_cost || 0,
      expirationDate: lot.expiry_date,
      receivedDate: lot.received_date,
      supplier: lot.suppliers?.name || null,
      status,
    }
  })
}

export interface LotStats {
  activeLotes: number
  expiringLotes: number
  totalValue: number
}

export async function getLotStats(): Promise<LotStats> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lots, error } = await (supabase as any)
    .from('product_lots')
    .select('current_quantity, unit_cost, expiry_date, status')

  if (error) {
    console.error('Error fetching lot stats:', error)
    return { activeLotes: 0, expiringLotes: 0, totalValue: 0 }
  }

  const today = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(today.getDate() + 30)

  let activeLotes = 0
  let expiringLotes = 0
  let totalValue = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lots?.forEach((lot: any) => {
    const remaining = lot.current_quantity || 0
    const cost = lot.unit_cost || 0

    if (remaining > 0) {
      totalValue += remaining * cost

      if (lot.expiry_date) {
        const expiryDate = new Date(lot.expiry_date)
        if (expiryDate > today) {
          activeLotes++
          if (expiryDate <= thirtyDaysFromNow) {
            expiringLotes++
          }
        }
      } else {
        activeLotes++
      }
    }
  })

  return { activeLotes, expiringLotes, totalValue }
}

export interface ProductForLot {
  id: string
  name: string
  brand: string | null
}

export async function getProductsForLots(): Promise<ProductForLot[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('products')
    .select('id, name, description')
    .eq('is_active', true)
    .eq('requires_lot_tracking', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching products for lots:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    brand: p.description,
  }))
}

export interface SupplierForLot {
  id: string
  name: string
}

export async function getSuppliersForLots(): Promise<SupplierForLot[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('suppliers')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching suppliers:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
  }))
}

export async function deleteLot(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('product_lots')
    .update({
      status: 'depleted',
      current_quantity: 0,
    })
    .eq('id', id)

  if (error) {
    console.error('Error deleting lot:', error)
    return { success: false, error: 'Error al eliminar el lote' }
  }

  revalidatePath('/inventario/lotes')
  return { success: true, error: null }
}

// Buscar productos
// =============================================
// PROVEEDORES (SUPPLIERS)
// =============================================

export interface SupplierData {
  id: string
  clinic_id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  category: string | null
  tax_id: string | null
  payment_terms: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierStats {
  total: number
  active: number
  totalOrders: number
  totalSpent: number
}

export async function getSuppliers(options?: {
  isActive?: boolean
  search?: string
}): Promise<SupplierData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true })

  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive)
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,contact_name.ilike.%${options.search}%,email.ilike.%${options.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching suppliers:', error)
    return []
  }

  return (data || []) as SupplierData[]
}

export async function getSupplierById(id: string): Promise<SupplierData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching supplier:', error)
    return null
  }

  return data as SupplierData
}

export async function createSupplier(
  input: {
    name: string
    contact_name?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    category?: string
    tax_id?: string
    payment_terms?: string
    notes?: string
    is_active?: boolean
  }
): Promise<{ data: SupplierData | null; error: string | null }> {
  const supabase = createAdminClient()

  const supplierData = {
    clinic_id: '00000000-0000-0000-0000-000000000001',
    name: input.name,
    contact_name: input.contact_name || null,
    email: input.email || null,
    phone: input.phone || null,
    address: input.address || null,
    city: input.city || null,
    category: input.category || null,
    tax_id: input.tax_id || null,
    payment_terms: input.payment_terms || null,
    notes: input.notes || null,
    is_active: input.is_active ?? true,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('suppliers')
    .insert(supplierData)
    .select()
    .single()

  if (error) {
    console.error('Error creating supplier:', error)
    return { data: null, error: 'Error al crear el proveedor' }
  }

  revalidatePath('/inventario/proveedores')
  return { data: data as SupplierData, error: null }
}

export async function updateSupplier(
  id: string,
  input: Partial<{
    name: string
    contact_name: string
    email: string
    phone: string
    address: string
    city: string
    category: string
    tax_id: string
    payment_terms: string
    notes: string
    is_active: boolean
  }>
): Promise<{ data: SupplierData | null; error: string | null }> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.name !== undefined) updateData.name = input.name
  if (input.contact_name !== undefined) updateData.contact_name = input.contact_name
  if (input.email !== undefined) updateData.email = input.email
  if (input.phone !== undefined) updateData.phone = input.phone
  if (input.address !== undefined) updateData.address = input.address
  if (input.city !== undefined) updateData.city = input.city
  if (input.category !== undefined) updateData.category = input.category
  if (input.tax_id !== undefined) updateData.tax_id = input.tax_id
  if (input.payment_terms !== undefined) updateData.payment_terms = input.payment_terms
  if (input.notes !== undefined) updateData.notes = input.notes
  if (input.is_active !== undefined) updateData.is_active = input.is_active

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('suppliers')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating supplier:', error)
    return { data: null, error: 'Error al actualizar el proveedor' }
  }

  revalidatePath('/inventario/proveedores')
  return { data: data as SupplierData, error: null }
}

export async function deleteSupplier(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // Soft delete - desactivar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('suppliers')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error deleting supplier:', error)
    return { success: false, error: 'Error al desactivar el proveedor' }
  }

  revalidatePath('/inventario/proveedores')
  return { success: true, error: null }
}

export async function getSupplierStats(): Promise<SupplierStats> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: suppliers } = await (supabase as any)
    .from('suppliers')
    .select('id, is_active')

  const total = suppliers?.length || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const active = suppliers?.filter((s: any) => s.is_active).length || 0

  // TODO: Get real order stats when purchase_orders table is implemented
  return {
    total,
    active,
    totalOrders: 0,
    totalSpent: 0,
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

// =============================================
// ORDENES DE COMPRA (PURCHASE ORDERS)
// =============================================

export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled'
export type PaymentStatus = 'pending' | 'partial' | 'paid'

export interface PurchaseOrderData {
  id: string
  clinic_id: string
  branch_id: string | null
  supplier_id: string
  order_number: string
  status: PurchaseOrderStatus
  order_date: string
  expected_date: string | null
  received_date: string | null
  subtotal: number
  tax_amount: number
  shipping_cost: number
  discount_amount: number
  total: number
  payment_status: PaymentStatus
  paid_amount: number
  notes: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  // Joined data
  supplier_name?: string
  items_count?: number
}

export interface PurchaseOrderItemData {
  id: string
  purchase_order_id: string
  product_id: string
  quantity_ordered: number
  quantity_received: number
  unit_cost: number
  discount_percent: number
  tax_rate: number
  subtotal: number
  tax_amount: number
  total: number
  lot_number: string | null
  expiry_date: string | null
  notes: string | null
  // Joined data
  product_name?: string
  product_sku?: string
}

export interface PurchaseOrderStats {
  pending: number
  inTransit: number
  received: number
  totalValue: number
}

export async function getPurchaseOrders(options?: {
  status?: PurchaseOrderStatus
  supplierId?: string
  search?: string
}): Promise<PurchaseOrderData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('purchase_orders')
    .select(`
      *,
      suppliers (name),
      purchase_order_items (id)
    `)
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.supplierId) {
    query = query.eq('supplier_id', options.supplierId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching purchase orders:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((po: any) => ({
    ...po,
    supplier_name: po.suppliers?.name || 'Sin proveedor',
    items_count: po.purchase_order_items?.length || 0,
  })) as PurchaseOrderData[]
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrderData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('purchase_orders')
    .select(`
      *,
      suppliers (name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching purchase order:', error)
    return null
  }

  return {
    ...data,
    supplier_name: data.suppliers?.name || 'Sin proveedor',
  } as PurchaseOrderData
}

export async function getPurchaseOrderItems(orderId: string): Promise<PurchaseOrderItemData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('purchase_order_items')
    .select(`
      *,
      products (name, sku)
    `)
    .eq('purchase_order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching purchase order items:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    ...item,
    product_name: item.products?.name || 'Producto',
    product_sku: item.products?.sku || '',
  })) as PurchaseOrderItemData[]
}

async function generateOrderNumber(): Promise<string> {
  const supabase = createAdminClient()
  const year = new Date().getFullYear()
  const prefix = `OC-${year}-`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('purchase_orders')
    .select('order_number')
    .like('order_number', `${prefix}%`)
    .order('order_number', { ascending: false })
    .limit(1)

  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].order_number.replace(prefix, '')) || 0
    return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`
  }

  return `${prefix}0001`
}

export async function createPurchaseOrder(
  input: {
    supplier_id: string
    expected_date?: string
    notes?: string
    items: Array<{
      product_id: string
      quantity_ordered: number
      unit_cost: number
      discount_percent?: number
      tax_rate?: number
    }>
  }
): Promise<{ data: PurchaseOrderData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Calcular totales
  let subtotal = 0
  let taxAmount = 0

  const processedItems = input.items.map(item => {
    const itemSubtotal = item.quantity_ordered * item.unit_cost * (1 - (item.discount_percent || 0) / 100)
    const itemTax = itemSubtotal * ((item.tax_rate || 16) / 100)
    subtotal += itemSubtotal
    taxAmount += itemTax
    return {
      ...item,
      discount_percent: item.discount_percent || 0,
      tax_rate: item.tax_rate || 16,
      subtotal: itemSubtotal,
      tax_amount: itemTax,
      total: itemSubtotal + itemTax,
    }
  })

  const orderNumber = await generateOrderNumber()

  const orderData = {
    clinic_id: '00000000-0000-0000-0000-000000000001',
    supplier_id: input.supplier_id,
    order_number: orderNumber,
    status: 'pending' as PurchaseOrderStatus,
    order_date: new Date().toISOString().split('T')[0],
    expected_date: input.expected_date || null,
    subtotal,
    tax_amount: taxAmount,
    shipping_cost: 0,
    discount_amount: 0,
    total: subtotal + taxAmount,
    payment_status: 'pending' as PaymentStatus,
    paid_amount: 0,
    notes: input.notes || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderError } = await (supabase as any)
    .from('purchase_orders')
    .insert(orderData)
    .select()
    .single()

  if (orderError) {
    console.error('Error creating purchase order:', orderError)
    return { data: null, error: 'Error al crear la orden de compra' }
  }

  // Insertar items
  const itemsData = processedItems.map(item => ({
    purchase_order_id: order.id,
    product_id: item.product_id,
    quantity_ordered: item.quantity_ordered,
    quantity_received: 0,
    unit_cost: item.unit_cost,
    discount_percent: item.discount_percent,
    tax_rate: item.tax_rate,
    subtotal: item.subtotal,
    tax_amount: item.tax_amount,
    total: item.total,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase as any)
    .from('purchase_order_items')
    .insert(itemsData)

  if (itemsError) {
    console.error('Error creating purchase order items:', itemsError)
    // Delete the order if items fail
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('purchase_orders').delete().eq('id', order.id)
    return { data: null, error: 'Error al crear los items de la orden' }
  }

  revalidatePath('/inventario/ordenes-compra')
  return { data: order as PurchaseOrderData, error: null }
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'received') {
    updateData.received_date = new Date().toISOString().split('T')[0]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('purchase_orders')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating purchase order status:', error)
    return { success: false, error: 'Error al actualizar el estado' }
  }

  revalidatePath('/inventario/ordenes-compra')
  return { success: true, error: null }
}

export async function deletePurchaseOrder(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // Solo se pueden eliminar ordenes en draft o cancelled
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (supabase as any)
    .from('purchase_orders')
    .select('status')
    .eq('id', id)
    .single()

  if (order && !['draft', 'cancelled'].includes(order.status)) {
    return { success: false, error: 'Solo se pueden eliminar ordenes en borrador o canceladas' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('purchase_orders')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting purchase order:', error)
    return { success: false, error: 'Error al eliminar la orden' }
  }

  revalidatePath('/inventario/ordenes-compra')
  return { success: true, error: null }
}

export async function getPurchaseOrderStats(): Promise<PurchaseOrderStats> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders } = await (supabase as any)
    .from('purchase_orders')
    .select('status, total')

  const stats = {
    pending: 0,
    inTransit: 0,
    received: 0,
    totalValue: 0,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orders?.forEach((o: any) => {
    if (o.status === 'pending' || o.status === 'approved') {
      stats.pending++
    } else if (o.status === 'ordered' || o.status === 'partial') {
      stats.inTransit++
    } else if (o.status === 'received') {
      stats.received++
    }

    if (o.status !== 'cancelled') {
      stats.totalValue += o.total || 0
    }
  })

  return stats
}

// =============================================
// CONTEO DE INVENTARIO (INVENTORY COUNTS)
// =============================================

export type InventoryCountType = 'full' | 'partial' | 'cycle' | 'spot'
export type InventoryCountStatus = 'in_progress' | 'completed' | 'approved' | 'cancelled'

export interface InventoryCountData {
  id: string
  clinic_id: string
  branch_id: string | null
  count_number: string
  count_type: InventoryCountType
  description: string | null
  status: InventoryCountStatus
  started_at: string
  completed_at: string | null
  approved_at: string | null
  total_items: number
  items_counted: number
  items_with_difference: number
  total_difference_value: number
  created_by: string | null
  approved_by: string | null
  created_at: string
}

export interface InventoryCountItemData {
  id: string
  count_id: string
  product_id: string
  lot_id: string | null
  system_quantity: number
  counted_quantity: number | null
  difference: number | null
  unit_cost: number | null
  difference_value: number | null
  status: 'pending' | 'counted' | 'verified'
  notes: string | null
  counted_at: string | null
  counted_by: string | null
  // Joined
  product_name?: string
  product_sku?: string
}

export interface InventoryCountStats {
  inProgress: number
  completed: number
  totalDifference: number
  lastCountDate: string | null
}

export async function getInventoryCounts(options?: {
  status?: InventoryCountStatus
}): Promise<InventoryCountData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('inventory_counts')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching inventory counts:', error)
    return []
  }

  return (data || []) as InventoryCountData[]
}

export async function getInventoryCountById(id: string): Promise<InventoryCountData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('inventory_counts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching inventory count:', error)
    return null
  }

  return data as InventoryCountData
}

export async function getInventoryCountItems(countId: string): Promise<InventoryCountItemData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('inventory_count_items')
    .select(`
      *,
      products (name, sku)
    `)
    .eq('count_id', countId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching inventory count items:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    ...item,
    product_name: item.products?.name || 'Producto',
    product_sku: item.products?.sku || '',
  })) as InventoryCountItemData[]
}

async function generateCountNumber(): Promise<string> {
  const supabase = createAdminClient()
  const year = new Date().getFullYear()
  const prefix = `CNT-${year}-`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('inventory_counts')
    .select('count_number')
    .like('count_number', `${prefix}%`)
    .order('count_number', { ascending: false })
    .limit(1)

  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].count_number.replace(prefix, '')) || 0
    return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`
  }

  return `${prefix}0001`
}

export async function createInventoryCount(
  input: {
    count_type: InventoryCountType
    description?: string
    product_ids?: string[] // Si es partial/spot, especificar productos
  }
): Promise<{ data: InventoryCountData | null; error: string | null }> {
  const supabase = createAdminClient()

  const countNumber = await generateCountNumber()

  const countData = {
    clinic_id: '00000000-0000-0000-0000-000000000001',
    count_number: countNumber,
    count_type: input.count_type,
    description: input.description || null,
    status: 'in_progress' as InventoryCountStatus,
    started_at: new Date().toISOString(),
    total_items: 0,
    items_counted: 0,
    items_with_difference: 0,
    total_difference_value: 0,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: count, error: countError } = await (supabase as any)
    .from('inventory_counts')
    .insert(countData)
    .select()
    .single()

  if (countError) {
    console.error('Error creating inventory count:', countError)
    return { data: null, error: 'Error al crear el conteo' }
  }

  // Obtener productos para el conteo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let productsQuery = (supabase as any)
    .from('products')
    .select(`
      id,
      cost_price,
      inventory (quantity)
    `)
    .eq('is_active', true)
    .eq('track_stock', true)

  if (input.product_ids && input.product_ids.length > 0) {
    productsQuery = productsQuery.in('id', input.product_ids)
  }

  const { data: products } = await productsQuery

  if (products && products.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemsData = products.map((p: any) => ({
      count_id: count.id,
      product_id: p.id,
      system_quantity: p.inventory?.[0]?.quantity || 0,
      unit_cost: p.cost_price || 0,
      status: 'pending',
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('inventory_count_items')
      .insert(itemsData)

    // Actualizar total de items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('inventory_counts')
      .update({ total_items: products.length })
      .eq('id', count.id)
  }

  revalidatePath('/inventario/conteo')
  return { data: count as InventoryCountData, error: null }
}

export async function updateInventoryCountItem(
  itemId: string,
  countedQuantity: number,
  notes?: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: item } = await (supabase as any)
    .from('inventory_count_items')
    .select('system_quantity, unit_cost')
    .eq('id', itemId)
    .single()

  if (!item) {
    return { success: false, error: 'Item no encontrado' }
  }

  const difference = countedQuantity - (item.system_quantity || 0)
  const differenceValue = difference * (item.unit_cost || 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('inventory_count_items')
    .update({
      counted_quantity: countedQuantity,
      difference_value: differenceValue,
      status: 'counted',
      notes: notes || null,
      counted_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (error) {
    console.error('Error updating inventory count item:', error)
    return { success: false, error: 'Error al actualizar el conteo' }
  }

  revalidatePath('/inventario/conteo')
  return { success: true, error: null }
}

export async function completeInventoryCount(
  countId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // Obtener resumen de items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from('inventory_count_items')
    .select('counted_quantity, difference, difference_value, status')
    .eq('count_id', countId)

  const itemsCounted = items?.filter((i: { status: string }) => i.status === 'counted').length || 0
  const itemsWithDiff = items?.filter((i: { difference: number | null }) => i.difference !== null && i.difference !== 0).length || 0
  const totalDiffValue = items?.reduce((sum: number, i: { difference_value: number | null }) => sum + (i.difference_value || 0), 0) || 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('inventory_counts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      items_counted: itemsCounted,
      items_with_difference: itemsWithDiff,
      total_difference_value: totalDiffValue,
    })
    .eq('id', countId)

  if (error) {
    console.error('Error completing inventory count:', error)
    return { success: false, error: 'Error al completar el conteo' }
  }

  revalidatePath('/inventario/conteo')
  return { success: true, error: null }
}

export async function deleteInventoryCount(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // Solo se pueden eliminar conteos en progreso
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: count } = await (supabase as any)
    .from('inventory_counts')
    .select('status')
    .eq('id', id)
    .single()

  if (count && count.status !== 'in_progress') {
    return { success: false, error: 'Solo se pueden eliminar conteos en progreso' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('inventory_counts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting inventory count:', error)
    return { success: false, error: 'Error al eliminar el conteo' }
  }

  revalidatePath('/inventario/conteo')
  return { success: true, error: null }
}

export async function getInventoryCountStats(): Promise<InventoryCountStats> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: counts } = await (supabase as any)
    .from('inventory_counts')
    .select('status, total_difference_value, completed_at')
    .order('completed_at', { ascending: false })

  const stats: InventoryCountStats = {
    inProgress: 0,
    completed: 0,
    totalDifference: 0,
    lastCountDate: null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  counts?.forEach((c: any) => {
    if (c.status === 'in_progress') {
      stats.inProgress++
    } else if (c.status === 'completed' || c.status === 'approved') {
      stats.completed++
      stats.totalDifference += c.total_difference_value || 0
      if (!stats.lastCountDate && c.completed_at) {
        stats.lastCountDate = c.completed_at
      }
    }
  })

  return stats
}

// =============================================
// TRANSFERENCIAS DE INVENTARIO
// =============================================

export type TransferStatus = 'pending' | 'in_transit' | 'received' | 'cancelled'

export interface InventoryTransferData {
  id: string
  clinic_id: string
  from_branch_id: string
  to_branch_id: string
  transfer_number: string
  status: TransferStatus
  requested_at: string
  shipped_at: string | null
  received_at: string | null
  notes: string | null
  requested_by: string | null
  shipped_by: string | null
  received_by: string | null
  created_at: string
  // Joined
  from_branch_name?: string
  to_branch_name?: string
  items_count?: number
}

export interface TransferItemData {
  id: string
  transfer_id: string
  product_id: string
  lot_id: string | null
  quantity_requested: number
  quantity_shipped: number | null
  quantity_received: number | null
  notes: string | null
  // Joined
  product_name?: string
  product_sku?: string
}

export interface TransferStats {
  pending: number
  inTransit: number
  completed: number
  thisMonth: number
}

export async function getInventoryTransfers(options?: {
  status?: TransferStatus
}): Promise<InventoryTransferData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('inventory_transfers')
    .select(`
      *,
      from_branch:branches!inventory_transfers_from_branch_id_fkey (name),
      to_branch:branches!inventory_transfers_to_branch_id_fkey (name),
      inventory_transfer_items (id)
    `)
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching inventory transfers:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((t: any) => ({
    ...t,
    from_branch_name: t.from_branch?.name || 'Origen',
    to_branch_name: t.to_branch?.name || 'Destino',
    items_count: t.inventory_transfer_items?.length || 0,
  })) as InventoryTransferData[]
}

export async function getInventoryTransferById(id: string): Promise<InventoryTransferData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('inventory_transfers')
    .select(`
      *,
      from_branch:branches!inventory_transfers_from_branch_id_fkey (name),
      to_branch:branches!inventory_transfers_to_branch_id_fkey (name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching inventory transfer:', error)
    return null
  }

  return {
    ...data,
    from_branch_name: data.from_branch?.name || 'Origen',
    to_branch_name: data.to_branch?.name || 'Destino',
  } as InventoryTransferData
}

export async function getTransferItems(transferId: string): Promise<TransferItemData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('inventory_transfer_items')
    .select(`
      *,
      products (name, sku)
    `)
    .eq('transfer_id', transferId)

  if (error) {
    console.error('Error fetching transfer items:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    ...item,
    product_name: item.products?.name || 'Producto',
    product_sku: item.products?.sku || '',
  })) as TransferItemData[]
}

async function generateTransferNumber(): Promise<string> {
  const supabase = createAdminClient()
  const year = new Date().getFullYear()
  const prefix = `TRF-${year}-`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('inventory_transfers')
    .select('transfer_number')
    .like('transfer_number', `${prefix}%`)
    .order('transfer_number', { ascending: false })
    .limit(1)

  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].transfer_number.replace(prefix, '')) || 0
    return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`
  }

  return `${prefix}0001`
}

export async function createInventoryTransfer(
  input: {
    from_branch_id: string
    to_branch_id: string
    notes?: string
    items: Array<{
      product_id: string
      quantity_requested: number
      lot_id?: string
    }>
  }
): Promise<{ data: InventoryTransferData | null; error: string | null }> {
  const supabase = createAdminClient()

  if (input.from_branch_id === input.to_branch_id) {
    return { data: null, error: 'El origen y destino no pueden ser iguales' }
  }

  const transferNumber = await generateTransferNumber()

  const transferData = {
    clinic_id: '00000000-0000-0000-0000-000000000001',
    from_branch_id: input.from_branch_id,
    to_branch_id: input.to_branch_id,
    transfer_number: transferNumber,
    status: 'pending' as TransferStatus,
    requested_at: new Date().toISOString(),
    notes: input.notes || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: transfer, error: transferError } = await (supabase as any)
    .from('inventory_transfers')
    .insert(transferData)
    .select()
    .single()

  if (transferError) {
    console.error('Error creating inventory transfer:', transferError)
    return { data: null, error: 'Error al crear la transferencia' }
  }

  // Insertar items
  const itemsData = input.items.map(item => ({
    transfer_id: transfer.id,
    product_id: item.product_id,
    quantity_requested: item.quantity_requested,
    lot_id: item.lot_id || null,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase as any)
    .from('inventory_transfer_items')
    .insert(itemsData)

  if (itemsError) {
    console.error('Error creating transfer items:', itemsError)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('inventory_transfers').delete().eq('id', transfer.id)
    return { data: null, error: 'Error al crear los items de la transferencia' }
  }

  revalidatePath('/inventario/transferencias')
  return { data: transfer as InventoryTransferData, error: null }
}

export async function updateTransferStatus(
  id: string,
  status: TransferStatus
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = { status }

  if (status === 'in_transit') {
    updateData.shipped_at = new Date().toISOString()
  } else if (status === 'received') {
    updateData.received_at = new Date().toISOString()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('inventory_transfers')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating transfer status:', error)
    return { success: false, error: 'Error al actualizar el estado' }
  }

  revalidatePath('/inventario/transferencias')
  return { success: true, error: null }
}

export async function deleteInventoryTransfer(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // Solo se pueden eliminar transferencias pendientes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: transfer } = await (supabase as any)
    .from('inventory_transfers')
    .select('status')
    .eq('id', id)
    .single()

  if (transfer && transfer.status !== 'pending') {
    return { success: false, error: 'Solo se pueden eliminar transferencias pendientes' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('inventory_transfers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting inventory transfer:', error)
    return { success: false, error: 'Error al eliminar la transferencia' }
  }

  revalidatePath('/inventario/transferencias')
  return { success: true, error: null }
}

export async function getTransferStats(): Promise<TransferStats> {
  const supabase = createAdminClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: transfers } = await (supabase as any)
    .from('inventory_transfers')
    .select('status, created_at')

  const stats: TransferStats = {
    pending: 0,
    inTransit: 0,
    completed: 0,
    thisMonth: 0,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transfers?.forEach((t: any) => {
    if (t.status === 'pending') {
      stats.pending++
    } else if (t.status === 'in_transit') {
      stats.inTransit++
    } else if (t.status === 'received') {
      stats.completed++
    }

    if (new Date(t.created_at) >= startOfMonth) {
      stats.thisMonth++
    }
  })

  return stats
}

// =============================================
// SUCURSALES (Para transferencias)
// =============================================

export interface BranchData {
  id: string
  name: string
}

export async function getBranches(): Promise<BranchData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('branches')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching branches:', error)
    return []
  }

  return (data || []) as BranchData[]
}
