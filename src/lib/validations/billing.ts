import { z } from 'zod'

// =============================================
// VALIDACIONES - Módulo de Facturación
// =============================================

// Validación de RNC (9 dígitos con dígito verificador)
const rncSchema = z.string().refine((val) => {
  const cleaned = val.replace(/\D/g, '')
  if (cleaned.length !== 9) return false

  const weights = [7, 9, 8, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 8; i++) {
    sum += parseInt(cleaned[i]) * weights[i]
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(cleaned[8])
}, { message: 'RNC inválido' })

// Validación de Cédula (11 dígitos con dígito verificador)
const cedulaSchema = z.string().refine((val) => {
  const cleaned = val.replace(/\D/g, '')
  if (cleaned.length !== 11) return false

  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
  let sum = 0
  for (let i = 0; i < 10; i++) {
    let product = parseInt(cleaned[i]) * weights[i]
    if (product > 9) product -= 9
    sum += product
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(cleaned[10])
}, { message: 'Cédula inválida' })

// =============================================
// CLIENTE DE FACTURACIÓN
// =============================================

export const billingClientSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  email: z
    .string()
    .email('Email inválido'),
  phone: z
    .string()
    .min(10, 'Teléfono debe tener al menos 10 dígitos'),
  isBusiness: z.boolean(),
  rncCedula: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true
      const cleaned = val.replace(/\D/g, '')
      return cleaned.length === 9 || cleaned.length === 11
    }, { message: 'Debe ser un RNC (9 dígitos) o Cédula (11 dígitos) válido' }),
  businessName: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional(),
  address: z
    .string()
    .max(300, 'Máximo 300 caracteres')
    .optional(),
  city: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .optional(),
  province: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .optional(),
}).refine((data) => {
  // Si es empresa, debe tener razón social
  if (data.isBusiness && !data.businessName) {
    return false
  }
  return true
}, {
  message: 'Las empresas requieren razón social',
  path: ['businessName'],
})

export type BillingClientFormData = z.infer<typeof billingClientSchema>

// =============================================
// ITEMS DE COTIZACIÓN/FACTURA
// =============================================

export const documentItemSchema = z.object({
  type: z.enum(['treatment', 'product', 'package', 'custom']),
  referenceId: z.string().optional(),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(500, 'Máximo 500 caracteres'),
  quantity: z
    .number()
    .min(0.01, 'La cantidad debe ser mayor a 0'),
  unitPrice: z
    .number()
    .min(0, 'El precio no puede ser negativo'),
  discount: z
    .number()
    .min(0, 'El descuento no puede ser negativo')
    .max(100, 'El descuento no puede ser mayor al 100%'),
  discountType: z.enum(['percentage', 'fixed']),
  taxable: z.boolean().optional(),
  notes: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional(),
})

export type DocumentItemFormData = z.infer<typeof documentItemSchema>

// =============================================
// COTIZACIÓN
// =============================================

export const quoteSchema = z.object({
  clientId: z
    .string()
    .min(1, 'Selecciona un cliente'),
  items: z
    .array(documentItemSchema)
    .min(1, 'Agrega al menos un item'),
  currency: z.enum(['DOP', 'USD']),
  validUntil: z
    .string()
    .min(1, 'La fecha de validez es requerida'),
  notes: z
    .string()
    .max(2000, 'Máximo 2000 caracteres')
    .optional(),
  termsAndConditions: z
    .string()
    .max(5000, 'Máximo 5000 caracteres')
    .optional(),
})

export type QuoteFormData = z.infer<typeof quoteSchema>

// =============================================
// FACTURA
// =============================================

export const invoiceSchema = z.object({
  clientId: z
    .string()
    .min(1, 'Selecciona un cliente'),

  // Comprobante fiscal
  hasFiscalReceipt: z.boolean(),
  ncfType: z.enum(['B01', 'B02', 'B14', 'B15', 'B16']).optional(),

  // Referencias
  quoteId: z.string().optional(),
  saleId: z.string().optional(),
  appointmentId: z.string().optional(),

  // Items
  items: z
    .array(documentItemSchema.extend({
      taxable: z.boolean(),
      taxRate: z.number().min(0).max(100),
    }))
    .min(1, 'Agrega al menos un item'),

  currency: z.enum(['DOP', 'USD']),

  // Términos de pago
  paymentTerms: z.enum(['immediate', 'net15', 'net30', 'net45', 'net60', 'custom']),
  customPaymentDays: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional(),

  // Notas
  notes: z
    .string()
    .max(2000, 'Máximo 2000 caracteres')
    .optional(),
  internalNotes: z
    .string()
    .max(2000, 'Máximo 2000 caracteres')
    .optional(),
}).refine((data) => {
  // Si tiene comprobante fiscal, debe especificar el tipo
  if (data.hasFiscalReceipt && !data.ncfType) {
    return false
  }
  return true
}, {
  message: 'Selecciona el tipo de comprobante fiscal',
  path: ['ncfType'],
}).refine((data) => {
  // Si es pago personalizado, debe especificar los días
  if (data.paymentTerms === 'custom' && !data.customPaymentDays) {
    return false
  }
  return true
}, {
  message: 'Especifica los días de crédito',
  path: ['customPaymentDays'],
})

