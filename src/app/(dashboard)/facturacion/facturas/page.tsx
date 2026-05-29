export const dynamic = 'force-dynamic'

import { getInvoices } from '@/actions/billing'
import { getCurrentUserRole } from '@/actions/auth'
import { FacturasClient } from './_components/facturas-client'

export default async function FacturasPage() {
  const [invoices, role] = await Promise.all([getInvoices(), getCurrentUserRole()])
  const canDelete = role === 'admin' || role === 'owner'

  return <FacturasClient invoices={invoices} isAdmin={canDelete} />
}
