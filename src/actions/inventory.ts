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

export async function getProductCategories(): Promise<ProductCategoryData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('product_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching product categories:', error)
    return []
  }

  return (data || []) as ProductCategoryData[]
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

  const productData = {
    ...input,
    clinic_id: '00000000-0000-0000-0000-000000000001', // TODO: Obtener del usuario
    type: input.type || 'consumable',
    unit: input.unit || 'units',
    tax_rate: input.tax_rate || 16,
    track_stock: input.track_stock ?? true,
    min_stock: input.min_stock || 0,
    is_active: input.is_active ?? true,
    is_sellable: input.is_sellable ?? true,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('products')
    .insert(productData)
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return { data: null, error: 'Error al crear el producto' }
  }

  revalidatePath('/inventario')
  return { data: data as ProductData, error: null }
}

export async function updateProduct(
  id: string,
  input: Partial<CreateProductInput>
): Promise<{ data: ProductData | null; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('products')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return { data: null, error: 'Error al actualizar el producto' }
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
