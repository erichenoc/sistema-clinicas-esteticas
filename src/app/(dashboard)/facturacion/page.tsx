export const dynamic = 'force-dynamic'

import { getSales, getInvoices, getBillingStats } from '@/actions/billing'
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
  const [dbSales, dbInvoices, dbStats] = await Promise.all([
    getSales(),
    getInvoices(),
    getBillingStats(),
  ])

  // Map sales status to invoice status for display
  const mapSaleStatusToInvoiceStatus = (status: string): InvoiceStatus => {
    switch (status) {
      case 'paid':
        return 'paid'
      case 'partial':
        return 'partial'
      case 'cancelled':
        return 'cancelled'
      case 'refunded':
        return 'cancelled'
      default:
        return 'pending'
    }
  }

  // Transform sales data to invoice format for display
  const invoicesFromSales = dbSales.map((sale) => ({
    id: sale.id,
    invoiceNumber: sale.sale_number,
    ncfNumber: null, // NCF comes from the invoice table
    clientName: sale.patient_name || sale.customer_name || 'Cliente',
    clientRnc: null,
    total: sale.total,
    amountDue: sale.total - (sale.paid_amount || 0),
    currency: 'DOP' as const,
    status: mapSaleStatusToInvoiceStatus(sale.status),
    issueDate: sale.created_at,
    dueDate: sale.created_at, // TODO: Add due date to sales
    hasFiscalReceipt: false,
  }))

  // Transform invoices data
  const invoicesFromInvoices = dbInvoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    ncfNumber: inv.invoice_series || null,
    clientName: inv.patient_name || inv.customer_legal_name || 'Cliente',
    clientRnc: inv.customer_tax_id || null,
    total: inv.total,
    amountDue: inv.amount_due || 0,
    currency: 'DOP' as const,
    status: mapSaleStatusToInvoiceStatus(inv.status),
    issueDate: inv.created_at,
    dueDate: inv.created_at,
    hasFiscalReceipt: !!inv.invoice_series,
  }))

  // Combine invoices, prioritizing formal invoices over sales
  const allInvoices = invoicesFromInvoices.length > 0 ? invoicesFromInvoices : invoicesFromSales

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
      invoices={allInvoices}
      quotes={mockQuotes}
      stats={stats}
    />
  )
}
