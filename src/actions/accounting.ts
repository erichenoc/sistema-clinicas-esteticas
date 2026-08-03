'use server'

// =============================================
// CONTABILIDAD / DGII
// =============================================
// Resumen de ITBIS a partir de datos reales: lo cobrado sale de las facturas
// emitidas y lo pagado de los gastos a proveedores, ambos acotados al periodo.
// Es informacion de dueno: solo admin/owner.
// =============================================

import { createAdminClient, createClient } from '@/lib/supabase/server'

const CLINIC_ID = '00000000-0000-0000-0000-000000000001'

export interface ItbisSummary {
  /** Periodo AAAAMM */
  period: string
  /** Ventas con comprobante fiscal (B01) */
  salesB01Total: number
  /** Ventas con comprobante de consumo (B02) y sin NCF */
  salesB02Total: number
  salesTaxableAmount: number
  salesItbisCollected: number
  purchasesTotal: number
  purchasesItbisPaid: number
  /** Positivo: se le debe a la DGII. Negativo: queda saldo a favor. */
  itbisToPayOrCredit: number
  invoicesIssued: number
}

const EMPTY_SUMMARY = (period: string): ItbisSummary => ({
  period,
  salesB01Total: 0,
  salesB02Total: 0,
  salesTaxableAmount: 0,
  salesItbisCollected: 0,
  purchasesTotal: 0,
  purchasesItbisPaid: 0,
  itbisToPayOrCredit: 0,
  invoicesIssued: 0,
})

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return false

  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (adminClient as any)
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  return data?.role === 'admin' || data?.role === 'owner'
}

const round2 = (n: number) => Math.round(n * 100) / 100

// period: 'AAAAMM' (ej. '202608')
export async function getItbisSummary(period: string): Promise<ItbisSummary> {
  if (!/^\d{6}$/.test(period)) return EMPTY_SUMMARY(period)
  if (!(await isAdmin())) return EMPTY_SUMMARY(period)

  const year = Number(period.slice(0, 4))
  const month = Number(period.slice(4, 6))
  const from = `${period.slice(0, 4)}-${period.slice(4, 6)}-01`
  const to = `${period.slice(0, 4)}-${period.slice(4, 6)}-${String(
    new Date(year, month, 0).getDate()
  ).padStart(2, '0')}`

  const supabase = createAdminClient()

  // Las facturas anuladas no generan ITBIS
  const [salesRes, purchasesRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('invoices')
      .select('total, tax_amount, ncf, ncf_type, status')
      .eq('clinic_id', CLINIC_ID)
      .gte('issue_date', from)
      .lte('issue_date', to)
      .neq('status', 'cancelled')
      .limit(5000),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('expenses')
      .select('total, tax_amount, status')
      .eq('clinic_id', CLINIC_ID)
      .gte('issue_date', from)
      .lte('issue_date', to)
      .neq('status', 'cancelled')
      .limit(5000),
  ])

  if (salesRes.error) console.error('Error fetching invoices for ITBIS:', salesRes.error)
  if (purchasesRes.error) console.error('Error fetching expenses for ITBIS:', purchasesRes.error)

  const summary = EMPTY_SUMMARY(period)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const inv of (salesRes.data || []) as any[]) {
    const total = Number(inv.total || 0)
    const tax = Number(inv.tax_amount || 0)

    // B01 = credito fiscal (empresas). Todo lo demas cuenta como consumo.
    const isFiscalCredit =
      inv.ncf_type === 'B01' || (typeof inv.ncf === 'string' && inv.ncf.startsWith('B01'))

    if (isFiscalCredit) summary.salesB01Total += total
    else summary.salesB02Total += total

    summary.salesTaxableAmount += total
    summary.salesItbisCollected += tax
    if (inv.ncf) summary.invoicesIssued += 1
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const exp of (purchasesRes.data || []) as any[]) {
    summary.purchasesTotal += Number(exp.total || 0)
    summary.purchasesItbisPaid += Number(exp.tax_amount || 0)
  }

  summary.salesB01Total = round2(summary.salesB01Total)
  summary.salesB02Total = round2(summary.salesB02Total)
  summary.salesTaxableAmount = round2(summary.salesTaxableAmount)
  summary.salesItbisCollected = round2(summary.salesItbisCollected)
  summary.purchasesTotal = round2(summary.purchasesTotal)
  summary.purchasesItbisPaid = round2(summary.purchasesItbisPaid)
  summary.itbisToPayOrCredit = round2(
    summary.salesItbisCollected - summary.purchasesItbisPaid
  )

  return summary
}

// Periodos con movimiento, para el selector. Mas reciente primero.
export async function getAvailablePeriods(): Promise<string[]> {
  if (!(await isAdmin())) return []

  const supabase = createAdminClient()

  const [inv, exp] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('invoices').select('issue_date').eq('clinic_id', CLINIC_ID).limit(5000),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('expenses').select('issue_date').eq('clinic_id', CLINIC_ID).limit(5000),
  ])

  const periods = new Set<string>()
  for (const row of [...(inv.data || []), ...(exp.data || [])] as { issue_date?: string }[]) {
    if (row.issue_date) periods.add(row.issue_date.slice(0, 7).replace('-', ''))
  }

  // El mes en curso siempre debe poder consultarse, aunque aun no tenga movimiento
  const now = new Date()
  periods.add(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`)

  return Array.from(periods).sort().reverse()
}
