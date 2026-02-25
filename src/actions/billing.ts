'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeError } from '@/lib/error-utils'

// Tipos - Aligned with actual database schema
export type InvoiceStatus = 'pending' | 'paid' | 'partial' | 'cancelled' | 'overdue'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check' | 'other'

export interface InvoiceData {
  id: string
  clinic_id: string
  branch_id: string | null
  patient_id: string | null
  invoice_number: string
  ncf: string | null
  ncf_type: string | null
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  currency: string
  status: InvoiceStatus
  notes: string | null
  internal_notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceListItemData extends InvoiceData {
  patient_name: string | null
  paid_amount: number
  amount_due: number
}

export interface PaymentData {
  id: string
  invoice_id: string
  amount: number
  payment_method: PaymentMethod
  reference: string | null
  payment_date: string
  notes: string | null
  created_by: string | null
  created_at: string
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

export interface CreateInvoiceInput {
  patient_id?: string
  invoice_number?: string
  ncf?: string
  ncf_type?: string
  issue_date?: string
  due_date?: string
  subtotal: number
  tax_amount?: number
  discount_amount?: number
  total: number
  currency?: string
  notes?: string
}

// =============================================
// FACTURAS (INVOICES)
// =============================================

// Obtener facturas con datos expandidos
export async function getInvoices(options?: {
  startDate?: string
  endDate?: string
  status?: InvoiceStatus
  patientId?: string
}): Promise<InvoiceListItemData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('invoices')
    .select(`
      *,
      patients (
        first_name,
        last_name
      ),
      payments (
        amount
      )
    `)
    .order('created_at', { ascending: false })
    .limit(200)

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
    console.error('Error fetching invoices:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((inv: any) => {
    const paidAmount = inv.payments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

    return {
      ...inv,
      patient_name: inv.patients
        ? `${inv.patients.first_name || ''} ${inv.patients.last_name || ''}`.trim()
        : null,
      paid_amount: paidAmount,
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
      patients (
        first_name,
        last_name,
        phone,
        email
      ),
      payments (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching invoice:', error)
    return null
  }

  const inv = data
  const paidAmount = inv.payments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

  return {
    ...inv,
    patient_name: inv.patients
      ? `${inv.patients.first_name || ''} ${inv.patients.last_name || ''}`.trim()
      : null,
    paid_amount: paidAmount,
    amount_due: inv.total - paidAmount,
  }
}

// Crear factura
export async function createInvoice(
  input: CreateInvoiceInput
): Promise<{ data: InvoiceData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Generar numero de factura si no se proporciona
  let invoiceNumber = input.invoice_number
  if (!invoiceNumber) {
    const year = new Date().getFullYear()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lastInvoice } = await (supabase as any)
      .from('invoices')
      .select('invoice_number')
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
    invoiceNumber = `FAC-${year}-${sequence.toString().padStart(5, '0')}`
  }

  const invoiceData = {
    clinic_id: '00000000-0000-0000-0000-000000000001', // TODO: Get from current user
    patient_id: input.patient_id || null,
    invoice_number: invoiceNumber,
    ncf: input.ncf || null,
    ncf_type: input.ncf_type || null,
    issue_date: input.issue_date || new Date().toISOString().split('T')[0],
    due_date: input.due_date || null,
    subtotal: input.subtotal,
    tax_amount: input.tax_amount || 0,
    discount_amount: input.discount_amount || 0,
    total: input.total,
    currency: input.currency || 'DOP',
    status: 'pending' as InvoiceStatus,
    notes: input.notes || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single()

  if (error) {
    return { data: null, error: sanitizeError(error, 'Error al crear la factura') }
  }

  revalidatePath('/facturacion')
  return { data: data as InvoiceData, error: null }
}

// Actualizar factura
export async function updateInvoice(
  id: string,
  input: Partial<CreateInvoiceInput> & { status?: InvoiceStatus }
): Promise<{ data: InvoiceData | null; error: string | null }> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.patient_id !== undefined) updateData.patient_id = input.patient_id
  if (input.ncf !== undefined) updateData.ncf = input.ncf
  if (input.ncf_type !== undefined) updateData.ncf_type = input.ncf_type
  if (input.issue_date !== undefined) updateData.issue_date = input.issue_date
  if (input.due_date !== undefined) updateData.due_date = input.due_date
  if (input.subtotal !== undefined) updateData.subtotal = input.subtotal
  if (input.tax_amount !== undefined) updateData.tax_amount = input.tax_amount
  if (input.discount_amount !== undefined) updateData.discount_amount = input.discount_amount
  if (input.total !== undefined) updateData.total = input.total
  if (input.currency !== undefined) updateData.currency = input.currency
  if (input.status !== undefined) updateData.status = input.status
  if (input.notes !== undefined) updateData.notes = input.notes

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('invoices')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating invoice:', error)
    return { data: null, error: 'Error al actualizar la factura' }
  }

