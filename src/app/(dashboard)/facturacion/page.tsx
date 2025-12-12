export const dynamic = 'force-dynamic'

import { getInvoices, getBillingStats } from '@/actions/billing'
import { getQuotations, getQuotationStats } from '@/actions/quotations'
import { FacturacionClient } from './_components/facturacion-client'
import type { InvoiceStatus } from '@/types/billing'

export default async function FacturacionPage() {
  const [dbInvoices, dbStats, dbQuotations, dbQuoteStats] = await Promise.all([
    getInvoices(),
    getBillingStats(),
    getQuotations(),
    getQuotationStats(),
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

  // Map quote status for display
  const mapQuoteStatus = (status: string): 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' => {
    switch (status) {
      case 'draft':
        return 'draft'
      case 'sent':
        return 'sent'
      case 'accepted':
        return 'accepted'
      case 'rejected':
        return 'rejected'
      case 'expired':
        return 'expired'
      default:
        return 'draft'
    }
  }

  // Transform quotations data
  const quotes = dbQuotations.map((q) => ({
    id: q.id,
    quoteNumber: q.quote_number,
    clientName: q.patient_name || 'Cliente',
    clientRnc: null,
    total: q.total,
    currency: q.currency as 'DOP' | 'USD',
    status: mapQuoteStatus(q.status),
    issueDate: q.created_at,
    validUntil: q.valid_until,
    itemsCount: q.items?.length || 0,
  }))

  // Calculate quote conversion rate
  const quoteConversionRate = dbQuoteStats.total > 0
    ? Math.round((dbQuoteStats.accepted / dbQuoteStats.total) * 100)
    : 0

  // Transform stats
  const stats = {
    invoicedThisMonth: dbStats.invoiced_this_month,
    pendingCollection: dbStats.pending_collection,
    overdueAmount: dbStats.overdue_amount,
    quoteConversionRate,
    pendingCount: dbStats.pending_count,
    overdueCount: dbStats.overdue_count,
  }

  return (
    <FacturacionClient
      invoices={invoices}
      quotes={quotes}
      stats={stats}
    />
  )
}
