'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createExpense } from '@/actions/expenses'

// =============================================
// MOVIMIENTOS DE STOCK
// =============================================
// Toda entrada o salida de existencias pasa por aqui. El calculo real lo hace
// la funcion `apply_inventory_movement` en Postgres, que bloquea la fila del
// inventario para que dos operaciones simultaneas no descuadren el stock.
// =============================================

export type MovementType =
  | 'initial'
  | 'purchase'
  | 'sale'
  | 'consumption'
  | 'adjustment'
  | 'loss'
  | 'return'
  | 'transfer_in'
  | 'transfer_out'

// Las etiquetas legibles viven en MOVEMENT_TYPE_OPTIONS (@/types/inventory):
// este archivo es 'use server' y solo puede exportar funciones async.

export interface StockMovementData {
  id: string
  product_id: string
  product_name: string
  movement_type: MovementType
  quantity: number
  unit_cost: number | null
  balance_after: number | null
  reference_type: string | null
  reference_id: string | null
  notes: string | null
  created_by_name: string | null
  created_at: string
}

export interface StockLevel {
  product_id: string
  quantity: number
  average_cost: number | null
}

// Sucursal principal: el sistema opera hoy con una sola
export async function getMainBranchId(): Promise<string | null> {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('branches')
    .select('id')
    .order('is_main', { ascending: false })
    .limit(1)
    .single()

  return data?.id ?? null
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

interface ApplyMovementInput {
  productId: string
  /** Con signo: positivo entra, negativo sale */
  quantity: number
  movementType: MovementType
  referenceType?: string | null
  referenceId?: string | null
  unitCost?: number | null
  notes?: string | null
  /** Permitir dejar el stock en negativo (ventas de productos sin control estricto) */
  allowNegative?: boolean
  branchId?: string | null
}

// Aplica un movimiento. Devuelve el nuevo saldo del producto.
export async function applyStockMovement(
  input: ApplyMovementInput
): Promise<{ balance: number | null; error: string | null }> {
  const supabase = createAdminClient()

  const branchId = input.branchId || (await getMainBranchId())
  if (!branchId) {
    return { balance: null, error: 'No hay una sucursal configurada para el inventario' }
  }

  const userId = await getCurrentUserId()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('apply_inventory_movement', {
    p_branch_id: branchId,
    p_product_id: input.productId,
    p_quantity: input.quantity,
    p_movement_type: input.movementType,
    p_reference_type: input.referenceType ?? null,
    p_reference_id: input.referenceId ?? null,
    p_unit_cost: input.unitCost ?? null,
    p_notes: input.notes ?? null,
    p_created_by: userId,
    p_allow_negative: input.allowNegative ?? false,
  })

  if (error) {
    console.error('Error applying stock movement:', error)
    // El mensaje de stock insuficiente viene de la funcion y sirve al usuario
    const message = error.message?.includes('Stock insuficiente')
      ? error.message
      : 'Error al mover el inventario'
    return { balance: null, error: message }
  }

  revalidatePath('/inventario')
  return { balance: Number(data), error: null }
}

// Existencias actuales de todos los productos (para listados)
export async function getStockLevels(): Promise<Map<string, StockLevel>> {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('inventory')
    .select('product_id, quantity, average_cost')
    .limit(1000)

  const map = new Map<string, StockLevel>()
  if (error) {
    console.error('Error fetching stock levels:', error)
    return map
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data || []) as any[]) {
    if (!row.product_id) continue
    map.set(row.product_id, {
      product_id: row.product_id,
      quantity: Number(row.quantity || 0),
      average_cost: row.average_cost !== null ? Number(row.average_cost) : null,
    })
  }
  return map
}

// =============================================
// OPERACIONES DE USUARIO
// =============================================

