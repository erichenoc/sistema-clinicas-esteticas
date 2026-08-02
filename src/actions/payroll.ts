'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeError } from '@/lib/error-utils'
import { createExpense } from '@/actions/expenses'
import {
  calculatePayrollLine,
  calculateEmployerCost,
  formatPeriodLabel,
} from '@/lib/payroll/calculations'

// TODO: obtener del usuario actual cuando el sistema sea multi-clinica
const CLINIC_ID = '00000000-0000-0000-0000-000000000001'

export type PayrollStatus = 'draft' | 'closed' | 'paid' | 'cancelled'
export type PayrollPaymentMethod = 'cash' | 'transfer' | 'check' | 'other'

export interface PayrollLine {
  /** id del item guardado; null cuando es una previsualizacion sin cerrar */
  id: string | null
  userId: string | null
  employeeName: string
  employeeDocument: string | null
  position: string | null
  baseSalary: number
  commissions: number
  bonuses: number
  overtime: number
  grossSalary: number
  applyDeductions: boolean
  afpEmployee: number
  arsEmployee: number
  isrWithholding: number
  otherDeductions: number
  totalDeductions: number
  netSalary: number
  notes: string | null
}

export interface PayrollPeriodData {
  id: string | null
  period: string
  periodLabel: string
  /** 'draft' = calculada al vuelo, todavia no existe en la base */
  status: PayrollStatus
  employeeCount: number
  totalGross: number
  totalDeductions: number
  totalNet: number
  employerCost: number
  notes: string | null
  closedByName: string | null
  closedAt: string | null
  paidAt: string | null
  paymentMethod: string | null
  expenseId: string | null
  lines: PayrollLine[]
}

export interface PayrollHistoryEntry {
  id: string
  period: string
  periodLabel: string
  status: PayrollStatus
  employeeCount: number
  totalGross: number
  totalNet: number
  closedAt: string | null
  paidAt: string | null
}

/** Ajustes que el usuario puede hacer antes de cerrar el mes */
export interface PayrollAdjustment {
  userId: string
  commissions?: number
  bonuses?: number
  overtime?: number
  otherDeductions?: number
  notes?: string | null
}

// La nomina es informacion de dueno: admin/owner unicamente
async function requirePayrollAccess(): Promise<{ userId: string; error: string | null }> {
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
    return { userId: authUser.id, error: 'Solo el administrador o el dueno puede gestionar la nomina' }
  }
  return { userId: authUser.id, error: null }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSavedLine(item: any): PayrollLine {
  return {
    id: item.id,
    userId: item.user_id,
    employeeName: item.employee_name,
    employeeDocument: item.employee_document,
    position: item.position,
    baseSalary: Number(item.base_salary || 0),
    commissions: Number(item.commissions || 0),
    bonuses: Number(item.bonuses || 0),
    overtime: Number(item.overtime || 0),
    grossSalary: Number(item.gross_salary || 0),
    applyDeductions: item.apply_deductions !== false,
    afpEmployee: Number(item.afp_employee || 0),
    arsEmployee: Number(item.ars_employee || 0),
    isrWithholding: Number(item.isr_withholding || 0),
    otherDeductions: Number(item.other_deductions || 0),
    totalDeductions: Number(item.total_deductions || 0),
    netSalary: Number(item.net_salary || 0),
    notes: item.notes,
  }
}

// Calcula la nomina del mes desde los empleados activos, sin guardar nada.
// Es lo que se ve mientras el mes no se ha cerrado.
async function buildDraft(
  period: string,
  adjustments: PayrollAdjustment[] = []
): Promise<PayrollPeriodData> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: employees } = await (supabase as any)
    .from('users')
    .select('id, first_name, last_name, license_number, job_title, base_salary, apply_payroll_deductions')
    .eq('is_professional', true)
    .eq('is_active', true)
    .order('first_name', { ascending: true })
    .limit(200)

  const adjustmentMap = new Map(adjustments.map((a) => [a.userId, a]))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lines: PayrollLine[] = ((employees || []) as any[]).map((emp) => {
    const adj = adjustmentMap.get(emp.id)
    const applyDeductions = emp.apply_payroll_deductions !== false
    const calc = calculatePayrollLine({
      baseSalary: Number(emp.base_salary || 0),
      commissions: adj?.commissions || 0,
      bonuses: adj?.bonuses || 0,
      overtime: adj?.overtime || 0,
      otherDeductions: adj?.otherDeductions || 0,
      applyDeductions,
    })

    return {
      id: null,
      userId: emp.id,
      employeeName: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Empleado',
      employeeDocument: emp.license_number || null,
      position: emp.job_title || null,
      baseSalary: Number(emp.base_salary || 0),
      commissions: adj?.commissions || 0,
      bonuses: adj?.bonuses || 0,
      overtime: adj?.overtime || 0,
      applyDeductions,
      notes: adj?.notes ?? null,
      ...calc,
    }
  })

  return {
    id: null,
    period,
    periodLabel: formatPeriodLabel(period),
    status: 'draft',
    employeeCount: lines.length,
    totalGross: lines.reduce((s, l) => s + l.grossSalary, 0),
    totalDeductions: lines.reduce((s, l) => s + l.totalDeductions, 0),
    totalNet: lines.reduce((s, l) => s + l.netSalary, 0),
    employerCost: calculateEmployerCost(lines),
    notes: null,
    closedByName: null,
    closedAt: null,
    paidAt: null,
    paymentMethod: null,
    expenseId: null,
    lines,
  }
}

