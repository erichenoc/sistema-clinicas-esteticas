'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeError } from '@/lib/error-utils'
import { createExpense, registerExpensePayment } from '@/actions/expenses'
import {
  calculatePayrollLine,
  calculateEmployerCost,
  formatPeriodLabel,
} from '@/lib/payroll/calculations'
import { periodBounds } from '@/lib/periods'

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
  /** null en una nomina pagada = el dinero salio sin quedar en el flujo de caja */
  expenseId: string | null
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

  // Una nomina anulada deja el mes abierto otra vez: se vuelve a calcular.
  // El documento anulado sigue visible en el historial.
  if (!saved || saved.status === 'cancelled') {
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

  if (existing && existing.status !== 'cancelled') {
    return { error: `La nomina de ${formatPeriodLabel(period)} ya esta cerrada` }
  }

  // Si la anterior fue anulada, se reemplaza: el rastro quedo en audit_logs
  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('payroll_periods').delete().eq('id', existing.id)
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

// Crea el gasto de una nomina y registra su pago.
// El gasto pertenece al mes de la nomina, no al dia en que se marca pagada:
// si no, la nomina de julio aparece como gasto de agosto y el mes no cuadra.
async function createPayrollExpense(
  period: string,
  totalNet: number,
  paymentMethod: PayrollPaymentMethod
): Promise<{ expenseId: string | null; error: string | null }> {
  const { end: periodEnd } = periodBounds(period)
  const label = formatPeriodLabel(period)

  const { data: expense, error: expError } = await createExpense({
    supplier_name: 'Nomina de empleados',
    category: 'nomina',
    subcategory: 'Sueldos fijos',
    concept: `Pago de nomina ${label}`,
    issue_date: periodEnd,
    due_date: periodEnd,
    subtotal: totalNet,
    tax_amount: 0,
    total: totalNet,
    payment_method: paymentMethod,
  })

  if (expError || !expense) {
    return { expenseId: null, error: expError || 'No se pudo registrar el gasto de la nomina' }
  }

  const { error: payError } = await registerExpensePayment(expense.id, {
    amount: totalNet,
    payment_method: paymentMethod,
    payment_date: periodEnd,
  })

  if (payError) {
    return { expenseId: expense.id, error: `El gasto se creo pero el pago no se registro: ${payError}` }
  }

  return { expenseId: expense.id, error: null }
}

// Marca la nomina como pagada y registra la salida de dinero como gasto.
// Si el gasto no se puede crear, la nomina NO se marca como pagada: de lo
// contrario el dinero sale sin aparecer nunca en el flujo de caja.
export async function markPayrollAsPaid(
  periodId: string,
  paymentMethod: PayrollPaymentMethod = 'transfer'
): Promise<{ error: string | null }> {
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

  let expenseId: string | null = payroll.expense_id
  if (!expenseId) {
    const result = await createPayrollExpense(
      payroll.period,
      Number(payroll.total_net || 0),
      paymentMethod
    )
    if (result.error) return { error: result.error }
    expenseId = result.expenseId
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
  revalidatePath('/facturacion')
  return { error: null }
}

// Repara nominas que quedaron pagadas sin gasto: el dinero salio pero no
// aparece en el flujo de caja. Crea el gasto que falto.
export async function ensurePayrollExpense(
  periodId: string
): Promise<{ error: string | null }> {
  const { error: authError } = await requirePayrollAccess()
  if (authError) return { error: authError }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payroll } = await (supabase as any)
    .from('payroll_periods')
    .select('id, period, status, total_net, expense_id, payment_method')
    .eq('id', periodId)
    .single()

  if (!payroll) return { error: 'Nomina no encontrada' }
  if (payroll.status !== 'paid') return { error: 'Solo aplica a nominas ya pagadas' }
  if (payroll.expense_id) return { error: 'Esta nomina ya tiene su gasto registrado' }

  const result = await createPayrollExpense(
    payroll.period,
    Number(payroll.total_net || 0),
    (payroll.payment_method as PayrollPaymentMethod) || 'transfer'
  )
  if (result.error) return { error: result.error }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('payroll_periods')
    .update({ expense_id: result.expenseId, updated_at: new Date().toISOString() })
    .eq('id', periodId)

  if (error) {
    console.error('Error linking payroll expense:', error)
    return { error: 'El gasto se creo pero no quedo enlazado a la nomina' }
  }

  revalidatePath('/nomina')
  revalidatePath('/facturacion/gastos')
  revalidatePath('/facturacion')
  return { error: null }
}

// Revierte el pago: borra el gasto y sus abonos, y devuelve la nomina a
// cerrada para poder corregirla. Es la salida cuando se pago por error.
export async function unmarkPayrollAsPaid(
  periodId: string
): Promise<{ error: string | null }> {
  const { error: authError } = await requirePayrollAccess()
  if (authError) return { error: authError }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payroll } = await (supabase as any)
    .from('payroll_periods')
    .select('id, status, expense_id')
    .eq('id', periodId)
    .single()

  if (!payroll) return { error: 'Nomina no encontrada' }
  if (payroll.status !== 'paid') return { error: 'Esta nomina no esta marcada como pagada' }

  if (payroll.expense_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('expense_payments').delete().eq('expense_id', payroll.expense_id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: expError } = await (supabase as any)
      .from('expenses')
      .delete()
      .eq('id', payroll.expense_id)
    if (expError) {
      console.error('Error deleting payroll expense:', expError)
      return { error: 'No se pudo revertir el gasto de la nomina' }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('payroll_periods')
    .update({
      status: 'closed',
      paid_at: null,
      payment_method: null,
      expense_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', periodId)

  if (error) {
    console.error('Error unmarking payroll as paid:', error)
    return { error: 'Error al revertir el pago de la nomina' }
  }

  revalidatePath('/nomina')
  revalidatePath('/facturacion/gastos')
  revalidatePath('/facturacion')
  return { error: null }
}

// Anula una nomina cerrada o pagada por error. Queda en el historial como
// documento anulado y su gasto desaparece del flujo de caja.
export async function cancelPayrollPeriod(
  periodId: string,
  reason?: string | null
): Promise<{ error: string | null }> {
  const { userId, error: authError } = await requirePayrollAccess()
  if (authError) return { error: authError }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payroll } = await (supabase as any)
    .from('payroll_periods')
    .select('*, payroll_items (*)')
    .eq('id', periodId)
    .single()

  if (!payroll) return { error: 'Nomina no encontrada' }
  if (payroll.status === 'cancelled') return { error: 'Esta nomina ya esta anulada' }

  // Anular una nomina pagada borra dinero del flujo de caja: queda el rastro
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: auditError } = await (supabase as any).from('audit_logs').insert({
    clinic_id: payroll.clinic_id ?? null,
    user_id: userId,
    action: 'cancel_payroll_period',
    table_name: 'payroll_periods',
    record_id: periodId,
    old_data: payroll,
  })

  if (auditError) {
    console.error('Error writing audit log for payroll cancellation:', auditError)
    return { error: 'No se pudo registrar la auditoria. La nomina no fue anulada.' }
  }

  if (payroll.expense_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('expense_payments').delete().eq('expense_id', payroll.expense_id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('expenses')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', payroll.expense_id)
  }

  const cancelNote = `[Anulada${reason?.trim() ? `: ${reason.trim()}` : ''}]`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('payroll_periods')
    .update({
      status: 'cancelled',
      notes: payroll.notes ? `${payroll.notes}\n${cancelNote}` : cancelNote,
      updated_at: new Date().toISOString(),
    })
    .eq('id', periodId)

  if (error) {
    console.error('Error cancelling payroll period:', error)
    return { error: 'Error al anular la nomina' }
  }

  revalidatePath('/nomina')
  revalidatePath('/facturacion/gastos')
  revalidatePath('/facturacion')
  return { error: null }
}

// Recalcula los totales del periodo a partir de sus lineas guardadas.
// Se llama cada vez que se corrige una linea de una nomina ya cerrada.
async function recalculatePayrollTotals(periodId: string): Promise<void> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from('payroll_items')
    .select('gross_salary, total_deductions, net_salary, apply_deductions')
    .eq('payroll_period_id', periodId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lines = ((items || []) as any[]).map((i) => ({
    grossSalary: Number(i.gross_salary || 0),
    totalDeductions: Number(i.total_deductions || 0),
    netSalary: Number(i.net_salary || 0),
    applyDeductions: i.apply_deductions !== false,
  }))

  const round = (n: number) => Math.round(n * 100) / 100

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('payroll_periods')
    .update({
      employee_count: lines.length,
      total_gross: round(lines.reduce((s, l) => s + l.grossSalary, 0)),
      total_deductions: round(lines.reduce((s, l) => s + l.totalDeductions, 0)),
      total_net: round(lines.reduce((s, l) => s + l.netSalary, 0)),
      employer_cost: calculateEmployerCost(lines),
      updated_at: new Date().toISOString(),
    })
    .eq('id', periodId)
}

export interface UpdatePayrollLineInput {
  baseSalary?: number
  commissions?: number
  bonuses?: number
  overtime?: number
  otherDeductions?: number
  applyDeductions?: boolean
  notes?: string | null
}

/**
 * Corrige una linea de una nomina ya cerrada y recalcula el mes.
 * Cerrar congela los montos, pero un error de digitacion no puede dejar la
 * nomina inservible: mientras no se haya pagado, se puede corregir.
 */
export async function updatePayrollLine(
  itemId: string,
  input: UpdatePayrollLineInput
): Promise<{ error: string | null }> {
  const { error: authError } = await requirePayrollAccess()
  if (authError) return { error: authError }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: item } = await (supabase as any)
    .from('payroll_items')
    .select('*, payroll_periods:payroll_period_id (id, status, period)')
    .eq('id', itemId)
    .single()

  if (!item) return { error: 'Linea de nomina no encontrada' }

  const period = item.payroll_periods
  if (!period) return { error: 'La linea no pertenece a ninguna nomina' }
  if (period.status === 'paid') {
    return {
      error: 'La nomina ya esta pagada. Revierte el pago para poder corregirla.',
    }
  }
  if (period.status === 'cancelled') return { error: 'Esta nomina fue anulada' }

  const baseSalary = input.baseSalary ?? Number(item.base_salary || 0)
  const commissions = input.commissions ?? Number(item.commissions || 0)
  const bonuses = input.bonuses ?? Number(item.bonuses || 0)
  const overtime = input.overtime ?? Number(item.overtime || 0)
  const otherDeductions = input.otherDeductions ?? Number(item.other_deductions || 0)
  const applyDeductions = input.applyDeductions ?? item.apply_deductions !== false

  const negative = [baseSalary, commissions, bonuses, overtime, otherDeductions].some(
    (n) => !Number.isFinite(n) || n < 0
  )
  if (negative) return { error: 'Los montos no pueden ser negativos' }

  const calc = calculatePayrollLine({
    baseSalary,
    commissions,
    bonuses,
    overtime,
    otherDeductions,
    applyDeductions,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('payroll_items')
    .update({
      base_salary: baseSalary,
      commissions,
      bonuses,
      overtime,
      apply_deductions: applyDeductions,
      gross_salary: calc.grossSalary,
      afp_employee: calc.afpEmployee,
      ars_employee: calc.arsEmployee,
      isr_withholding: calc.isrWithholding,
      other_deductions: calc.otherDeductions,
      total_deductions: calc.totalDeductions,
      net_salary: calc.netSalary,
      notes: input.notes !== undefined ? input.notes?.trim() || null : item.notes,
    })
    .eq('id', itemId)

  if (error) {
    console.error('Error updating payroll line:', error)
    return { error: sanitizeError(error, 'Error al corregir la linea de la nomina') }
  }

  await recalculatePayrollTotals(period.id)

  revalidatePath('/nomina')
  return { error: null }
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
    return { error: 'Revierte primero el pago para poder corregir o reabrir esta nomina.' }
  }
  if (payroll.status === 'cancelled') {
    return { error: 'Esta nomina fue anulada: el mes ya esta abierto para calcularse de nuevo.' }
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
    .select('id, period, status, employee_count, total_gross, total_net, closed_at, paid_at, expense_id')
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
      expenseId: p.expense_id,
    })),
    error: null,
  }
}
