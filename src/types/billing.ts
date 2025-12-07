// =============================================
// TIPOS - Módulo de Facturación y Cotizaciones
// Sistema de Comprobantes Fiscales RD (DGII)
// =============================================

// Tipos de Comprobantes Fiscales según DGII
export type NCFType =
  | 'B01' // Facturas de Crédito Fiscal (para contribuyentes con RNC)
  | 'B02' // Facturas de Consumo (consumidor final)
  | 'B14' // Regímenes Especiales
  | 'B15' // Gubernamental
  | 'B16' // Exportaciones

export type DocumentType = 'quote' | 'invoice'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'refunded'
export type PaymentTerms = 'immediate' | 'net15' | 'net30' | 'net45' | 'net60' | 'custom'

// =============================================
// INTERFACES - Datos del Cliente para Facturación
// =============================================

export interface BillingClient {
  id: string
  patientId?: string // Opcional, puede ser cliente externo

  // Datos básicos
  name: string
  email: string
  phone: string

  // Datos fiscales (para comprobante fiscal)
  rncCedula?: string // RNC (9 dígitos) o Cédula (11 dígitos)
  businessName?: string // Razón social (si es empresa)
  isBusiness: boolean

  // Dirección
  address?: string
  city?: string
  province?: string

  createdAt: string
  updatedAt: string
}

// =============================================
// INTERFACES - Cotización
// =============================================

export interface QuoteItem {
  id: string
  type: 'treatment' | 'product' | 'package' | 'custom'
  referenceId?: string // ID del tratamiento/producto/paquete

  description: string
  quantity: number
  unitPrice: number
  discount: number // Porcentaje o monto fijo
  discountType: 'percentage' | 'fixed'

  subtotal: number
  notes?: string
}

export interface Quote {
  id: string
  clinicId: string

  // Numeración
  quoteNumber: string // COT-2024-0001

  // Cliente
  clientId: string
  client?: BillingClient

  // Items
  items: QuoteItem[]

  // Totales
  subtotal: number
  discountTotal: number
  taxRate: number // ITBIS 18%
  taxAmount: number
  total: number
  currency: 'DOP' | 'USD'

  // Fechas
  issueDate: string
  validUntil: string // Fecha de vencimiento de la cotización

  // Estado
  status: QuoteStatus

  // Notas
  notes?: string
  termsAndConditions?: string

  // Conversión a factura
  convertedToInvoiceId?: string
  convertedAt?: string

  // Metadata
  createdBy: string
  createdAt: string
  updatedAt: string
}

// =============================================
// INTERFACES - Factura
// =============================================

export interface InvoiceItem {
  id: string
  type: 'treatment' | 'product' | 'package' | 'custom'
  referenceId?: string

  description: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'percentage' | 'fixed'

  // ITBIS por item (algunos productos pueden estar exentos)
  taxable: boolean
  taxRate: number
  taxAmount: number

  subtotal: number
  total: number
}

export interface InvoicePayment {
  id: string
  invoiceId: string

  amount: number
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check' | 'other'
  reference?: string // Número de referencia

  paidAt: string
  receivedBy: string
  notes?: string
}

export interface Invoice {
  id: string
  clinicId: string

  // Numeración
  invoiceNumber: string // FAC-2024-0001

  // Comprobante Fiscal (DGII)
  hasFiscalReceipt: boolean
  ncfType?: NCFType
  ncfNumber?: string // B0100000001
  ncfExpirationDate?: string

  // Cliente
  clientId: string
  client?: BillingClient

  // Referencia
  quoteId?: string // Si viene de una cotización
  saleId?: string // Si viene del POS
  appointmentId?: string // Si viene de una cita

  // Items
  items: InvoiceItem[]

  // Totales
  subtotal: number
  discountTotal: number
  taxableAmount: number // Monto gravado con ITBIS
  exemptAmount: number // Monto exento
  taxAmount: number // ITBIS total
  total: number
  currency: 'DOP' | 'USD'

  // Pagos
  payments: InvoicePayment[]
  amountPaid: number
  amountDue: number

