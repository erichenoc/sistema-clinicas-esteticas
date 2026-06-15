'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  Eye,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { getInvoices, type InvoiceListItemData } from '@/actions/billing'
import { formatCurrency } from '@/lib/currency'

// Fila de cuenta por cobrar derivada de una factura real
interface ReceivableRow {
  id: string
  patientName: string
  invoiceNumber: string
  total: number
  paidAmount: number
  pendingAmount: number
  dueDate: string | null
  currency: string
  effectiveStatus: 'paid' | 'partial' | 'overdue' | 'pending'
  daysOverdue: number
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusBadge(status: ReceivableRow['effectiveStatus'], daysOverdue: number) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-500">Pagado</Badge>
    case 'partial':
      return <Badge className="bg-blue-500">Parcial</Badge>
    case 'overdue':
      return <Badge className="bg-red-500">Vencido ({daysOverdue}d)</Badge>
    default:
      return <Badge className="bg-yellow-500">Pendiente</Badge>
  }
}

export default function CuentasPorCobrarPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [rows, setRows] = useState<ReceivableRow[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'partial' | 'paid'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const invoices = await getInvoices()
        const now = new Date()

        const mapped: ReceivableRow[] = invoices
          // Excluir facturas anuladas
          .filter((inv: InvoiceListItemData) => inv.status !== 'cancelled')
          .map((inv: InvoiceListItemData) => {
            const pending = inv.amount_due
            const isPaid = inv.status === 'paid' || pending <= 0.01
            const isOverdue =
              !isPaid && !!inv.due_date && new Date(inv.due_date) < now && pending > 0
            const daysOverdue = isOverdue
              ? Math.floor((now.getTime() - new Date(inv.due_date as string).getTime()) / 86400000)
              : 0

            let effectiveStatus: ReceivableRow['effectiveStatus'] = 'pending'
            if (isPaid) effectiveStatus = 'paid'
            else if (isOverdue) effectiveStatus = 'overdue'
            else if (inv.paid_amount > 0) effectiveStatus = 'partial'

            return {
              id: inv.id,
              patientName: inv.patient_name || 'Cliente General',
              invoiceNumber: inv.invoice_number,
              total: inv.total,
              paidAmount: inv.paid_amount,
              pendingAmount: pending,
              dueDate: inv.due_date,
              currency: inv.currency,
              effectiveStatus,
              daysOverdue,
            }
          })

        setRows(mapped)
      } catch (error) {
        console.error('Error loading cuentas por cobrar:', error)
        toast.error('Error al cargar las cuentas por cobrar')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // Estadisticas (sobre datos reales)
  const totalPorCobrar = rows
    .filter((r) => r.effectiveStatus !== 'paid')
    .reduce((acc, r) => acc + r.pendingAmount, 0)
  const totalVencido = rows
    .filter((r) => r.effectiveStatus === 'overdue')
    .reduce((acc, r) => acc + r.pendingAmount, 0)
  const totalParcial = rows
    .filter((r) => r.effectiveStatus === 'partial')
    .reduce((acc, r) => acc + r.pendingAmount, 0)
  const cuentasVencidas = rows.filter((r) => r.effectiveStatus === 'overdue').length

  const totalFacturado = rows.reduce((acc, r) => acc + r.total, 0)
  const totalCobrado = rows.reduce((acc, r) => acc + r.paidAmount, 0)
  const tasaCobro = totalFacturado > 0 ? Math.round((totalCobrado / totalFacturado) * 100) : 0

  // Filtro por tab + busqueda
  const filteredRows = rows.filter((r) => {
    if (activeTab === 'overdue' && r.effectiveStatus !== 'overdue') return false
    if (activeTab === 'partial' && r.effectiveStatus !== 'partial') return false
    if (activeTab === 'paid' && r.effectiveStatus !== 'paid') return false
    if (
      searchTerm &&
      !r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !r.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facturacion">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cuentas por Cobrar</h1>
            <p className="text-muted-foreground">
              Lo que tus pacientes te deben realmente
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total por Cobrar
            </CardDescription>
            <CardTitle className="text-3xl text-amber-600">{formatCurrency(totalPorCobrar)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {rows.filter((r) => r.effectiveStatus !== 'paid').length} cuentas pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Saldo Vencido
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">{formatCurrency(totalVencido)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{cuentasVencidas} facturas vencidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Con Abono (Parcial)
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">{formatCurrency(totalParcial)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {rows.filter((r) => r.effectiveStatus === 'partial').length} facturas con abono
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Tasa de Cobro
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{tasaCobro}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={tasaCobro} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs + busqueda */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="overdue">
            Vencidas
            {cuentasVencidas > 0 && (
              <Badge variant="destructive" className="ml-2">
                {cuentasVencidas}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="partial">Con Abono</TabsTrigger>
          <TabsTrigger value="paid">Pagadas</TabsTrigger>
        </TabsList>

        <div className="relative mt-4 mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente o factura..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle className="h-12 w-12 text-green-500/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'all'
                    ? 'No hay cuentas registradas'
                    : 'No hay cuentas en esta categoria'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Pendiente</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[90px] text-right">Accion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.patientName}</TableCell>
                      <TableCell>
                        <Link
                          href={`/facturacion/facturas/${r.id}`}
                          className="text-primary hover:underline"
                        >
                          {r.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(r.total, r.currency)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(r.paidAmount, r.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-amber-600">
                        {formatCurrency(r.pendingAmount, r.currency)}
                      </TableCell>
                      <TableCell>{formatDate(r.dueDate)}</TableCell>
                      <TableCell>{getStatusBadge(r.effectiveStatus, r.daysOverdue)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/facturacion/facturas/${r.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
