'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipos
export type SaleStatus = 'pending' | 'paid' | 'partial' | 'cancelled' | 'refunded'
export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'cancelled'
export type PaymentMethod = 'cash' | 'card_debit' | 'card_credit' | 'transfer' | 'check' | 'patient_credit' | 'other'

export interface SaleData {
  id: string
  clinic_id: string
  branch_id: string | null
  cash_session_id: string | null
  sale_number: string
  sale_type: string
  patient_id: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  sold_by: string
  professional_id: string | null
  subtotal: number
  discount_amount: number
  discount_reason: string | null
  tax_amount: number
  total: number
  coupon_id: string | null
  coupon_discount: number
  credit_used: number
  status: SaleStatus
  paid_at: string | null
  notes: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
}

export interface SaleListItemData extends SaleData {
  patient_name: string | null
  sold_by_name: string
  items_count: number
  paid_amount: number
}

export interface InvoiceData {
  id: string
  clinic_id: string
  sale_id: string
  invoice_number: string
  invoice_series: string | null
  customer_tax_id: string | null
  customer_legal_name: string | null
  customer_address: string | null
  customer_email: string | null
  subtotal: number
  tax_amount: number
  total: number
  pdf_url: string | null
  xml_url: string | null
  status: InvoiceStatus
  created_at: string
  cancelled_at: string | null
  cancellation_reason: string | null
}

export interface InvoiceListItemData extends InvoiceData {
  sale_number: string
  patient_name: string | null
  amount_due: number
}

export interface PaymentData {
  id: string
  sale_id: string
  cash_session_id: string | null
  payment_method: PaymentMethod
  amount: number
  amount_received: number | null
  change_given: number | null
  reference_number: string | null
  card_last_four: string | null
  card_brand: string | null
  bank_name: string | null
  status: string
  notes: string | null
  created_at: string
  created_by: string
}

export interface BillingStats {
  total_invoiced: number
  invoiced_this_month: number
  pending_collection: number
  overdue_amount: number
  paid_count: number
  pending_count: number
  overdue_count: number
}

// =============================================
// VENTAS
// =============================================