// Devuelve la nomina del mes: la guardada si ya se cerro, o el calculo al vuelo
export async function getPayrollPeriod(
  period: string,
  adjustments: PayrollAdjustment[] = []
): Promise<{ data: PayrollPeriodData | null; error: string | null }> {
  const { error: authError } = await requirePayrollAccess()
  if (authError) return { data: null, error: authError }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: saved } = await (supabase as any)
    .from('payroll_periods')
    .select('*, payroll_items (*), closed_by_user:closed_by (first_name, last_name)')
    .eq('clinic_id', CLINIC_ID)
    .eq('period', period)
    .maybeSingle()

  if (!saved) {
    return { data: await buildDraft(period, adjustments), error: null }
  }

  const closedByUser = saved.closed_by_user
  return {
    data: {
      id: saved.id,
      period: saved.period,
      periodLabel: formatPeriodLabel(saved.period),
      status: saved.status as PayrollStatus,
      employeeCount: saved.employee_count,
      totalGross: Number(saved.total_gross || 0),
      totalDeductions: Number(saved.total_deductions || 0),
      totalNet: Number(saved.total_net || 0),
      employerCost: Number(saved.employer_cost || 0),
      notes: saved.notes,
      closedByName: closedByUser
        ? `${closedByUser.first_name || ''} ${closedByUser.last_name || ''}`.trim() || null
        : null,
      closedAt: saved.closed_at,
      paidAt: saved.paid_at,
      paymentMethod: saved.payment_method,
      expenseId: saved.expense_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lines: ((saved.payroll_items || []) as any[])
        .map(mapSavedLine)
        .sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
    },
    error: null,
  }
}

