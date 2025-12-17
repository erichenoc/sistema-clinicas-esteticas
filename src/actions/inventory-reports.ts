'use server'

import { createAdminClient } from '@/lib/supabase/server'
import type {
  ReportPeriod,
  StockReportData,
  MovementsReportData,
  ExpirationReportData,
  PurchaseReportData,
  CountReportData,
  InventoryReportData,
  MOVEMENT_TYPE_LABELS,
  LOT_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  COUNT_TYPE_LABELS,
  COUNT_STATUS_LABELS,
} from '@/types/inventory-reports'

// =============================================
// HELPER FUNCTIONS
// =============================================

function getDateRange(period: ReportPeriod): { startDate: Date; previousStartDate: Date; previousEndDate: Date } {
  const now = new Date()
  let startDate: Date
  let previousStartDate: Date
  let previousEndDate: Date

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousEndDate = new Date(startDate.getTime() - 1)
      previousStartDate = new Date(previousEndDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      previousEndDate = new Date(startDate.getTime() - 1)
      previousStartDate = new Date(previousEndDate.getFullYear(), previousEndDate.getMonth(), 1)
      break
    case 'quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1)
      previousEndDate = new Date(startDate.getTime() - 1)
      previousStartDate = new Date(previousEndDate.getFullYear(), Math.floor(previousEndDate.getMonth() / 3) * 3, 1)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      previousEndDate = new Date(startDate.getTime() - 1)
      previousStartDate = new Date(previousEndDate.getFullYear(), 0, 1)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      previousEndDate = new Date(startDate.getTime() - 1)
      previousStartDate = new Date(previousEndDate.getFullYear(), previousEndDate.getMonth(), 1)
  }

  return { startDate, previousStartDate, previousEndDate }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// =============================================
// STOCK REPORT
// =============================================

export async function getStockReportData(period: ReportPeriod = 'month'): Promise<StockReportData> {
  const supabase = createAdminClient()

  // Get all products with their stock info
  // Using explicit type since production DB has different schema
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching products for stock report:', error)
  }

  // Type the products array explicitly
  const productList = (products || []) as Array<{
    id: string
    name: string
    code: string | null
    category: string | null
    unit: string | null
    cost: number | null
    price: number | null
    min_stock: number | null
    max_stock: number | null
    is_consumable: boolean | null
    is_for_sale: boolean | null
    is_active: boolean | null
    current_stock?: number
  }>

  // Calculate stock metrics
  const totalProducts = productList.length
  let totalValue = 0
  let inStockCount = 0
  let lowStockCount = 0
  let outOfStockCount = 0
  let overStockCount = 0

  // Stock by category
  const categoryMap = new Map<string, { count: number; value: number }>()
  // Stock by type
  const typeMap = new Map<string, { count: number; value: number }>()
  // Top products by value
  const productsWithValue: { id: string; name: string; sku: string | null; currentStock: number; unit: string; unitCost: number; totalValue: number; stockStatus: string }[] = []

  for (const p of productList) {
    const stock = p.current_stock || 0
    const cost = p.cost || 0
    const value = stock * cost
    totalValue += value

    // Determine stock status
    let stockStatus = 'in_stock'
    if (stock <= 0) {
      outOfStockCount++
      stockStatus = 'out_of_stock'
    } else if (p.min_stock && stock <= p.min_stock) {
      lowStockCount++
      stockStatus = 'low_stock'
    } else if (p.max_stock && stock >= p.max_stock) {
      overStockCount++
      stockStatus = 'over_stock'
    } else {
      inStockCount++
    }

    // Aggregate by category
    const category = p.category || 'Sin Categoria'
    const catData = categoryMap.get(category) || { count: 0, value: 0 }
    catData.count++
    catData.value += value
    categoryMap.set(category, catData)

    // Aggregate by type (is_consumable)
    const type = p.is_consumable ? 'consumable' : 'retail'
    const typeData = typeMap.get(type) || { count: 0, value: 0 }
    typeData.count++
    typeData.value += value
    typeMap.set(type, typeData)

    // Add to products list for top by value
    productsWithValue.push({
      id: p.id,
      name: p.name,
      sku: p.code,
      currentStock: stock,
      unit: p.unit || 'unit',
      unitCost: cost,
      totalValue: value,
      stockStatus,
    })
  }

  // Convert category map to array with colors
  const categoryColors = ['#A67C52', '#8a6543', '#b8956e', '#6b5a4d', '#c4a882', '#5a4938']
  const stockByCategory = Array.from(categoryMap.entries()).map(([category, data], index) => ({
    category,
    color: categoryColors[index % categoryColors.length],
    count: data.count,
    value: data.value,
    percentage: totalProducts > 0 ? Math.round((data.count / totalProducts) * 100) : 0,
  }))

  // Convert type map to array
  const typeLabels: Record<string, string> = {
    consumable: 'Uso Interno',
    retail: 'Para Venta',
  }
  const stockByType = Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    label: typeLabels[type] || type,
    count: data.count,
    value: data.value,
  }))

  // Sort and get top 10 products by value
  const topProductsByValue = productsWithValue
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10)

  return {
    totalProducts,
    previousTotalProducts: totalProducts, // TODO: historical data
    totalValue,
    previousTotalValue: totalValue, // TODO: historical data
    inStockCount,
    lowStockCount,
    outOfStockCount,
    overStockCount,
    stockByCategory,
    stockByType,
    topProductsByValue,
  }
}

