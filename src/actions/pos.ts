'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipos para POS
export interface POSTreatment {
  id: string
  name: string
  price: number
  category: string
  color: string
}

export interface POSPackage {
  id: string
  name: string
  price: number
  original_price: number
  sessions: number
}

export interface POSProduct {
  id: string
  name: string
  price: number
  stock: number
}

export interface POSPatient {
  id: string
  name: string
  phone: string
  email: string | null
  credit: number
}

// =============================================
// TRATAMIENTOS PARA POS
// =============================================

export async function getPOSTreatments(): Promise<POSTreatment[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatments')
    .select(`
      id,
      name,
      price,
      treatment_categories (
        name,
        color
      )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching treatments for POS:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    price: t.price || 0,
    category: t.treatment_categories?.name || 'Sin categoria',
    color: t.treatment_categories?.color || '#6366f1',
  }))
}

// =============================================
// PAQUETES PARA POS
// =============================================

export async function getPOSPackages(): Promise<POSPackage[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('treatment_packages')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching packages for POS:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price || 0,
    original_price: p.original_price || p.price || 0,
    sessions: p.total_sessions || 1,
  }))
}

// =============================================
// PRODUCTOS PARA POS
// =============================================

export async function getPOSProducts(): Promise<POSProduct[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('products')
    .select('id, name, sell_price, current_stock')
    .eq('is_active', true)
    .eq('is_sellable', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching products for POS:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.sell_price || 0,
    stock: p.current_stock || 0,
  }))
}

// =============================================
// PACIENTES PARA POS
// =============================================

export async function getPOSPatients(): Promise<POSPatient[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('patients')
    .select('id, first_name, last_name, phone, email')
    .eq('status', 'active')
    .order('first_name', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Error fetching patients for POS:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((p: any) => ({
    id: p.id,
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Paciente',
    phone: p.phone || '',
    email: p.email,
    credit: 0, // TODO: Add credit_balance column to patients table
  }))
}

// =============================================
// CREAR VENTA
// =============================================

export interface CreateSaleInput {
  patient_id?: string
  customer_name?: string
  items: {
    item_type: 'treatment' | 'package' | 'product'
    item_id: string
    item_name: string
    quantity: number
    unit_price: number
    discount_amount: number
  }[]
  subtotal: number
  discount_total: number
  tax_amount: number
  total: number
  payment_method: string
  payment_reference?: string
  notes?: string
}

export async function createSale(input: CreateSaleInput): Promise<{
  data: { id: string; sale_number: string } | null
  error: string | null
}> {
  const supabase = createAdminClient()

  // Generate sale number
  const saleNumber = `V-${Date.now()}`

  const saleData = {
    clinic_id: '00000000-0000-0000-0000-000000000001',
    branch_id: null,
    sale_number: saleNumber,
    sale_type: 'pos',
    patient_id: input.patient_id || null,
    customer_name: input.customer_name || 'Cliente',
    subtotal: input.subtotal,
    discount_total: input.discount_total,
    tax_amount: input.tax_amount,
    total: input.total,
    status: 'paid',
    paid_amount: input.total,
    payment_method: input.payment_method,
    payment_reference: input.payment_reference,
    notes: input.notes,
    completed_at: new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sale, error: saleError } = await (supabase as any)
    .from('sales')
    .insert(saleData)
    .select('id, sale_number')
    .single()

  if (saleError) {
    console.error('Error creating sale:', saleError)
    return { data: null, error: 'Error al crear la venta' }
  }

  // Insert sale items
  const saleItems = input.items.map((item) => ({
    sale_id: sale.id,
    item_type: item.item_type,
    item_id: item.item_id,
    item_name: item.item_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_amount: item.discount_amount,
    subtotal: item.unit_price * item.quantity - item.discount_amount,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase as any)
    .from('sale_items')
    .insert(saleItems)

  if (itemsError) {
    console.error('Error creating sale items:', itemsError)
    // Sale was created but items failed - log but don't fail
  }

  revalidatePath('/pos')
  revalidatePath('/facturacion')
  return { data: { id: sale.id, sale_number: sale.sale_number }, error: null }
}
