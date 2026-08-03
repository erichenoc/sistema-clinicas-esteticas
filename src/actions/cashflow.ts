'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { ExpenseCategory, ExpenseStats, CashFlowSummary } from '@/actions/expenses'
import { MONTH_NAMES, formatPeriodLabel, periodBounds } from '@/lib/periods'

// =============================================
// FLUJO DE CAJA
// =============================================
// Responde la pregunta del negocio: cuanto entro, cuanto pague y que me queda.
//
//   Entradas = cobros reales a pacientes  (payments de facturas no anuladas)
//   Salidas  = pagos reales de gastos     (expense_payments)
//   Balance  = entradas - salidas
//
// Se cuenta el dinero cuando se mueve (base de caja), no cuando se factura:
// una factura emitida y no cobrada no es dinero disponible.
// =============================================

// Ademas de los atajos, acepta un mes concreto en formato 'YYYY-MM' para poder
// consultar meses anteriores (ej: '2026-07')
export type CashFlowPeriod = 'month' | 'quarter' | 'year' | 'all' | string

const MONTH_PATTERN = /^\d{4}-\d{2}$/

// Solo admin/dueno: esto expone la rentabilidad del negocio
async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return 'No autorizado'

  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData } = await (adminClient as any)
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
    return 'Solo el administrador o el dueno puede ver el flujo de caja'
  }
  return null
}

function getPeriodRange(period: CashFlowPeriod): {
  start: string | null
  end: string | null
  label: string
} {
  const now = new Date()
  const year = now.getFullYear()

  // Mes concreto: '2026-07'
  if (MONTH_PATTERN.test(period)) {
    const { start, end } = periodBounds(period)
    return { start, end, label: formatPeriodLabel(period) }
  }

  switch (period) {
    case 'month': {
      const start = new Date(year, now.getMonth(), 1)
      return {
        start: start.toISOString().slice(0, 10),
        end: null,
        label: `${MONTH_NAMES[now.getMonth()]} ${year}`,
      }
    }
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
      const start = new Date(year, quarterStartMonth, 1)
      return {
        start: start.toISOString().slice(0, 10),
        end: null,
        label: `Trimestre ${Math.floor(now.getMonth() / 3) + 1} de ${year}`,
      }
    }
    case 'year': {
      const start = new Date(year, 0, 1)
      return { start: start.toISOString().slice(0, 10), end: null, label: `Año ${year}` }
    }
    default:
      return { start: null, end: null, label: 'Histórico completo' }
  }
}

export async function getCashFlowSummary(
  period: CashFlowPeriod = 'month'
): Promise<{ data: CashFlowSummary | null; error: string | null }> {
  const authError = await requireAdmin()
  if (authError) return { data: null, error: authError }

  const supabase = createAdminClient()
  const { start, end, label } = getPeriodRange(period)

  // --- ENTRADAS: cobros a pacientes (se excluyen facturas anuladas) ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let incomeQuery = (supabase as any)
    .from('payments')
    .select('amount, payment_date, invoices!inner (status)')
  if (start) incomeQuery = incomeQuery.gte('payment_date', start)
  // Un mes cerrado se acota tambien por arriba
  if (end) incomeQuery = incomeQuery.lte('payment_date', `${end}T23:59:59`)

  const { data: incomeRows, error: incomeError } = await incomeQuery
  if (incomeError) {
    console.error('Error fetching income for cash flow:', incomeError)
    return { data: null, error: 'Error al calcular los ingresos' }
  }

  const income = (incomeRows || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => p.invoices?.status !== 'cancelled')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0)

  // --- SALIDAS: pagos de gastos ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let expenseQuery = (supabase as any).from('expense_payments').select('amount, payment_date')
  if (start) expenseQuery = expenseQuery.gte('payment_date', start)
  if (end) expenseQuery = expenseQuery.lte('payment_date', end)

  const { data: expenseRows, error: expenseError } = await expenseQuery
  if (expenseError) {
    console.error('Error fetching expense payments for cash flow:', expenseError)
    return { data: null, error: 'Error al calcular los gastos' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expenses = (expenseRows || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0)

  // --- PENDIENTES (no dependen del periodo: es lo que esta abierto hoy) ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: openInvoices } = await (supabase as any)
    .from('invoices')
    .select('total, status, payments (amount)')
    .not('status', 'in', '("cancelled","paid")')

  const pendingToCollect = (openInvoices || []).reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, inv: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paid = (inv.payments || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
      return sum + Math.max(0, Number(inv.total || 0) - paid)
    },
    0
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: openExpenses } = await (supabase as any)
    .from('expenses')
    .select('total, status, expense_payments (amount)')
    .not('status', 'in', '("cancelled","paid")')

  const pendingToPay = (openExpenses || []).reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, exp: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paid = (exp.expense_payments || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
      return sum + Math.max(0, Number(exp.total || 0) - paid)
    },
    0
  )

  const round = (n: number) => Math.round(n * 100) / 100

  return {
    data: {
      income: round(income),
      expenses: round(expenses),
      balance: round(income - expenses),
      pending_to_collect: round(pendingToCollect),
      pending_to_pay: round(pendingToPay),
      // Si cobro todo lo que me deben y pago todo lo que debo
      projected_balance: round(income - expenses + pendingToCollect - pendingToPay),
      period_label: label,
    },
    error: null,
  }
}

