'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { INJECTABLE_PRODUCTS } from '@/types/treatment-templates'

const CLINIC_ID = '00000000-0000-0000-0000-000000000001'

// Get all injectable products (defaults + custom)
export async function getInjectableProducts(): Promise<string[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('clinics')
    .select('settings')
    .eq('id', CLINIC_ID)
    .single()

  if (error || !data?.settings?.injectable_products) {
    return [...INJECTABLE_PRODUCTS]
  }

  return data.settings.injectable_products as string[]
}

// Add a custom injectable product
export async function addInjectableProduct(
  productName: string
): Promise<{ success: boolean; error: string | null }> {
  if (!productName.trim()) {
    return { success: false, error: 'El nombre del producto es requerido' }
  }

  const supabase = createAdminClient()

  // Get current products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clinic } = await (supabase as any)
    .from('clinics')
    .select('settings')
    .eq('id', CLINIC_ID)
    .single()

  const currentSettings = clinic?.settings || {}
  const currentProducts: string[] = currentSettings.injectable_products || [...INJECTABLE_PRODUCTS]

  // Check for duplicates
  if (currentProducts.some(p => p.toLowerCase() === productName.trim().toLowerCase())) {
    return { success: false, error: 'Este producto ya existe' }
  }

  const updatedProducts = [...currentProducts, productName.trim()]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('clinics')
    .update({
      settings: { ...currentSettings, injectable_products: updatedProducts },
    })
    .eq('id', CLINIC_ID)

  if (error) {
    return { success: false, error: 'Error al agregar el producto' }
  }

  return { success: true, error: null }
}

// Remove an injectable product
export async function removeInjectableProduct(
  productName: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clinic } = await (supabase as any)
    .from('clinics')
    .select('settings')
    .eq('id', CLINIC_ID)
    .single()

  const currentSettings = clinic?.settings || {}
  const currentProducts: string[] = currentSettings.injectable_products || [...INJECTABLE_PRODUCTS]

  const updatedProducts = currentProducts.filter(p => p !== productName)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('clinics')
    .update({
      settings: { ...currentSettings, injectable_products: updatedProducts },
    })
    .eq('id', CLINIC_ID)

  if (error) {
    return { success: false, error: 'Error al eliminar el producto' }
  }

  return { success: true, error: null }
}
