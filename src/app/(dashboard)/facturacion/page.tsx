'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Send,
  FileCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Building2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  type QuoteStatus,
  type InvoiceStatus,
  QUOTE_STATUS_OPTIONS,
  INVOICE_STATUS_OPTIONS,
  formatCurrency,
} from '@/types/billing'

// Mock data - Cotizaciones
const mockQuotes = [
  {
    id: '1',
    quoteNumber: 'COT-2024-0015',
    clientName: 'María García López',
    clientRnc: null,
    total: 45000,
    currency: 'DOP' as const,
    status: 'sent' as QuoteStatus,
    issueDate: '2024-12-05',
    validUntil: '2024-12-20',
    itemsCount: 3,
  },
  {
    id: '2',
    quoteNumber: 'COT-2024-0014',
    clientName: 'Centro Médico San Rafael',
    clientRnc: '101234567',
    total: 125000,
    currency: 'DOP' as const,
    status: 'accepted' as QuoteStatus,
    issueDate: '2024-12-03',
    validUntil: '2024-12-18',
    itemsCount: 8,
  },
  {
    id: '3',
    quoteNumber: 'COT-2024-0013',
    clientName: 'Laura Martínez',
    clientRnc: null,
    total: 28500,
    currency: 'DOP' as const,
    status: 'draft' as QuoteStatus,
    issueDate: '2024-12-01',
    validUntil: '2024-12-16',
    itemsCount: 2,
  },
  {
    id: '4',
    quoteNumber: 'COT-2024-0012',
    clientName: 'Corporación Bella Vista',
    clientRnc: '130567890',
    total: 350000,
    currency: 'DOP' as const,
    status: 'converted' as QuoteStatus,
    issueDate: '2024-11-28',
    validUntil: '2024-12-13',
    itemsCount: 12,
  },
  {
    id: '5',
    quoteNumber: 'COT-2024-0011',
    clientName: 'Pedro Sánchez',
    clientRnc: null,
    total: 15000,
    currency: 'DOP' as const,
    status: 'expired' as QuoteStatus,
    issueDate: '2024-11-15',
    validUntil: '2024-11-30',
    itemsCount: 1,
  },
]

// Mock data - Facturas
const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'FAC-2024-0042',
    ncfNumber: 'B0200000156',
    clientName: 'María García López',
    clientRnc: null,
    total: 45000,
    amountDue: 0,
    currency: 'DOP' as const,
    status: 'paid' as InvoiceStatus,
    issueDate: '2024-12-06',
    dueDate: '2024-12-06',
    hasFiscalReceipt: true,
  },
  {
    id: '2',
    invoiceNumber: 'FAC-2024-0041',
    ncfNumber: 'B0100000089',
    clientName: 'Centro Médico San Rafael',
    clientRnc: '101234567',
    total: 125000,
    amountDue: 125000,
    currency: 'DOP' as const,
    status: 'pending' as InvoiceStatus,
    issueDate: '2024-12-05',
    dueDate: '2025-01-04',
    hasFiscalReceipt: true,
  },
  {
    id: '3',
    invoiceNumber: 'FAC-2024-0040',
    ncfNumber: null,
    clientName: 'Laura Martínez',
    clientRnc: null,
    total: 28500,
    amountDue: 0,
    currency: 'DOP' as const,
    status: 'paid' as InvoiceStatus,
    issueDate: '2024-12-04',
    dueDate: '2024-12-04',
    hasFiscalReceipt: false,
  },
  {
    id: '4',
    invoiceNumber: 'FAC-2024-0039',
    ncfNumber: 'B0100000088',
    clientName: 'Corporación Bella Vista',
    clientRnc: '130567890',
    total: 350000,
    amountDue: 175000,
    currency: 'DOP' as const,
    status: 'partial' as InvoiceStatus,
    issueDate: '2024-12-01',
    dueDate: '2024-12-31',
    hasFiscalReceipt: true,
  },
  {
    id: '5',
    invoiceNumber: 'FAC-2024-0038',
    ncfNumber: 'B0200000155',
    clientName: 'Ana Fernández',
    clientRnc: null,
    total: 18000,
    amountDue: 18000,
    currency: 'DOP' as const,
    status: 'overdue' as InvoiceStatus,
    issueDate: '2024-11-15',
    dueDate: '2024-11-30',
    hasFiscalReceipt: true,
  },
]

