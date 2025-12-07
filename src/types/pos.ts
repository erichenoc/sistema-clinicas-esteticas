// =============================================
// TIPOS - Módulo de POS/Facturación
// =============================================

// Enums
export type SaleStatus = 'pending' | 'paid' | 'partial' | 'cancelled' | 'refunded'
export type SaleType = 'standard' | 'package_purchase' | 'package_consumption' | 'credit_use'
export type SaleItemType = 'treatment' | 'package' | 'product' | 'session_consumption' | 'other'
export type PaymentMethod = 'cash' | 'card_debit' | 'card_credit' | 'transfer' | 'check' | 'patient_credit' | 'other'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
export type CashSessionStatus = 'open' | 'closed' | 'audited'
export type CashMovementType = 'sale' | 'refund' | 'cash_in' | 'cash_out' | 'adjustment' | 'opening' | 'closing'
export type CouponDiscountType = 'percentage' | 'fixed_amount'
export type PatientPackageStatus = 'active' | 'completed' | 'expired' | 'cancelled' | 'paused'
export type CreditType = 'refund' | 'promotion' | 'gift' | 'compensation' | 'adjustment'

// =============================================
// CASH REGISTER - Caja Registradora
// =============================================
export interface CashRegister {
  id: string
  clinicId: string
  branchId: string | null
  name: string
  description: string | null
  isDefault: boolean
  status: 'open' | 'closed'
  currentSessionId: string | null
  openedAt: string | null
  openedBy: string | null
  openingBalance: number | null
  expectedBalance: number | null
  actualBalance: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CashRegisterStatus extends CashRegister {
  sessionOpenedAt: string | null
  sessionOpeningBalance: number | null
  openedByName: string | null
  sessionTotalSales: number
  sessionTotalRefunds: number
  sessionNetCash: number
}

// =============================================
// CASH SESSION - Sesión de Caja
// =============================================
export interface CashSession {
  id: string
  cashRegisterId: string
  openedAt: string
  openedBy: string
  openingBalance: number
  openingNotes: string | null
  closedAt: string | null
  closedBy: string | null
  closingBalance: number | null
  expectedBalance: number | null
  difference: number | null
  closingNotes: string | null
  totalSales: number
  totalRefunds: number
  totalCashIn: number
  totalCashOut: number
  status: CashSessionStatus
  createdAt: string
}

export interface CashSessionInput {
  cashRegisterId: string
  openingBalance: number
  openingNotes?: string | null
}

export interface CloseCashSessionInput {
  closingBalance: number
  closingNotes?: string | null
}

// =============================================
// CASH MOVEMENT - Movimiento de Caja
// =============================================
export interface CashMovement {
  id: string
  cashSessionId: string
  type: CashMovementType
  amount: number
  paymentMethod: PaymentMethod | null
  referenceType: string | null
  referenceId: string | null
  description: string | null
  notes: string | null
  createdAt: string
  createdBy: string
}

export interface CashMovementInput {
  type: CashMovementType
  amount: number
  paymentMethod?: PaymentMethod | null
  description?: string | null
  notes?: string | null
}

// =============================================
// SALE - Venta
// =============================================
export interface Sale {
  id: string
  clinicId: string
  branchId: string | null
  cashSessionId: string | null
  saleNumber: string
  saleType: SaleType
  patientId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  soldBy: string
  professionalId: string | null
  subtotal: number
  discountAmount: number
  discountReason: string | null
  taxAmount: number
  total: number
  couponId: string | null
  couponDiscount: number
  creditUsed: number
  status: SaleStatus
  paidAt: string | null
  notes: string | null
  internalNotes: string | null
  createdAt: string
  updatedAt: string
  cancelledAt: string | null
  cancelledBy: string | null
  cancellationReason: string | null
}

export interface SaleDetails extends Sale {
  patientFullName: string | null
  patientPhone: string | null
  soldByName: string
  items: SaleItem[]
  paidAmount: number
  pendingAmount: number
}

export interface SaleInput {
  patientId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  saleType?: SaleType
  discountAmount?: number
  discountReason?: string | null
  couponCode?: string | null
  creditAmount?: number
  notes?: string | null
  items: SaleItemInput[]
  payments?: PaymentInput[]
}

// =============================================
// SALE ITEM - Item de Venta
// =============================================
export interface SaleItem {
  id: string
  saleId: string
  itemType: SaleItemType
  treatmentId: string | null
  packageId: string | null
  productId: string | null
  patientPackageId: string | null
  name: string
  description: string | null
  quantity: number
  unitPrice: number
  discountPercent: number
  discountAmount: number
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  professionalId: string | null
  commissionRate: number | null
  commissionAmount: number | null
  sessionId: string | null
  createdAt: string
}

export interface SaleItemInput {
  itemType: SaleItemType
  treatmentId?: string | null
  packageId?: string | null
  productId?: string | null
  patientPackageId?: string | null
  name: string
  description?: string | null
  quantity: number
  unitPrice: number
  discountPercent?: number
  professionalId?: string | null
}

// =============================================
// PAYMENT - Pago
// =============================================
export interface Payment {
  id: string
  saleId: string
  cashSessionId: string | null
  paymentMethod: PaymentMethod
  amount: number
  amountReceived: number | null
  changeGiven: number | null
  referenceNumber: string | null
  cardLastFour: string | null
  cardBrand: string | null
  bankName: string | null
  status: PaymentStatus
  notes: string | null
  createdAt: string
  createdBy: string
  refundedAt: string | null
  refundedBy: string | null
  refundReason: string | null
}

export interface PaymentInput {
  paymentMethod: PaymentMethod
  amount: number
  amountReceived?: number | null
  referenceNumber?: string | null
  cardLastFour?: string | null
  cardBrand?: string | null
  bankName?: string | null
  notes?: string | null
}

// =============================================
// COUPON - Cupón
// =============================================
export interface Coupon {
  id: string
  clinicId: string
  code: string
  name: string
  description: string | null
  discountType: CouponDiscountType
  discountValue: number
  maxDiscount: number | null
  minPurchaseAmount: number | null
  applicableTo: 'all' | 'treatments' | 'packages' | 'products' | 'specific'
  applicableItems: string[]
  maxUses: number | null
  maxUsesPerPatient: number
  currentUses: number
  validFrom: string
  validUntil: string | null
  isActive: boolean
  createdAt: string
  createdBy: string | null
}

export interface CouponInput {
  code: string
  name: string
  description?: string | null
  discountType: CouponDiscountType
  discountValue: number
  maxDiscount?: number | null
  minPurchaseAmount?: number | null
  applicableTo?: 'all' | 'treatments' | 'packages' | 'products' | 'specific'
  applicableItems?: string[]
  maxUses?: number | null
  maxUsesPerPatient?: number
  validFrom?: string
  validUntil?: string | null
  isActive?: boolean
}

// =============================================
// PATIENT PACKAGE - Paquete del Paciente
// =============================================
export interface PatientPackage {
  id: string
  clinicId: string
  patientId: string
  packageId: string
  saleId: string | null
  purchasePrice: number
  totalSessions: number
  usedSessions: number
  remainingSessions: number
  purchasedAt: string
  startsAt: string
  expiresAt: string | null
  status: PatientPackageStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface PatientPackageWithDetails extends PatientPackage {
  packageName: string
  patientName: string
  sessions: PatientPackageSession[]
}

export interface PatientPackageSession {
  id: string
  patientPackageId: string
  sessionId: string | null
  treatmentId: string | null
  sessionNumber: number
  treatmentName: string | null
  status: 'available' | 'used' | 'expired' | 'cancelled'
  usedAt: string | null
  scheduledAt: string | null
  notes: string | null
  createdAt: string
}

// =============================================
// PATIENT CREDIT - Crédito del Paciente
// =============================================
export interface PatientCredit {
  id: string
  clinicId: string
  patientId: string
  creditType: CreditType
  amount: number
  usedAmount: number
  remainingAmount: number
  sourceSaleId: string | null
  reason: string | null
  expiresAt: string | null
  status: 'active' | 'used' | 'expired' | 'cancelled'
  createdAt: string
  createdBy: string | null
  updatedAt: string
}

export interface PatientCreditInput {
  patientId: string
  creditType: CreditType
  amount: number
  reason?: string | null
  expiresAt?: string | null
}

// =============================================
// CONSTANTES Y OPCIONES
// =============================================

export const SALE_STATUS_OPTIONS: {
  value: SaleStatus
  label: string
  color: string
}[] = [
  { value: 'pending', label: 'Pendiente', color: '#f59e0b' },
  { value: 'paid', label: 'Pagada', color: '#22c55e' },
  { value: 'partial', label: 'Pago parcial', color: '#3b82f6' },
  { value: 'cancelled', label: 'Cancelada', color: '#6b7280' },
  { value: 'refunded', label: 'Reembolsada', color: '#ef4444' },
]

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod
  label: string
  icon: string
}[] = [
  { value: 'cash', label: 'Efectivo', icon: 'banknote' },
  { value: 'card_debit', label: 'Tarjeta Débito', icon: 'credit-card' },
  { value: 'card_credit', label: 'Tarjeta Crédito', icon: 'credit-card' },
  { value: 'transfer', label: 'Transferencia', icon: 'arrow-right-left' },
  { value: 'check', label: 'Cheque', icon: 'receipt' },
  { value: 'patient_credit', label: 'Crédito Paciente', icon: 'wallet' },
  { value: 'other', label: 'Otro', icon: 'more-horizontal' },
]

export const SALE_TYPE_OPTIONS: {
  value: SaleType
  label: string
}[] = [
  { value: 'standard', label: 'Venta estándar' },
  { value: 'package_purchase', label: 'Compra de paquete' },
  { value: 'package_consumption', label: 'Consumo de paquete' },
  { value: 'credit_use', label: 'Uso de crédito' },
]

export const PATIENT_PACKAGE_STATUS_OPTIONS: {
  value: PatientPackageStatus
  label: string
  color: string
}[] = [
  { value: 'active', label: 'Activo', color: '#22c55e' },
  { value: 'completed', label: 'Completado', color: '#3b82f6' },
  { value: 'expired', label: 'Expirado', color: '#f59e0b' },
  { value: 'cancelled', label: 'Cancelado', color: '#ef4444' },
  { value: 'paused', label: 'Pausado', color: '#6b7280' },
]

// =============================================
// HELPERS
// =============================================

export function getSaleStatusConfig(status: SaleStatus) {
  return SALE_STATUS_OPTIONS.find((s) => s.value === status)
}

export function getPaymentMethodConfig(method: PaymentMethod) {
  return PAYMENT_METHOD_OPTIONS.find((m) => m.value === method)
}

export function formatCurrency(amount: number, currency = 'DOP'): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function calculateSaleTotal(
  items: { unitPrice: number; quantity: number; discountAmount?: number }[],
  discount = 0,
  couponDiscount = 0,
  creditUsed = 0
): { subtotal: number; total: number } {
  const subtotal = items.reduce(
    (acc, item) => acc + (item.unitPrice * item.quantity - (item.discountAmount || 0)),
    0
  )
  const total = Math.max(0, subtotal - discount - couponDiscount - creditUsed)
  return { subtotal, total }
}

export function validateCoupon(
  coupon: Coupon,
  patientId: string | null,
  purchaseAmount: number,
  patientUses: number
): { valid: boolean; error?: string } {
  if (!coupon.isActive) {
    return { valid: false, error: 'El cupón no está activo' }
  }

  const now = new Date()
  if (new Date(coupon.validFrom) > now) {
    return { valid: false, error: 'El cupón aún no es válido' }
  }

  if (coupon.validUntil && new Date(coupon.validUntil) < now) {
    return { valid: false, error: 'El cupón ha expirado' }
  }

  if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
    return { valid: false, error: 'El cupón ha alcanzado su límite de usos' }
  }

  if (patientUses >= coupon.maxUsesPerPatient) {
    return { valid: false, error: 'Ya has usado este cupón el máximo permitido' }
  }

  if (coupon.minPurchaseAmount && purchaseAmount < coupon.minPurchaseAmount) {
    return {
      valid: false,
      error: `El monto mínimo de compra es ${formatCurrency(coupon.minPurchaseAmount)}`,
    }
  }

  return { valid: true }
}

export function calculateCouponDiscount(coupon: Coupon, subtotal: number): number {
  let discount = 0

  if (coupon.discountType === 'percentage') {
    discount = (subtotal * coupon.discountValue) / 100
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount
    }
  } else {
    discount = coupon.discountValue
  }

  return Math.min(discount, subtotal)
}