export type InvoiceFormData = z.infer<typeof invoiceSchema>

// =============================================
// PAGO DE FACTURA
// =============================================

export const invoicePaymentSchema = z.object({
  amount: z
    .number()
    .positive('El monto debe ser mayor a 0'),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'check', 'other']),
  reference: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .optional(),
  notes: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional(),
})

export type InvoicePaymentFormData = z.infer<typeof invoicePaymentSchema>

// =============================================
// CONFIGURACIÓN DE FACTURACIÓN
// =============================================

export const billingSettingsSchema = z.object({
  // Datos de la empresa
  businessName: z
    .string()
    .min(1, 'La razón social es requerida')
    .max(200, 'Máximo 200 caracteres'),
  rnc: rncSchema,
  address: z
    .string()
    .min(1, 'La dirección es requerida')
    .max(300, 'Máximo 300 caracteres'),
  city: z
    .string()
    .min(1, 'La ciudad es requerida')
    .max(100, 'Máximo 100 caracteres'),
  province: z
    .string()
    .min(1, 'La provincia es requerida')
    .max(100, 'Máximo 100 caracteres'),
  phone: z
    .string()
    .min(10, 'Teléfono debe tener al menos 10 dígitos'),
  email: z
    .string()
    .email('Email inválido'),

  // NCF
  ncfEnabled: z.boolean(),
  ncfPrefix: z
    .string()
    .max(20, 'Máximo 20 caracteres')
    .optional(),

  // Impuestos
  defaultTaxRate: z
    .number()
    .min(0, 'No puede ser negativo')
    .max(100, 'Máximo 100%'),

  // Términos
  defaultPaymentTerms: z.enum(['immediate', 'net15', 'net30', 'net45', 'net60', 'custom']),
  defaultQuoteValidity: z
    .number()
    .int()
    .min(1, 'Mínimo 1 día')
    .max(365, 'Máximo 365 días'),

  // Prefijos
  quotePrefix: z
    .string()
    .min(1, 'El prefijo es requerido')
    .max(10, 'Máximo 10 caracteres'),
  invoicePrefix: z
    .string()
    .min(1, 'El prefijo es requerido')
    .max(10, 'Máximo 10 caracteres'),

  // Textos
  defaultQuoteNotes: z
    .string()
    .max(2000, 'Máximo 2000 caracteres')
    .optional(),
  defaultQuoteTerms: z
    .string()
    .max(5000, 'Máximo 5000 caracteres')
    .optional(),
  defaultInvoiceNotes: z
    .string()
    .max(2000, 'Máximo 2000 caracteres')
    .optional(),
})

export type BillingSettingsFormData = z.infer<typeof billingSettingsSchema>

// =============================================
// ANULACIÓN DE FACTURA
// =============================================

export const invoiceCancellationSchema = z.object({
  reason: z
    .string()
    .min(10, 'Explica el motivo de la anulación (mínimo 10 caracteres)')
    .max(500, 'Máximo 500 caracteres'),
})

export type InvoiceCancellationFormData = z.infer<typeof invoiceCancellationSchema>

// =============================================
// CONVERSIÓN DE COTIZACIÓN A FACTURA
// =============================================

export const quoteToInvoiceSchema = z.object({
  hasFiscalReceipt: z.boolean(),
  ncfType: z.enum(['B01', 'B02', 'B14', 'B15', 'B16']).optional(),
  paymentTerms: z.enum(['immediate', 'net15', 'net30', 'net45', 'net60', 'custom']),
  customPaymentDays: z.number().int().min(1).max(365).optional(),
}).refine((data) => {
  if (data.hasFiscalReceipt && !data.ncfType) {
    return false
  }
  return true
}, {
  message: 'Selecciona el tipo de comprobante fiscal',
  path: ['ncfType'],
})

export type QuoteToInvoiceFormData = z.infer<typeof quoteToInvoiceSchema>
