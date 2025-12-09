'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Printer,
  Download,
  Send,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  FileText,
  Clock,
  Receipt,
  AlertCircle,
  Copy,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  type Invoice,
  type InvoiceItem,
  type InvoicePayment,
  type InvoiceStatus,
  type BillingClient,
  INVOICE_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  formatCurrency,
} from '@/types/billing'
import { useUser, RequirePermission } from '@/contexts/user-context'
import { Pencil } from 'lucide-react'

// Mock invoice data
const mockInvoice: Invoice = {
  id: '1',
  clinicId: 'clinic-1',
  invoiceNumber: 'FAC-2024-0042',
  hasFiscalReceipt: true,
  ncfType: 'B02',
  ncfNumber: 'B0200000156',
  ncfExpirationDate: '2025-12-31',
  clientId: 'client-1',
  client: {
    id: 'client-1',
    patientId: 'patient-1',
    name: 'Maria Garcia Lopez',
    email: 'maria.garcia@email.com',
    phone: '809-555-1234',
    isBusiness: false,
    address: 'Calle Principal #123',
    city: 'Santo Domingo',
    province: 'Distrito Nacional',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01',
  },
  quoteId: 'quote-1',
  appointmentId: 'apt-123',
  items: [
    {
      id: 'item-1',
      type: 'treatment',
      referenceId: 'treat-1',
      description: 'Limpieza Facial Profunda',
      quantity: 1,
      unitPrice: 2500,
      discount: 0,
      discountType: 'percentage',
      taxable: true,
      taxRate: 18,
      taxAmount: 450,
      subtotal: 2500,
      total: 2950,
    },
    {
      id: 'item-2',
      type: 'treatment',
      referenceId: 'treat-2',
      description: 'Botox - Zona Entrecejo (20 unidades)',
      quantity: 1,
      unitPrice: 15000,
      discount: 10,
      discountType: 'percentage',
      taxable: true,
      taxRate: 18,
      taxAmount: 2430,
      subtotal: 13500,
      total: 15930,
    },
    {
      id: 'item-3',
      type: 'product',
      referenceId: 'prod-1',
      description: 'Crema Hidratante Post-tratamiento',
      quantity: 2,
      unitPrice: 1200,
      discount: 0,
      discountType: 'fixed',
      taxable: true,
      taxRate: 18,
      taxAmount: 432,
      subtotal: 2400,
      total: 2832,
    },
  ],
  subtotal: 18400,
  discountTotal: 1500,
  taxableAmount: 16900,
  exemptAmount: 0,
  taxAmount: 3042,
  total: 21712,
  currency: 'DOP',
  payments: [
    {
      id: 'pay-1',
      invoiceId: '1',
      amount: 21712,
      paymentMethod: 'card',
      reference: 'VISA ****4532',
      paidAt: '2024-12-06T14:30:00',
      receivedBy: 'Dra. Carmen Perez',
      notes: 'Pago completo con tarjeta de credito',
    },
  ],
  amountPaid: 21712,
  amountDue: 0,
  issueDate: '2024-12-06',
  dueDate: '2024-12-06',
  paidAt: '2024-12-06T14:30:00',
  status: 'paid',
  paymentTerms: 'immediate',
  notes: 'Tratamiento realizado por Dra. Carmen Perez. Proxima cita programada para seguimiento en 2 semanas.',
  createdBy: 'user-1',
  createdAt: '2024-12-06T10:00:00',
  updatedAt: '2024-12-06T14:30:00',
}

