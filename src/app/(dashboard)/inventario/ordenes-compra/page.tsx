export const dynamic = 'force-dynamic'

import { getPurchaseOrders, getPurchaseOrderStats, getSuppliers, getProducts } from '@/actions/inventory'
import { OrdenesCompraClient } from './_components/ordenes-compra-client'

export default async function OrdenesCompraPage() {
  const [orders, stats, suppliers, products] = await Promise.all([
    getPurchaseOrders(),
    getPurchaseOrderStats(),
    getSuppliers({ isActive: true }),
    getProducts({ isActive: true }),
  ])

  return (
    <OrdenesCompraClient
      initialOrders={orders}
      initialStats={stats}
      suppliers={suppliers}
      products={products}
    />
  )
}
