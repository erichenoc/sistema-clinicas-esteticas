export const dynamic = 'force-dynamic'

import { getInvoices } from '@/actions/billing'
import { getCurrentUser } from '@/actions/auth'
import { FacturasClient } from './_components/facturas-client'

export default async function FacturasPage() {
  const [invoices, currentUser] = await Promise.all([getInvoices(), getCurrentUser()])

  const canDelete = ['admin', 'owner'].includes(currentUser?.role ?? '')

  return <FacturasClient invoices={invoices} isAdmin={canDelete} />
}