// =============================================
// MOVEMENTS REPORT
// =============================================

export async function getMovementsReportData(period: ReportPeriod = 'month'): Promise<MovementsReportData> {
  const supabase = createAdminClient()
  const { startDate } = getDateRange(period)

  // Get movements within period
  const { data: movements, error } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      products:product_id (name, code)
    `)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching movements:', error)
  }

  // Type the movements array explicitly
  const movementList = (movements || []) as Array<{
    id: string
    product_id: string
    movement_type: string
    quantity: number
    unit_cost: number | null
    created_at: string
    products: { name: string; code: string | null } | null
  }>

  // Movement type labels and directions
  const typeConfig: Record<string, { label: string; direction: 'in' | 'out'; color: string }> = {
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

  let totalEntriesValue = 0
  let totalExitsValue = 0
  const typeMap = new Map<string, { count: number; value: number }>()

  // Process movements
  const recentMovements = movementList.slice(0, 20).map((m) => {
    const config = typeConfig[m.movement_type] || { label: m.movement_type, direction: 'out', color: 'gray' }
    const cost = m.unit_cost || 0
    const totalCost = m.quantity * cost

    // Sum entries and exits
    if (config.direction === 'in') {
      totalEntriesValue += totalCost
    } else {
      totalExitsValue += totalCost
    }

    // Aggregate by type
    const typeData = typeMap.get(m.movement_type) || { count: 0, value: 0 }
    typeData.count++
    typeData.value += totalCost
    typeMap.set(m.movement_type, typeData)

    return {
      id: m.id,
      productName: (m.products as { name: string } | null)?.name || 'Producto',
      productSku: (m.products as { code: string } | null)?.code || null,
      type: m.movement_type,
      typeLabel: config.label,
      quantity: m.quantity,
      unitCost: cost,
      totalCost,
      createdAt: m.created_at,
      createdByName: 'Sistema', // TODO: join with users
    }
  })

  // Calculate totals from all movements
  for (const m of movementList) {
    const config = typeConfig[m.movement_type] || { direction: 'out' }
    const cost = m.unit_cost || 0
    const totalCost = m.quantity * cost

    if (!recentMovements.find(r => r.id === m.id)) {
      if (config.direction === 'in') {
        totalEntriesValue += totalCost
      } else {
        totalExitsValue += totalCost
      }

      const typeData = typeMap.get(m.movement_type) || { count: 0, value: 0 }
      typeData.count++
      typeData.value += totalCost
      typeMap.set(m.movement_type, typeData)
    }
  }

  // Convert type map to array
  const totalMovements = movementList.length
  const movementsByType = Array.from(typeMap.entries()).map(([type, data]) => {
    const config = typeConfig[type] || { label: type, direction: 'out', color: 'gray' }
    return {
      type,
      label: config.label,
      direction: config.direction,
      color: config.color,
      count: data.count,
      value: data.value,
      percentage: totalMovements > 0 ? Math.round((data.count / totalMovements) * 100) : 0,
    }
  }).sort((a, b) => b.count - a.count)

  return {
    totalMovements,
    previousTotalMovements: totalMovements, // TODO: historical data
    totalEntriesValue,
    totalExitsValue,
    netMovement: totalEntriesValue - totalExitsValue,
    movementsByType,
    recentMovements,
  }
}

// =============================================
// EXPIRATION REPORT
// =============================================

export async function getExpirationReportData(): Promise<ExpirationReportData> {
  const supabase = createAdminClient()
  const now = new Date()

  // Get all lots with product info
  const { data: lots, error } = await supabase
    .from('product_lots')
    .select(`
      *,
      products:product_id (name, code)
    `)
    .gt('current_quantity', 0)
    .order('expiry_date', { ascending: true })

  if (error) {
    console.error('Error fetching lots:', error)
  }

  // Type the lots array explicitly
  const lotList = (lots || []) as Array<{
    id: string
    product_id: string
    lot_number: string | null
    current_quantity: number
    unit_cost: number | null
    expiry_date: string | null
    status: string | null
    products: { name: string; code: string | null } | null
  }>

  let totalActiveLots = 0
  let expiringIn7Days = 0
  let expiringIn30Days = 0
  let expiredCount = 0
  let valueAtRisk = 0

  const statusMap = new Map<string, { count: number; value: number }>()
  const expiringProducts: {
    id: string
    productName: string
    lotNumber: string
    currentQuantity: number
    unitCost: number
    totalValue: number
    expiryDate: string
    daysUntilExpiry: number
    status: 'urgent' | 'warning' | 'normal'
  }[] = []

  for (const lot of lotList) {
    const quantity = lot.current_quantity || 0
    const cost = lot.unit_cost || 0
    const value = quantity * cost
    const expiryDate = lot.expiry_date ? new Date(lot.expiry_date) : null
    const daysUntilExpiry = expiryDate
      ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    // Count by status
    let status: 'urgent' | 'warning' | 'normal' = 'normal'
    let statusKey = lot.status || 'active'

    if (daysUntilExpiry < 0) {
      expiredCount++
      statusKey = 'expired'
      status = 'urgent'
      valueAtRisk += value
    } else if (daysUntilExpiry <= 7) {
      expiringIn7Days++
      status = 'urgent'
      valueAtRisk += value
      totalActiveLots++
    } else if (daysUntilExpiry <= 30) {
      expiringIn30Days++
      status = 'warning'
      valueAtRisk += value
      totalActiveLots++
    } else {
      totalActiveLots++
    }

    // Aggregate by status
    const statusData = statusMap.get(statusKey) || { count: 0, value: 0 }
    statusData.count++
    statusData.value += value
    statusMap.set(statusKey, statusData)

    // Add to expiring products if within 90 days or expired
    if (daysUntilExpiry <= 90 || daysUntilExpiry < 0) {
      expiringProducts.push({
        id: lot.id,
        productName: (lot.products as { name: string } | null)?.name || 'Producto',
        lotNumber: lot.lot_number || 'Sin Lote',
        currentQuantity: quantity,
        unitCost: cost,
        totalValue: value,
        expiryDate: lot.expiry_date || '',
        daysUntilExpiry,
        status,
      })
    }
  }

  // Status labels and colors
  const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Activo', color: 'emerald' },
    low: { label: 'Bajo', color: 'amber' },
    expired: { label: 'Vencido', color: 'red' },
    depleted: { label: 'Agotado', color: 'gray' },
    quarantine: { label: 'Cuarentena', color: 'purple' },
  }

  const lotsByStatus = Array.from(statusMap.entries()).map(([status, data]) => ({
    status,
    label: statusConfig[status]?.label || status,
    color: statusConfig[status]?.color || 'gray',
    count: data.count,
    value: data.value,
  }))

  return {
    totalActiveLots,
    expiringIn7Days,
    expiringIn30Days,
    expiredCount,
    valueAtRisk,
    lotsByStatus,
    expiringProducts: expiringProducts.slice(0, 20),
  }
}

// =============================================
// PURCHASE REPORT
// =============================================

export async function getPurchaseReportData(period: ReportPeriod = 'month'): Promise<PurchaseReportData> {
  const supabase = createAdminClient()
  const { startDate } = getDateRange(period)

  // Get purchase orders within period
  const { data: orders, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      suppliers:supplier_id (name)
    `)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching purchase orders:', error)
  }

  // Type the orders array explicitly
  const orderList = (orders || []) as Array<{
    id: string
    supplier_id: string | null
    status: string
    total: number | null
    created_at: string
    suppliers: { name: string } | null
  }>

  let totalSpent = 0
  let pendingOrders = 0
  let receivedOrders = 0

  const statusMap = new Map<string, { count: number; value: number }>()
  const supplierMap = new Map<string, { name: string; count: number; value: number; lastDate: string | null }>()

  // Status labels and colors
  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: 'gray' },
    pending: { label: 'Pendiente', color: 'amber' },
    ordered: { label: 'Ordenada', color: 'blue' },
    partial: { label: 'Parcial', color: 'cyan' },
    received: { label: 'Recibida', color: 'emerald' },
    cancelled: { label: 'Cancelada', color: 'red' },
  }

  for (const order of orderList) {
    const total = order.total || 0
    totalSpent += total

    // Count by status
    if (order.status === 'pending' || order.status === 'ordered') {
      pendingOrders++
    } else if (order.status === 'received') {
      receivedOrders++
    }

    // Aggregate by status
    const statusData = statusMap.get(order.status) || { count: 0, value: 0 }
    statusData.count++
    statusData.value += total
    statusMap.set(order.status, statusData)

    // Aggregate by supplier
    const supplierId = order.supplier_id
    if (supplierId) {
      const supplierData = supplierMap.get(supplierId) || {
        name: (order.suppliers as { name: string } | null)?.name || 'Proveedor',
        count: 0,
        value: 0,
        lastDate: null,
      }
      supplierData.count++
      supplierData.value += total
      if (!supplierData.lastDate || order.created_at > supplierData.lastDate) {
        supplierData.lastDate = order.created_at
      }
      supplierMap.set(supplierId, supplierData)
    }
  }

  // Convert status map to array
  const ordersByStatus = Array.from(statusMap.entries()).map(([status, data]) => ({
    status,
    label: statusConfig[status]?.label || status,
    color: statusConfig[status]?.color || 'gray',
    count: data.count,
    value: data.value,
  }))

  // Convert supplier map to array and sort by value
  const topSuppliers = Array.from(supplierMap.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      ordersCount: data.count,
      totalSpent: data.value,
      lastOrderDate: data.lastDate,
      avgOrderValue: data.count > 0 ? Math.round(data.value / data.count) : 0,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)

  return {
    totalOrders: orderList.length,
    previousTotalOrders: orderList.length, // TODO: historical data
    totalSpent,
    previousTotalSpent: totalSpent, // TODO: historical data
    pendingOrders,
    receivedOrders,
    ordersByStatus,
    topSuppliers,
  }
}