// Las cifras se acotan al mismo periodo que el flujo de caja, para que toda la
// pantalla hable del mismo rango de fechas.
export async function getExpenseStats(
  period: CashFlowPeriod = 'month'
): Promise<{ data: ExpenseStats | null; error: string | null }> {
  const authError = await requireAdmin()
  if (authError) return { data: null, error: authError }

  const supabase = createAdminClient()
  const { start, end } = getPeriodRange(period)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('expenses')
    .select('total, status, category, due_date, issue_date, expense_payments (amount, payment_date)')

  if (start) query = query.gte('issue_date', start)
  if (end) query = query.lte('issue_date', end)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching expense stats:', error)
    return { data: null, error: 'Error al calcular las estadisticas' }
  }

  const today = new Date()
  const paidFrom = start || '0001-01-01'
  const paidTo = end || '9999-12-31'

  let totalPending = 0
  let totalOverdue = 0
  let overdueCount = 0
  let pendingCount = 0
  let paidThisMonth = 0
  let paidCountThisMonth = 0

  const byCategory = new Map<ExpenseCategory, { total: number; pending: number }>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const exp of (data || []) as any[]) {
    if (exp.status === 'cancelled') continue

    const total = Number(exp.total || 0)
    const payments = exp.expense_payments || []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paid = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
    const pending = Math.max(0, total - paid)

    if (pending > 0) {
      totalPending += pending
      pendingCount += 1

      // Vencido: la fecha limite ya paso y todavia se debe
      if (exp.due_date && new Date(exp.due_date) < today) {
        totalOverdue += pending
        overdueCount += 1
      }
    }

    const cat = (exp.category || 'otros') as ExpenseCategory
    const acc = byCategory.get(cat) || { total: 0, pending: 0 }
    acc.total += total
    acc.pending += pending
    byCategory.set(cat, acc)
  }

  // Pagos realizados dentro del periodo, sin importar cuando se emitio el gasto
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let paidQuery = (supabase as any).from('expense_payments').select('amount, payment_date')
  if (start) paidQuery = paidQuery.gte('payment_date', paidFrom)
  if (end) paidQuery = paidQuery.lte('payment_date', paidTo)
  const { data: paidRows } = await paidQuery

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of ((paidRows || []) as any[])) {
    paidThisMonth += Number(p.amount || 0)
    paidCountThisMonth += 1
  }

  const round = (n: number) => Math.round(n * 100) / 100

  return {
    data: {
      total_pending: round(totalPending),
      total_overdue: round(totalOverdue),
      overdue_count: overdueCount,
      pending_count: pendingCount,
      paid_this_month: round(paidThisMonth),
      paid_count_this_month: paidCountThisMonth,
      by_category: Array.from(byCategory.entries())
        .map(([category, v]) => ({
          category,
          total: round(v.total),
          pending: round(v.pending),
        }))
        .sort((a, b) => b.total - a.total),
    },
    error: null,
  }
}