  // Fechas
  issueDate: string
  dueDate: string
  paidAt?: string

  // Estado
  status: InvoiceStatus

  // Términos
  paymentTerms: PaymentTerms
  customPaymentDays?: number

  // Notas
  notes?: string
  internalNotes?: string

  // Anulación
  cancelledAt?: string
  cancelledBy?: string
  cancellationReason?: string

  // Metadata
  createdBy: string
  createdAt: string
  updatedAt: string
}

// =============================================
// INTERFACES - Configuración de Facturación
// =============================================

export interface BillingSettings {
  clinicId: string

  // Datos de la empresa
  businessName: string
  rnc: string
  address: string
  city: string
  province: string
  phone: string
  email: string

  // Configuración NCF
  ncfEnabled: boolean
  ncfPrefix: string // Prefijo asignado por DGII
  ncfSequences: {
    B01: { current: number; limit: number; expiration: string }
    B02: { current: number; limit: number; expiration: string }
    B14?: { current: number; limit: number; expiration: string }
    B15?: { current: number; limit: number; expiration: string }
  }

  // Impuestos
  defaultTaxRate: number // 18% ITBIS

  // Términos por defecto
  defaultPaymentTerms: PaymentTerms
  defaultQuoteValidity: number // días

  // Numeración
  quotePrefix: string // COT
  invoicePrefix: string // FAC
  currentQuoteNumber: number
  currentInvoiceNumber: number

  // Textos por defecto
  defaultQuoteNotes?: string
  defaultQuoteTerms?: string
  defaultInvoiceNotes?: string

  updatedAt: string
}

// =============================================
// TIPOS PARA LISTADOS Y FILTROS
// =============================================

export interface QuoteListItem {
  id: string
  quoteNumber: string
  clientName: string
  total: number
  currency: 'DOP' | 'USD'
  status: QuoteStatus
  issueDate: string
  validUntil: string
  itemsCount: number
}

export interface InvoiceListItem {
  id: string
  invoiceNumber: string
  ncfNumber?: string
  clientName: string
  total: number
  amountDue: number
  currency: 'DOP' | 'USD'
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  hasFiscalReceipt: boolean
}

export interface QuoteFilters {
  search?: string
  status?: QuoteStatus
  dateFrom?: string
  dateTo?: string
  clientId?: string
}

export interface InvoiceFilters {
  search?: string
  status?: InvoiceStatus
  hasFiscalReceipt?: boolean
  ncfType?: NCFType
  dateFrom?: string
  dateTo?: string
  clientId?: string
}

// =============================================
// CONSTANTES Y OPCIONES
// =============================================

export const NCF_TYPE_OPTIONS = [
  { value: 'B01', label: 'Crédito Fiscal (B01)', description: 'Para contribuyentes con RNC' },
  { value: 'B02', label: 'Consumidor Final (B02)', description: 'Para consumidores sin RNC' },
  { value: 'B14', label: 'Regímenes Especiales (B14)', description: 'Zonas francas y similares' },
  { value: 'B15', label: 'Gubernamental (B15)', description: 'Entidades del gobierno' },
  { value: 'B16', label: 'Exportaciones (B16)', description: 'Ventas al exterior' },
] as const

export const QUOTE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador', color: '#6B7280' },
  { value: 'sent', label: 'Enviada', color: '#3B82F6' },
  { value: 'accepted', label: 'Aceptada', color: '#10B981' },
  { value: 'rejected', label: 'Rechazada', color: '#EF4444' },
  { value: 'expired', label: 'Vencida', color: '#F59E0B' },
  { value: 'converted', label: 'Facturada', color: '#8B5CF6' },
] as const

export const INVOICE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador', color: '#6B7280' },
  { value: 'pending', label: 'Pendiente', color: '#F59E0B' },
  { value: 'paid', label: 'Pagada', color: '#10B981' },
  { value: 'partial', label: 'Pago Parcial', color: '#3B82F6' },
  { value: 'overdue', label: 'Vencida', color: '#EF4444' },
  { value: 'cancelled', label: 'Anulada', color: '#6B7280' },
  { value: 'refunded', label: 'Reembolsada', color: '#8B5CF6' },
] as const