// KPIs
const kpis = {
  totalQuotes: 15,
  quotesThisMonth: 5,
  quoteConversionRate: 68,
  totalInvoiced: 1250000,
  invoicedThisMonth: 548500,
  pendingCollection: 318000,
  overdueAmount: 18000,
}

export default function FacturacionPage() {
  const [activeTab, setActiveTab] = useState('facturas')
  const [quoteSearch, setQuoteSearch] = useState('')
  const [quoteStatusFilter, setQuoteStatusFilter] = useState('all')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all')
  const [invoiceFiscalFilter, setInvoiceFiscalFilter] = useState('all')
  const [isExporting, setIsExporting] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  const filteredQuotes = mockQuotes.filter((quote) => {
    const matchesSearch =
      quote.quoteNumber.toLowerCase().includes(quoteSearch.toLowerCase()) ||
      quote.clientName.toLowerCase().includes(quoteSearch.toLowerCase())
    const matchesStatus = quoteStatusFilter === 'all' || quote.status === quoteStatusFilter
    return matchesSearch && matchesStatus
  })

  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      (invoice.ncfNumber?.toLowerCase().includes(invoiceSearch.toLowerCase()) ?? false)
    const matchesStatus = invoiceStatusFilter === 'all' || invoice.status === invoiceStatusFilter
    const matchesFiscal =
      invoiceFiscalFilter === 'all' ||
      (invoiceFiscalFilter === 'fiscal' && invoice.hasFiscalReceipt) ||
      (invoiceFiscalFilter === 'simple' && !invoice.hasFiscalReceipt)
    return matchesSearch && matchesStatus && matchesFiscal
  })

  const getQuoteStatusBadge = (status: QuoteStatus) => {
    const config = QUOTE_STATUS_OPTIONS.find((s) => s.value === status)
    if (!config) return null
    return (
      <Badge style={{ backgroundColor: config.color }} className="text-white">
        {config.label}
      </Badge>
    )
  }

  const getInvoiceStatusBadge = (status: InvoiceStatus) => {
    const config = INVOICE_STATUS_OPTIONS.find((s) => s.value === status)
    if (!config) return null
    return (
      <Badge style={{ backgroundColor: config.color }} className="text-white">
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Export handlers
  const handleExportInvoices = async () => {
    setIsExporting(true)
    toast.loading('Exportando facturas...', { id: 'export-invoices' })
    await new Promise(resolve => setTimeout(resolve, 1500))

    const headers = 'Numero,Cliente,NCF,Total,Por Cobrar,Vencimiento,Estado\n'
    const rows = filteredInvoices.map(inv =>
      `${inv.invoiceNumber},${inv.clientName},${inv.ncfNumber || '-'},${inv.total},${inv.amountDue},${inv.dueDate},${inv.status}`
    ).join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `facturas-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.dismiss('export-invoices')
    toast.success(`${filteredInvoices.length} facturas exportadas`)
    setIsExporting(false)
  }

  const handleExportQuotes = async () => {
    setIsExporting(true)
    toast.loading('Exportando cotizaciones...', { id: 'export-quotes' })
    await new Promise(resolve => setTimeout(resolve, 1500))

    const headers = 'Numero,Cliente,Total,Valida Hasta,Estado\n'
    const rows = filteredQuotes.map(q =>
      `${q.quoteNumber},${q.clientName},${q.total},${q.validUntil},${q.status}`
    ).join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cotizaciones-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.dismiss('export-quotes')
    toast.success(`${filteredQuotes.length} cotizaciones exportadas`)
    setIsExporting(false)
  }

  // Invoice action handlers
  const handleDownloadPDF = async (invoiceNumber: string) => {
    setProcessingAction(`pdf-${invoiceNumber}`)
    toast.loading('Generando PDF...', { id: 'download-pdf' })
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.dismiss('download-pdf')
    toast.success(`PDF de ${invoiceNumber} generado. Funcionalidad completa proximamente.`)
    setProcessingAction(null)
  }

  const handleSendEmail = async (clientName: string, invoiceNumber: string) => {
    setProcessingAction(`email-${invoiceNumber}`)
    toast.loading('Enviando email...', { id: 'send-email' })
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.dismiss('send-email')
    toast.success(`Factura ${invoiceNumber} enviada a ${clientName}`)
    setProcessingAction(null)
  }

  const handleRegisterPayment = async (invoiceNumber: string, amountDue: number) => {
    setProcessingAction(`payment-${invoiceNumber}`)
    toast.loading('Registrando pago...', { id: 'register-payment' })
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.dismiss('register-payment')
    toast.success(`Pago registrado para ${invoiceNumber}. Monto pendiente: ${formatCurrency(amountDue)}`)
    setProcessingAction(null)
  }

  const handleCancelInvoice = async (invoiceNumber: string) => {
    setProcessingAction(`cancel-${invoiceNumber}`)
    toast.loading('Anulando factura...', { id: 'cancel-invoice' })
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.dismiss('cancel-invoice')
    toast.success(`Factura ${invoiceNumber} anulada`)
    setProcessingAction(null)
  }

  // Quote action handlers
  const handleSendToClient = async (clientName: string, quoteNumber: string) => {
    setProcessingAction(`send-${quoteNumber}`)
    toast.loading('Enviando cotizacion...', { id: 'send-quote' })
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.dismiss('send-quote')
    toast.success(`Cotizacion ${quoteNumber} enviada a ${clientName}`)
    setProcessingAction(null)
  }

  const handleConvertToInvoice = async (quoteNumber: string) => {
    setProcessingAction(`convert-${quoteNumber}`)
    toast.loading('Convirtiendo a factura...', { id: 'convert-invoice' })
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.dismiss('convert-invoice')
    toast.success(`Cotizacion ${quoteNumber} convertida a factura`)
    setProcessingAction(null)
  }

  const handleDeleteQuote = async (quoteNumber: string) => {
    setProcessingAction(`delete-${quoteNumber}`)
    toast.loading('Eliminando cotizacion...', { id: 'delete-quote' })
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.dismiss('delete-quote')
    toast.success(`Cotizacion ${quoteNumber} eliminada`)
    setProcessingAction(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturación</h1>
          <p className="text-muted-foreground">Cotizaciones, facturas y comprobantes fiscales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/facturacion/cotizaciones/nueva">
              <FileText className="mr-2 h-4 w-4" />
              Nueva Cotización
            </Link>
          </Button>
          <Button asChild>
            <Link href="/facturacion/facturas/nueva">
              <Receipt className="mr-2 h-4 w-4" />
              Nueva Factura
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Facturado Este Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.invoicedThisMonth)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15%</span> vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.pendingCollection)}</div>
            <p className="text-xs text-muted-foreground">
              {mockInvoices.filter((i) => i.status === 'pending' || i.status === 'partial').length}{' '}
              facturas pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vencido</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(kpis.overdueAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {mockInvoices.filter((i) => i.status === 'overdue').length} facturas vencidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.quoteConversionRate}%</div>
            <p className="text-xs text-muted-foreground">Cotizaciones a facturas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="facturas" className="gap-2">
            <Receipt className="h-4 w-4" />
            Facturas
            <Badge variant="secondary" className="ml-1">
              {mockInvoices.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cotizaciones" className="gap-2">
            <FileText className="h-4 w-4" />
            Cotizaciones
            <Badge variant="secondary" className="ml-1">
              {mockQuotes.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Facturas */}
        <TabsContent value="facturas" className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente o NCF..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {INVOICE_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={invoiceFiscalFilter} onValueChange={setInvoiceFiscalFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="fiscal">Con NCF</SelectItem>
                <SelectItem value="simple">Sin NCF</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleExportInvoices} disabled={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
          </div>

          {/* Tabla de Facturas */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>NCF</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Por Cobrar</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/facturacion/facturas/${invoice.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">{formatDate(invoice.issueDate)}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {invoice.clientRnc && <Building2 className="h-4 w-4 text-muted-foreground" />}
                        <div>
                          <p className="font-medium">{invoice.clientName}</p>
                          {invoice.clientRnc && (
                            <p className="text-xs text-muted-foreground">RNC: {invoice.clientRnc}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.ncfNumber ? (
                        <Badge variant="outline" className="font-mono">
                          {invoice.ncfNumber}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.amountDue > 0 ? (
                        <span className={invoice.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                          {formatCurrency(invoice.amountDue, invoice.currency)}
                        </span>
                      ) : (
                        <span className="text-green-600">Pagado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          invoice.status === 'overdue'
                            ? 'text-red-600'
                            : new Date(invoice.dueDate) < new Date()
                            ? 'text-amber-600'
                            : ''
                        }
                      >
                        {formatDate(invoice.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/facturacion/facturas/${invoice.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPDF(invoice.invoiceNumber)}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendEmail(invoice.clientName, invoice.invoiceNumber)}>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar por email
                          </DropdownMenuItem>
                          {(invoice.status === 'pending' || invoice.status === 'partial') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleRegisterPayment(invoice.invoiceNumber, invoice.amountDue)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Registrar pago
                              </DropdownMenuItem>
                            </>
                          )}
                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleCancelInvoice(invoice.invoiceNumber)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Anular factura
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab: Cotizaciones */}
        <TabsContent value="cotizaciones" className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número o cliente..."
                value={quoteSearch}
                onChange={(e) => setQuoteSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={quoteStatusFilter} onValueChange={setQuoteStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {QUOTE_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleExportQuotes} disabled={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
          </div>

          {/* Tabla de Cotizaciones */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Válida Hasta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <Link
                        href={`/facturacion/cotizaciones/${quote.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {quote.quoteNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">{formatDate(quote.issueDate)}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {quote.clientRnc && <Building2 className="h-4 w-4 text-muted-foreground" />}
                        <div>
                          <p className="font-medium">{quote.clientName}</p>
                          {quote.clientRnc && (
                            <p className="text-xs text-muted-foreground">RNC: {quote.clientRnc}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{quote.itemsCount} items</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(quote.total, quote.currency)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          quote.status === 'expired'
                            ? 'text-red-600'
                            : new Date(quote.validUntil) < new Date()
                            ? 'text-amber-600'
                            : ''
                        }
                      >
                        {formatDate(quote.validUntil)}
                      </span>
                    </TableCell>
                    <TableCell>{getQuoteStatusBadge(quote.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/facturacion/cotizaciones/${quote.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </Link>
                          </DropdownMenuItem>
                          {quote.status === 'draft' && (
                            <DropdownMenuItem asChild>
                              <Link href={`/facturacion/cotizaciones/${quote.id}/editar`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDownloadPDF(quote.quoteNumber)}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar PDF
                          </DropdownMenuItem>
                          {quote.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleSendToClient(quote.clientName, quote.quoteNumber)}>
                              <Send className="mr-2 h-4 w-4" />
                              Enviar al cliente
                            </DropdownMenuItem>
                          )}
                          {(quote.status === 'sent' || quote.status === 'accepted') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleConvertToInvoice(quote.quoteNumber)}>
                                <ArrowUpRight className="mr-2 h-4 w-4" />
                                Convertir a factura
                              </DropdownMenuItem>
                            </>
                          )}
                          {quote.status === 'draft' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteQuote(quote.quoteNumber)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
