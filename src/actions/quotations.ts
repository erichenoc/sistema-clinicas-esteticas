'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail, generateQuotationEmailHTML } from '@/lib/email'

// Types
export interface QuotationItem {
  id?: string
  quotation_id?: string
  type: 'treatment' | 'product' | 'package' | 'custom'
  reference_id?: string
  description: string
  quantity: number
  unit_price: number
  discount: number
  discount_type: 'percentage' | 'fixed'
  subtotal: number
  notes?: string
}

export interface QuotationData {
  id: string
  quote_number: string
  clinic_id: string
  patient_id: string
  patient_name?: string
  patient_email?: string
  patient_phone?: string
  patient_address?: string
  currency: 'DOP' | 'USD'
  subtotal: number
  discount_total: number
  tax_rate: number
  tax_amount: number
  total: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
  valid_until: string
  notes?: string
  terms_conditions?: string
  sent_at?: string
  accepted_at?: string
  rejected_at?: string
  converted_invoice_id?: string
  created_at: string
  updated_at: string
  items?: QuotationItem[]
}

export interface CreateQuotationInput {
  patient_id: string
  currency: 'DOP' | 'USD'
  items: Omit<QuotationItem, 'id' | 'quotation_id'>[]
  valid_until: string
  notes?: string
  terms_conditions?: string
  subtotal: number
  discount_total: number
  tax_rate: number
  tax_amount: number
  total: number
  status?: 'draft' | 'sent'
}

// Generate quote number
async function generateQuoteNumber(): Promise<string> {
  const supabase = createAdminClient()
  const year = new Date().getFullYear()

  // Get count of quotes this year
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)
    .lte('created_at', `${year}-12-31`)

  const nextNumber = (count || 0) + 1
  return `COT-${year}-${nextNumber.toString().padStart(4, '0')}`
}

