'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeError } from '@/lib/error-utils'
import type { ExpenseCategory } from '@/actions/expenses'

// TODO: obtener del usuario actual cuando el sistema sea multi-clinica
const CLINIC_ID = '00000000-0000-0000-0000-000000000001'
const ITBIS_RATE = 18

// =============================================
// GASTOS FIJOS (RECURRENTES)
// =============================================
// Renta, luz, internet, telefono: se pagan todos los meses. Aqui se guarda la
// plantilla una sola vez y cada mes se generan los gastos con un clic.
//
// El monto es una estimacion (la luz varia); el gasto generado se puede editar
// despues sin tocar la plantilla.
// =============================================

export interface RecurringExpenseData {
  id: string
  supplier_id: string | null
  supplier_name: string | null
  supplier_rnc: string | null
  category: ExpenseCategory
  subcategory: string | null
  concept: string
  amount: number
  includes_tax: boolean
  due_day: number | null
  payment_method: string | null
  is_active: boolean
  notes: string | null
  /** Nombre a mostrar: proveedor registrado o texto libre */
  display_name: string
  /** Si ya existe el gasto de este mes */
  generated_this_period: boolean
}

export interface CreateRecurringExpenseInput {
  supplier_id?: string | null
  supplier_name?: string | null
  supplier_rnc?: string | null
  category: ExpenseCategory
  subcategory?: string | null
  concept: string
  amount: number
  includes_tax?: boolean
  due_day?: number | null
  payment_method?: string | null
  notes?: string | null
}

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
    return { userId: authUser.id, error: 'Solo el administrador o el dueno puede gestionar gastos fijos' }
  }
  return { userId: authUser.id, error: null }
}

