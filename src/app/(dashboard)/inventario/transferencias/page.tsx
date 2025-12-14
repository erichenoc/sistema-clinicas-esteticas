export const dynamic = 'force-dynamic'

import { getInventoryTransfers, getTransferStats, getBranches, getProducts } from '@/actions/inventory'
import { TransferenciasClient } from './_components/transferencias-client'

export default async function TransferenciasPage() {
  const [transfers, stats, branches, products] = await Promise.all([
    getInventoryTransfers(),
    getTransferStats(),
    getBranches(),
    getProducts({ isActive: true }),
  ])

  return (
    <TransferenciasClient
      initialTransfers={transfers}
      initialStats={stats}
      branches={branches}
      products={products}
    />
  )
}
