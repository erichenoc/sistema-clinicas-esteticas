'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
