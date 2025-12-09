// =============================================
// TIPOS PARA CONTABILIDAD DGII - REPÚBLICA DOMINICANA
// =============================================

// Tipos de Comprobantes Fiscales Electrónicos (e-NCF)
export type NCFType =
  | 'B01' // Factura de Crédito Fiscal
  | 'B02' // Factura de Consumo
  | 'B03' // Nota de Débito
  | 'B04' // Nota de Crédito
  | 'B11' // Comprobante de Compras
  | 'B13' // Gastos Menores
  | 'B14' // Regímenes Especiales
  | 'B15' // Comprobante Gubernamental
  | 'B16' // Comprobante para Exportación

export const NCF_TYPE_OPTIONS: { value: NCFType; label: string; description: string }[] = [
  { value: 'B01', label: 'B01 - Crédito Fiscal', description: 'Para clientes con RNC que requieren crédito fiscal' },
  { value: 'B02', label: 'B02 - Consumo', description: 'Para consumidores finales' },
  { value: 'B03', label: 'B03 - Nota de Débito', description: 'Para ajustes que aumentan la deuda' },
  { value: 'B04', label: 'B04 - Nota de Crédito', description: 'Para devoluciones y descuentos' },
  { value: 'B11', label: 'B11 - Compras', description: 'Para registrar compras a proveedores informales' },
  { value: 'B13', label: 'B13 - Gastos Menores', description: 'Para gastos menores sin comprobante' },
  { value: 'B14', label: 'B14 - Regímenes Especiales', description: 'Para zonas francas y regímenes especiales' },
  { value: 'B15', label: 'B15 - Gubernamental', description: 'Para ventas al gobierno' },
  { value: 'B16', label: 'B16 - Exportación', description: 'Para ventas de exportación' },
]

// Secuencia de NCF
export interface NCFSequence {
  id: string
  clinicId: string
  ncfType: NCFType
  prefix: string // Ej: "E310000000001"
  currentNumber: number
  startNumber: number
  endNumber: number
  expirationDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Formato 606 - Compras de Bienes y Servicios
export interface Report606Entry {
  id: string
  clinicId: string
  period: string // YYYYMM
  supplierRnc: string
  supplierName: string
  ncfType: string
  ncfNumber: string
  ncfModified?: string // NCF que modifica (para notas de crédito/débito)
  invoiceDate: string
  paymentDate?: string
  serviceAmount: number // Monto servicios
  goodsAmount: number // Monto bienes
  totalAmount: number
  itbisAmount: number // ITBIS facturado
  itbisWithheld: number // ITBIS retenido
  isrWithheld: number // ISR retenido
  otherTaxes: number
  paymentType: '01' | '02' | '03' | '04' | '05' | '06' // Efectivo, cheque, transferencia, etc.
  createdAt: string
}

// Formato 607 - Ventas de Bienes y Servicios
export interface Report607Entry {
  id: string
  clinicId: string
  period: string // YYYYMM
  clientRnc: string
  clientName: string
  ncfType: NCFType
  ncfNumber: string
  ncfModified?: string
  invoiceDate: string
  cashAmount: number // Monto efectivo
  creditAmount: number // Monto crédito
  bonusAmount: number // Monto bonificación/descuento
  totalAmount: number
  itbisAmount: number
  itbisWithheld: number
  selectiveConsumptionTax: number // ISC
  otherTaxes: number
  propineLegal: number // Propina legal 10%
  createdAt: string
}

// Formato 608 - Retenciones
export interface Report608Entry {
  id: string
  clinicId: string
  period: string
  supplierRnc: string
  supplierName: string
  ncfNumber: string
  invoiceDate: string
  paymentDate: string
  retentionType: 'ISR' | 'ITBIS'
  retentionAmount: number
  createdAt: string
}

// Resumen mensual de ITBIS
export interface ITBISMonthlySummary {
  period: string
  // Ventas
  salesB01Total: number
  salesB02Total: number
  salesTaxableAmount: number
  salesItbisCollected: number
  // Compras
  purchasesTotal: number
  purchasesItbisPaid: number
  // Balance
  itbisToPayOrCredit: number
}

// Opciones de tipo de pago para 606
export const PAYMENT_TYPE_606_OPTIONS = [
  { value: '01', label: 'Efectivo' },
  { value: '02', label: 'Cheques/Transferencias/Depósito' },
  { value: '03', label: 'Tarjeta Crédito/Débito' },
  { value: '04', label: 'Compra a Crédito' },
  { value: '05', label: 'Permuta' },
  { value: '06', label: 'Nota de Crédito' },
  { value: '07', label: 'Mixto' },
]

// Estado de reportes DGII
export type DGIIReportStatus = 'draft' | 'pending' | 'submitted' | 'accepted' | 'rejected'

export interface DGIIReport {
  id: string
  clinicId: string
  period: string
  reportType: '606' | '607' | '608'
  status: DGIIReportStatus
  totalRecords: number
  totalAmount: number
  totalTax: number
  submittedAt?: string
  dgiiReference?: string
  errors?: string[]
  createdAt: string
  updatedAt: string
}

// Helpers
export function formatNCFNumber(type: NCFType, sequence: number): string {
  const sequenceStr = sequence.toString().padStart(8, '0')
  return `E${type}${sequenceStr}`
}

export function validateRNC(rnc: string): { isValid: boolean; type: 'RNC' | 'Cedula' | null } {
  const cleanRnc = rnc.replace(/[-\s]/g, '')

  if (cleanRnc.length === 9) {
    // RNC de empresa (9 dígitos)
    if (/^\d{9}$/.test(cleanRnc)) {
      // Validación con algoritmo de Luhn simplificado
      return { isValid: true, type: 'RNC' }
    }
  } else if (cleanRnc.length === 11) {
    // Cédula (11 dígitos)
    if (/^\d{11}$/.test(cleanRnc)) {
      return { isValid: true, type: 'Cedula' }
    }
  }

  return { isValid: false, type: null }
}

export function formatRNC(rnc: string): string {
  const clean = rnc.replace(/[-\s]/g, '')
  if (clean.length === 9) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 8)}-${clean.slice(8)}`
  } else if (clean.length === 11) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 10)}-${clean.slice(10)}`
  }
  return rnc
}

export function formatPeriod(year: number, month: number): string {
  return `${year}${month.toString().padStart(2, '0')}`
}

export function parsePeriod(period: string): { year: number; month: number } {
  return {
    year: parseInt(period.slice(0, 4)),
    month: parseInt(period.slice(4, 6)),
  }
}

export function getPeriodLabel(period: string): string {
  const { year, month } = parsePeriod(period)
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return `${months[month - 1]} ${year}`
}
