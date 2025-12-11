'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipos para paquetes
export interface PackageTreatmentItem {
  treatment_id: string
  quantity: number
}

export interface PackageData {
  id: string
  clinic_id: string | null
  name: string
  description: string | null
  total_sessions: number
  price: number
  currency: 'DOP' | 'USD'
  validity_days: number
  is_active: boolean
  treatments: PackageTreatmentItem[]
  created_at: string
}

export interface PackageWithTreatments extends PackageData {
  treatment_details?: {
    id: string
    name: string
    price: number
    duration_minutes: number
    quantity: number
  }[]
}

// Helper type for Supabase queries - bypasses strict typing for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

// Obtener todos los paquetes
export async function getPackages(): Promise<PackageData[]> {
  const supabase = await createAdminClient()

  const { data, error } = await (supabase as SupabaseAny)
    .from('packages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching packages:', error)
    return []
  }

  return data as PackageData[]
}

// Obtener un paquete por ID con detalles de tratamientos
export async function getPackageById(id: string): Promise<PackageWithTreatments | null> {
  const supabase = await createAdminClient()

  const { data, error: packageError } = await (supabase as SupabaseAny)
    .from('packages')
    .select('*')
    .eq('id', id)
    .single()

  if (packageError || !data) {
    console.error('Error fetching package:', packageError)
    return null
  }

  // Cast to our known type
  const packageData = data as PackageData

  // Obtener detalles de los tratamientos incluidos
  const treatmentIds = packageData.treatments?.map((t: PackageTreatmentItem) => t.treatment_id) || []

  if (treatmentIds.length > 0) {
    const { data: treatmentsData, error: treatmentsError } = await (supabase as SupabaseAny)
      .from('treatments')
      .select('id, name, price, duration_minutes')
      .in('id', treatmentIds)

    if (!treatmentsError && treatmentsData) {
      const treatments = treatmentsData as { id: string; name: string; price: number; duration_minutes: number }[]
      const treatmentDetails = treatments.map(treatment => {
        const packageTreatment = packageData.treatments?.find(
          (t: PackageTreatmentItem) => t.treatment_id === treatment.id
        )
        return {
          ...treatment,
          quantity: packageTreatment?.quantity || 1,
        }
      })

      return {
        ...packageData,
        treatment_details: treatmentDetails,
      } as PackageWithTreatments
    }
  }

  return packageData as PackageWithTreatments
}

// Crear un nuevo paquete
export async function createPackage(data: {
  name: string
  description?: string
  total_sessions: number
  price: number
  currency?: 'DOP' | 'USD'
  validity_days?: number
  is_active?: boolean
  treatments: PackageTreatmentItem[]
}): Promise<{ data: PackageData | null; error: string | null }> {
  const supabase = await createAdminClient()

  const { data: newPackage, error } = await (supabase as SupabaseAny)
    .from('packages')
    .insert({
      name: data.name,
      description: data.description || null,
      total_sessions: data.total_sessions,
      price: data.price,
      currency: data.currency || 'DOP',
      validity_days: data.validity_days || 365,
      is_active: data.is_active ?? true,
      treatments: data.treatments,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating package:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/paquetes')
  return { data: newPackage as PackageData, error: null }
}

// Actualizar un paquete existente
export async function updatePackage(
  id: string,
  data: Partial<{
    name: string
    description: string | null
    total_sessions: number
    price: number
    currency: 'DOP' | 'USD'
    validity_days: number
    is_active: boolean
    treatments: PackageTreatmentItem[]
  }>
): Promise<{ data: PackageData | null; error: string | null }> {
  const supabase = await createAdminClient()

  const { data: updatedPackage, error } = await (supabase as SupabaseAny)
    .from('packages')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating package:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/paquetes')
  revalidatePath(`/paquetes/${id}`)
  return { data: updatedPackage as PackageData, error: null }
}

// Eliminar un paquete
export async function deletePackage(id: string): Promise<{ error: string | null }> {
  const supabase = await createAdminClient()

  const { error } = await (supabase as SupabaseAny)
    .from('packages')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting package:', error)
    return { error: error.message }
  }

  revalidatePath('/paquetes')
  return { error: null }
}

// Activar/Desactivar un paquete
export async function togglePackageStatus(
  id: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  const supabase = await createAdminClient()

  const { error } = await (supabase as SupabaseAny)
    .from('packages')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    console.error('Error toggling package status:', error)
    return { error: error.message }
  }

  revalidatePath('/paquetes')
  return { error: null }
}

// Calcular el precio total de los tratamientos en un paquete (precio sin descuento)
export async function calculatePackageRegularPrice(
  treatments: PackageTreatmentItem[]
): Promise<number> {
  const supabase = await createAdminClient()

  const treatmentIds = treatments.map(t => t.treatment_id)

  const { data, error } = await (supabase as SupabaseAny)
    .from('treatments')
    .select('id, price')
    .in('id', treatmentIds)

  if (error || !data) {
    console.error('Error calculating package price:', error)
    return 0
  }

  const treatmentsData = data as { id: string; price: number }[]
  return treatments.reduce((total, treatment) => {
    const treatmentData = treatmentsData.find(t => t.id === treatment.treatment_id)
    return total + (treatmentData?.price || 0) * treatment.quantity
  }, 0)
}