  revalidatePath('/facturacion')
  revalidatePath(`/facturacion/facturas/${id}`)
  return { data: data as InvoiceData, error: null }
}

// Cancelar factura
export async function cancelInvoice(
  id: string,
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    status: 'cancelled',
    updated_at: new Date().toISOString(),
  }

  if (reason) {
    updateData.internal_notes = reason
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('invoices')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error cancelling invoice:', error)
    return { success: false, error: 'Error al anular la factura' }
  }

  revalidatePath('/facturacion')
  return { success: true, error: null }
}

// =============================================
// PAGOS (PAYMENTS)
// =============================================

// Obtener pagos de una factura
export async function getPaymentsByInvoice(invoiceId: string): Promise<PaymentData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching payments:', error)
    return []
  }

  return (data || []) as PaymentData[]
}

// Registrar pago
export async function registerPayment(
  invoiceId: string,
  paymentData: {
    payment_method: PaymentMethod
    amount: number
    reference?: string
    notes?: string
  },
  userId?: string
): Promise<{ data: PaymentData | null; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      payment_method: paymentData.payment_method,
      amount: paymentData.amount,
      reference: paymentData.reference || null,
      notes: paymentData.notes || null,
      created_by: userId || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error registering payment:', error)
    return { data: null, error: 'Error al registrar el pago' }
  }

  // Obtener total de la factura y pagos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invoice } = await (supabase as any)
    .from('invoices')
    .select('total')
    .eq('id', invoiceId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payments } = await (supabase as any)
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoiceId)
    .limit(100)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPaid = payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0

  // Actualizar estado de la factura
  let newStatus: InvoiceStatus = 'partial'
  if (totalPaid >= invoice.total) {
    newStatus = 'paid'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('invoices')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)

  revalidatePath('/facturacion')
  revalidatePath(`/facturacion/facturas/${invoiceId}`)
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

  // Obtener todas las facturas EXCLUYENDO las anuladas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invoices } = await (supabase as any)
    .from('invoices')
    .select(`
      id,
      total,
      status,
      created_at,
      due_date,
      payments (
        amount
      )
    `)
    .neq('status', 'cancelled') // Excluir facturas anuladas
    .limit(500)

  if (!invoices) {
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
  invoices.forEach((inv: any) => {
    totalInvoiced += inv.total || 0

    const invDate = new Date(inv.created_at)
    if (invDate >= startOfMonth) {
      invoicedThisMonth += inv.total || 0
    }

    const paidAmount = inv.payments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

    const pending = inv.total - paidAmount

    if (inv.status === 'paid') {
      paidCount++
    } else if (inv.status === 'pending' || inv.status === 'partial') {
      pendingCollection += pending
      pendingCount++

      // Check if overdue
      if (inv.due_date && new Date(inv.due_date) < now) {
        overdueAmount += pending
        overdueCount++
      }
    } else if (inv.status === 'overdue') {
      overdueAmount += pending
      overdueCount++
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

// =============================================
// ITEMS DE FACTURA
// =============================================

export interface InvoiceItemData {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  tax_percent: number
  subtotal: number
  treatment_id: string | null
  created_at: string
}

// Obtener items de una factura
export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItemData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Error fetching invoice items:', error)
    return []
  }

  return (data || []) as InvoiceItemData[]
}

// Agregar item a factura
export async function addInvoiceItem(
  invoiceId: string,
  item: {
    description: string
    quantity: number
    unit_price: number
    discount?: number
    tax_rate?: number
    treatment_id?: string
    product_id?: string
  }
): Promise<{ data: InvoiceItemData | null; error: string | null }> {
  const supabase = createAdminClient()

  // Calculate subtotal including tax
  const discountPercent = item.discount || 0
  const taxPercent = item.tax_rate || 0
  const subtotalBeforeTax = item.quantity * item.unit_price * (1 - discountPercent / 100)
  const subtotal = subtotalBeforeTax * (1 + taxPercent / 100)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('invoice_items')
    .insert({
      invoice_id: invoiceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: discountPercent,
      tax_percent: taxPercent,
      subtotal: subtotal,
      treatment_id: item.treatment_id || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding invoice item:', error)
    return { data: null, error: 'Error al agregar el item' }
  }

  // Recalcular totales de la factura
  await recalculateInvoiceTotals(invoiceId)

  revalidatePath('/facturacion')
  revalidatePath(`/facturacion/facturas/${invoiceId}`)
  return { data: data as InvoiceItemData, error: null }
}

// Recalcular totales de factura
async function recalculateInvoiceTotals(invoiceId: string): Promise<void> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from('invoice_items')
    .select('subtotal, tax_percent, unit_price, quantity, discount_percent')
    .eq('invoice_id', invoiceId)
    .limit(100)

  if (!items || items.length === 0) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subtotal = items.reduce((sum: number, item: any) => {
    return sum + (item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100))
  }, 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taxAmount = items.reduce((sum: number, item: any) => {
    const itemSubtotal = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100)
    return sum + (itemSubtotal * (item.tax_percent || 0) / 100)
  }, 0)

  const total = subtotal + taxAmount

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('invoices')
    .update({
      subtotal,
      tax_amount: taxAmount,
      total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
}

// =============================================
// ENVIO DE EMAIL
// =============================================

import { sendEmail, generateInvoiceEmailHTML } from '@/lib/email'

// Enviar factura por email
export async function sendInvoiceEmail(
  invoiceId: string,
  recipientEmail: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  try {
    // Obtener la factura con datos del paciente
    const invoice = await getInvoiceById(invoiceId)
    if (!invoice) {
      return { success: false, error: 'Factura no encontrada' }
    }

    // Obtener items de la factura
    const items = await getInvoiceItems(invoiceId)

    // Obtener datos adicionales del paciente si existe
    let patientEmail = recipientEmail
    let patientPhone: string | undefined
    let patientRnc: string | undefined

    if (invoice.patient_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: patient } = await (supabase as any)
        .from('patients')
        .select('email, phone, document_id')
        .eq('id', invoice.patient_id)
        .single()

      if (patient) {
        patientEmail = recipientEmail || patient.email
        patientPhone = patient.phone
        patientRnc = patient.document_id
      }
    }

    // Generar HTML del email
    const emailHTML = generateInvoiceEmailHTML({
      invoiceNumber: invoice.invoice_number,
      ncf: invoice.ncf || undefined,
      clientName: invoice.patient_name || 'Cliente General',
      clientPhone: patientPhone,
      clientEmail: patientEmail,
      clientRnc: patientRnc,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.subtotal,
      })),
      subtotal: invoice.subtotal,
      discountAmount: invoice.discount_amount,
      taxAmount: invoice.tax_amount,
      total: invoice.total,
      paidAmount: invoice.paid_amount,
      amountDue: invoice.amount_due,
      currency: invoice.currency,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date || undefined,
      status: invoice.status,
      notes: invoice.notes || undefined,
    })

    // Enviar email
    const result = await sendEmail({
      to: patientEmail,
      subject: `Factura ${invoice.invoice_number} - Med Luxe Aesthetics & Wellness`,
      html: emailHTML,
    })

    if (!result.success) {
      return { success: false, error: result.error || 'Error al enviar el email' }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error sending invoice email:', error)
    return { success: false, error: 'Error al enviar el email' }
  }
}
