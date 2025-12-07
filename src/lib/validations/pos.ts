import { z } from 'zod'

// =============================================
// VALIDACIONES - Módulo de POS/Facturación
// =============================================

// =============================================
// SESIÓN DE CAJA
// =============================================

export const openCashSessionSchema = z.object({
  cashRegisterId: z.string().uuid('Selecciona una caja'),
  openingBalance: z.number().min(0, 'El monto no puede ser negativo'),
  openingNotes: z.string().max(500).optional().nullable(),
})

export type OpenCashSessionFormData = z.infer<typeof openCashSessionSchema>

export const closeCashSessionSchema = z.object({
  closingBalance: z.number().min(0, 'El monto no puede ser negativo'),
  closingNotes: z.string().max(500).optional().nullable(),
})

export type CloseCashSessionFormData = z.infer<typeof closeCashSessionSchema>

// =============================================
// MOVIMIENTO DE CAJA
// =============================================

export const cashMovementSchema = z.object({
  type: z.enum(['cash_in', 'cash_out', 'adjustment']),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  description: z.string().min(1, 'La descripción es requerida').max(200),
  notes: z.string().max(500).optional().nullable(),
})

export type CashMovementFormData = z.infer<typeof cashMovementSchema>

// =============================================
// ITEM DE VENTA
// =============================================

const saleItemSchema = z.object({
  itemType: z.enum(['treatment', 'package', 'product', 'session_consumption', 'other']),
  treatmentId: z.string().uuid().optional().nullable(),
  packageId: z.string().uuid().optional().nullable(),
  productId: z.string().uuid().optional().nullable(),
  patientPackageId: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().max(500).optional().nullable(),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.number().min(0, 'El precio no puede ser negativo'),
  discountPercent: z.number().min(0).max(100).default(0),
  professionalId: z.string().uuid().optional().nullable(),
})

export type SaleItemFormData = z.infer<typeof saleItemSchema>

// =============================================
// PAGO
// =============================================

const paymentSchema = z.object({
  paymentMethod: z.enum([
    'cash',
    'card_debit',
    'card_credit',
    'transfer',
    'check',
    'patient_credit',
    'other',
  ]),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  amountReceived: z.number().min(0).optional().nullable(),
  referenceNumber: z.string().max(100).optional().nullable(),
  cardLastFour: z.string().length(4).optional().nullable(),
  cardBrand: z.string().max(20).optional().nullable(),
  bankName: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type PaymentFormData = z.infer<typeof paymentSchema>

// =============================================
// VENTA COMPLETA
// =============================================

export const saleSchema = z.object({
  patientId: z.string().uuid().optional().nullable(),
  customerName: z.string().max(200).optional().nullable(),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().max(20).optional().nullable(),
  saleType: z.enum(['standard', 'package_purchase', 'package_consumption', 'credit_use']).default('standard'),
  discountAmount: z.number().min(0).default(0),
  discountReason: z.string().max(200).optional().nullable(),
  couponCode: z.string().max(50).optional().nullable(),
  creditAmount: z.number().min(0).default(0),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(saleItemSchema).min(1, 'Agrega al menos un item'),
  payments: z.array(paymentSchema).optional(),
}).refine(
  (data) => data.patientId || data.customerName,
  { message: 'Selecciona un paciente o ingresa el nombre del cliente', path: ['patientId'] }
)

export type SaleFormData = z.infer<typeof saleSchema>

// =============================================
// CUPÓN
// =============================================

export const couponSchema = z.object({
  code: z.string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(50)
    .regex(/^[A-Z0-9-]+$/, 'Solo mayúsculas, números y guiones'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  description: z.string().max(1000).optional().nullable(),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number().positive('El valor debe ser mayor a 0'),
  maxDiscount: z.number().positive().optional().nullable(),
  minPurchaseAmount: z.number().min(0).optional().nullable(),
  applicableTo: z.enum(['all', 'treatments', 'packages', 'products', 'specific']).default('all'),
  applicableItems: z.array(z.string().uuid()).default([]),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerPatient: z.number().int().positive().default(1),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      return false
    }
    return true
  },
  { message: 'El porcentaje no puede ser mayor a 100', path: ['discountValue'] }
)

export type CouponFormData = z.infer<typeof couponSchema>

// =============================================
// CRÉDITO DEL PACIENTE
// =============================================

export const patientCreditSchema = z.object({
  patientId: z.string().uuid('Selecciona un paciente'),
  creditType: z.enum(['refund', 'promotion', 'gift', 'compensation', 'adjustment']),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  reason: z.string().min(5, 'Describe el motivo').max(500).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
})

export type PatientCreditFormData = z.infer<typeof patientCreditSchema>

// =============================================
// REEMBOLSO
// =============================================

export const refundSchema = z.object({
  saleId: z.string().uuid(),
  paymentId: z.string().uuid().optional(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  reason: z.string().min(10, 'Describe el motivo del reembolso').max(500),
  refundMethod: z.enum(['cash', 'card', 'patient_credit']),
})

export type RefundFormData = z.infer<typeof refundSchema>

// =============================================
// VALIDACIÓN DE CUPÓN
// =============================================

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Ingresa el código del cupón'),
  subtotal: z.number().min(0),
  patientId: z.string().uuid().optional().nullable(),
})

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>

// =============================================
// FILTROS
// =============================================

export const salesFiltersSchema = z.object({
  patientId: z.string().uuid().optional(),
  status: z.enum(['all', 'pending', 'paid', 'partial', 'cancelled', 'refunded']).default('all'),
  paymentMethod: z.enum([
    'all', 'cash', 'card_debit', 'card_credit', 'transfer', 'check', 'patient_credit', 'other'
  ]).default('all'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  cashSessionId: z.string().uuid().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  sortBy: z.enum(['createdAt', 'total', 'saleNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export type SalesFilters = z.infer<typeof salesFiltersSchema>

// =============================================
// QUICK SALE (POS rápido)
// =============================================

export const quickSaleItemSchema = z.object({
  id: z.string(), // treatmentId, packageId, productId
  type: z.enum(['treatment', 'package', 'product']),
  name: z.string(),
  price: z.number(),
  quantity: z.number().positive().default(1),
  discount: z.number().min(0).max(100).default(0), // porcentaje
})

export const quickSaleSchema = z.object({
  patientId: z.string().uuid().optional().nullable(),
  items: z.array(quickSaleItemSchema).min(1, 'Agrega al menos un item'),
  couponCode: z.string().optional().nullable(),
  discount: z.number().min(0).default(0),
  notes: z.string().max(500).optional().nullable(),
})

export type QuickSaleFormData = z.infer<typeof quickSaleSchema>
