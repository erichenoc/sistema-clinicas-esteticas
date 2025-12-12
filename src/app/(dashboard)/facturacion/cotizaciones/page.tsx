'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, FileText, Clock, CheckCircle, XCircle, Send, MoreHorizontal, Loader2, Mail, Trash2, Copy, FileCheck } from 'lucide-react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { toast } from 'sonner'

import { getQuotations, getQuotationStats, deleteQuotation, sendQuotationEmail, updateQuotationStatus, type QuotationData } from '@/actions/quotations'

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800', icon: FileText },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-800', icon: Send },
  accepted: { label: 'Aceptada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired: { label: 'Expirada', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  converted: { label: 'Facturada', color: 'bg-purple-100 text-purple-800', icon: FileCheck },
}

export default function CotizacionesPage() {
  const [quotations, setQuotations] = useState<QuotationData[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, totalValue: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)

  // Load data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [quotationsData, statsData] = await Promise.all([
          getQuotations(),
          getQuotationStats(),
        ])
        setQuotations(quotationsData)
        setStats(statsData)
      } catch (error) {
        console.error('Error loading quotations:', error)
        toast.error('Error al cargar las cotizaciones')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Filter quotations
  const filteredQuotations = quotations.filter(q => {
    const matchesSearch =
      q.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Handle delete
  const handleDelete = async () => {
    if (!deleteId) return

    const result = await deleteQuotation(deleteId)
    if (result.success) {
      setQuotations(quotations.filter(q => q.id !== deleteId))
      toast.success('Cotización eliminada')
    } else {
      toast.error(result.error || 'Error al eliminar')
    }
    setDeleteId(null)
  }

  // Handle send email
  const handleSendEmail = async (id: string) => {
    setSendingId(id)
    toast.loading('Enviando cotización...', { id: 'send-email' })

    const result = await sendQuotationEmail(id)

    toast.dismiss('send-email')
    if (result.success) {
      // Update local state
      setQuotations(quotations.map(q =>
        q.id === id ? { ...q, status: 'sent' as const } : q
      ))
      toast.success('Cotización enviada por email')
    } else {
      toast.error(result.error || 'Error al enviar')
    }
    setSendingId(null)
  }

  // Handle status change
  const handleStatusChange = async (id: string, status: 'accepted' | 'rejected') => {
    const result = await updateQuotationStatus(id, status)
    if (result.success) {
      setQuotations(quotations.map(q =>
        q.id === id ? { ...q, status } : q
      ))
      toast.success(`Cotización marcada como ${status === 'accepted' ? 'aceptada' : 'rechazada'}`)
    } else {
      toast.error(result.error || 'Error al actualizar estado')
    }
  }

  const formatCurrency = (amount: number, currency: string = 'DOP') => {
    const symbol = currency === 'DOP' ? 'RD$' : 'US$'
    return `${symbol}${amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facturacion">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Cotizaciones</h1>
            <p className="text-muted-foreground">Gestiona cotizaciones y presupuestos</p>
          </div>
        </div>
        <Link href="/facturacion/cotizaciones/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cotizacion
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">cotizaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">por responder</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aceptadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Aceptado</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">confirmado</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Cotizaciones</CardTitle>
          <CardDescription>Todas las cotizaciones registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por numero o cliente..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="sent">Enviadas</SelectItem>
                <SelectItem value="accepted">Aceptadas</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay cotizaciones</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all'
                  ? 'No se encontraron cotizaciones con los filtros aplicados'
                  : 'Crea tu primera cotización para comenzar'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/facturacion/cotizaciones/nueva">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Cotización
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quote) => {
                  const status = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.draft
                  const StatusIcon = status.icon
                  const isExpired = new Date(quote.valid_until) < new Date() && quote.status !== 'accepted' && quote.status !== 'converted'
                  const displayStatus = isExpired && quote.status === 'sent' ? statusConfig.expired : status

                  return (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.quote_number}</TableCell>
                      <TableCell>{quote.patient_name || 'Sin cliente'}</TableCell>
                      <TableCell>{new Date(quote.created_at).toLocaleDateString('es-DO')}</TableCell>
                      <TableCell>
                        <span className={isExpired ? 'text-red-600' : ''}>
                          {new Date(quote.valid_until).toLocaleDateString('es-DO')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{quote.currency}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(quote.total, quote.currency)}</TableCell>
                      <TableCell>
                        <Badge className={displayStatus.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {displayStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={sendingId === quote.id}>
                              {sendingId === quote.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/facturacion/cotizaciones/${quote.id}`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Ver detalles
                              </Link>
                            </DropdownMenuItem>
                            {quote.status === 'draft' && (
                              <DropdownMenuItem asChild>
                                <Link href={`/facturacion/cotizaciones/${quote.id}/editar`}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {(quote.status === 'draft' || quote.status === 'sent') && (
                              <DropdownMenuItem onClick={() => handleSendEmail(quote.id)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Enviar por email
                              </DropdownMenuItem>
                            )}
                            {quote.status === 'sent' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'accepted')}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Marcar como aceptada
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'rejected')}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Marcar como rechazada
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href={`/facturacion/cotizaciones/nueva?duplicate=${quote.id}`}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleteId(quote.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Cotización</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar esta cotización? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
