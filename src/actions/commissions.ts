'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createExpense, registerExpensePayment, type ExpensePaymentMethod } from '@/actions/expenses'
import { formatPeriodLabel } from '@/lib/periods'

// =============================================
// PAGO DE COMISIONES
// =============================================
// Una comision pagada es dinero que sale de la clinica. Antes solo se le
// cambiaba el estado a 'paid' y no quedaba rastro: no aparecia en gastos ni
// en el flujo de caja, asi que el mes cerraba con una utilidad inflada.
//
// Ahora pagar una comision crea su gasto (categoria nomina / Comisiones) y
// registra el pago, igual que hace la nomina. El enlace queda en
// commissions.expense_id para poder revertirlo si fue un error.
// =============================================

// El dinero que sale es informacion de dueno: solo admin/owner.
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
    return { userId: authUser.id, error: 'Solo el administrador o el dueno puede pagar comisiones' }
  }
  return { userId: authUser.id, error: null }
}

export interface PayCommissionInput {
  paymentMethod?: ExpensePaymentMethod
  /** Por defecto el ultimo dia del periodo de la comision */
  paymentDate?: string
  reference?: string | null
}

export interface CommissionsSummary {
  /** Comisiones generadas pero todavia no pagadas: deuda con los profesionales */
  pendingAmount: number
  pendingCount: number
  /** Comisiones pagadas dentro del periodo consultado */
  paidAmount: number
  paidCount: number
}

// El gasto pertenece al mes de la comision, no al dia en que se paga: si no,
// la comision de julio aparece como gasto de agosto y el mes no cuadra.
function expenseDateFor(periodEnd: string | null, paymentDate?: string): string {
  if (paymentDate) return paymentDate
  if (periodEnd) return periodEnd
  return new Date().toISOString().slice(0, 10)
}

function periodLabelFor(periodStart: string | null, periodEnd: string | null): string {
  const source = periodStart || periodEnd
  if (!source) return 'sin periodo'
  return formatPeriodLabel(source.slice(0, 7))
}

/**
 * Paga una comision: crea el gasto, registra la salida de dinero y recien
 * entonces la marca como pagada. Si el gasto falla, la comision NO se marca
 * pagada; asi no se repite el hueco que dejaron las nominas sin gasto.
 */
