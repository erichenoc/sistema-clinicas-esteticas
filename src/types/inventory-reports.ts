// Inventory Reports Types

export type ReportPeriod = 'week' | 'month' | 'quarter' | 'year'

// ==================== Stock Report ====================

export interface StockByCategory {
  category: string
  color: string
  count: number
  value: number
  percentage: number
}

export interface StockByType {
  type: string
  label: string
  count: number
  value: number
}

export interface TopProductByValue {
  id: string
  name: string
  sku: string | null
  currentStock: number
  unit: string
  unitCost: number
  totalValue: number
  stockStatus: string
}

export interface StockReportData {
  totalProducts: number
  previousTotalProducts: number
  totalValue: number
  previousTotalValue: number
  inStockCount: number
  lowStockCount: number
  outOfStockCount: number
  overStockCount: number
  stockByCategory: StockByCategory[]
  stockByType: StockByType[]
  topProductsByValue: TopProductByValue[]
}

// ==================== Movements Report ====================

export interface MovementByType {
  type: string
  label: string
  direction: 'in' | 'out'
  color: string
  count: number
  value: number
  percentage: number
}

export interface MovementTrend {
  date: string
  entries: number
  exits: number
  net: number
}

export interface RecentMovement {
  id: string
  productName: string
  productSku: string | null
  type: string
  typeLabel: string
  quantity: number
  unitCost: number
  totalCost: number
  createdAt: string
  createdByName: string
}

export interface MovementsReportData {
  totalMovements: number
  previousTotalMovements: number
  totalEntriesValue: number
  totalExitsValue: number
  netMovement: number
  movementsByType: MovementByType[]
  recentMovements: RecentMovement[]
}

// ==================== Expiration Report ====================

export interface LotByStatus {
  status: string
  label: string
  color: string
  count: number
  value: number
}

export interface ExpiringProduct {
  id: string
  productName: string
  lotNumber: string
  currentQuantity: number
  unitCost: number
  totalValue: number
  expiryDate: string
  daysUntilExpiry: number
  status: 'urgent' | 'warning' | 'normal'
}

export interface ExpirationTimeline {
  period: string
  count: number
  value: number
}

export interface ExpirationReportData {
  totalActiveLots: number
  expiringIn7Days: number
  expiringIn30Days: number
  expiredCount: number
  valueAtRisk: number
  lotsByStatus: LotByStatus[]
  expiringProducts: ExpiringProduct[]
}

// ==================== Purchase Report ====================

export interface OrderByStatus {
  status: string
  label: string
  color: string
  count: number
  value: number
}

export interface SpendingBySupplier {
  supplierId: string
  supplierName: string
  ordersCount: number
  totalSpent: number
  percentage: number
}

export interface TopSupplier {
  id: string
  name: string
  ordersCount: number
  totalSpent: number
  lastOrderDate: string | null
  avgOrderValue: number
}

export interface PurchaseReportData {
  totalOrders: number
  previousTotalOrders: number
  totalSpent: number
  previousTotalSpent: number
  pendingOrders: number
  receivedOrders: number
  ordersByStatus: OrderByStatus[]
  topSuppliers: TopSupplier[]
}

// ==================== Count Report ====================

export interface CountByType {
  type: string
  label: string
  count: number
}

export interface CountByStatus {
  status: string
  label: string
  color: string
  count: number
}

export interface RecentCount {
  id: string
  countNumber: string
  countType: string
  countTypeLabel: string
  status: string
  statusLabel: string
  startedAt: string
  completedAt: string | null
  totalItems: number
  itemsCounted: number
  itemsWithDifference: number
  totalDifferenceValue: number
}

export interface CountReportData {
  totalCounts: number
  completedCounts: number
  inProgressCounts: number
  totalDiscrepancies: number
  totalDifferenceValue: number
  countsByType: CountByType[]
  countsByStatus: CountByStatus[]
  recentCounts: RecentCount[]
}

// ==================== Combined Report Data ====================

export interface InventoryReportData {
  stock: StockReportData
  movements: MovementsReportData
  expirations: ExpirationReportData
  purchases: PurchaseReportData
  counts: CountReportData
}

// ==================== Constants ====================

export const MOVEMENT_TYPE_LABELS: Record<string, { label: string; direction: 'in' | 'out'; color: string }> = {
  purchase: { label: 'Compra', direction: 'in', color: 'emerald' },
  sale: { label: 'Venta', direction: 'out', color: 'blue' },
  adjustment_in: { label: 'Ajuste Entrada', direction: 'in', color: 'cyan' },
  adjustment_out: { label: 'Ajuste Salida', direction: 'out', color: 'orange' },
  transfer_in: { label: 'Transferencia Entrada', direction: 'in', color: 'purple' },
  transfer_out: { label: 'Transferencia Salida', direction: 'out', color: 'violet' },
  return: { label: 'Devolucion', direction: 'in', color: 'yellow' },
  damaged: { label: 'Danado', direction: 'out', color: 'red' },
  expired: { label: 'Vencido', direction: 'out', color: 'rose' },
  consumption: { label: 'Consumo', direction: 'out', color: 'amber' },
  initial: { label: 'Inventario Inicial', direction: 'in', color: 'gray' },
}

export const LOT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Activo', color: 'emerald' },
  low: { label: 'Bajo', color: 'amber' },
  expired: { label: 'Vencido', color: 'red' },
  depleted: { label: 'Agotado', color: 'gray' },
  quarantine: { label: 'Cuarentena', color: 'purple' },
}

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'gray' },
  pending: { label: 'Pendiente', color: 'amber' },
  ordered: { label: 'Ordenada', color: 'blue' },
  partial: { label: 'Parcial', color: 'cyan' },
  received: { label: 'Recibida', color: 'emerald' },
  cancelled: { label: 'Cancelada', color: 'red' },
}

export const COUNT_TYPE_LABELS: Record<string, string> = {
  full: 'Completo',
  partial: 'Parcial',
  cycle: 'Ciclico',
  spot: 'Spot',
}

export const COUNT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  in_progress: { label: 'En Progreso', color: 'blue' },
  completed: { label: 'Completado', color: 'emerald' },
  approved: { label: 'Aprobado', color: 'green' },
  cancelled: { label: 'Cancelado', color: 'red' },
}
