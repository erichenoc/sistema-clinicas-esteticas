export const dynamic = 'force-dynamic'

import { getAllInventoryReportData } from '@/actions/inventory-reports'
import { InventarioReportesClient } from './_components/inventario-reportes-client'

export default async function InventarioReportesPage() {
  const data = await getAllInventoryReportData('month')

  return <InventarioReportesClient {...data} />
}