export async function payCommission(
  id: string,
  input: PayCommissionInput = {}
): Promise<{ error: string | null }> {
  const { userId, error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: commission } = await (supabase as any)
    .from('commissions')
    .select(
      'id, status, commission_amount, period_start, period_end, expense_id, notes, professional:professional_id (first_name, last_name)'
    )
    .eq('id', id)
    .single()

  if (!commission) return { error: 'Comision no encontrada' }
  if (commission.status === 'paid') return { error: 'Esta comision ya esta pagada' }
  if (commission.status === 'cancelled') return { error: 'Esta comision fue anulada' }

  const amount = Number(commission.commission_amount || 0)
  if (amount <= 0) return { error: 'La comision no tiene monto que pagar' }

  const professionalName =
    `${commission.professional?.first_name || ''} ${commission.professional?.last_name || ''}`.trim() ||
    'Profesional'
  const label = periodLabelFor(commission.period_start, commission.period_end)
  const expenseDate = expenseDateFor(commission.period_end, input.paymentDate)
  const paymentMethod = input.paymentMethod || 'transfer'

  let expenseId: string | null = commission.expense_id

  if (!expenseId) {
    const { data: expense, error: expenseError } = await createExpense({
      supplier_name: professionalName,
      category: 'nomina',
      subcategory: 'Comisiones',
      concept: `Comision ${label} - ${professionalName}`,
      issue_date: expenseDate,
      due_date: expenseDate,
      subtotal: amount,
      tax_amount: 0,
      total: amount,
      payment_method: paymentMethod,
      notes: commission.notes || null,
    })

    if (expenseError || !expense) {
      return { error: expenseError || 'No se pudo registrar el gasto de la comision' }
    }
    expenseId = expense.id

    const { error: paymentError } = await registerExpensePayment(expenseId, {
      amount,
      payment_method: paymentMethod,
      payment_date: expenseDate,
      reference: input.reference || null,
    })

    if (paymentError) {
      return { error: `El gasto se creo pero el pago no se registro: ${paymentError}` }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('commissions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      paid_by: userId,
      payment_date: expenseDate,
      payment_reference: input.reference?.trim() || null,
      expense_id: expenseId,
    })
    .eq('id', id)

  if (error) {
    console.error('Error marking commission as paid:', error)
    return { error: 'El gasto quedo registrado pero la comision no se marco como pagada' }
  }

  revalidatePath('/profesionales/comisiones')
  revalidatePath('/facturacion/gastos')
  revalidatePath('/facturacion')
  return { error: null }
}

/**
 * Revierte el pago de una comision: borra el gasto que se creo y la devuelve
 * a pendiente. Solo toca el gasto si nacio de esta comision.
 */
export async function revertCommissionPayment(id: string): Promise<{ error: string | null }> {
  const { error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: commission } = await (supabase as any)
    .from('commissions')
    .select('id, status, expense_id')
    .eq('id', id)
    .single()

  if (!commission) return { error: 'Comision no encontrada' }
  if (commission.status !== 'paid') return { error: 'Esta comision no esta pagada' }

  if (commission.expense_id) {
    // Solo se borra si ninguna otra comision cuelga del mismo gasto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from('commissions')
      .select('id', { count: 'exact', head: true })
      .eq('expense_id', commission.expense_id)

    if ((count ?? 1) <= 1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('expense_payments').delete().eq('expense_id', commission.expense_id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('expenses').delete().eq('id', commission.expense_id)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('commissions')
    .update({
      status: 'pending',
      paid_at: null,
      paid_by: null,
      payment_date: null,
      payment_reference: null,
      expense_id: null,
    })
    .eq('id', id)

  if (error) {
    console.error('Error reverting commission payment:', error)
    return { error: 'Error al revertir el pago de la comision' }
  }

  revalidatePath('/profesionales/comisiones')
  revalidatePath('/facturacion/gastos')
  revalidatePath('/facturacion')
  return { error: null }
}

/**
 * Comisiones pendientes (deuda viva) y pagadas dentro de un rango.
 * Lo usa el flujo de caja para que las comisiones cuenten como costo.
 */
export async function getCommissionsSummary(range?: {
  start?: string | null
  end?: string | null
}): Promise<CommissionsSummary> {
  const supabase = createAdminClient()

  const empty: CommissionsSummary = {
    pendingAmount: 0,
    pendingCount: 0,
    paidAmount: 0,
    paidCount: 0,
  }

  // Es una cifra de rentabilidad: no se expone a recepcion ni a los profesionales
  const { error: authError } = await requireAdmin()
  if (authError) return empty

  try {
    // Deuda viva: no depende del periodo, es lo que se debe hoy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingRows } = await (supabase as any)
      .from('commissions')
      .select('commission_amount')
      .in('status', ['pending', 'approved'])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let paidQuery = (supabase as any)
      .from('commissions')
      .select('commission_amount, payment_date')
      .eq('status', 'paid')
    if (range?.start) paidQuery = paidQuery.gte('payment_date', range.start)
    if (range?.end) paidQuery = paidQuery.lte('payment_date', range.end)
    const { data: paidRows } = await paidQuery

    const round = (n: number) => Math.round(n * 100) / 100
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sum = (rows: any[]) => rows.reduce((s, r) => s + Number(r.commission_amount || 0), 0)

    return {
      pendingAmount: round(sum(pendingRows || [])),
      pendingCount: (pendingRows || []).length,
      paidAmount: round(sum(paidRows || [])),
      paidCount: (paidRows || []).length,
    }
  } catch {
    // La tabla puede no existir en instalaciones viejas
    return empty
  }
}
