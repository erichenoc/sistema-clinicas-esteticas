'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Download,
  Printer,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { cancelInvoice } from '@/actions/billing'
import type { InvoiceListItemData } from '@/actions/billing'

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800', icon: FileText },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: 'Pagada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  partial: { label: 'Pago Parcial', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  overdue: { label: 'Vencida', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  cancelled: { label: 'Anulada', color: 'bg-gray-100 text-gray-800', icon: XCircle },
}

interface FacturasClientProps {
  invoices: InvoiceListItemData[]
}

export function FacturasClient({ invoices }: FacturasClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [invoiceToCancel, setInvoiceToCancel] = useState<InvoiceListItemData | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [localInvoices, setLocalInvoices] = useState<InvoiceListItemData[]>(invoices)

  const filtered = localInvoices.filter((inv) => {
    const matchesSearch =
      searchQuery === '' ||
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.ncf || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || inv.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: localInvoices.length,
    pending: localInvoices.filter((i) => i.status === 'pending' || i.status === 'partial').length,
    overdue: localInvoices.filter((i) => i.status === 'overdue').length,
    totalPending: localInvoices
      .filter((i) => i.status === 'pending' || i.status === 'partial' || i.status === 'overdue')
      .reduce((acc, i) => acc + i.total, 0),
  }

  async function handleConfirmCancel() {
    if (!invoiceToCancel) return
    setIsCancelling(true)
    try {
      const result = await cancelInvoice(invoiceToCancel.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Factura ${invoiceToCancel.invoice_number} anulada correctamente`)
        setLocalInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoiceToCancel.id ? { ...inv, status: 'cancelled' } : inv
          )
        )
      }
    } catch {
      toast.error('Error al anular la factura')
    } finally {
      setIsCancelling(false)
      setInvoiceToCancel(null)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/facturacion">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Facturas</h1>
            <p className="text-muted-foreground text-sm">
              Gestiona facturas y comprobantes fiscales
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Link href="/facturacion/facturas/nueva" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Factura
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">facturas pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">requieren atencion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              RD${stats.totalPending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">por cobrar</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Facturas</CardTitle>
          <CardDescription>Todas las facturas emitidas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por numero, cliente o NCF..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="paid">Pagadas</SelectItem>
                <SelectItem value="partial">Pago Parcial</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
                <SelectItem value="cancelled">Anuladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-sm font-medium">No se encontraron facturas</p>
              <p className="text-xs mt-1">
                {searchQuery || statusFilter !== 'all'
                  ? 'Intenta cambiar los filtros de busqueda'
                  : 'Crea una nueva factura para comenzar'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>NCF</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((invoice) => {
                  const statusKey = (invoice.status in statusConfig
                    ? invoice.status
                    : 'pending') as keyof typeof statusConfig
                  const status = statusConfig[statusKey]
                  const StatusIcon = status.icon
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {invoice.ncf || '-'}
                      </TableCell>
                      <TableCell>{invoice.patient_name || 'Cliente general'}</TableCell>
                      <TableCell>
                        {new Date(invoice.issue_date).toLocaleDateString('es-DO')}
                      </TableCell>
                      <TableCell>
                        {invoice.due_date
                          ? new Date(invoice.due_date).toLocaleDateString('es-DO')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {invoice.currency === 'USD' ? 'US$' : 'RD$'}
                        {invoice.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Descargar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Printer className="mr-2 h-4 w-4" />
                              Imprimir
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Registrar pago</DropdownMenuItem>
                            <DropdownMenuItem>Enviar por email</DropdownMenuItem>
                            {invoice.status !== 'cancelled' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => setInvoiceToCancel(invoice)}
                                >
                                  Anular factura
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel confirmation dialog */}
      <AlertDialog
        open={invoiceToCancel !== null}
        onOpenChange={(open) => {
          if (!open && !isCancelling) setInvoiceToCancel(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular factura</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion anulara la factura{' '}
              <span className="font-semibold">{invoiceToCancel?.invoice_number}</span> de{' '}
              <span className="font-semibold">
                {invoiceToCancel?.patient_name || 'Cliente general'}
              </span>{' '}
              por un total de{' '}
              <span className="font-semibold">
                {invoiceToCancel?.currency === 'USD' ? 'US$' : 'RD$'}
                {invoiceToCancel?.total.toLocaleString()}
              </span>
              . Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isCancelling ? 'Anulando...' : 'Anular factura'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
