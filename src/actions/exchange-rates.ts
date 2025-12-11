'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipos
export interface ExchangeRate {
  id: string
  from_currency: string
  to_currency: string
  rate: number
  source: 'manual' | 'api'
  effective_date: string
  created_at: string
  created_by?: string
}

export interface CurrencyConversion {
  fromCurrency: string
  toCurrency: string
  rate: number
  effectiveDate: string
  source: 'manual' | 'api'
}

// =============================================
// OBTENER TASA DE CAMBIO ACTUAL
// =============================================

export async function getCurrentExchangeRate(
  fromCurrency: string = 'USD',
  toCurrency: string = 'DOP'
): Promise<CurrencyConversion | null> {
  const supabase = createAdminClient()

  // Buscar la tasa más reciente para el par de monedas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('exchange_rates')
    .select('*')
    .eq('from_currency', fromCurrency)
    .eq('to_currency', toCurrency)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    // Si no hay tasa en la base de datos, devolver una tasa por defecto
    return {
      fromCurrency: 'USD',
      toCurrency: 'DOP',
      rate: 60.50, // Tasa por defecto aproximada
      effectiveDate: new Date().toISOString().split('T')[0],
      source: 'manual',
    }
  }

  return {
    fromCurrency: data.from_currency,
    toCurrency: data.to_currency,
    rate: data.rate,
    effectiveDate: data.effective_date,
    source: data.source,
  }
}

// =============================================
// GUARDAR TASA DE CAMBIO MANUAL
// =============================================

export async function saveExchangeRate(input: {
  fromCurrency?: string
  toCurrency?: string
  rate: number
  effectiveDate?: string
  source?: 'manual' | 'api'
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const rateData = {
    from_currency: input.fromCurrency || 'USD',
    to_currency: input.toCurrency || 'DOP',
    rate: input.rate,
    effective_date: input.effectiveDate || new Date().toISOString().split('T')[0],
    source: input.source || 'manual',
    created_at: new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('exchange_rates')
    .insert(rateData)

  if (error) {
    console.error('Error saving exchange rate:', error)
    return { success: false, error: 'Error al guardar la tasa de cambio' }
  }

  revalidatePath('/configuracion')
  revalidatePath('/pos')
  revalidatePath('/facturacion')
  return { success: true }
}

// =============================================
// OBTENER HISTORIAL DE TASAS
// =============================================

export async function getExchangeRateHistory(
  fromCurrency: string = 'USD',
  toCurrency: string = 'DOP',
  limit: number = 30
): Promise<ExchangeRate[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('exchange_rates')
    .select('*')
    .eq('from_currency', fromCurrency)
    .eq('to_currency', toCurrency)
    .order('effective_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching exchange rate history:', error)
    return []
  }

  return data || []
}

// =============================================
// OBTENER TASA DESDE API EXTERNA
// =============================================

export async function fetchExchangeRateFromAPI(
  fromCurrency: string = 'USD',
  toCurrency: string = 'DOP'
): Promise<{ rate: number | null; error?: string }> {
  // Intentar con ExchangeRate-API (requiere API key)
  const apiKey = process.env.EXCHANGE_RATE_API_KEY

  if (apiKey) {
    try {
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}`,
        { next: { revalidate: 3600 } } // Cache por 1 hora
      )

      if (response.ok) {
        const data = await response.json()
        if (data.result === 'success') {
          return { rate: data.conversion_rate }
        }
      }
    } catch (error) {
      console.error('Error fetching from ExchangeRate-API:', error)
    }
  }

  // Fallback: Open Exchange Rates
  const oxrApiKey = process.env.OPEN_EXCHANGE_RATES_API_KEY

  if (oxrApiKey) {
    try {
      const response = await fetch(
        `https://openexchangerates.org/api/latest.json?app_id=${oxrApiKey}&symbols=${toCurrency}`,
        { next: { revalidate: 3600 } }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.rates && data.rates[toCurrency]) {
          return { rate: data.rates[toCurrency] }
        }
      }
    } catch (error) {
      console.error('Error fetching from Open Exchange Rates:', error)
    }
  }

  return { rate: null, error: 'No se pudo obtener la tasa de cambio. Configure una API key.' }
}

// =============================================
// ACTUALIZAR TASA DESDE API
// =============================================

export async function updateRateFromAPI(
  fromCurrency: string = 'USD',
  toCurrency: string = 'DOP'
): Promise<{ success: boolean; rate?: number; error?: string }> {
  const { rate, error } = await fetchExchangeRateFromAPI(fromCurrency, toCurrency)

  if (rate === null) {
    return { success: false, error: error || 'No se pudo obtener la tasa' }
  }

  // Guardar la tasa obtenida
  const saveResult = await saveExchangeRate({
    fromCurrency,
    toCurrency,
    rate,
    source: 'api',
  })

  if (!saveResult.success) {
    return { success: false, error: saveResult.error }
  }

  return { success: true, rate }
}

// =============================================
// CONVERSIONES DE MONEDA
// =============================================

export async function convertCurrency(
  amount: number,
  fromCurrency: string = 'USD',
  toCurrency: string = 'DOP'
): Promise<{
  convertedAmount: number
  rate: number
  fromCurrency: string
  toCurrency: string
}> {
  const currentRate = await getCurrentExchangeRate(fromCurrency, toCurrency)
  const rate = currentRate?.rate || 60.50 // Tasa por defecto si no hay datos

  return {
    convertedAmount: Number((amount * rate).toFixed(2)),
    rate,
    fromCurrency,
    toCurrency,
  }
}
