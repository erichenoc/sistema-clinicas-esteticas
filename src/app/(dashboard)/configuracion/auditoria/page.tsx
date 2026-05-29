export const dynamic = 'force-dynamic'

import { getDeletedInvoicesAudit } from '@/actions/billing'
import { getCurrentUserRole } from '@/actions/auth'
import { AuditoriaClient } from './_components/auditoria-client'

export default async function AuditoriaPage() {
  const [role, result] = await Promise.all([
    getCurrentUserRole(),
    getDeletedInvoicesAudit(),
  ])

  const authorized = role === 'admin' || role === 'owner'

  return (
    <AuditoriaClient
      entries={result.data}
      authorized={authorized}
    />
  )
}
