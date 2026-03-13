export const dynamic = 'force-dynamic'

import { getInvoices } from '@/actions/billing'
import { FacturasClient } from './_components/facturas-client'

export default async function FacturasPage() {
  const invoices = await getInvoices()

  return <FacturasClient invoices={invoices} isAdmin={true} />
}