// Create quotation
export async function createQuotation(input: CreateQuotationInput): Promise<{ success: boolean; data?: QuotationData; error?: string }> {
  const supabase = createAdminClient()

  try {
    // Generate quote number
    const quote_number = await generateQuoteNumber()

    // Insert quotation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: quotation, error: quotationError } = await (supabase as any)
      .from('quotations')
      .insert({
        quote_number,
        clinic_id: '00000000-0000-0000-0000-000000000001',
        patient_id: input.patient_id,
        currency: input.currency,
        subtotal: input.subtotal,
        discount_total: input.discount_total,
        tax_rate: input.tax_rate,
        tax_amount: input.tax_amount,
        total: input.total,
        status: input.status || 'draft',
        valid_until: input.valid_until,
        notes: input.notes,
        terms_conditions: input.terms_conditions,
      })
      .select()
      .single()

    if (quotationError) {
      console.error('Error creating quotation:', quotationError)
      return { success: false, error: quotationError.message }
    }

    // Insert quotation items
    const itemsToInsert = input.items.map(item => ({
      quotation_id: quotation.id,
      type: item.type,
      reference_id: item.reference_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      discount_type: item.discount_type,
      subtotal: item.subtotal,
      notes: item.notes,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: itemsError } = await (supabase as any)
      .from('quotation_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('Error creating quotation items:', itemsError)
      // Rollback quotation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('quotations').delete().eq('id', quotation.id)
      return { success: false, error: itemsError.message }
    }

    revalidatePath('/facturacion/cotizaciones')
    return { success: true, data: quotation }

  } catch (error) {
    console.error('Error in createQuotation:', error)
    return { success: false, error: 'Error inesperado al crear la cotización' }
  }
}

// Get all quotations
export async function getQuotations(): Promise<QuotationData[]> {
  try {
    console.log('[Quotations] Starting getQuotations...')
    const supabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('quotations')
      .select(`
        *,
        patient:patients(first_name, last_name, email, phone),
        items:quotation_items(id)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Quotations] Error fetching quotations:', error)
      return []
    }

    console.log('[Quotations] Fetched quotations count:', data?.length || 0)

    // Transform data
    return (data || []).map((q: { patient?: { first_name?: string; last_name?: string; email?: string; phone?: string }; items?: { id: string }[] } & QuotationData) => ({
      ...q,
      patient_name: q.patient ? `${q.patient.first_name} ${q.patient.last_name}` : 'Cliente desconocido',
      patient_email: q.patient?.email,
      patient_phone: q.patient?.phone,
      items: q.items || [],
    }))
  } catch (err) {
    console.error('[Quotations] Unexpected error in getQuotations:', err)
    return []
  }
}

// Get quotation by ID
export async function getQuotationById(id: string): Promise<QuotationData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('quotations')
    .select(`
      *,
      patient:patients(first_name, last_name, email, phone, address),
      items:quotation_items(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching quotation:', error)
    return null
  }

  return {
    ...data,
    patient_name: data.patient ? `${data.patient.first_name} ${data.patient.last_name}` : 'Cliente desconocido',
    patient_email: data.patient?.email,
    patient_phone: data.patient?.phone,
    patient_address: data.patient?.address,
  }
}

// Update quotation (full edit)
export interface UpdateQuotationInput {
  id: string
  patient_id: string
  currency: 'DOP' | 'USD'
  items: Omit<QuotationItem, 'id' | 'quotation_id'>[]
  valid_until: string
  notes?: string
  terms_conditions?: string
  subtotal: number
  discount_total: number
  tax_rate: number
  tax_amount: number
  total: number
}

export async function updateQuotation(input: UpdateQuotationInput): Promise<{ success: boolean; data?: QuotationData; error?: string }> {
  const supabase = createAdminClient()

  try {
    console.log('[Quotations] Updating quotation:', input.id)

    // Update quotation main data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: quotation, error: quotationError } = await (supabase as any)
      .from('quotations')
      .update({
        patient_id: input.patient_id,
        currency: input.currency,
        subtotal: input.subtotal,
        discount_total: input.discount_total,
        tax_rate: input.tax_rate,
        tax_amount: input.tax_amount,
        total: input.total,
        valid_until: input.valid_until,
        notes: input.notes,
        terms_conditions: input.terms_conditions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single()

    if (quotationError) {
      console.error('[Quotations] Error updating quotation:', quotationError)
      return { success: false, error: quotationError.message }
    }

    // Delete existing items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('quotation_items')
      .delete()
      .eq('quotation_id', input.id)

    // Insert new items
    const itemsToInsert = input.items.map(item => ({
      quotation_id: input.id,
      type: item.type,
      reference_id: item.reference_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      discount_type: item.discount_type,
      subtotal: item.subtotal,
      notes: item.notes,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: itemsError } = await (supabase as any)
      .from('quotation_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('[Quotations] Error inserting updated items:', itemsError)
      return { success: false, error: itemsError.message }
    }

    console.log('[Quotations] Quotation updated successfully')
    revalidatePath('/facturacion/cotizaciones')
    revalidatePath(`/facturacion/cotizaciones/${input.id}`)
    return { success: true, data: quotation }

  } catch (error) {
    console.error('[Quotations] Error in updateQuotation:', error)
    return { success: false, error: 'Error inesperado al actualizar la cotización' }
  }
}

// Update quotation status
export async function updateQuotationStatus(
  id: string,
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = { status }

  if (status === 'sent') {
    updateData.sent_at = new Date().toISOString()
  } else if (status === 'accepted') {
    updateData.accepted_at = new Date().toISOString()
  } else if (status === 'rejected') {
    updateData.rejected_at = new Date().toISOString()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('quotations')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating quotation status:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/facturacion/cotizaciones')
  return { success: true }
}

// Send quotation by email
export async function sendQuotationEmail(id: string): Promise<{ success: boolean; error?: string }> {
  // Get quotation with items
  const quotation = await getQuotationById(id)

  if (!quotation) {
    return { success: false, error: 'Cotización no encontrada' }
  }

  if (!quotation.patient_email) {
    return { success: false, error: 'El cliente no tiene email registrado' }
  }

  // Generate email HTML
  const emailHTML = generateQuotationEmailHTML({
    quotationNumber: quotation.quote_number,
    clientName: quotation.patient_name || 'Cliente',
    clientPhone: quotation.patient_phone,
    clientEmail: quotation.patient_email,
    items: (quotation.items || []).map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      subtotal: item.subtotal,
    })),
    subtotal: quotation.subtotal,
    discountTotal: quotation.discount_total,
    taxRate: quotation.tax_rate,
    taxAmount: quotation.tax_amount,
    total: quotation.total,
    currency: quotation.currency,
    validUntil: quotation.valid_until,
    notes: quotation.notes,
    termsConditions: quotation.terms_conditions,
  })

  // Send email
  const emailResult = await sendEmail({
    to: quotation.patient_email,
    subject: `Cotización ${quotation.quote_number} - Med Luxe Aesthetics & Wellness`,
    html: emailHTML,
  })

  if (!emailResult.success) {
    return { success: false, error: emailResult.error }
  }

  // Update status to sent
  await updateQuotationStatus(id, 'sent')

  return { success: true }
}

// Delete quotation
export async function deleteQuotation(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Delete items first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('quotation_items')
    .delete()
    .eq('quotation_id', id)

  // Delete quotation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('quotations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting quotation:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/facturacion/cotizaciones')
  return { success: true }
}

// Get quotation stats
export async function getQuotationStats(): Promise<{
  total: number
  pending: number
  accepted: number
  totalValue: number
}> {
  try {
    console.log('[Quotations] Starting getQuotationStats...')
    const supabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('quotations')
      .select('status, total')

    if (error) {
      console.error('[Quotations] Error fetching quotation stats:', error)
      return { total: 0, pending: 0, accepted: 0, totalValue: 0 }
    }

    console.log('[Quotations] Stats data count:', data?.length || 0)

    const quotes = data || []
    return {
      total: quotes.length,
      pending: quotes.filter((q: { status: string }) => q.status === 'draft' || q.status === 'sent').length,
      accepted: quotes.filter((q: { status: string }) => q.status === 'accepted').length,
      totalValue: quotes
        .filter((q: { status: string }) => q.status === 'accepted')
        .reduce((sum: number, q: { total: number }) => sum + (q.total || 0), 0),
    }
  } catch (err) {
    console.error('[Quotations] Unexpected error in getQuotationStats:', err)
    return { total: 0, pending: 0, accepted: 0, totalValue: 0 }
  }
}