// Obtener ventas con datos expandidos
export async function getSales(options?: {
  startDate?: string
  endDate?: string
  status?: SaleStatus
  patientId?: string
}): Promise<SaleListItemData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('sales')
    .select(`
      *,
      patients (
        first_name,
        last_name
      ),
      users!sales_sold_by_fkey (
        full_name
      ),
      sale_items (
        id
      ),
      payments (
        amount,
        status
      )
    `)
    .order('created_at', { ascending: false })

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate)
  }
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.patientId) {
    query = query.eq('patient_id', options.patientId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching sales:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((sale: any) => {
    const paidAmount = sale.payments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.filter((p: any) => p.status === 'completed')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

    return {
      ...sale,
      patient_name: sale.patients
        ? `${sale.patients.first_name || ''} ${sale.patients.last_name || ''}`.trim()
        : sale.customer_name,
      sold_by_name: sale.users?.full_name || 'Usuario',
      items_count: sale.sale_items?.length || 0,
      paid_amount: paidAmount,
    }
  })
}

// Obtener venta por ID
export async function getSaleById(id: string): Promise<SaleListItemData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('sales')
    .select(`
      *,
      patients (
        first_name,
        last_name,
        phone,
        email
      ),
      users!sales_sold_by_fkey (
        full_name
      ),
      sale_items (
        *,
        treatments (name),
        products (name)
      ),
      payments (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching sale:', error)
    return null
  }

  const sale = data
  const paidAmount = sale.payments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?.filter((p: any) => p.status === 'completed')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

  return {
    ...sale,
    patient_name: sale.patients
      ? `${sale.patients.first_name || ''} ${sale.patients.last_name || ''}`.trim()
      : sale.customer_name,
    sold_by_name: sale.users?.full_name || 'Usuario',
    items_count: sale.sale_items?.length || 0,
    paid_amount: paidAmount,
  }
}

// =============================================
// FACTURAS
// =============================================

// Obtener facturas
export async function getInvoices(options?: {
  startDate?: string
  endDate?: string
  status?: InvoiceStatus
}): Promise<InvoiceListItemData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('invoices')
    .select(`
      *,
      sales (
        sale_number,
        patient_id,
        customer_name,
        total,
        status,
        patients (
          first_name,
          last_name
        ),
        payments (
          amount,
          status
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate)
  }
  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching invoices:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((inv: any) => {
    const paidAmount = inv.sales?.payments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.filter((p: any) => p.status === 'completed')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

    return {
      ...inv,
      sale_number: inv.sales?.sale_number || '',
      patient_name: inv.sales?.patients
        ? `${inv.sales.patients.first_name || ''} ${inv.sales.patients.last_name || ''}`.trim()
        : inv.sales?.customer_name || inv.customer_legal_name,
      amount_due: inv.total - paidAmount,
    }
  })
}

// Obtener factura por ID
export async function getInvoiceById(id: string): Promise<InvoiceListItemData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('invoices')
    .select(`
      *,
      sales (
        *,
        patients (
          first_name,
          last_name,
          phone,
          email
        ),
        sale_items (*),
        payments (*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching invoice:', error)
    return null
  }

  const inv = data
  const paidAmount = inv.sales?.payments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?.filter((p: any) => p.status === 'completed')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

  return {
    ...inv,
    sale_number: inv.sales?.sale_number || '',
    patient_name: inv.sales?.patients
      ? `${inv.sales.patients.first_name || ''} ${inv.sales.patients.last_name || ''}`.trim()
      : inv.sales?.customer_name || inv.customer_legal_name,
    amount_due: inv.total - paidAmount,
  }
}

// Crear factura
export async function createInvoice(
  saleId: string,
  invoiceData: {
    customer_tax_id?: string
    customer_legal_name?: string
    customer_address?: string
    customer_email?: string
    invoice_series?: string
  }
): Promise<{ data: InvoiceData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Obtener datos de la venta
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sale } = await (supabase as any)
    .from('sales')
    .select('*')
    .eq('id', saleId)
    .single()

  if (!sale) {
    return { data: null, error: 'Venta no encontrada' }
  }

  // Generar numero de factura
  const year = new Date().getFullYear()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lastInvoice } = await (supabase as any)
    .from('invoices')
    .select('invoice_number')
    .eq('clinic_id', sale.clinic_id)
    .ilike('invoice_number', `FAC-${year}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
    .single()

  let sequence = 1
  if (lastInvoice) {
    const match = lastInvoice.invoice_number.match(/FAC-\d{4}-(\d+)/)
    if (match) {
      sequence = parseInt(match[1]) + 1
    }
  }

  const invoiceNumber = `FAC-${year}-${sequence.toString().padStart(5, '0')}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('invoices')
    .insert({
      clinic_id: sale.clinic_id,
      sale_id: saleId,
      invoice_number: invoiceNumber,
      invoice_series: invoiceData.invoice_series,
      customer_tax_id: invoiceData.customer_tax_id,
      customer_legal_name: invoiceData.customer_legal_name,
      customer_address: invoiceData.customer_address,
      customer_email: invoiceData.customer_email,
      subtotal: sale.subtotal,
      tax_amount: sale.tax_amount,
      total: sale.total,
      status: 'issued',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating invoice:', error)
    return { data: null, error: 'Error al crear la factura' }
  }

  revalidatePath('/facturacion')
  return { data: data as InvoiceData, error: null }
}

// Cancelar factura
export async function cancelInvoice(
  id: string,
  reason: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('invoices')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq('id', id)

  if (error) {
    console.error('Error cancelling invoice:', error)
    return { success: false, error: 'Error al anular la factura' }
  }

  revalidatePath('/facturacion')
  return { success: true, error: null }
}

// =============================================
// PAGOS
// =============================================

// Registrar pago
export async function registerPayment(
  saleId: string,
  paymentData: {
    payment_method: PaymentMethod
    amount: number
    amount_received?: number
    reference_number?: string
    card_last_four?: string
    card_brand?: string
    bank_name?: string
    notes?: string
  },
  userId: string
): Promise<{ data: PaymentData | null; error: string | null }> {
  const supabase = createAdminClient()

  const changeGiven = paymentData.amount_received
    ? paymentData.amount_received - paymentData.amount
    : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('payments')
    .insert({
      sale_id: saleId,
      payment_method: paymentData.payment_method,
      amount: paymentData.amount,
      amount_received: paymentData.amount_received,
      change_given: changeGiven,
      reference_number: paymentData.reference_number,
      card_last_four: paymentData.card_last_four,
      card_brand: paymentData.card_brand,
      bank_name: paymentData.bank_name,
      notes: paymentData.notes,
      status: 'completed',
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error registering payment:', error)
    return { data: null, error: 'Error al registrar el pago' }
  }

  // Actualizar estado de la venta
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sale } = await (supabase as any)
    .from('sales')
    .select('total')
    .eq('id', saleId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payments } = await (supabase as any)
    .from('payments')
    .select('amount')
    .eq('sale_id', saleId)
    .eq('status', 'completed')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPaid = payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0

  let newStatus: SaleStatus = 'partial'
  if (totalPaid >= sale.total) {
    newStatus = 'paid'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('sales')
    .update({
      status: newStatus,
      paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
    })
    .eq('id', saleId)

  revalidatePath('/facturacion')
  return { data: data as PaymentData, error: null }
}

// =============================================
// ESTADISTICAS
// =============================================

// Obtener estadisticas de facturacion
export async function getBillingStats(): Promise<BillingStats> {
  const supabase = createAdminClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Obtener todas las ventas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sales } = await (supabase as any)
    .from('sales')
    .select(`
      id,
      total,
      status,
      created_at,
      payments (
        amount,
        status
      )
    `)

  if (!sales) {
    return {
      total_invoiced: 0,
      invoiced_this_month: 0,
      pending_collection: 0,
      overdue_amount: 0,
      paid_count: 0,
      pending_count: 0,
      overdue_count: 0,
    }
  }

  let totalInvoiced = 0
  let invoicedThisMonth = 0
  let pendingCollection = 0
  let overdueAmount = 0
  let paidCount = 0
  let pendingCount = 0
  let overdueCount = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sales.forEach((sale: any) => {
    totalInvoiced += sale.total || 0

    const saleDate = new Date(sale.created_at)
    if (saleDate >= startOfMonth) {
      invoicedThisMonth += sale.total || 0
    }

    const paidAmount = sale.payments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.filter((p: any) => p.status === 'completed')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

    const pending = sale.total - paidAmount

    if (sale.status === 'paid') {
      paidCount++
    } else if (sale.status === 'pending' || sale.status === 'partial') {
      pendingCollection += pending
      pendingCount++
      // TODO: Check due date for overdue calculation
    }
  })

  return {
    total_invoiced: totalInvoiced,
    invoiced_this_month: invoicedThisMonth,
    pending_collection: pendingCollection,
    overdue_amount: overdueAmount,
    paid_count: paidCount,
    pending_count: pendingCount,
    overdue_count: overdueCount,
  }
}