/** Primer y ultimo dia de un periodo 'YYYY-MM' */
function periodRange(period: string): { start: string; end: string } {
  const [year, month] = period.split('-').map(Number)
  const start = `${period}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${period}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export async function getRecurringExpenses(
  period: string
): Promise<{ data: RecurringExpenseData[]; error: string | null }> {
  const { error: authError } = await requireAdmin()
  if (authError) return { data: [], error: authError }

  const supabase = createAdminClient()
  const { start, end } = periodRange(period)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('recurring_expenses')
    .select('*, suppliers:supplier_id (name)')
    .eq('clinic_id', CLINIC_ID)
    .order('category', { ascending: true })
    .order('concept', { ascending: true })
    .limit(200)

  if (error) {
    console.error('Error fetching recurring expenses:', error)
    return { data: [], error: 'Error al cargar los gastos fijos' }
  }

  // Cuales ya se generaron en el periodo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: generated } = await (supabase as any)
    .from('expenses')
    .select('recurring_expense_id')
    .eq('clinic_id', CLINIC_ID)
    .not('recurring_expense_id', 'is', null)
    .gte('issue_date', start)
    .lte('issue_date', end)

  const generatedIds = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((generated || []) as any[]).map((g) => g.recurring_expense_id)
  )

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: ((data || []) as any[]).map((r) => ({
      id: r.id,
      supplier_id: r.supplier_id,
      supplier_name: r.supplier_name,
      supplier_rnc: r.supplier_rnc,
      category: r.category as ExpenseCategory,
      subcategory: r.subcategory,
      concept: r.concept,
      amount: Number(r.amount || 0),
      includes_tax: r.includes_tax === true,
      due_day: r.due_day,
      payment_method: r.payment_method,
      is_active: r.is_active !== false,
      notes: r.notes,
      display_name: r.suppliers?.name || r.supplier_name || 'Sin proveedor',
      generated_this_period: generatedIds.has(r.id),
    })),
    error: null,
  }
}

export async function createRecurringExpense(
  input: CreateRecurringExpenseInput
): Promise<{ error: string | null }> {
  const { userId, error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  if (!input.concept?.trim()) return { error: 'Escribe el concepto del gasto fijo' }
  if (!input.supplier_id && !input.supplier_name?.trim()) {
    return { error: 'Indica a quién se le paga' }
  }
  if (input.amount < 0) return { error: 'El monto no puede ser negativo' }

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('recurring_expenses').insert({
    clinic_id: CLINIC_ID,
    supplier_id: input.supplier_id || null,
    supplier_name: input.supplier_name?.trim() || null,
    supplier_rnc: input.supplier_rnc?.trim() || null,
    category: input.category,
    subcategory: input.subcategory?.trim() || null,
    concept: input.concept.trim(),
    amount: input.amount,
    includes_tax: input.includes_tax === true,
    due_day: input.due_day || null,
    payment_method: input.payment_method || null,
    notes: input.notes?.trim() || null,
    created_by: userId,
  })

  if (error) {
    console.error('Error creating recurring expense:', error)
    return { error: sanitizeError(error, 'Error al guardar el gasto fijo') }
  }

  revalidatePath('/facturacion/gastos')
  return { error: null }
}

export async function updateRecurringExpense(
  id: string,
  input: Partial<CreateRecurringExpenseInput> & { is_active?: boolean }
): Promise<{ error: string | null }> {
  const { error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (input.supplier_id !== undefined) updateData.supplier_id = input.supplier_id || null
  if (input.supplier_name !== undefined) updateData.supplier_name = input.supplier_name?.trim() || null
  if (input.category !== undefined) updateData.category = input.category
  if (input.subcategory !== undefined) updateData.subcategory = input.subcategory?.trim() || null
  if (input.concept !== undefined) updateData.concept = input.concept.trim()
  if (input.amount !== undefined) updateData.amount = input.amount
  if (input.includes_tax !== undefined) updateData.includes_tax = input.includes_tax
  if (input.due_day !== undefined) updateData.due_day = input.due_day || null
  if (input.payment_method !== undefined) updateData.payment_method = input.payment_method || null
  if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null
  if (input.is_active !== undefined) updateData.is_active = input.is_active

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('recurring_expenses').update(updateData).eq('id', id)

  if (error) {
    console.error('Error updating recurring expense:', error)
    return { error: 'Error al actualizar el gasto fijo' }
  }

  revalidatePath('/facturacion/gastos')
  return { error: null }
}

export async function deleteRecurringExpense(id: string): Promise<{ error: string | null }> {
  const { error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  // Los gastos ya generados se conservan; solo se pierde el enlace
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('recurring_expenses').delete().eq('id', id)

  if (error) {
    console.error('Error deleting recurring expense:', error)
    return { error: 'Error al eliminar el gasto fijo' }
  }

  revalidatePath('/facturacion/gastos')
  return { error: null }
}

// Genera en el periodo los gastos fijos que todavia no existan.
// Es idempotente: si ya se genero uno, no se duplica.
export async function generateRecurringExpenses(
  period: string
): Promise<{ created: number; error: string | null }> {
  const { userId, error: authError } = await requireAdmin()
  if (authError) return { created: 0, error: authError }

  const { data: recurring, error: listError } = await getRecurringExpenses(period)
  if (listError) return { created: 0, error: listError }

  const pending = recurring.filter((r) => r.is_active && !r.generated_this_period)
  if (pending.length === 0) {
    return { created: 0, error: null }
  }

  const supabase = createAdminClient()
  const { start } = periodRange(period)
  const [year, month] = period.split('-').map(Number)

  // Consecutivo: se calcula una vez y se incrementa, para no repetir numero
  const prefix = `GAS-${year}-`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lastRows } = await (supabase as any)
    .from('expenses')
    .select('expense_number')
    .eq('clinic_id', CLINIC_ID)
    .like('expense_number', `${prefix}%`)
    .order('expense_number', { ascending: false })
    .limit(1)

  const lastNumber = lastRows?.[0]?.expense_number as string | undefined
  const lastSeq = lastNumber ? parseInt(lastNumber.slice(prefix.length), 10) : 0
  let seq = Number.isNaN(lastSeq) ? 0 : lastSeq

  const rows = pending.map((r) => {
    seq += 1
    const total = r.amount
    const subtotal = r.includes_tax ? total / (1 + ITBIS_RATE / 100) : total
    const taxAmount = r.includes_tax ? total - subtotal : 0

    // El gasto se emite el primer dia del mes y vence el dia configurado
    const dueDate = r.due_day
      ? `${period}-${String(Math.min(r.due_day, new Date(year, month, 0).getDate())).padStart(2, '0')}`
      : null

    return {
      clinic_id: CLINIC_ID,
      recurring_expense_id: r.id,
      supplier_id: r.supplier_id,
      supplier_name: r.supplier_id ? null : r.supplier_name,
      supplier_rnc: r.supplier_rnc,
      expense_number: `${prefix}${String(seq).padStart(5, '0')}`,
      category: r.category,
      subcategory: r.subcategory,
      concept: r.concept,
      issue_date: start,
      due_date: dueDate,
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total,
      status: 'pending',
      payment_method: r.payment_method,
      notes: r.notes,
      created_by: userId,
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('expenses').insert(rows)

  if (error) {
    console.error('Error generating recurring expenses:', error)
    return { created: 0, error: sanitizeError(error, 'Error al generar los gastos fijos') }
  }

  revalidatePath('/facturacion/gastos')
  return { created: rows.length, error: null }
}
