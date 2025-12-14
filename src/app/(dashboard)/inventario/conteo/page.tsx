export const dynamic = 'force-dynamic'

import { getInventoryCounts, getInventoryCountStats } from '@/actions/inventory'
import { ConteoClient } from './_components/conteo-client'

export default async function ConteoInventarioPage() {
  const [counts, stats] = await Promise.all([
    getInventoryCounts(),
    getInventoryCountStats(),
  ])

  return <ConteoClient initialCounts={counts} initialStats={stats} />
}
