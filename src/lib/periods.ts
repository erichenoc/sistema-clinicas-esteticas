// Nombres de meses fijos en espanol.
//
// No se usa toLocaleDateString para las etiquetas de periodo porque el servidor
// (Node en Vercel) y el navegador pueden traer datos ICU distintos y devolver
// textos diferentes, lo que provoca un error de hidratacion en React.

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

/** '2026-08' -> 'Agosto 2026' */
export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-').map(Number)
  if (!year || !month || month < 1 || month > 12) return period
  return `${MONTH_NAMES[month - 1]} ${year}`
}

/** Mes actual en formato 'YYYY-MM' */
export function currentPeriod(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** Primer y ultimo dia de un periodo 'YYYY-MM' */
export function periodBounds(period: string): { start: string; end: string } {
  const [year, month] = period.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return {
    start: `${period}-01`,
    end: `${period}-${String(lastDay).padStart(2, '0')}`,
  }
}

/** Los ultimos `count` meses, del mas reciente al mas antiguo */
export function recentPeriods(count = 12, now: Date = new Date()): { value: string; label: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { value, label: formatPeriodLabel(value) }
  })
}
