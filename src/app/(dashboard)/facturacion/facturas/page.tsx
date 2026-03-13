export const revalidate = 30

import { getInvoices } from '@/actions/billing'
import { getCurrentUser } from '@/actions/auth'
import { FacturasClient } from './_components/facturas-client'

export default async function FacturasPage() {
  const [invoices, currentUser] = await Promise.all([getInvoices(), getCurrentUser()])

  return <FacturasClient invoices={invoices} isAdmin={currentUser?.role === 'admin'} />
}