// Cierra el mes: congela el calculo actual como documento historico
export async function closePayrollPeriod(
  period: string,
  adjustments: PayrollAdjustment[] = [],
  notes?: string | null
): Promise<{ error: string | null }> {
  const { userId, error: authError } = await requirePayrollAccess()
  if (authError) return { error: authError }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('payroll_periods')
    .select('id, status')
    .eq('clinic_id', CLINIC_ID)
    .eq('period', period)
    .maybeSingle()

  if (existing) {
    return { error: `La nomina de ${formatPeriodLabel(period)} ya esta cerrada` }
  }

  const draft = await buildDraft(period, adjustments)

  if (draft.lines.length === 0) {
    return { error: 'No hay empleados activos para cerrar la nomina' }
  }
  if (draft.totalGross <= 0) {
    return { error: 'No se puede cerrar una nomina en cero: revisa los sueldos de los empleados' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error: periodError } = await (supabase as any)
    .from('payroll_periods')
    .insert({
      clinic_id: CLINIC_ID,
      period,
      status: 'closed',
      employee_count: draft.employeeCount,
      total_gross: draft.totalGross,
      total_deductions: draft.totalDeductions,
      total_net: draft.totalNet,
      employer_cost: draft.employerCost,
      notes: notes?.trim() || null,
      closed_by: userId,
      closed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (periodError || !created) {
    console.error('Error closing payroll period:', periodError)
    return { error: sanitizeError(periodError, 'Error al cerrar la nomina') }
  }

  const items = draft.lines.map((l) => ({
    payroll_period_id: created.id,
    user_id: l.userId,
    employee_name: l.employeeName,
    employee_document: l.employeeDocument,
    position: l.position,
    base_salary: l.baseSalary,
    commissions: l.commissions,
    bonuses: l.bonuses,
    overtime: l.overtime,
    gross_salary: l.grossSalary,
    apply_deductions: l.applyDeductions,
    afp_employee: l.afpEmployee,
    ars_employee: l.arsEmployee,
    isr_withholding: l.isrWithholding,
    other_deductions: l.otherDeductions,
    total_deductions: l.totalDeductions,
    net_salary: l.netSalary,
    notes: l.notes,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase as any).from('payroll_items').insert(items)

  if (itemsError) {
    console.error('Error inserting payroll items:', itemsError)
    // Sin detalle por empleado la nomina no sirve: se revierte el cierre
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('payroll_periods').delete().eq('id', created.id)
    return { error: 'Error al guardar el detalle de la nomina' }
  }

  revalidatePath('/nomina')
  return { error: null }
}

// Marca la nomina como pagada y registra la salida de dinero como gasto
export async function markPayrollAsPaid(
  periodId: string,
  paymentMethod: PayrollPaymentMethod = 'transfer'
): Promise<{ error: string | null; expenseError?: string | null }> {
  const { error: authError } = await requirePayrollAccess()
  if (authError) return { error: authError }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payroll } = await (supabase as any)
    .from('payroll_periods')
    .select('id, period, status, total_net, expense_id')
    .eq('id', periodId)
    .single()

  if (!payroll) return { error: 'Nomina no encontrada' }
  if (payroll.status === 'paid') return { error: 'Esta nomina ya esta marcada como pagada' }
  if (payroll.status === 'cancelled') return { error: 'Esta nomina fue anulada' }

  const label = formatPeriodLabel(payroll.period)

  // El pago de nomina es dinero que sale: se refleja en el flujo de caja
  let expenseId: string | null = payroll.expense_id
  let expenseError: string | null = null
  if (!expenseId) {
    const { data: expense, error: expError } = await createExpense({
      supplier_name: 'Nomina de empleados',
      category: 'nomina',
      subcategory: 'Sueldos fijos',
      concept: `Pago de nomina ${label}`,
      subtotal: Number(payroll.total_net || 0),
      tax_amount: 0,
      total: Number(payroll.total_net || 0),
      payment_method: paymentMethod,
    })
    if (expError) {
      expenseError = expError
    } else {
      expenseId = expense?.id ?? null
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('payroll_periods')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: paymentMethod,
      expense_id: expenseId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', periodId)

  if (error) {
    console.error('Error marking payroll as paid:', error)
    return { error: 'Error al marcar la nomina como pagada' }
  }

  revalidatePath('/nomina')
  revalidatePath('/facturacion/gastos')
  return { error: null, expenseError }
}

// Reabrir un mes cerrado por error. No se permite si ya se pago.
export async function reopenPayrollPeriod(periodId: string): Promise<{ error: string | null }> {
  const { error: authError } = await requirePayrollAccess()
  if (authError) return { error: authError }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payroll } = await (supabase as any)
    .from('payroll_periods')
    .select('id, status, period')
    .eq('id', periodId)
    .single()

  if (!payroll) return { error: 'Nomina no encontrada' }
  if (payroll.status === 'paid') {
    return { error: 'No se puede reabrir una nomina ya pagada. Anulala si fue un error.' }
  }

  // Al borrar el periodo se van sus items en cascada y el mes vuelve a calcularse
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('payroll_periods').delete().eq('id', periodId)

  if (error) {
    console.error('Error reopening payroll period:', error)
    return { error: 'Error al reabrir la nomina' }
  }

  revalidatePath('/nomina')
  return { error: null }
}

// Historial real de nominas cerradas
export async function getPayrollHistory(): Promise<{
  data: PayrollHistoryEntry[]
  error: string | null
}> {
  const { error: authError } = await requirePayrollAccess()
  if (authError) return { data: [], error: authError }

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('payroll_periods')
    .select('id, period, status, employee_count, total_gross, total_net, closed_at, paid_at')
    .eq('clinic_id', CLINIC_ID)
    .order('period', { ascending: false })
    .limit(60)

  if (error) {
    console.error('Error fetching payroll history:', error)
    return { data: [], error: 'Error al cargar el historial' }
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: ((data || []) as any[]).map((p) => ({
      id: p.id,
      period: p.period,
      periodLabel: formatPeriodLabel(p.period),
      status: p.status as PayrollStatus,
      employeeCount: p.employee_count,
      totalGross: Number(p.total_gross || 0),
      totalNet: Number(p.total_net || 0),
      closedAt: p.closed_at,
      paidAt: p.paid_at,
    })),
    error: null,
  }
}
