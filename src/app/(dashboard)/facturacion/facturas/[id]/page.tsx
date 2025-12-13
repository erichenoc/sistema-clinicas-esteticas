'use client'

import { use, useState, useEffect } from 'react'
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
  Loader2,
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
  type InvoiceStatus,
  INVOICE_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '@/types/billing'
import { formatCurrency } from '@/lib/currency'
import { useUser } from '@/contexts/user-context'
import { Pencil } from 'lucide-react'
import {
  getInvoiceById,
  getInvoiceItems,
  cancelInvoice,
  registerPayment,
  type InvoiceListItemData,
  type InvoiceItemData,
  type PaymentMethod,
} from '@/actions/billing'

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
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [invoice, setInvoice] = useState<(InvoiceListItemData & { items?: InvoiceItemData[] }) | null>(null)

  // Fetch invoice data from database
  useEffect(() => {
    async function fetchInvoice() {
      setIsLoading(true)
      try {
        const [invoiceData, itemsData] = await Promise.all([
          getInvoiceById(id),
          getInvoiceItems(id),
        ])
        if (invoiceData) {
          setInvoice({ ...invoiceData, items: itemsData })
        }
      } catch (error) {
        console.error('Error fetching invoice:', error)
        toast.error('Error al cargar la factura')
      } finally {
        setIsLoading(false)
      }
    }
    fetchInvoice()
  }, [id])

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
    toast.success(`Factura enviada`)
  }

  const handleCopyNCF = () => {
    if (invoice?.ncf) {
      navigator.clipboard.writeText(invoice.ncf)
      toast.success('NCF copiado al portapapeles')
    }
  }

  const handleRegisterPayment = async () => {
    if (!invoice) return

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingrese un monto valido')
      return
    }
    if (amount > invoice.amount_due) {
      toast.error('El monto no puede exceder el saldo pendiente')
      return
    }
    if (!paymentMethod) {
      toast.error('Seleccione un metodo de pago')
      return
    }

    setIsProcessingPayment(true)
    try {
      const result = await registerPayment(invoice.id, {
        payment_method: paymentMethod as PaymentMethod,
        amount,
        reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(`Pago de ${formatCurrency(amount)} registrado exitosamente`)
      setShowPaymentDialog(false)
      setPaymentAmount('')
      setPaymentMethod('')
      setPaymentReference('')
      setPaymentNotes('')

      // Refresh invoice data
      const [invoiceData, itemsData] = await Promise.all([
        getInvoiceById(id),
        getInvoiceItems(id),
      ])
      if (invoiceData) {
        setInvoice({ ...invoiceData, items: itemsData })
      }
    } catch (error) {
      console.error('Error registering payment:', error)
      toast.error('Error al registrar el pago')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleCancelInvoice = async () => {
    if (!cancelReason.trim()) {
      toast.error('Ingrese el motivo de la anulacion')
      return
    }

    setIsCancelling(true)
    try {
      const result = await cancelInvoice(id, cancelReason)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Factura anulada exitosamente')
      setShowCancelDialog(false)
      setCancelReason('')
      router.push('/facturacion')
    } catch (error) {
      console.error('Error cancelling invoice:', error)
      toast.error('Error al anular la factura')
    } finally {
      setIsCancelling(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Not found
  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Factura no encontrada</h2>
        <Button asChild>
          <Link href="/facturacion">Volver a Facturacion</Link>
        </Button>
      </div>
    )
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
              <h1 className="text-3xl font-bold">{invoice.invoice_number}</h1>
              {getStatusBadge(invoice.status as InvoiceStatus)}
            </div>
            <p className="text-muted-foreground mt-1">
              Emitida el {formatDate(invoice.issue_date)}
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
                    Saldo pendiente: {formatCurrency(invoice.amount_due, invoice.currency)}
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
                  <Button onClick={handleRegisterPayment} disabled={isProcessingPayment}>
                    {isProcessingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              {invoice.patient_id && (
                <DropdownMenuItem asChild>
                  <Link href={`/pacientes/${invoice.patient_id}`}>
                    <User className="mr-2 h-4 w-4" />
                    Ver perfil del paciente
                  </Link>
                </DropdownMenuItem>
              )}
              {invoice.patient_id && <DropdownMenuSeparator />}
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
                        Esta accion no se puede deshacer. La factura sera marcada como anulada y los montos seran excluidos de las estadisticas.
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
                      <Button variant="destructive" onClick={handleCancelInvoice} disabled={isCancelling}>
                        {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

      {/* Status Alert for Cancelled */}
      {invoice.status === 'cancelled' && (
        <Card className="border-gray-300 bg-gray-50">
          <CardContent className="flex items-center gap-4 py-4">
            <XCircle className="h-6 w-6 text-gray-600" />
            <div>
              <p className="font-medium text-gray-800">Factura Anulada</p>
              <p className="text-sm text-gray-600">
                Esta factura ha sido anulada y no se incluye en las estadisticas.
                {invoice.internal_notes && ` Motivo: ${invoice.internal_notes}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Alert for Overdue */}
      {invoice.status === 'overdue' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Factura Vencida</p>
              <p className="text-sm text-red-600">
                Esta factura vencio el {invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}.
                Saldo pendiente: {formatCurrency(invoice.amount_due, invoice.currency)}
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
                <User className="h-5 w-5" />
                Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-lg">{invoice.patient_name || 'Cliente General'}</p>
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
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.description}</p>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price, invoice.currency)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total, invoice.currency)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No hay items en esta factura
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(invoice.subtotal, invoice.currency)}
                    </TableCell>
                  </TableRow>
                  {invoice.discount_amount > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">Descuento</TableCell>
                      <TableCell className="text-right text-red-600">
                        -{formatCurrency(invoice.discount_amount, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  )}
                  {invoice.tax_amount > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">ITBIS (18%)</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.tax_amount, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={3} className="text-right font-bold text-lg">
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
              {invoice.ncf && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Comprobante Fiscal</p>
                      <p className="font-mono font-medium">{invoice.ncf}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCopyNCF}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
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
                    {formatCurrency(invoice.paid_amount, invoice.currency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Saldo Pendiente</span>
                  <span className={`font-bold ${invoice.amount_due > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    {formatCurrency(invoice.amount_due, invoice.currency)}
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
                    <p className="text-sm">{formatDate(invoice.issue_date)}</p>
                  </div>
                </div>
                {invoice.due_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha de Vencimiento</p>
                      <p className={`text-sm ${invoice.status === 'overdue' ? 'text-red-600 font-medium' : ''}`}>
                        {formatDate(invoice.due_date)}
                      </p>
                    </div>
                  </div>
                )}
                {invoice.status === 'paid' && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Estado</p>
                      <p className="text-sm text-green-600">Pagada</p>
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
              {invoice.patient_id && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/pacientes/${invoice.patient_id}`}>
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