// Mock data for other invoices (for testing different statuses)
const mockInvoices: Record<string, Invoice> = {
  '1': mockInvoice,
  '2': {
    ...mockInvoice,
    id: '2',
    invoiceNumber: 'FAC-2024-0041',
    ncfNumber: 'B0100000089',
    ncfType: 'B01',
    client: {
      id: 'client-2',
      name: 'Centro Medico San Rafael',
      email: 'admin@centrosanrafael.com',
      phone: '809-555-9876',
      rncCedula: '101234567',
      businessName: 'Centro Medico San Rafael, SRL',
      isBusiness: true,
      address: 'Av. Winston Churchill #45',
      city: 'Santo Domingo',
      province: 'Distrito Nacional',
      createdAt: '2024-01-10',
      updatedAt: '2024-11-15',
    },
    total: 125000,
    amountPaid: 0,
    amountDue: 125000,
    status: 'pending',
    payments: [],
    paymentTerms: 'net30',
    issueDate: '2024-12-05',
    dueDate: '2025-01-04',
  },
  '3': {
    ...mockInvoice,
    id: '3',
    invoiceNumber: 'FAC-2024-0040',
    hasFiscalReceipt: false,
    ncfNumber: undefined,
    ncfType: undefined,
    client: {
      id: 'client-3',
      name: 'Laura Martinez',
      email: 'laura.m@email.com',
      phone: '809-555-4567',
      isBusiness: false,
      createdAt: '2024-02-20',
      updatedAt: '2024-12-01',
    },
    total: 28500,
    amountPaid: 28500,
    amountDue: 0,
    status: 'paid',
    payments: [
      {
        id: 'pay-2',
        invoiceId: '3',
        amount: 28500,
        paymentMethod: 'cash',
        paidAt: '2024-12-04T16:00:00',
        receivedBy: 'Recepcion',
      },
    ],
  },
  '4': {
    ...mockInvoice,
    id: '4',
    invoiceNumber: 'FAC-2024-0039',
    ncfNumber: 'B0100000088',
    ncfType: 'B01',
    client: {
      id: 'client-4',
      name: 'Corporacion Bella Vista',
      email: 'contabilidad@bellavista.com',
      phone: '809-555-7890',
      rncCedula: '130567890',
      businessName: 'Corporacion Bella Vista, SA',
      isBusiness: true,
      address: 'Torre Empresarial, Piso 12',
      city: 'Santiago',
      province: 'Santiago',
      createdAt: '2024-03-01',
      updatedAt: '2024-11-28',
    },
    total: 350000,
    amountPaid: 175000,
    amountDue: 175000,
    status: 'partial',
    payments: [
      {
        id: 'pay-3',
        invoiceId: '4',
        amount: 175000,
        paymentMethod: 'transfer',
        reference: 'REF-2024-001234',
        paidAt: '2024-12-15T09:00:00',
        receivedBy: 'Contabilidad',
        notes: 'Primer pago - 50%',
      },
    ],
    paymentTerms: 'net30',
    issueDate: '2024-12-01',
    dueDate: '2024-12-31',
  },
  '5': {
    ...mockInvoice,
    id: '5',
    invoiceNumber: 'FAC-2024-0038',
    ncfNumber: 'B0200000155',
    client: {
      id: 'client-5',
      name: 'Ana Fernandez',
      email: 'ana.f@email.com',
      phone: '809-555-2345',
      isBusiness: false,
      createdAt: '2024-04-10',
      updatedAt: '2024-11-15',
    },
    total: 18000,
    amountPaid: 0,
    amountDue: 18000,
    status: 'overdue',
    payments: [],
    paymentTerms: 'net15',
    issueDate: '2024-11-15',
    dueDate: '2024-11-30',
  },
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { hasPermission } = useUser()
  const canEditInvoice = hasPermission('billing:edit')
  const canVoidInvoice = hasPermission('billing:void')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  // Get invoice data (would be fetched from API in production)
  const invoice = mockInvoices[id] || mockInvoice

  const getStatusBadge = (status: InvoiceStatus) => {
    const config = INVOICE_STATUS_OPTIONS.find((s) => s.value === status)
    if (!config) return null
    return (
      <Badge style={{ backgroundColor: config.color }} className="text-white text-sm px-3 py-1">
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />
      case 'card':
        return <CreditCard className="h-4 w-4" />
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4" />
      case 'check':
        return <FileText className="h-4 w-4" />
      default:
        return <Receipt className="h-4 w-4" />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    return PAYMENT_METHOD_OPTIONS.find((m) => m.value === method)?.label || method
  }

  const handlePrint = () => {
    window.print()
    toast.success('Preparando impresion...')
  }

  const handleDownloadPDF = () => {
    toast.success('Descargando factura como PDF...')
    // Would trigger PDF generation in production
  }

  const handleSendEmail = () => {
    toast.success(`Factura enviada a ${invoice.client?.email}`)
  }

  const handleCopyNCF = () => {
    if (invoice.ncfNumber) {
      navigator.clipboard.writeText(invoice.ncfNumber)
      toast.success('NCF copiado al portapapeles')
    }
  }

  const handleRegisterPayment = () => {
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingrese un monto valido')
      return
    }
    if (amount > invoice.amountDue) {
      toast.error('El monto no puede exceder el saldo pendiente')
      return
    }
    if (!paymentMethod) {
      toast.error('Seleccione un metodo de pago')
      return
    }

    toast.success(`Pago de ${formatCurrency(amount)} registrado exitosamente`)
    setShowPaymentDialog(false)
    setPaymentAmount('')
    setPaymentMethod('')
    setPaymentReference('')
    setPaymentNotes('')
  }

  const handleCancelInvoice = () => {
    if (!cancelReason.trim()) {
      toast.error('Ingrese el motivo de la anulacion')
      return
    }

    toast.success('Factura anulada exitosamente')
    setShowCancelDialog(false)
    setCancelReason('')
    router.push('/facturacion')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/facturacion">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-muted-foreground mt-1">
              Emitida el {formatDate(invoice.issueDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleSendEmail}>
            <Send className="mr-2 h-4 w-4" />
            Enviar
          </Button>

          {(invoice.status === 'pending' || invoice.status === 'partial' || invoice.status === 'overdue') && (
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Registrar Pago
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Pago</DialogTitle>
                  <DialogDescription>
                    Saldo pendiente: {formatCurrency(invoice.amountDue, invoice.currency)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Metodo de Pago</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar metodo" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHOD_OPTIONS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Referencia (opcional)</Label>
                    <Input
                      id="reference"
                      placeholder="Numero de transaccion, ultimos 4 digitos, etc."
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Notas adicionales sobre el pago"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleRegisterPayment}>
                    Registrar Pago
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {invoice.client?.patientId && (
                <DropdownMenuItem asChild>
                  <Link href={`/pacientes/${invoice.client.patientId}`}>
                    <User className="mr-2 h-4 w-4" />
                    Ver perfil del paciente
                  </Link>
                </DropdownMenuItem>
              )}
              {invoice.appointmentId && (
                <DropdownMenuItem asChild>
                  <Link href={`/agenda/${invoice.appointmentId}`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Ver cita asociada
                  </Link>
                </DropdownMenuItem>
              )}
              {invoice.quoteId && (
                <DropdownMenuItem asChild>
                  <Link href={`/facturacion/cotizaciones/${invoice.quoteId}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Ver cotizacion original
                  </Link>
                </DropdownMenuItem>
              )}
              {(invoice.client?.patientId || invoice.appointmentId || invoice.quoteId) && (
                <DropdownMenuSeparator />
              )}
              {canEditInvoice && invoice.status !== 'cancelled' && (
                <DropdownMenuItem asChild>
                  <Link href={`/facturacion/facturas/${invoice.id}/editar`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar factura
                  </Link>
                </DropdownMenuItem>
              )}
              {canVoidInvoice && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Anular factura
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Anular Factura</DialogTitle>
                      <DialogDescription>
                        Esta accion no se puede deshacer. La factura sera marcada como anulada.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cancelReason">Motivo de anulacion</Label>
                        <Textarea
                          id="cancelReason"
                          placeholder="Ingrese el motivo de la anulacion"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                        Cancelar
                      </Button>
                      <Button variant="destructive" onClick={handleCancelInvoice}>
                        Anular Factura
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status Alert for Overdue */}
      {invoice.status === 'overdue' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Factura Vencida</p>
              <p className="text-sm text-red-600">
                Esta factura vencio el {formatDate(invoice.dueDate)}.
                Saldo pendiente: {formatCurrency(invoice.amountDue, invoice.currency)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {invoice.client?.isBusiness ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
                Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-lg">{invoice.client?.name}</p>
                  {invoice.client?.businessName && (
                    <p className="text-muted-foreground">{invoice.client.businessName}</p>
                  )}
                  {invoice.client?.rncCedula && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.client.isBusiness ? 'RNC' : 'Cedula'}: {invoice.client.rncCedula}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  {invoice.client?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${invoice.client.email}`} className="text-primary hover:underline">
                        {invoice.client.email}
                      </a>
                    </div>
                  )}
                  {invoice.client?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${invoice.client.phone}`} className="text-primary hover:underline">
                        {invoice.client.phone}
                      </a>
                    </div>
                  )}
                  {invoice.client?.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {invoice.client.address}
                        {invoice.client.city && `, ${invoice.client.city}`}
                        {invoice.client.province && `, ${invoice.client.province}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de la Factura</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Descripcion</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Desc.</TableHead>
                    <TableHead className="text-right">ITBIS</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {item.type === 'treatment' ? 'Tratamiento' :
                             item.type === 'product' ? 'Producto' :
                             item.type === 'package' ? 'Paquete' : 'Otro'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.discount > 0 ? (
                          item.discountType === 'percentage'
                            ? `${item.discount}%`
                            : formatCurrency(item.discount, invoice.currency)
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.taxable ? formatCurrency(item.taxAmount, invoice.currency) : 'Exento'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right">Subtotal</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(invoice.subtotal, invoice.currency)}
                    </TableCell>
                  </TableRow>
                  {invoice.discountTotal > 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-right">Descuento Total</TableCell>
                      <TableCell className="text-right text-red-600">
                        -{formatCurrency(invoice.discountTotal, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={5} className="text-right">ITBIS (18%)</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(invoice.taxAmount, invoice.currency)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={5} className="text-right font-bold text-lg">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoice.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-start justify-between p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-green-100 text-green-600">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {formatCurrency(payment.amount, invoice.currency)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getPaymentMethodLabel(payment.paymentMethod)}
                            {payment.reference && ` - ${payment.reference}`}
                          </p>
                          {payment.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {payment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">{formatDateTime(payment.paidAt)}</p>
                        <p className="text-muted-foreground">por {payment.receivedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NCF Info */}
              {invoice.hasFiscalReceipt && invoice.ncfNumber && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Comprobante Fiscal</p>
                      <p className="font-mono font-medium">{invoice.ncfNumber}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCopyNCF}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {invoice.ncfExpirationDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Valido hasta: {formatDate(invoice.ncfExpirationDate)}
                    </p>
                  )}
                </div>
              )}

              <Separator />

              {/* Amounts */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Facturado</span>
                  <span className="font-medium">{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Pagado</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(invoice.amountPaid, invoice.currency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Saldo Pendiente</span>
                  <span className={`font-bold ${invoice.amountDue > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    {formatCurrency(invoice.amountDue, invoice.currency)}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Dates */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de Emision</p>
                    <p className="text-sm">{formatDate(invoice.issueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de Vencimiento</p>
                    <p className={`text-sm ${invoice.status === 'overdue' ? 'text-red-600 font-medium' : ''}`}>
                      {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                </div>
                {invoice.paidAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha de Pago</p>
                      <p className="text-sm text-green-600">{formatDateTime(invoice.paidAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rapidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoice.client?.patientId && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/pacientes/${invoice.client.patientId}`}>
                    <User className="mr-2 h-4 w-4" />
                    Ver Perfil del Paciente
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/pos">
                  <Receipt className="mr-2 h-4 w-4" />
                  Nueva Venta (POS)
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/facturacion/facturas/nueva">
                  <FileText className="mr-2 h-4 w-4" />
                  Nueva Factura
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
