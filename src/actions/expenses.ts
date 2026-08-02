'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeError } from '@/lib/error-utils'

// TODO: obtener del usuario actual cuando el sistema sea multi-clinica
const CLINIC_ID = '00000000-0000-0000-0000-000000000001'

// =============================================
// TIPOS
// =============================================

export type ExpenseCategory =
  | 'servicios'
  | 'inversion'
  | 'nomina'
  | 'equipos'
  | 'mantenimiento'
  | 'impuestos'
  | 'marketing'
  | 'transporte'
  | 'otros'

export type ExpenseStatus = 'pending' | 'partial' | 'paid' | 'cancelled'
export type ExpensePaymentMethod = 'cash' | 'card' | 'transfer' | 'check' | 'other'

export interface ExpenseData {
  id: string
  clinic_id: string
  supplier_id: string | null
  supplier_name: string | null
  supplier_rnc: string | null
  expense_number: string
  supplier_invoice_number: string | null
  ncf: string | null
  category: ExpenseCategory
  subcategory: string | null
  concept: string
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_amount: number
  total: number
  currency: string
  status: ExpenseStatus
  payment_method: string | null
  notes: string | null
  purchase_order_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ExpenseListItem extends ExpenseData {
  supplier_display_name: string
  paid_amount: number
  pending_amount: number
  days_overdue: number
}

export interface ExpensePaymentData {
  id: string
  expense_id: string
  amount: number
  payment_method: ExpensePaymentMethod
  payment_date: string
  reference: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface CreateExpenseInput {
  supplier_id?: string | null
  supplier_name?: string | null
  supplier_rnc?: string | null
  supplier_invoice_number?: string | null
  ncf?: string | null
  category: ExpenseCategory
  subcategory?: string | null
  concept: string
  issue_date?: string
  due_date?: string | null
  subtotal: number
  tax_amount?: number
  total: number
  payment_method?: string | null
  notes?: string | null
}

export interface ExpenseStats {
  total_pending: number
  total_overdue: number
  overdue_count: number
  pending_count: number
  paid_this_month: number
  paid_count_this_month: number
  by_category: { category: ExpenseCategory; total: number; pending: number }[]
}

export interface CashFlowSummary {
  income: number          // cobrado a pacientes en el periodo
  expenses: number        // pagado a proveedores/gastos en el periodo
  balance: number         // lo que queda
  pending_to_collect: number
  pending_to_pay: number
  projected_balance: number
  period_label: string
}

// =============================================
// HELPERS
// =============================================

// Los gastos y el flujo de caja son informacion de dueno: solo admin/owner.
async function requireAdmin(): Promise<{ userId: string; error: string | null }> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return { userId: '', error: 'No autorizado' }

  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData } = await (adminClient as any)
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
    return { userId: authUser.id, error: 'Solo el administrador o el dueno puede gestionar gastos' }
  }
  return { userId: authUser.id, error: null }
}

// Consecutivo interno: GAS-2026-00001
async function generateExpenseNumber(): Promise<string> {
  const supabase = createAdminClient()
  const year = new Date().getFullYear()
  const prefix = `GAS-${year}-`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('expenses')
    .select('expense_number')
    .eq('clinic_id', CLINIC_ID)
    .like('expense_number', `${prefix}%`)
    .order('expense_number', { ascending: false })
    .limit(1)

  const last = data?.[0]?.expense_number as string | undefined
  const lastSeq = last ? parseInt(last.slice(prefix.length), 10) : 0
  const next = (Number.isNaN(lastSeq) ? 0 : lastSeq) + 1
  return `${prefix}${String(next).padStart(5, '0')}`
}

function daysBetween(from: string, to: Date): number {
  const diff = to.getTime() - new Date(from).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExpenseRow(row: any): ExpenseListItem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paid = (row.expense_payments || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  const total = Number(row.total || 0)
  const pending = Math.max(0, Math.round((total - paid) * 100) / 100)

  const isOpen = row.status !== 'paid' && row.status !== 'cancelled' && pending > 0
  const overdue = isOpen && row.due_date ? daysBetween(row.due_date, new Date()) : 0

  return {
    ...row,
    subtotal: Number(row.subtotal || 0),
    tax_amount: Number(row.tax_amount || 0),
    total,
    supplier_display_name: row.suppliers?.name || row.supplier_name || 'Sin proveedor',
    supplier_rnc: row.supplier_rnc || row.suppliers?.tax_id || null,
    paid_amount: Math.round(paid * 100) / 100,
    pending_amount: pending,
    days_overdue: overdue > 0 ? overdue : 0,
  } as ExpenseListItem
}

// =============================================
// GASTOS
// =============================================

export async function getExpenses(options?: {
  status?: ExpenseStatus
  category?: ExpenseCategory
  supplierId?: string
  startDate?: string
  endDate?: string
}): Promise<{ data: ExpenseListItem[]; error: string | null }> {
  const { error: authError } = await requireAdmin()
  if (authError) return { data: [], error: authError }

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('expenses')
    .select('*, suppliers:supplier_id (name, tax_id), expense_payments (id, amount)')
    .eq('clinic_id', CLINIC_ID)
    .order('issue_date', { ascending: false })
    .limit(500)

  if (options?.status) query = query.eq('status', options.status)
  if (options?.category) query = query.eq('category', options.category)
  if (options?.supplierId) query = query.eq('supplier_id', options.supplierId)
  if (options?.startDate) query = query.gte('issue_date', options.startDate)
  if (options?.endDate) query = query.lte('issue_date', options.endDate)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching expenses:', error)
    return { data: [], error: 'Error al cargar los gastos' }
  }

  return { data: (data || []).map(mapExpenseRow), error: null }
}

