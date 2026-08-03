'use server'

// =============================================
// GASTOS QUE MUEVEN INVENTARIO
// =============================================
// Une dos modulos que hasta ahora vivian separados: una factura de proveedor
// es a la vez dinero que sale (gasto) y mercancia que entra (stock).
//
// No hay tabla de lineas de gasto: las lineas SON los movimientos de
// inventario, marcados con reference_type='expense' + reference_id=<gasto>.
// Asi el stock y el gasto no pueden desincronizarse, y el detalle de que
// entro con cada factura se reconstruye desde inventory_movements.
//
// Este archivo importa de expenses.ts e inventory-movements.ts; ninguno de
// los dos importa de aqui, para no crear una dependencia circular.
// =============================================

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { createExpense, deleteExpense } from '@/actions/expenses'
import type { CreateExpenseInput, ExpenseData } from '@/actions/expenses'
import { applyStockMovement } from '@/actions/inventory-movements'

const EXPENSE_REFERENCE = 'expense'

export interface ExpenseStockItem {
  product_id: string
  quantity: number
  unit_cost: number
}

export interface ExpenseStockLine extends ExpenseStockItem {
  movement_id: string
  product_name: string
  unit: string
  line_total: number
  created_at: string
}

// Crea el gasto y mete la mercancia al inventario en un solo paso.
// Si el gasto se crea pero alguna linea de stock falla, se devuelve
// `stockWarning`: el dinero ya quedo registrado y el usuario debe saber
// exactamente que producto no entro, en vez de recibir un falso "todo bien".
export async function createExpenseWithStock(
  input: CreateExpenseInput,
  items: ExpenseStockItem[]
): Promise<{ data: ExpenseData | null; error: string | null; stockWarning: string | null }> {
  const cleanItems = (items || []).filter((item) => item.product_id && item.quantity > 0)

  for (const item of cleanItems) {
    if (item.quantity <= 0) {
      return { data: null, error: 'Las cantidades de los productos deben ser mayores a cero', stockWarning: null }
    }
    if (item.unit_cost < 0) {
      return { data: null, error: 'El costo unitario no puede ser negativo', stockWarning: null }
    }
  }

  // Un mismo producto repetido en la factura se consolida en una sola entrada,
  // promediando el costo por unidad para que el costo promedio no se distorsione.
  const merged = new Map<string, ExpenseStockItem>()
  for (const item of cleanItems) {
    const existing = merged.get(item.product_id)
    if (!existing) {
      merged.set(item.product_id, { ...item })
      continue
    }
    const totalQty = existing.quantity + item.quantity
    const totalCost = existing.quantity * existing.unit_cost + item.quantity * item.unit_cost
    merged.set(item.product_id, {
      product_id: item.product_id,
      quantity: totalQty,
      unit_cost: totalQty > 0 ? totalCost / totalQty : 0,
    })
  }

  const { data: expense, error } = await createExpense(input)
  if (error || !expense) {
    return { data: null, error: error || 'Error al registrar el gasto', stockWarning: null }
  }

  const failed: string[] = []
  for (const item of merged.values()) {
    const { error: stockError } = await applyStockMovement({
      productId: item.product_id,
      quantity: item.quantity,
      movementType: 'purchase',
      referenceType: EXPENSE_REFERENCE,
      referenceId: expense.id,
      unitCost: item.unit_cost > 0 ? item.unit_cost : null,
      notes: `Factura ${expense.supplier_invoice_number || expense.expense_number}`,
    })
    if (stockError) failed.push(stockError)
  }

  revalidatePath('/facturacion/gastos')
  revalidatePath('/inventario')

  return {
    data: expense,
    error: null,
    stockWarning: failed.length > 0
      ? `El gasto se registro, pero ${failed.length} producto(s) no entraron al inventario: ${failed[0]}`
      : null,
  }
}

// Lineas de inventario asociadas a un gasto (para verlo en el detalle)
export async function getExpenseStockLines(expenseId: string): Promise<ExpenseStockLine[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('inventory_movements')
    .select('id, product_id, quantity, unit_cost, created_at, products:product_id (name, unit)')
    .eq('reference_type', EXPENSE_REFERENCE)
    .eq('reference_id', expenseId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    console.error('Error fetching expense stock lines:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => {
    const quantity = Number(row.quantity || 0)
    const unitCost = Number(row.unit_cost || 0)
    return {
      movement_id: row.id,
      product_id: row.product_id,
      product_name: row.products?.name || 'Producto eliminado',
      unit: row.products?.unit || 'unit',
      quantity,
      unit_cost: unitCost,
      line_total: Math.round(quantity * unitCost * 100) / 100,
      created_at: row.created_at,
    }
  })
}

// Borra el gasto y devuelve el inventario a como estaba.
// La reversion se permite en negativo a proposito: si la mercancia ya se
// consumio, el saldo negativo es la senal honesta de que hay un descuadre,
// preferible a bloquear el borrado o a dejar stock fantasma.
export async function deleteExpenseWithStock(
  expenseId: string
): Promise<{ error: string | null; stockWarning: string | null }> {
  const lines = await getExpenseStockLines(expenseId)

  const { error } = await deleteExpense(expenseId)
  if (error) return { error, stockWarning: null }

  const failed: string[] = []
  for (const line of lines) {
    if (line.quantity <= 0) continue
    const { error: stockError } = await applyStockMovement({
      productId: line.product_id,
      quantity: -Math.abs(line.quantity),
      movementType: 'return',
      referenceType: EXPENSE_REFERENCE,
      referenceId: expenseId,
      unitCost: line.unit_cost || null,
      notes: 'Reversion por gasto eliminado',
      allowNegative: true,
    })
    if (stockError) failed.push(stockError)
  }

  revalidatePath('/facturacion/gastos')
  revalidatePath('/inventario')

  return {
    error: null,
    stockWarning: failed.length > 0
      ? `El gasto se elimino, pero ${failed.length} producto(s) no se descontaron del inventario`
      : null,
  }
}
