// Función helper para formatear moneda (no es server action)
export function formatCurrency(
  amount: number,
  currency: string = 'DOP'
): string {
  const currencyFormats: Record<string, { locale: string; currency: string }> = {
    DOP: { locale: 'es-DO', currency: 'DOP' },
    USD: { locale: 'en-US', currency: 'USD' },
    EUR: { locale: 'de-DE', currency: 'EUR' },
  }

  const format = currencyFormats[currency] || currencyFormats.DOP

  return new Intl.NumberFormat(format.locale, {
    style: 'currency',
    currency: format.currency,
  }).format(amount)
}

// Función para parsear moneda a número
export function parseCurrency(value: string): number {
  // Remover símbolos de moneda y formateo
  const cleanValue = value
    .replace(/[RD$US€,\s]/g, '')
    .replace(',', '.')
  return parseFloat(cleanValue) || 0
}
