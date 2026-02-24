'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Mail,
  Loader2,
  Copy,
  Edit,
  Trash2,
  Package,
  Stethoscope,
  Gift,
  User,
  Phone,
  AtSign,
  Calendar,
  DollarSign,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

import {
  getQuotationById,
  deleteQuotation,
  sendQuotationEmail,
  updateQuotationStatus,
  type QuotationData,
} from '@/actions/quotations'
import { getCurrentExchangeRate, type CurrencyConversion } from '@/actions/exchange-rates'
import { DownloadQuotationPDF } from '@/components/pdf/download-quotation-pdf'

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800', icon: FileText },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-800', icon: Send },
  accepted: { label: 'Aceptada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired: { label: 'Expirada', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  converted: { label: 'Facturada', color: 'bg-purple-100 text-purple-800', icon: FileText },
}

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [quotation, setQuotation] = useState<QuotationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [exchangeRate, setExchangeRate] = useState<CurrencyConversion | null>(null)

  useEffect(() => {
    async function loadQuotation() {
      setIsLoading(true)
      try {
        const [data, rateData] = await Promise.all([
          getQuotationById(resolvedParams.id),
          getCurrentExchangeRate('USD', 'DOP'),
        ])
        setQuotation(data)
        setExchangeRate(rateData)
      } catch (error) {
        console.error('Error loading quotation:', error)
        toast.error('Error al cargar la cotizacion')
      } finally {
        setIsLoading(false)
      }
    }
    loadQuotation()
  }, [resolvedParams.id])

  const handleSendEmail = async () => {
    if (!quotation) return
    setIsSending(true)
    toast.loading('Enviando cotizacion...', { id: 'send-email' })

    const result = await sendQuotationEmail(quotation.id)

    toast.dismiss('send-email')
    if (result.success) {
      setQuotation({ ...quotation, status: 'sent' })
      toast.success('Cotizacion enviada por email')
    } else {
      toast.error(result.error || 'Error al enviar')
    }
    setIsSending(false)
  }

  const handleStatusChange = async (status: 'accepted' | 'rejected') => {
    if (!quotation) return
    const result = await updateQuotationStatus(quotation.id, status)
    if (result.success) {
      setQuotation({ ...quotation, status })
      toast.success(`Cotizacion marcada como ${status === 'accepted' ? 'aceptada' : 'rechazada'}`)
    } else {
      toast.error(result.error || 'Error al actualizar estado')
    }
  }

  const handleDelete = async () => {
    if (!quotation) return
    setIsDeleting(true)

    const result = await deleteQuotation(quotation.id)

    if (result.success) {
      toast.success('Cotizacion eliminada')
      router.push('/facturacion/cotizaciones')
    } else {
      toast.error(result.error || 'Error al eliminar')
      setIsDeleting(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'DOP') => {
    const symbol = currency === 'DOP' ? 'RD$' : 'US$'
    return `${symbol}${amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
  }

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'treatment':
        return <Stethoscope className="h-4 w-4 text-blue-500" />
      case 'product':
        return <Package className="h-4 w-4 text-green-500" />
      case 'package':
        return <Gift className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'treatment':
        return 'Tratamiento'
      case 'product':
        return 'Producto'
      case 'package':
        return 'Paquete'
      default:
        return 'Personalizado'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/facturacion/cotizaciones">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Cotizacion no encontrada</h1>
            <p className="text-muted-foreground">La cotizacion solicitada no existe</p>
          </div>
        </div>
      </div>
    )
  }

  const status = statusConfig[quotation.status as keyof typeof statusConfig] || statusConfig.draft
  const StatusIcon = status.icon
  const isExpired = new Date(quotation.valid_until) < new Date() &&
    quotation.status !== 'accepted' &&
    quotation.status !== 'converted'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facturacion/cotizaciones">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{quotation.quote_number}</h1>
              <Badge className={isExpired && quotation.status === 'sent' ? statusConfig.expired.color : status.color}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {isExpired && quotation.status === 'sent' ? statusConfig.expired.label : status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Creada el {format(new Date(quotation.created_at), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {quotation.status === 'draft' && (
            <Link href={`/facturacion/cotizaciones/${quotation.id}/editar`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
          )}

          {(quotation.status === 'draft' || quotation.status === 'sent') && (
            <Button onClick={handleSendEmail} disabled={isSending}>
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Enviar por Email
            </Button>
          )}

          <Link href={`/facturacion/cotizaciones/nueva?duplicate=${quotation.id}`}>
            <Button variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </Button>
          </Link>

          <DownloadQuotationPDF
            data={{
              quoteNumber: quotation.quote_number,
              createdAt: quotation.created_at,
              validUntil: quotation.valid_until,
              status: quotation.status,
              clientName: quotation.patient_name || 'Cliente',
              clientEmail: quotation.patient_email,
              clientPhone: quotation.patient_phone,
              clientAddress: quotation.patient_address,
              items: (quotation.items || []).map(item => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                discount: item.discount,
                discountType: item.discount_type as 'percentage' | 'fixed',
                subtotal: item.subtotal,
              })),
              subtotal: quotation.subtotal,
              discountTotal: quotation.discount_total,
              taxRate: quotation.tax_rate,
              taxAmount: quotation.tax_amount,
              total: quotation.total,
              currency: quotation.currency,
              notes: quotation.notes,
              termsConditions: quotation.terms_conditions,
              exchangeRate: exchangeRate?.rate,
            }}
          />

          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informacion del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{quotation.patient_name || 'Sin cliente'}</span>
                </div>
                {quotation.patient_email && (
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                    <span>{quotation.patient_email}</span>
                  </div>
                )}
                {quotation.patient_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{quotation.patient_phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items de la Cotizacion</CardTitle>
              <CardDescription>
                {quotation.items?.length || 0} items en esta cotizacion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripcion</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Descuento</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotation.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getItemTypeIcon(item.type)}
                          <div>
                            <span className="font-medium">{item.description}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {getItemTypeLabel(item.type)}
                            </Badge>
                          </div>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unit_price, quotation.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.discount > 0 && (
                          <span className="text-green-600">
                            -{item.discount_type === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount, quotation.currency)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.subtotal, quotation.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          {(quotation.notes || quotation.terms_conditions) && (
            <Card>
              <CardHeader>
                <CardTitle>Notas y Terminos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quotation.notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Notas:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {quotation.notes}
                    </p>
                  </div>
                )}
                {quotation.terms_conditions && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Terminos y Condiciones:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {quotation.terms_conditions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(quotation.subtotal + quotation.discount_total, quotation.currency)}</span>
              </div>
              {quotation.discount_total > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuentos</span>
                  <span>-{formatCurrency(quotation.discount_total, quotation.currency)}</span>
                </div>
              )}
              {quotation.tax_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ITBIS ({quotation.tax_rate}%)</span>
                  <span>{formatCurrency(quotation.tax_amount, quotation.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(quotation.total, quotation.currency)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Creada</span>
                <span>{format(new Date(quotation.created_at), 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valida hasta</span>
                <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                  {format(new Date(quotation.valid_until), 'dd/MM/yyyy')}
                </span>
              </div>
              {quotation.sent_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Enviada</span>
                  <span>{format(new Date(quotation.sent_at), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
              {quotation.accepted_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Aceptada</span>
                  <span>{format(new Date(quotation.accepted_at), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
              {quotation.rejected_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rechazada</span>
                  <span>{format(new Date(quotation.rejected_at), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {quotation.status === 'sent' && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rapidas</CardTitle>
                <CardDescription>Actualizar estado de la cotizacion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleStatusChange('accepted')}
                >
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Marcar como Aceptada
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleStatusChange('rejected')}
                >
                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                  Marcar como Rechazada
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Cotizacion</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que deseas eliminar la cotizacion {quotation.quote_number}?
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
