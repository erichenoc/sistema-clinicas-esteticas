export const revalidate = 30

import {
  getLotsForList,
  getLotStats,
  getProductsForLots,
  getSuppliersForLots,
} from '@/actions/inventory'
import { LotesClient } from './_components/lotes-client'

export default async function LotesPage() {
  const [lotes, stats, products, suppliers] = await Promise.all([
    getLotsForList(),
    getLotStats(),
    getProductsForLots(),
    getSuppliersForLots(),
  ])

  return (
    <LotesClient
      lotes={lotes}
      stats={stats}
      products={products}
      suppliers={suppliers}
    />
  )
}
