import { createAdminClient } from '@/lib/supabase/server'

let cachedClinicId: string | null = null

/**
 * Obtiene el ID de la clinica principal.
 * Usa cache en memoria para evitar queries repetidas.
 * Fallback al ID por defecto si no se puede obtener de la BD.
 */
export async function getClinicId(): Promise<string> {
  if (cachedClinicId) return cachedClinicId

  try {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('clinics')
      .select('id')
      .limit(1)
      .single()

    if (!error && data?.id) {
      cachedClinicId = data.id
      return data.id
    }
  } catch {
    // Fallback silencioso
  }

  return '00000000-0000-0000-0000-000000000001'
}

/**
 * ID de clinica por defecto (sincrono, para casos donde no se puede usar async)
 */
export const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001'