export async function getExpenseById(
  id: string
): Promise<{ data: ExpenseListItem | null; error: string | null }> {
  const { error: authError } = await requireAdmin()
  if (authError) return { data: null, error: authError }

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('expenses')
    .select('*, suppliers:supplier_id (name, tax_id), expense_payments (id, amount)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return { data: null, error: 'Gasto no encontrado' }
  }

  return { data: mapExpenseRow(data), error: null }
}

export async function createExpense(
  input: CreateExpenseInput
): Promise<{ data: ExpenseData | null; error: string | null }> {
  const { userId, error: authError } = await requireAdmin()
  if (authError) return { data: null, error: authError }

  if (!input.concept?.trim()) {
    return { data: null, error: 'El concepto del gasto es requerido' }
  }
  if (!input.total || input.total <= 0) {
    return { data: null, error: 'El monto del gasto debe ser mayor a cero' }
  }
  if (!input.supplier_id && !input.supplier_name?.trim()) {
    return { data: null, error: 'Indica el proveedor o a quien se le paga' }
  }

  const supabase = createAdminClient()
  const expenseNumber = await generateExpenseNumber()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('expenses')
    .insert({
      clinic_id: CLINIC_ID,
      supplier_id: input.supplier_id || null,
      supplier_name: input.supplier_name?.trim() || null,
      supplier_rnc: input.supplier_rnc?.trim() || null,
      expense_number: expenseNumber,
      supplier_invoice_number: input.supplier_invoice_number?.trim() || null,
      ncf: input.ncf?.trim() || null,
      category: input.category,
      subcategory: input.subcategory?.trim() || null,
      concept: input.concept.trim(),
      issue_date: input.issue_date || new Date().toISOString().slice(0, 10),
      due_date: input.due_date || null,
      subtotal: input.subtotal,
      tax_amount: input.tax_amount || 0,
      total: input.total,
      status: 'pending',
      payment_method: input.payment_method || null,
      notes: input.notes?.trim() || null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating expense:', error)
    return { data: null, error: sanitizeError(error, 'Error al registrar el gasto') }
  }

  revalidatePath('/facturacion/gastos')
  revalidatePath('/facturacion')
  return { data: data as ExpenseData, error: null }
}

export async function updateExpense(
  id: string,
  input: Partial<CreateExpenseInput>
): Promise<{ error: string | null }> {
  const { error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (input.supplier_id !== undefined) updateData.supplier_id = input.supplier_id || null
  if (input.supplier_name !== undefined) updateData.supplier_name = input.supplier_name?.trim() || null
  if (input.supplier_rnc !== undefined) updateData.supplier_rnc = input.supplier_rnc?.trim() || null
  if (input.supplier_invoice_number !== undefined) {
    updateData.supplier_invoice_number = input.supplier_invoice_number?.trim() || null
  }
  if (input.ncf !== undefined) updateData.ncf = input.ncf?.trim() || null
  if (input.category !== undefined) updateData.category = input.category
  if (input.subcategory !== undefined) updateData.subcategory = input.subcategory?.trim() || null
  if (input.concept !== undefined) updateData.concept = input.concept.trim()
  if (input.issue_date !== undefined) updateData.issue_date = input.issue_date
  if (input.due_date !== undefined) updateData.due_date = input.due_date || null
  if (input.subtotal !== undefined) updateData.subtotal = input.subtotal
  if (input.tax_amount !== undefined) updateData.tax_amount = input.tax_amount
  if (input.total !== undefined) updateData.total = input.total
  if (input.payment_method !== undefined) updateData.payment_method = input.payment_method || null
  if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('expenses').update(updateData).eq('id', id)

  if (error) {
    console.error('Error updating expense:', error)
    return { error: 'Error al actualizar el gasto' }
  }

  // El total pudo cambiar: reajustar el estado segun lo ya pagado
  if (input.total !== undefined) {
    await recalculateExpenseStatus(id)
  }

  revalidatePath('/facturacion/gastos')
  return { error: null }
}

export async function deleteExpense(id: string): Promise<{ error: string | null }> {
  const { userId, error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()

  // Snapshot con sus pagos para el rastro de auditoria
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: snapshot } = await (supabase as any)
    .from('expenses')
    .select('*, expense_payments (*)')
    .eq('id', id)
    .single()

  if (!snapshot) return { error: 'Gasto no encontrado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: auditError } = await (supabase as any).from('audit_logs').insert({
    clinic_id: snapshot.clinic_id ?? null,
    user_id: userId,
    action: 'delete_expense',
    table_name: 'expenses',
    record_id: id,
    old_data: snapshot,
  })

  if (auditError) {
    console.error('Error writing audit log for expense deletion:', auditError)
    return { error: 'No se pudo registrar la auditoria. El gasto no fue eliminado.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('expenses').delete().eq('id', id)

  if (error) {
    console.error('Error deleting expense:', error)
    return { error: 'Error al eliminar el gasto' }
  }

  revalidatePath('/facturacion/gastos')
  return { error: null }
}

// =============================================
// PAGOS A GASTOS
// =============================================

// Recalcula el estado del gasto a partir de sus abonos reales
async function recalculateExpenseStatus(expenseId: string): Promise<number> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: expense } = await (supabase as any)
    .from('expenses')
    .select('total, status, expense_payments (amount)')
    .eq('id', expenseId)
    .single()

  if (!expense) return 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paid = (expense.expense_payments || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  const total = Number(expense.total || 0)

  let status: ExpenseStatus = 'pending'
  if (expense.status === 'cancelled') {
    status = 'cancelled'
  } else if (paid <= 0) {
    status = 'pending'
  } else if (paid + 0.01 >= total) {
    status = 'paid'
  } else {
    status = 'partial'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('expenses')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', expenseId)

  return Math.round(paid * 100) / 100
}

export async function getExpensePayments(
  expenseId: string
): Promise<{ data: ExpensePaymentData[]; error: string | null }> {
  const { error: authError } = await requireAdmin()
  if (authError) return { data: [], error: authError }

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('expense_payments')
    .select('*')
    .eq('expense_id', expenseId)
    .order('payment_date', { ascending: false })

  if (error) {
    console.error('Error fetching expense payments:', error)
    return { data: [], error: 'Error al cargar los pagos' }
  }

  return { data: (data || []) as ExpensePaymentData[], error: null }
}

export async function registerExpensePayment(
  expenseId: string,
  input: {
    amount: number
    payment_method: ExpensePaymentMethod
    payment_date?: string
    reference?: string | null
    notes?: string | null
  }
): Promise<{ error: string | null }> {
  const { userId, error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  if (!input.amount || input.amount <= 0) {
    return { error: 'El monto del pago debe ser mayor a cero' }
  }

  const supabase = createAdminClient()

  // Validar contra el saldo pendiente real
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: expense } = await (supabase as any)
    .from('expenses')
    .select('total, status, expense_payments (amount)')
    .eq('id', expenseId)
    .single()

  if (!expense) return { error: 'Gasto no encontrado' }
  if (expense.status === 'cancelled') {
    return { error: 'No se puede pagar un gasto anulado' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paid = (expense.expense_payments || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  const pending = Number(expense.total || 0) - paid

  if (input.amount > pending + 0.01) {
    return { error: `El pago excede el saldo pendiente (${pending.toFixed(2)})` }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('expense_payments').insert({
    expense_id: expenseId,
    amount: input.amount,
    payment_method: input.payment_method,
    payment_date: input.payment_date || new Date().toISOString().slice(0, 10),
    reference: input.reference?.trim() || null,
    notes: input.notes?.trim() || null,
    created_by: userId,
  })

  if (error) {
    console.error('Error registering expense payment:', error)
    return { error: sanitizeError(error, 'Error al registrar el pago') }
  }

  await recalculateExpenseStatus(expenseId)

  revalidatePath('/facturacion/gastos')
  revalidatePath('/facturacion')
  return { error: null }
}

export async function deleteExpensePayment(paymentId: string): Promise<{ error: string | null }> {
  const { error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payment } = await (supabase as any)
    .from('expense_payments')
    .select('expense_id')
    .eq('id', paymentId)
    .single()

  if (!payment) return { error: 'Pago no encontrado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('expense_payments').delete().eq('id', paymentId)

  if (error) {
    console.error('Error deleting expense payment:', error)
    return { error: 'Error al eliminar el pago' }
  }

  await recalculateExpenseStatus(payment.expense_id)

  revalidatePath('/facturacion/gastos')
  return { error: null }
}
