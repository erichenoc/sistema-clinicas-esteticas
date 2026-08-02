// Calculo de nomina segun la legislacion dominicana.
// Vive aparte de las server actions para que el mismo criterio se use al
// previsualizar en pantalla y al cerrar el mes en la base de datos.

export const AFP_EMPLOYEE_RATE = 0.0287 // 2.87% pensiones
export const ARS_EMPLOYEE_RATE = 0.0304 // 3.04% salud
export const EMPLOYER_COST_RATE = 0.2206 // aporte patronal estimado sobre el bruto

/** Tramos anuales de ISR segun la DGII */
export function calculateAnnualISR(annualSalary: number): number {
  if (annualSalary <= 416220) return 0
  if (annualSalary <= 624329) return (annualSalary - 416220) * 0.15
  if (annualSalary <= 867123) return 31216 + (annualSalary - 624329) * 0.2
  return 79776 + (annualSalary - 867123) * 0.25
}

export interface PayrollLineInput {
  baseSalary: number
  commissions?: number
  bonuses?: number
  overtime?: number
  otherDeductions?: number
  /** false = se le paga el bruto sin AFP, ARS ni ISR */
  applyDeductions: boolean
}

export interface PayrollLineResult {
  grossSalary: number
  afpEmployee: number
  arsEmployee: number
  isrWithholding: number
  otherDeductions: number
  totalDeductions: number
  netSalary: number
}

const round = (n: number) => Math.round(n * 100) / 100

export function calculatePayrollLine(input: PayrollLineInput): PayrollLineResult {
  const grossSalary =
    (input.baseSalary || 0) +
    (input.commissions || 0) +
    (input.bonuses || 0) +
    (input.overtime || 0)

  const applies = input.applyDeductions !== false
  const afpEmployee = applies ? grossSalary * AFP_EMPLOYEE_RATE : 0
  const arsEmployee = applies ? grossSalary * ARS_EMPLOYEE_RATE : 0
  const isrWithholding = applies ? calculateAnnualISR(grossSalary * 12) / 12 : 0

  // Los otros descuentos (adelantos, prestamos) se aplican siempre: no son de ley
  const otherDeductions = input.otherDeductions || 0
  const totalDeductions = afpEmployee + arsEmployee + isrWithholding + otherDeductions

  // El neto nunca baja de cero: si los descuentos superan el bruto, queda en 0
  const netSalary = Math.max(0, grossSalary - totalDeductions)

  return {
    grossSalary: round(grossSalary),
    afpEmployee: round(afpEmployee),
    arsEmployee: round(arsEmployee),
    isrWithholding: round(isrWithholding),
    otherDeductions: round(otherDeductions),
    totalDeductions: round(totalDeductions),
    netSalary: round(netSalary),
  }
}

/** Aporte patronal: solo sobre quienes cotizan */
export function calculateEmployerCost(lines: { grossSalary: number; applyDeductions: boolean }[]): number {
  const cotizable = lines
    .filter((l) => l.applyDeductions)
    .reduce((sum, l) => sum + l.grossSalary, 0)
  return round(cotizable * EMPLOYER_COST_RATE)
}

/**
 * '2026-08' -> 'Agosto 2026'
 * Devuelve la etiqueta ya capitalizada para no depender de `capitalize` en CSS,
 * que pondria mayuscula a cada palabra ("De Agosto De 2026").
 */
export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-').map(Number)
  if (!year || !month) return period
  const monthName = new Date(year, month - 1, 1).toLocaleDateString('es-DO', { month: 'long' })
  return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${year}`
}
