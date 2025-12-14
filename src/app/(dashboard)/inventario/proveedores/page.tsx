export const dynamic = 'force-dynamic'

import { getSuppliers, getSupplierStats } from '@/actions/inventory'
import { ProveedoresClient } from './_components/proveedores-client'

export default async function ProveedoresPage() {
  const [suppliers, stats] = await Promise.all([
    getSuppliers(),
    getSupplierStats(),
  ])

  return <ProveedoresClient initialSuppliers={suppliers} initialStats={stats} />
}
