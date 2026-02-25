'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// =============================================
// PROVEEDORES (SUPPLIERS)
// =============================================

export interface SupplierData {
  id: string
  clinic_id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  category: string | null
  tax_id: string | null
  payment_terms: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierStats {
  total: number
  active: number
  totalOrders: number
  totalSpent: number
}

export async function getSuppliers(options?: {
  isActive?: boolean
  search?: string
}): Promise<SupplierData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true })
    .limit(500)

  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive)
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,contact_name.ilike.%${options.search}%,email.ilike.%${options.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching suppliers:', error)
    return []
  }

  return (data || []) as SupplierData[]
}

export async function getSupplierById(id: string): Promise<SupplierData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching supplier:', error)
    return null
  }

  return data as SupplierData
}

export async function createSupplier(
  input: {
    name: string
    contact_name?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    category?: string
    tax_id?: string
    payment_terms?: string
    notes?: string
    is_active?: boolean
  }
): Promise<{ data: SupplierData | null; error: string | null }> {
  const supabase = createAdminClient()

  const supplierData = {
    clinic_id: '00000000-0000-0000-0000-000000000001',
    name: input.name,
    contact_name: input.contact_name || null,
    email: input.email || null,
    phone: input.phone || null,
    address: input.address || null,
    city: input.city || null,
    category: input.category || null,
    tax_id: input.tax_id || null,
    payment_terms: input.payment_terms || null,
    notes: input.notes || null,
    is_active: input.is_active ?? true,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('suppliers')
    .insert(supplierData)
    .select()
    .single()

  if (error) {
    console.error('Error creating supplier:', error)
    return { data: null, error: 'Error al crear el proveedor' }
  }

  revalidatePath('/inventario/proveedores')
  return { data: data as SupplierData, error: null }
}

export async function updateSupplier(
  id: string,
  input: Partial<{
    name: string
    contact_name: string
    email: string
    phone: string
    address: string
    city: string
    category: string
    tax_id: string
    payment_terms: string
    notes: string
    is_active: boolean
  }>
): Promise<{ data: SupplierData | null; error: string | null }> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.name !== undefined) updateData.name = input.name
  if (input.contact_name !== undefined) updateData.contact_name = input.contact_name
  if (input.email !== undefined) updateData.email = input.email
  if (input.phone !== undefined) updateData.phone = input.phone
  if (input.address !== undefined) updateData.address = input.address
  if (input.city !== undefined) updateData.city = input.city
  if (input.category !== undefined) updateData.category = input.category
  if (input.tax_id !== undefined) updateData.tax_id = input.tax_id
  if (input.payment_terms !== undefined) updateData.payment_terms = input.payment_terms
  if (input.notes !== undefined) updateData.notes = input.notes
  if (input.is_active !== undefined) updateData.is_active = input.is_active

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('suppliers')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating supplier:', error)
    return { data: null, error: 'Error al actualizar el proveedor' }
  }

  revalidatePath('/inventario/proveedores')
  return { data: data as SupplierData, error: null }
}

export async function deleteSupplier(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // Soft delete - desactivar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('suppliers')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error deleting supplier:', error)
    return { success: false, error: 'Error al desactivar el proveedor' }
  }

  revalidatePath('/inventario/proveedores')
  return { success: true, error: null }
}

export async function getSupplierStats(): Promise<SupplierStats> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: suppliers } = await (supabase as any)
    .from('suppliers')
    .select('id, is_active')
    .limit(500)

  const total = suppliers?.length || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const active = suppliers?.filter((s: any) => s.is_active).length || 0

  // TODO: Get real order stats when purchase_orders table is implemented
  return {
    total,
    active,
    totalOrders: 0,
    totalSpent: 0,
  }
}
