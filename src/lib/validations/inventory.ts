import { z } from 'zod'

// =============================================
// VALIDACIONES - Módulo de Inventario
// =============================================

// =============================================
// CATEGORÍAS DE PRODUCTOS
// =============================================

export const productCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  description: z.string().max(500).optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
})

export type ProductCategoryFormData = z.infer<typeof productCategorySchema>

// =============================================
// PRODUCTOS
// =============================================

export const productSchema = z.object({
  categoryId: z.string().uuid('Selecciona una categoría').optional().nullable(),
  sku: z.string()
    .min(3, 'El SKU debe tener al menos 3 caracteres')
    .max(50)
    .regex(/^[A-Z0-9-]+$/, 'Solo mayúsculas, números y guiones'),
  barcode: z.string().max(50).optional().nullable(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  description: z.string().max(1000).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  unit: z.enum(['unit', 'box', 'pack', 'ml', 'g', 'kg', 'l', 'cm', 'm']),
  unitsPerPackage: z.number().int().positive(),
  costPrice: z.number().min(0, 'El precio no puede ser negativo'),
  sellingPrice: z.number().min(0, 'El precio no puede ser negativo'),
  minStock: z.number().int().min(0),
  maxStock: z.number().int().positive().optional().nullable(),
  reorderPoint: z.number().int().min(0),
  reorderQuantity: z.number().int().positive(),
  trackLots: z.boolean(),
  requiresPrescription: z.boolean(),
  isConsumable: z.boolean(),
  forSale: z.boolean(),
  taxRate: z.number().min(0).max(100),
  status: z.enum(['active', 'inactive', 'discontinued', 'out_of_stock']),
  imageUrl: z.string().url().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
}).refine(
  (data) => data.sellingPrice >= data.costPrice,
  { message: 'El precio de venta debe ser mayor o igual al costo', path: ['sellingPrice'] }
).refine(
  (data) => !data.maxStock || data.maxStock >= data.minStock,
  { message: 'El stock máximo debe ser mayor al mínimo', path: ['maxStock'] }
)

export type ProductFormData = z.infer<typeof productSchema>

// =============================================
// PROVEEDORES
// =============================================

export const supplierSchema = z.object({
  code: z.string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Solo mayúsculas, números y guiones'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  legalName: z.string().max(200).optional().nullable(),
  taxId: z.string().max(20).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100),
  postalCode: z.string().max(10).optional().nullable(),
  contactName: z.string().max(200).optional().nullable(),
  contactPhone: z.string().max(20).optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal('')),
  paymentTerms: z.string().max(200).optional().nullable(),
  creditLimit: z.number().min(0).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(['active', 'inactive', 'blocked']),
})

export type SupplierFormData = z.infer<typeof supplierSchema>

// =============================================
// LOTES DE PRODUCTOS
// =============================================

export const productLotSchema = z.object({
  productId: z.string().uuid('Selecciona un producto'),
  lotNumber: z.string()
    .min(1, 'El número de lote es requerido')
    .max(50),
  batchNumber: z.string().max(50).optional().nullable(),
  manufacturingDate: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  initialQuantity: z.number().positive('La cantidad debe ser mayor a 0'),
  purchasePrice: z.number().min(0, 'El precio no puede ser negativo'),
  supplierId: z.string().uuid().optional().nullable(),
  purchaseOrderId: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
}).refine(
  (data) => {
    if (data.manufacturingDate && data.expirationDate) {
      return new Date(data.manufacturingDate) < new Date(data.expirationDate)
    }
    return true
  },
  { message: 'La fecha de vencimiento debe ser posterior a la de fabricación', path: ['expirationDate'] }
)

export type ProductLotFormData = z.infer<typeof productLotSchema>

// =============================================
// MOVIMIENTOS DE INVENTARIO
// =============================================

export const inventoryMovementSchema = z.object({
  productId: z.string().uuid('Selecciona un producto'),
  lotId: z.string().uuid().optional().nullable(),
  movementType: z.enum([
    'purchase', 'sale', 'adjustment_in', 'adjustment_out',
    'transfer_in', 'transfer_out', 'return', 'damaged', 'expired', 'initial'
  ]),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unitCost: z.number().min(0).optional().nullable(),
  referenceType: z.string().max(50).optional().nullable(),
  referenceId: z.string().uuid().optional().nullable(),
  reason: z.string().min(3, 'Ingresa un motivo').max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type InventoryMovementFormData = z.infer<typeof inventoryMovementSchema>

// =============================================
// AJUSTES DE INVENTARIO (simplificado)
// =============================================

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().uuid('Selecciona un producto'),
  lotId: z.string().uuid().optional().nullable(),
  adjustmentType: z.enum(['add', 'remove']),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  reason: z.string().min(5, 'Describe el motivo del ajuste').max(200),
  notes: z.string().max(500).optional().nullable(),
})

