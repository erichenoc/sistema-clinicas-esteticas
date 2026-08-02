// El stock cambia con cada venta: no se cachea
export const dynamic = 'force-dynamic'

import { getProducts, getInventoryStats, getProductLots } from '@/actions/inventory'
import { getStockMovements } from '@/actions/inventory-movements'
import { InventarioClient } from './_components/inventario-client'
import type { ProductStatus, MovementType, UnitType } from '@/types/inventory'

export default async function InventarioPage() {
  const [dbProducts, dbStats, dbLots, dbMovements] = await Promise.all([
    getProducts(),
    getInventoryStats(),
    getProductLots({ expiringWithinDays: 30 }),
    getStockMovements({ limit: 100 }),
  ])

  // Transform products data
  const products = dbProducts.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    brand: null, // TODO: Add brand to products table
    sku: p.sku,
    categoryName: p.category_name,
    categoryColor: p.category_color,
    type: p.type || 'consumable',
    unit: (p.unit || 'unit') as UnitType,
    costPrice: p.cost_price || 0,
    sellPrice: p.sell_price || 0,
    currentStock: p.current_stock,
    reservedStock: p.reserved_stock,
    availableStock: p.available_stock,
    minStock: p.min_stock,
    maxStock: p.max_stock,
    stockStatus: p.stock_status,
    status: (p.is_active ? 'active' : 'inactive') as ProductStatus,
    trackStock: p.track_stock,
    isSellable: p.is_sellable,
    nearestExpiry: p.nearest_expiry,
  }))

  // Generate alerts from low stock products and expiring lots
  const alerts = []

  // Solo se alerta sobre productos con minimo configurado: sin minimo no hay
  // criterio para decir que falta algo
  const lowStockProducts = products.filter(
    (p) => p.trackStock && p.minStock > 0 && p.currentStock <= p.minStock && p.currentStock > 0
  )
  for (const p of lowStockProducts) {
    alerts.push({
      productId: p.id,
      productName: p.name,
      productSku: p.sku,
      branchName: 'Principal',
      alertType: 'low_stock',
      currentStock: p.currentStock,
      threshold: p.minStock,
      message: 'Stock por debajo del minimo',
      severity: 'high',
    })
  }

  // Agotado solo importa si es un producto que se repone (tiene minimo)
  const outOfStockProducts = products.filter(
    (p) => p.trackStock && p.minStock > 0 && p.currentStock <= 0
  )
  for (const p of outOfStockProducts) {
    alerts.push({
      productId: p.id,
      productName: p.name,
      productSku: p.sku,
      branchName: 'Principal',
      alertType: 'out_of_stock',
      currentStock: 0,
      threshold: 1,
      message: 'Producto agotado',
      severity: 'critical',
    })
  }

  // Expiring soon alerts from lots
  const today = new Date().getTime()
  for (const lot of dbLots) {
    if (lot.expiry_date && lot.current_quantity > 0) {
      const daysToExpiry = Math.ceil(
        (new Date(lot.expiry_date).getTime() - today) / (1000 * 60 * 60 * 24)
      )
      if (daysToExpiry > 0 && daysToExpiry <= 30) {
        alerts.push({
          productId: lot.product_id,
          productName: (lot as unknown as { products?: { name: string } }).products?.name || 'Producto',
          productSku: lot.lot_number,
          branchName: 'Principal',
          alertType: 'expiring_soon',
          currentStock: lot.current_quantity,
          threshold: 30,
          message: `Vence en ${daysToExpiry} dias`,
          severity: daysToExpiry <= 7 ? 'high' : 'medium',
        })
      }
    }
  }

  // Historial real de entradas y salidas
  const movements = dbMovements.map((m) => {
    const newStock = m.balance_after ?? 0
    return {
      id: m.id,
      productName: m.product_name,
      productSku: null,
      movementType: m.movement_type as MovementType,
      quantity: m.quantity,
      previousStock: newStock - m.quantity,
      newStock,
      lotNumber: null,
      notes: m.notes,
      createdAt: m.created_at,
      createdByName: m.created_by_name || 'Sistema',
    }
  })

  // Transform stats
  const stats = {
    totalProducts: dbStats.total_products,
    lowStockCount: dbStats.low_stock_count,
    outOfStockCount: dbStats.out_of_stock_count,
    expiringSoonCount: dbStats.expiring_soon_count,
    totalValue: dbStats.total_value,
  }

  return (
    <InventarioClient
      products={products}
      alerts={alerts}
      movements={movements}
      stats={stats}
    />
  )
}