export const PAYMENT_TERMS_OPTIONS = [
  { value: 'immediate', label: 'Pago Inmediato', days: 0 },
  { value: 'net15', label: 'Neto 15 días', days: 15 },
  { value: 'net30', label: 'Neto 30 días', days: 30 },
  { value: 'net45', label: 'Neto 45 días', days: 45 },
  { value: 'net60', label: 'Neto 60 días', days: 60 },
  { value: 'custom', label: 'Personalizado', days: null },
] as const

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Efectivo', icon: 'Banknote' },
  { value: 'card', label: 'Tarjeta', icon: 'CreditCard' },
  { value: 'transfer', label: 'Transferencia', icon: 'ArrowRightLeft' },
  { value: 'check', label: 'Cheque', icon: 'FileText' },
  { value: 'other', label: 'Otro', icon: 'MoreHorizontal' },
] as const

// =============================================
// FUNCIONES HELPER
// =============================================

export function formatCurrency(amount: number, currency: 'DOP' | 'USD' = 'DOP'): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function generateQuoteNumber(prefix: string, sequence: number, year?: number): string {
  const y = year || new Date().getFullYear()
  return `${prefix}-${y}-${sequence.toString().padStart(4, '0')}`
}

export function generateInvoiceNumber(prefix: string, sequence: number, year?: number): string {
  const y = year || new Date().getFullYear()
  return `${prefix}-${y}-${sequence.toString().padStart(4, '0')}`
}

export function generateNCF(type: NCFType, sequence: number): string {
  return `${type}${sequence.toString().padStart(8, '0')}`
}

export function validateRNC(rnc: string): boolean {
  // RNC tiene 9 dígitos
  const cleaned = rnc.replace(/\D/g, '')
  if (cleaned.length !== 9) return false

  // Validación del dígito verificador (algoritmo Luhn modificado)
  const weights = [7, 9, 8, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 8; i++) {
    sum += parseInt(cleaned[i]) * weights[i]
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(cleaned[8])
}

export function validateCedula(cedula: string): boolean {
  // Cédula tiene 11 dígitos
  const cleaned = cedula.replace(/\D/g, '')
  if (cleaned.length !== 11) return false

  // Validación del dígito verificador
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
  let sum = 0
  for (let i = 0; i < 10; i++) {
    let product = parseInt(cleaned[i]) * weights[i]
    if (product > 9) product -= 9
    sum += product
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(cleaned[10])
}

export function formatRNC(rnc: string): string {
  const cleaned = rnc.replace(/\D/g, '')
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 8)}-${cleaned.slice(8)}`
  }
  return rnc
}

export function formatCedula(cedula: string): string {
  const cleaned = cedula.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 10)}-${cleaned.slice(10)}`
  }
  return cedula
}

export function calculateDueDate(issueDate: string, terms: PaymentTerms, customDays?: number): string {
  const date = new Date(issueDate)
  let days = 0

  switch (terms) {
    case 'immediate': days = 0; break
    case 'net15': days = 15; break
    case 'net30': days = 30; break
    case 'net45': days = 45; break
    case 'net60': days = 60; break
    case 'custom': days = customDays || 0; break
  }

  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export function getQuoteStatusConfig(status: QuoteStatus) {
  return QUOTE_STATUS_OPTIONS.find(s => s.value === status)
}

export function getInvoiceStatusConfig(status: InvoiceStatus) {
  return INVOICE_STATUS_OPTIONS.find(s => s.value === status)
}

export function calculateItemTotal(
  quantity: number,
  unitPrice: number,
  discount: number,
  discountType: 'percentage' | 'fixed',
  taxRate: number,
  taxable: boolean
): { subtotal: number; taxAmount: number; total: number } {
  const gross = quantity * unitPrice
  const discountAmount = discountType === 'percentage'
    ? gross * (discount / 100)
    : discount
  const subtotal = gross - discountAmount
  const taxAmount = taxable ? subtotal * (taxRate / 100) : 0
  const total = subtotal + taxAmount

  return { subtotal, taxAmount, total }
}
