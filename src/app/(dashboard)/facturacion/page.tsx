export const dynamic = 'force-dynamic'

import { getInvoices, getBillingStats } from '@/actions/billing'
import { FacturacionClient } from './_components/facturacion-client'
import type { InvoiceStatus } from '@/types/billing'

// Mock quotes - TODO: Create quotes table in database
const mockQuotes = [
  {
    id: '1',
    quoteNumber: 'COT-2024-0015',
    clientName: 'Maria Garcia Lopez',
    clientRnc: null,
    total: 45000,
    currency: 'DOP' as const,
    status: 'sent' as const,
    issueDate: '2024-12-05',
    validUntil: '2024-12-20',
    itemsCount: 3,
  },
  {
    id: '2',
    quoteNumber: 'COT-2024-0014',
    clientName: 'Centro Medico San Rafael',
    clientRnc: '101234567',
    total: 125000,
    currency: 'DOP' as const,
    status: 'accepted' as const,
    issueDate: '2024-12-03',
    validUntil: '2024-12-18',
    itemsCount: 8,
  },
]

export default async function FacturacionPage() {
  const [dbInvoices, dbStats] = await Promise.all([
    getInvoices(),
    getBillingStats(),
  ])

  // Map invoice status for display
  const mapInvoiceStatus = (status: string): InvoiceStatus => {
    switch (status) {
      case 'paid':
        return 'paid'
      case 'partial':
        return 'partial'
      case 'cancelled':
        return 'cancelled'
      case 'overdue':
        return 'overdue'
      default:
        return 'pending'
    }
  }

  // Transform invoices data
  const invoices = dbInvoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    ncfNumber: inv.ncf || null,
    clientName: inv.patient_name || 'Cliente',
    clientRnc: null, // NCF type would be used for RNC
    total: inv.total,
    amountDue: inv.amount_due || 0,
    currency: (inv.currency || 'DOP') as 'DOP' | 'USD',
    status: mapInvoiceStatus(inv.status),
    issueDate: inv.issue_date || inv.created_at,
    dueDate: inv.due_date || inv.created_at,
    hasFiscalReceipt: !!inv.ncf,
  }))

  // Transform stats
  const stats = {
    invoicedThisMonth: dbStats.invoiced_this_month,
    pendingCollection: dbStats.pending_collection,
    overdueAmount: dbStats.overdue_amount,
    quoteConversionRate: 68, // TODO: Calculate from real data
    pendingCount: dbStats.pending_count,
    overdueCount: dbStats.overdue_count,
  }

  return (
    <FacturacionClient
      invoices={invoices}
      quotes={mockQuotes}
      stats={stats}
    />
  )
}
