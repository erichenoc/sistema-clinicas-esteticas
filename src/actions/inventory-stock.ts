'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    .limit(500)

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
    .limit(500)

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
    .limit(500)

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
    .limit(500)

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
    .limit(200)

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
    .limit(500)

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
    .limit(100)

  if (error) {
    console.error('Error fetching branches:', error)
    return []
  }

  return (data || []) as BranchData[]
}