// =============================================
// COUNT REPORT
// =============================================

export async function getCountReportData(period: ReportPeriod = 'month'): Promise<CountReportData> {
  const supabase = createAdminClient()
  const { startDate } = getDateRange(period)

  // Get inventory counts within period
  const { data: counts, error } = await supabase
    .from('inventory_counts')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching inventory counts:', error)
  }

  // Type the counts array explicitly
  const countList = (counts || []) as Array<{
    id: string
    count_number: string | null
    count_type: string
    status: string
    started_at: string | null
    completed_at: string | null
    created_at: string
    total_products: number | null
    counted_products: number | null
    items_with_difference: number | null
    total_difference_value: number | null
  }>

  let completedCounts = 0
  let inProgressCounts = 0
  let totalDiscrepancies = 0
  let totalDifferenceValue = 0

  const typeMap = new Map<string, number>()
  const statusMap = new Map<string, number>()

  // Type and status labels
  const typeLabels: Record<string, string> = {
    full: 'Completo',
    partial: 'Parcial',
    cycle: 'Ciclico',
    spot: 'Spot',
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    in_progress: { label: 'En Progreso', color: 'blue' },
    completed: { label: 'Completado', color: 'emerald' },
    approved: { label: 'Aprobado', color: 'green' },
    cancelled: { label: 'Cancelado', color: 'red' },
  }

  const recentCounts: {
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
  }[] = []

  for (const count of countList) {
    // Count by status
    if (count.status === 'completed' || count.status === 'approved') {
      completedCounts++
    } else if (count.status === 'in_progress') {
      inProgressCounts++
    }

    // Aggregate discrepancies
    const diff = count.items_with_difference || 0
    const diffValue = count.total_difference_value || 0
    totalDiscrepancies += diff
    totalDifferenceValue += diffValue

    // Aggregate by type
    typeMap.set(count.count_type, (typeMap.get(count.count_type) || 0) + 1)

    // Aggregate by status
    statusMap.set(count.status, (statusMap.get(count.status) || 0) + 1)

    // Add to recent counts
    if (recentCounts.length < 10) {
      recentCounts.push({
        id: count.id,
        countNumber: count.count_number || '',
        countType: count.count_type,
        countTypeLabel: typeLabels[count.count_type] || count.count_type,
        status: count.status,
        statusLabel: statusConfig[count.status]?.label || count.status,
        startedAt: count.started_at || count.created_at,
        completedAt: count.completed_at,
        totalItems: count.total_products || 0,
        itemsCounted: count.counted_products || 0,
        itemsWithDifference: diff,
        totalDifferenceValue: diffValue,
      })
    }
  }

  // Convert maps to arrays
  const countsByType = Array.from(typeMap.entries()).map(([type, count]) => ({
    type,
    label: typeLabels[type] || type,
    count,
  }))

  const countsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    label: statusConfig[status]?.label || status,
    color: statusConfig[status]?.color || 'gray',
    count,
  }))

  return {
    totalCounts: countList.length,
    completedCounts,
    inProgressCounts,
    totalDiscrepancies,
    totalDifferenceValue,
    countsByType,
    countsByStatus,
    recentCounts,
  }
}

// =============================================
// COMBINED REPORT DATA
// =============================================

export async function getAllInventoryReportData(period: ReportPeriod = 'month'): Promise<InventoryReportData> {
  const [stock, movements, expirations, purchases, counts] = await Promise.all([
    getStockReportData(period),
    getMovementsReportData(period),
    getExpirationReportData(),
    getPurchaseReportData(period),
    getCountReportData(period),
  ])

  return {
    stock,
    movements,
    expirations,
    purchases,
    counts,
  }
}