export type InventoryAdjustmentFormData = z.infer<typeof inventoryAdjustmentSchema>

// =============================================
// ÓRDENES DE COMPRA
// =============================================

const purchaseOrderItemSchema = z.object({
  productId: z.string().uuid('Selecciona un producto'),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.number().min(0, 'El precio no puede ser negativo'),
  discountPercent: z.number().min(0).max(100),
  taxRate: z.number().min(0).max(100),
  notes: z.string().max(200).optional().nullable(),
})

export type PurchaseOrderItemFormData = z.infer<typeof purchaseOrderItemSchema>

export const purchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Selecciona un proveedor'),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  internalNotes: z.string().max(500).optional().nullable(),
  items: z.array(purchaseOrderItemSchema).min(1, 'Agrega al menos un producto'),
})

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>

// =============================================
// RECEPCIÓN DE ORDEN DE COMPRA
// =============================================

const receiveItemSchema = z.object({
  itemId: z.string().uuid(),
  receivedQuantity: z.number().min(0),
  lotNumber: z.string().min(1, 'El número de lote es requerido').optional(),
  expirationDate: z.string().optional().nullable(),
  notes: z.string().max(200).optional().nullable(),
})

export const receivePurchaseOrderSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  items: z.array(receiveItemSchema).min(1),
  notes: z.string().max(500).optional().nullable(),
})

export type ReceivePurchaseOrderFormData = z.infer<typeof receivePurchaseOrderSchema>

// =============================================
// CONTEO DE INVENTARIO
// =============================================

export const inventoryCountSchema = z.object({
  countType: z.enum(['full', 'partial', 'cycle']),
  categoryId: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type InventoryCountFormData = z.infer<typeof inventoryCountSchema>

const countItemSchema = z.object({
  productId: z.string().uuid(),
  lotId: z.string().uuid().optional().nullable(),
  expectedQuantity: z.number().min(0),
  countedQuantity: z.number().min(0).optional().nullable(),
  notes: z.string().max(200).optional().nullable(),
})

export const submitInventoryCountSchema = z.object({
  inventoryCountId: z.string().uuid(),
  items: z.array(countItemSchema).min(1),
  notes: z.string().max(500).optional().nullable(),
})

export type SubmitInventoryCountFormData = z.infer<typeof submitInventoryCountSchema>

// =============================================
// TRANSFERENCIAS
// =============================================

const transferItemSchema = z.object({
  productId: z.string().uuid('Selecciona un producto'),
  lotId: z.string().uuid().optional().nullable(),
  requestedQuantity: z.number().positive('La cantidad debe ser mayor a 0'),
  notes: z.string().max(200).optional().nullable(),
})

export type TransferItemFormData = z.infer<typeof transferItemSchema>

export const inventoryTransferSchema = z.object({
  fromBranchId: z.string().uuid('Selecciona la sucursal de origen'),
  toBranchId: z.string().uuid('Selecciona la sucursal de destino'),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(transferItemSchema).min(1, 'Agrega al menos un producto'),
}).refine(
  (data) => data.fromBranchId !== data.toBranchId,
  { message: 'Las sucursales de origen y destino deben ser diferentes', path: ['toBranchId'] }
)

export type InventoryTransferFormData = z.infer<typeof inventoryTransferSchema>

// =============================================
// FILTROS
// =============================================

export const productsFiltersSchema = z.object({
  categoryId: z.string().uuid().optional(),
  status: z.enum(['all', 'active', 'inactive', 'discontinued', 'out_of_stock']).default('all'),
  search: z.string().optional(),
  lowStock: z.boolean().default(false),
  forSale: z.boolean().optional(),
  isConsumable: z.boolean().optional(),
  sortBy: z.enum(['name', 'sku', 'costPrice', 'sellingPrice', 'currentStock', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export type ProductsFilters = z.infer<typeof productsFiltersSchema>

export const movementsFiltersSchema = z.object({
  productId: z.string().uuid().optional(),
  movementType: z.enum([
    'all', 'purchase', 'sale', 'adjustment_in', 'adjustment_out',
    'transfer_in', 'transfer_out', 'return', 'damaged', 'expired', 'initial'
  ]).default('all'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['createdAt', 'quantity', 'productName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
})

export type MovementsFilters = z.infer<typeof movementsFiltersSchema>

export const alertsFiltersSchema = z.object({
  alertType: z.enum(['all', 'low_stock', 'expiring_soon', 'expired', 'overstock']).default('all'),
  severity: z.enum(['all', 'low', 'medium', 'high', 'critical']).default('all'),
  branchId: z.string().uuid().optional(),
})

export type AlertsFilters = z.infer<typeof alertsFiltersSchema>

// =============================================
// QUICK ACTIONS
// =============================================

export const quickStockUpdateSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int(),
  reason: z.string().min(3).max(100),
})

export type QuickStockUpdateFormData = z.infer<typeof quickStockUpdateSchema>
