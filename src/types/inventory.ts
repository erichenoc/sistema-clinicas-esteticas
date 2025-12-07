// =============================================
// TIPOS - Módulo de Inventario
// =============================================

// Enums
export type ProductCategory = 'consumables' | 'equipment' | 'cosmetics' | 'supplements' | 'medications' | 'accessories' | 'disposables' | 'other'
export type ProductStatus = 'active' | 'inactive' | 'discontinued' | 'out_of_stock'
export type SupplierStatus = 'active' | 'inactive' | 'blocked'
export type LotStatus = 'active' | 'expired' | 'depleted' | 'returned' | 'damaged'
export type MovementType = 'purchase' | 'sale' | 'adjustment_in' | 'adjustment_out' | 'transfer_in' | 'transfer_out' | 'return' | 'damaged' | 'expired' | 'initial'
export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled'
export type InventoryCountStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled'
export type TransferStatus = 'pending' | 'in_transit' | 'received' | 'cancelled'
export type AlertType = 'low_stock' | 'expiring_soon' | 'expired' | 'overstock'
export type UnitType = 'unit' | 'box' | 'pack' | 'ml' | 'g' | 'kg' | 'l' | 'cm' | 'm'

// =============================================
// CATEGORÍAS DE PRODUCTOS
// =============================================
export interface ProductCategoryItem {
  id: string
  clinicId: string
  name: string
  description: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductCategoryInput {
  name: string
  description?: string | null
  parentId?: string | null
  sortOrder?: number
  isActive?: boolean
}

// =============================================
// PRODUCTOS
// =============================================
export interface Product {
  id: string
  clinicId: string
  categoryId: string | null
  sku: string
  barcode: string | null
  name: string
  description: string | null
  brand: string | null
  unit: UnitType
  unitsPerPackage: number
  costPrice: number
  sellingPrice: number
  minStock: number
  maxStock: number | null
  reorderPoint: number
  reorderQuantity: number
  trackLots: boolean
  requiresPrescription: boolean
  isConsumable: boolean
  forSale: boolean
  taxRate: number
  status: ProductStatus
  imageUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductWithStock extends Product {
  categoryName: string | null
  currentStock: number
  reservedStock: number
  availableStock: number
  stockValue: number
  lastPurchaseDate: string | null
  lastPurchasePrice: number | null
}

export interface ProductInput {
  categoryId?: string | null
  sku: string
  barcode?: string | null
  name: string
  description?: string | null
  brand?: string | null
  unit?: UnitType
  unitsPerPackage?: number
  costPrice: number
  sellingPrice: number
  minStock?: number
  maxStock?: number | null
  reorderPoint?: number
  reorderQuantity?: number
  trackLots?: boolean
  requiresPrescription?: boolean
  isConsumable?: boolean
  forSale?: boolean
  taxRate?: number
  status?: ProductStatus
  imageUrl?: string | null
  notes?: string | null
}

// =============================================
// PROVEEDORES
// =============================================
export interface Supplier {
  id: string
  clinicId: string
  code: string
  name: string
  legalName: string | null
  taxId: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string
  postalCode: string | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  paymentTerms: string | null
  creditLimit: number | null
  notes: string | null
  status: SupplierStatus
  createdAt: string
  updatedAt: string
}

export interface SupplierWithStats extends Supplier {
  totalOrders: number
  totalPurchases: number
  lastOrderDate: string | null
  avgDeliveryDays: number | null
}

export interface SupplierInput {
  code: string
  name: string
  legalName?: string | null
  taxId?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string
  postalCode?: string | null
  contactName?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  paymentTerms?: string | null
  creditLimit?: number | null
  notes?: string | null
  status?: SupplierStatus
}

// =============================================
// INVENTARIO (Stock por ubicación)
// =============================================
export interface Inventory {
  id: string
  clinicId: string
  branchId: string | null
  productId: string
  currentStock: number
  reservedStock: number
  lastMovementAt: string | null
  lastCountAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InventoryWithProduct extends Inventory {
  productName: string
  productSku: string
  productUnit: UnitType
  minStock: number
  reorderPoint: number
  costPrice: number
  sellingPrice: number
}

// =============================================
// LOTES DE PRODUCTOS
// =============================================
export interface ProductLot {
  id: string
  clinicId: string
  branchId: string | null
  productId: string
  lotNumber: string
  batchNumber: string | null
  manufacturingDate: string | null
  expirationDate: string | null
  initialQuantity: number
  currentQuantity: number
  purchasePrice: number
  supplierId: string | null
  purchaseOrderId: string | null
  status: LotStatus
  notes: string | null
  createdAt: string
}

export interface ProductLotWithDetails extends ProductLot {
  productName: string
  productSku: string
  supplierName: string | null
  daysUntilExpiry: number | null
}

export interface ProductLotInput {
  productId: string
  lotNumber: string
  batchNumber?: string | null
  manufacturingDate?: string | null
  expirationDate?: string | null
  initialQuantity: number
  purchasePrice: number
  supplierId?: string | null
  purchaseOrderId?: string | null
  notes?: string | null
}

// =============================================
// MOVIMIENTOS DE INVENTARIO
// =============================================
export interface InventoryMovement {
  id: string
  clinicId: string
  branchId: string | null
  productId: string
  lotId: string | null
  movementType: MovementType
  quantity: number
  previousStock: number
  newStock: number
  unitCost: number | null
  totalCost: number | null
  referenceType: string | null
  referenceId: string | null
  reason: string | null
  notes: string | null
  createdAt: string
  createdBy: string
}

export interface InventoryMovementWithDetails extends InventoryMovement {
  productName: string
  productSku: string
  lotNumber: string | null
  createdByName: string
}

export interface InventoryMovementInput {
  productId: string
  lotId?: string | null
  movementType: MovementType
  quantity: number
  unitCost?: number | null
  referenceType?: string | null
  referenceId?: string | null
  reason?: string | null
  notes?: string | null
}

// =============================================
// ÓRDENES DE COMPRA
// =============================================
export interface PurchaseOrder {
  id: string
  clinicId: string
  branchId: string | null
  orderNumber: string
  supplierId: string
  status: PurchaseOrderStatus
  orderDate: string
  expectedDate: string | null
  receivedDate: string | null
  subtotal: number
  taxAmount: number
  shippingCost: number
  discountAmount: number
  total: number
  notes: string | null
  internalNotes: string | null
  createdAt: string
  createdBy: string
  approvedAt: string | null
  approvedBy: string | null
  cancelledAt: string | null
  cancelledBy: string | null
  cancellationReason: string | null
}

export interface PurchaseOrderWithDetails extends PurchaseOrder {
  supplierName: string
  createdByName: string
  approvedByName: string | null
  items: PurchaseOrderItem[]
  receivedItems: number
  totalItems: number
}

export interface PurchaseOrderInput {
  supplierId: string
  orderDate?: string
  expectedDate?: string | null
  subtotal?: number
  taxAmount?: number
  shippingCost?: number
  discountAmount?: number
  notes?: string | null
  internalNotes?: string | null
  items: PurchaseOrderItemInput[]
}

// =============================================
// ITEMS DE ORDEN DE COMPRA
// =============================================
export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  productId: string
  quantity: number
  receivedQuantity: number
  unitPrice: number
  discountPercent: number
  taxRate: number
  subtotal: number
  notes: string | null
  createdAt: string
}

export interface PurchaseOrderItemWithProduct extends PurchaseOrderItem {
  productName: string
  productSku: string
  productUnit: UnitType
}

export interface PurchaseOrderItemInput {
  productId: string
  quantity: number
  unitPrice: number
  discountPercent?: number
  taxRate?: number
  notes?: string | null
}

// =============================================
// CONTEO DE INVENTARIO
// =============================================
export interface InventoryCount {
  id: string
  clinicId: string
  branchId: string | null
  countNumber: string
  countType: 'full' | 'partial' | 'cycle'
  categoryId: string | null
  status: InventoryCountStatus
  startedAt: string | null
  completedAt: string | null
  notes: string | null
  createdAt: string
  createdBy: string
  completedBy: string | null
}

export interface InventoryCountWithStats extends InventoryCount {
  createdByName: string
  completedByName: string | null
  totalProducts: number
  countedProducts: number
  discrepancies: number
}

export interface InventoryCountInput {
  countType: 'full' | 'partial' | 'cycle'
  categoryId?: string | null
  notes?: string | null
}

// =============================================
// ITEMS DE CONTEO
// =============================================
export interface InventoryCountItem {
  id: string
  inventoryCountId: string
  productId: string
  lotId: string | null
  expectedQuantity: number
  countedQuantity: number | null
  difference: number | null
  countedAt: string | null
  countedBy: string | null
  notes: string | null
}

export interface InventoryCountItemWithProduct extends InventoryCountItem {
  productName: string
  productSku: string
  lotNumber: string | null
  countedByName: string | null
}

export interface InventoryCountItemInput {
  productId: string
  lotId?: string | null
  expectedQuantity: number
  countedQuantity?: number | null
  notes?: string | null
}

// =============================================
// TRANSFERENCIAS
// =============================================
export interface InventoryTransfer {
  id: string
  clinicId: string
  transferNumber: string
  fromBranchId: string
  toBranchId: string
  status: TransferStatus
  requestedAt: string
  shippedAt: string | null
  receivedAt: string | null
  notes: string | null
  createdAt: string
  createdBy: string
  shippedBy: string | null
  receivedBy: string | null
}

export interface InventoryTransferWithDetails extends InventoryTransfer {
  fromBranchName: string
  toBranchName: string
  createdByName: string
  items: InventoryTransferItem[]
  totalItems: number
}

export interface InventoryTransferInput {
  fromBranchId: string
  toBranchId: string
  notes?: string | null
  items: InventoryTransferItemInput[]
}

// =============================================
// ITEMS DE TRANSFERENCIA
// =============================================
export interface InventoryTransferItem {
  id: string
  inventoryTransferId: string
  productId: string
  lotId: string | null
  requestedQuantity: number
  shippedQuantity: number | null
  receivedQuantity: number | null
  notes: string | null
}

export interface InventoryTransferItemWithProduct extends InventoryTransferItem {
  productName: string
  productSku: string
  lotNumber: string | null
}

export interface InventoryTransferItemInput {
  productId: string
  lotId?: string | null
  requestedQuantity: number
  notes?: string | null
}

// =============================================
// ALERTAS DE INVENTARIO
// =============================================
export interface InventoryAlert {
  productId: string
  productName: string
  productSku: string
  branchId: string | null
  branchName: string | null
  alertType: AlertType
  currentStock: number
  threshold: number
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
}

// =============================================
// CONSTANTES Y OPCIONES
// =============================================

export const PRODUCT_CATEGORY_OPTIONS: {
  value: ProductCategory
  label: string
  icon: string
}[] = [
  { value: 'consumables', label: 'Consumibles', icon: 'package' },
  { value: 'equipment', label: 'Equipamiento', icon: 'cpu' },
  { value: 'cosmetics', label: 'Cosméticos', icon: 'sparkles' },
  { value: 'supplements', label: 'Suplementos', icon: 'pill' },
  { value: 'medications', label: 'Medicamentos', icon: 'pill' },
  { value: 'accessories', label: 'Accesorios', icon: 'gem' },
  { value: 'disposables', label: 'Desechables', icon: 'trash-2' },
  { value: 'other', label: 'Otros', icon: 'more-horizontal' },
]

export const PRODUCT_STATUS_OPTIONS: {
  value: ProductStatus
  label: string
  color: string
}[] = [
  { value: 'active', label: 'Activo', color: '#22c55e' },
  { value: 'inactive', label: 'Inactivo', color: '#6b7280' },
  { value: 'discontinued', label: 'Descontinuado', color: '#f59e0b' },
  { value: 'out_of_stock', label: 'Sin stock', color: '#ef4444' },
]

export const UNIT_OPTIONS: {
  value: UnitType
  label: string
  abbreviation: string
}[] = [
  { value: 'unit', label: 'Unidad', abbreviation: 'u' },
  { value: 'box', label: 'Caja', abbreviation: 'caja' },
  { value: 'pack', label: 'Paquete', abbreviation: 'paq' },
  { value: 'ml', label: 'Mililitros', abbreviation: 'ml' },
  { value: 'g', label: 'Gramos', abbreviation: 'g' },
  { value: 'kg', label: 'Kilogramos', abbreviation: 'kg' },
  { value: 'l', label: 'Litros', abbreviation: 'L' },
  { value: 'cm', label: 'Centímetros', abbreviation: 'cm' },
  { value: 'm', label: 'Metros', abbreviation: 'm' },
]

export const MOVEMENT_TYPE_OPTIONS: {
  value: MovementType
  label: string
  direction: 'in' | 'out'
  color: string
}[] = [
  { value: 'purchase', label: 'Compra', direction: 'in', color: '#22c55e' },
  { value: 'sale', label: 'Venta', direction: 'out', color: '#3b82f6' },
  { value: 'adjustment_in', label: 'Ajuste entrada', direction: 'in', color: '#8b5cf6' },
  { value: 'adjustment_out', label: 'Ajuste salida', direction: 'out', color: '#f59e0b' },
  { value: 'transfer_in', label: 'Transferencia entrada', direction: 'in', color: '#06b6d4' },
  { value: 'transfer_out', label: 'Transferencia salida', direction: 'out', color: '#14b8a6' },
  { value: 'return', label: 'Devolución', direction: 'in', color: '#ec4899' },
  { value: 'damaged', label: 'Dañado', direction: 'out', color: '#ef4444' },
  { value: 'expired', label: 'Vencido', direction: 'out', color: '#dc2626' },
  { value: 'initial', label: 'Stock inicial', direction: 'in', color: '#6b7280' },
]

export const PURCHASE_ORDER_STATUS_OPTIONS: {
  value: PurchaseOrderStatus
  label: string
  color: string
}[] = [
  { value: 'draft', label: 'Borrador', color: '#6b7280' },
  { value: 'pending', label: 'Pendiente', color: '#f59e0b' },
  { value: 'approved', label: 'Aprobada', color: '#3b82f6' },
  { value: 'ordered', label: 'Ordenada', color: '#8b5cf6' },
  { value: 'partial', label: 'Parcial', color: '#06b6d4' },
  { value: 'received', label: 'Recibida', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelada', color: '#ef4444' },
]

export const TRANSFER_STATUS_OPTIONS: {
  value: TransferStatus
  label: string
  color: string
}[] = [
  { value: 'pending', label: 'Pendiente', color: '#f59e0b' },
  { value: 'in_transit', label: 'En tránsito', color: '#3b82f6' },
  { value: 'received', label: 'Recibida', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelada', color: '#ef4444' },
]

export const ALERT_TYPE_OPTIONS: {
  value: AlertType
  label: string
  icon: string
  color: string
}[] = [
  { value: 'low_stock', label: 'Stock bajo', icon: 'alert-triangle', color: '#f59e0b' },
  { value: 'expiring_soon', label: 'Por vencer', icon: 'clock', color: '#f97316' },
  { value: 'expired', label: 'Vencido', icon: 'x-circle', color: '#ef4444' },
  { value: 'overstock', label: 'Sobrestock', icon: 'archive', color: '#3b82f6' },
]

// =============================================
// HELPERS
// =============================================

export function getProductStatusConfig(status: ProductStatus) {
  return PRODUCT_STATUS_OPTIONS.find((s) => s.value === status)
}

export function getMovementTypeConfig(type: MovementType) {
  return MOVEMENT_TYPE_OPTIONS.find((m) => m.value === type)
}

export function getPurchaseOrderStatusConfig(status: PurchaseOrderStatus) {
  return PURCHASE_ORDER_STATUS_OPTIONS.find((s) => s.value === status)
}

export function getUnitAbbreviation(unit: UnitType): string {
  return UNIT_OPTIONS.find((u) => u.value === unit)?.abbreviation || unit
}

export function formatStock(quantity: number, unit: UnitType): string {
  const abbr = getUnitAbbreviation(unit)
  return `${quantity} ${abbr}`
}

export function calculateStockValue(products: ProductWithStock[]): number {
  return products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0)
}

export function isLowStock(currentStock: number, minStock: number): boolean {
  return currentStock <= minStock
}

export function isExpiringSoon(expirationDate: string | null, daysThreshold = 30): boolean {
  if (!expirationDate) return false
  const expiry = new Date(expirationDate)
  const threshold = new Date()
  threshold.setDate(threshold.getDate() + daysThreshold)
  return expiry <= threshold
}

export function formatCurrency(amount: number, currency = 'DOP'): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function generateSKU(name: string, category: string): string {
  const nameCode = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '')
  const catCode = category.substring(0, 2).toUpperCase()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${catCode}-${nameCode}-${random}`
}
