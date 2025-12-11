export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowLeft, Plus, Search, FileText, Clock, CheckCircle, XCircle, AlertCircle, MoreHorizontal, Download, Printer } from 'lucide-react'
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

// Mock data - TODO: Connect to database
const mockInvoices = [
  {
    id: 'FAC-001',
    client: 'Maria Fernandez',
    date: '2024-02-15',
    dueDate: '2024-03-15',
    status: 'paid',
    total: 45000,
    items: 3,
    ncf: 'B0100000001',
  },
  {
    id: 'FAC-002',
    client: 'Juan Rodriguez',
    date: '2024-02-12',
    dueDate: '2024-03-12',
    status: 'pending',
    total: 28500,
    items: 2,
    ncf: 'B0100000002',
  },
  {
    id: 'FAC-003',
    client: 'Ana Martinez',
    date: '2024-02-10',
    dueDate: '2024-02-25',
    status: 'overdue',
    total: 125000,
    items: 5,
    ncf: 'B0100000003',
  },
  {
    id: 'FAC-004',
    client: 'Pedro Sanchez',
    date: '2024-02-05',
    dueDate: '2024-03-05',
    status: 'partial',
    total: 65000,
    items: 4,
    ncf: 'B0100000004',
  },
  {
    id: 'FAC-005',
    client: 'Laura Gomez',
    date: '2024-02-01',
    dueDate: '2024-03-01',
    status: 'cancelled',
    total: 15000,
    items: 1,
    ncf: 'B0100000005',
  },
]

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800', icon: FileText },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: 'Pagada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  partial: { label: 'Pago Parcial', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  overdue: { label: 'Vencida', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  cancelled: { label: 'Anulada', color: 'bg-gray-100 text-gray-800', icon: XCircle },
}

export default function FacturasPage() {
  const stats = {
    total: mockInvoices.length,
    pending: mockInvoices.filter(i => i.status === 'pending' || i.status === 'partial').length,
    overdue: mockInvoices.filter(i => i.status === 'overdue').length,
    totalPending: mockInvoices
      .filter(i => i.status === 'pending' || i.status === 'partial' || i.status === 'overdue')
      .reduce((acc, i) => acc + i.total, 0),
    totalPaid: mockInvoices
      .filter(i => i.status === 'paid')
      .reduce((acc, i) => acc + i.total, 0),
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
            <h1 className="text-2xl font-bold">Facturas</h1>
            <p className="text-muted-foreground">Gestiona facturas y comprobantes fiscales</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Link href="/facturacion/facturas/nueva">
            <Button>
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
            <p className="text-xs text-muted-foreground">este mes</p>
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
            <div className="text-2xl font-bold">RD${stats.totalPending.toLocaleString()}</div>
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
              <Input placeholder="Buscar por numero, cliente o NCF..." className="pl-10" />
            </div>
            <Select defaultValue="all">
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
              {mockInvoices.map((invoice) => {
                const status = statusConfig[invoice.status as keyof typeof statusConfig]
                const StatusIcon = status.icon
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell className="font-mono text-sm">{invoice.ncf}</TableCell>
                    <TableCell>{invoice.client}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString('es-DO')}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString('es-DO')}</TableCell>
                    <TableCell>RD${invoice.total.toLocaleString()}</TableCell>
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Anular factura</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
