'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipos
export type LotStatus = 'active' | 'low' | 'expired' | 'depleted' | 'quarantine'

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