// Entrada de mercancia. Opcionalmente registra el gasto al proveedor:
// una compra es a la vez entrada de stock y dinero que sale.
export async function registerStockEntry(input: {
  productId: string
  quantity: number
  unitCost?: number | null
  supplierId?: string | null
  notes?: string | null
  movementType?: Extract<MovementType, 'purchase' | 'initial' | 'return'>
  registerExpense?: boolean
  expenseConcept?: string
}): Promise<{ balance: number | null; error: string | null; expenseError?: string | null }> {
  if (input.quantity <= 0) {
    return { balance: null, error: 'La cantidad debe ser mayor a cero' }
  }

  const { balance, error } = await applyStockMovement({
    productId: input.productId,
    quantity: Math.abs(input.quantity),
    movementType: input.movementType || 'purchase',
    referenceType: input.supplierId ? 'supplier' : null,
    referenceId: input.supplierId || null,
    unitCost: input.unitCost ?? null,
    notes: input.notes ?? null,
  })

  if (error) return { balance: null, error }

  // Registrar el gasto asociado a la compra
  let expenseError: string | null = null
  if (input.registerExpense && input.unitCost && input.unitCost > 0) {
    const total = Math.round(input.quantity * input.unitCost * 100) / 100
    const { error: expError } = await createExpense({
      supplier_id: input.supplierId || null,
      supplier_name: input.supplierId ? null : 'Compra de inventario',
      category: 'inversion',
      subcategory: 'Insumos de tratamiento',
      concept: input.expenseConcept || input.notes || 'Compra de inventario',
      subtotal: total,
      tax_amount: 0,
      total,
    })
    expenseError = expError
  }

  revalidatePath('/inventario')
  revalidatePath('/facturacion/gastos')
  return { balance, error: null, expenseError }
}

// Ajuste por conteo fisico: se indica la cantidad REAL contada y el sistema
// calcula la diferencia contra lo que dice el sistema.
export async function adjustStock(input: {
  productId: string
  countedQuantity: number
  notes?: string | null
}): Promise<{ balance: number | null; error: string | null }> {
  if (input.countedQuantity < 0) {
    return { balance: null, error: 'La cantidad contada no puede ser negativa' }
  }

  const levels = await getStockLevels()
  const current = levels.get(input.productId)?.quantity ?? 0
  const delta = input.countedQuantity - current

  if (delta === 0) {
    return { balance: current, error: null }
  }

  return applyStockMovement({
    productId: input.productId,
    quantity: delta,
    movementType: 'adjustment',
    notes: input.notes || `Conteo fisico: sistema ${current}, contado ${input.countedQuantity}`,
    allowNegative: true,
  })
}

// Merma: producto vencido, roto o perdido
export async function registerStockLoss(input: {
  productId: string
  quantity: number
  reason: string
}): Promise<{ balance: number | null; error: string | null }> {
  if (input.quantity <= 0) {
    return { balance: null, error: 'La cantidad debe ser mayor a cero' }
  }
  if (!input.reason?.trim()) {
    return { balance: null, error: 'Indica el motivo de la merma' }
  }

  return applyStockMovement({
    productId: input.productId,
    quantity: -Math.abs(input.quantity),
    movementType: 'loss',
    notes: input.reason.trim(),
  })
}

// =============================================
// HISTORIAL
// =============================================

export async function getStockMovements(options?: {
  productId?: string
  limit?: number
}): Promise<StockMovementData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('inventory_movements')
    .select(`
      id, product_id, movement_type, quantity, unit_cost, balance_after,
      reference_type, reference_id, notes, created_at,
      products:product_id (name),
      users:created_by (first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(options?.limit || 200)

  if (options?.productId) query = query.eq('product_id', options.productId)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching stock movements:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((m: any) => ({
    id: m.id,
    product_id: m.product_id,
    product_name: m.products?.name || 'Producto eliminado',
    movement_type: m.movement_type as MovementType,
    quantity: Number(m.quantity || 0),
    unit_cost: m.unit_cost !== null ? Number(m.unit_cost) : null,
    balance_after: m.balance_after !== null ? Number(m.balance_after) : null,
    reference_type: m.reference_type,
    reference_id: m.reference_id,
    notes: m.notes,
    created_by_name: m.users
      ? `${m.users.first_name || ''} ${m.users.last_name || ''}`.trim() || null
      : null,
    created_at: m.created_at,
  }))
}
