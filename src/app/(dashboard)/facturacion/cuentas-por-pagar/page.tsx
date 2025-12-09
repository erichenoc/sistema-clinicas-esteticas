'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  Search,
  Plus,
  Eye,
  Building2,
  FileText,
  MoreHorizontal,
  TrendingUp,
  CreditCard,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Label } from '@/components/ui/label'

// Mock data para cuentas por pagar
const mockCuentasPorPagar = [
  {
    id: '1',
    supplierName: 'MedSupplies RD',
    supplierRnc: '131234567',
    invoiceNumber: 'PROV-2024-001',
    concept: 'Insumos médicos - Ácido Hialurónico',
    category: 'insumos',
    totalAmount: 85000,
    paidAmount: 0,
    pendingAmount: 85000,
    dueDate: '2024-12-20',
    issueDate: '2024-11-20',
    status: 'pending',
    daysOverdue: 0,
    paymentMethod: 'transfer',
  },
  {
    id: '2',
    supplierName: 'Equipos Estéticos DR',
    supplierRnc: '131987654',
    invoiceNumber: 'PROV-2024-002',
    concept: 'Mantenimiento equipo HIFU',
    category: 'equipos',
    totalAmount: 45000,
    paidAmount: 0,
    pendingAmount: 45000,
    dueDate: '2024-12-01',
    issueDate: '2024-11-01',
    status: 'overdue',
    daysOverdue: 8,
    paymentMethod: 'check',
  },
  {
    id: '3',
    supplierName: 'EDESUR Dominicana',
    supplierRnc: '101234567',
    invoiceNumber: 'SERV-2024-001',
    concept: 'Servicio eléctrico - Noviembre',
    category: 'servicios',
    totalAmount: 28500,
    paidAmount: 28500,
    pendingAmount: 0,
    dueDate: '2024-12-10',
    issueDate: '2024-11-28',
    status: 'paid',
    daysOverdue: 0,
    paymentMethod: 'transfer',
  },
  {
    id: '4',
    supplierName: 'Claro RD',
    supplierRnc: '101876543',
    invoiceNumber: 'SERV-2024-002',
    concept: 'Internet y telefonía - Diciembre',
    category: 'servicios',
    totalAmount: 12500,
    paidAmount: 0,
    pendingAmount: 12500,
    dueDate: '2024-12-25',
    issueDate: '2024-12-01',
    status: 'pending',
    daysOverdue: 0,
    paymentMethod: 'autopay',
  },
  {
    id: '5',
    supplierName: 'Inmobiliaria Piantini',
    supplierRnc: '131555444',
    invoiceNumber: 'ALQ-2024-012',
    concept: 'Alquiler local comercial - Diciembre',
    category: 'alquiler',
    totalAmount: 95000,
    paidAmount: 0,
    pendingAmount: 95000,
    dueDate: '2024-12-05',
    issueDate: '2024-11-25',
    status: 'overdue',
    daysOverdue: 4,
    paymentMethod: 'transfer',
  },
  {
    id: '6',
    supplierName: 'Cosméticos Premium SRL',
    supplierRnc: '131333222',
    invoiceNumber: 'PROV-2024-003',
    concept: 'Productos skincare profesional',
    category: 'insumos',
    totalAmount: 35000,
    paidAmount: 35000,
    pendingAmount: 0,
    dueDate: '2024-11-30',
    issueDate: '2024-11-15',
    status: 'paid',
    daysOverdue: 0,
    paymentMethod: 'credit',
  },
]

const categoryIcons: Record<string, React.ReactNode> = {
  insumos: <FileText className="h-4 w-4" />,
  equipos: <Building2 className="h-4 w-4" />,
  servicios: <TrendingUp className="h-4 w-4" />,
  alquiler: <Building2 className="h-4 w-4" />,
}

const categoryLabels: Record<string, string> = {
  insumos: 'Insumos',
  equipos: 'Equipos',
  servicios: 'Servicios',
  alquiler: 'Alquiler',
}

export default function CuentasPorPagarPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCuentas = mockCuentasPorPagar.filter((cuenta) => {
    if (statusFilter !== 'all' && cuenta.status !== statusFilter) return false
    if (categoryFilter !== 'all' && cuenta.category !== categoryFilter) return false
    if (searchTerm && !cuenta.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !cuenta.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string, daysOverdue: number) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pagado</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case 'overdue':
        return (
          <Badge className="bg-red-500">
            Vencido ({daysOverdue}d)
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      transfer: 'Transferencia',
      check: 'Cheque',
      credit: 'Tarjeta de Crédito',
      cash: 'Efectivo',
      autopay: 'Pago Automático',
    }
    return labels[method] || method
  }

  // Estadísticas
  const totalPorPagar = mockCuentasPorPagar.reduce((acc, c) => acc + c.pendingAmount, 0)
  const totalVencido = mockCuentasPorPagar
    .filter((c) => c.status === 'overdue')
    .reduce((acc, c) => acc + c.pendingAmount, 0)
  const totalProximoVencer = mockCuentasPorPagar
    .filter((c) => c.status === 'pending')
    .reduce((acc, c) => acc + c.pendingAmount, 0)
  const cuentasVencidas = mockCuentasPorPagar.filter((c) => c.status === 'overdue').length

  // Gastos por categoría
  const gastosPorCategoria = mockCuentasPorPagar.reduce((acc, cuenta) => {
    if (!acc[cuenta.category]) {
      acc[cuenta.category] = 0
    }
    acc[cuenta.category] += cuenta.totalAmount
    return acc
  }, {} as Record<string, number>)

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
            <h1 className="text-2xl font-bold tracking-tight">Cuentas por Pagar</h1>
            <p className="text-muted-foreground">
              Gestión de pagos a proveedores y gastos operativos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Factura
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Registrar Factura de Proveedor</DialogTitle>
                <DialogDescription>
                  Agrega una nueva factura de proveedor al sistema
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Proveedor</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medsupplies">MedSupplies RD</SelectItem>
                      <SelectItem value="equipos">Equipos Estéticos DR</SelectItem>
                      <SelectItem value="cosmeticos">Cosméticos Premium SRL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invoice">No. Factura</Label>
                    <Input id="invoice" placeholder="PROV-2024-XXX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="insumos">Insumos</SelectItem>
                        <SelectItem value="equipos">Equipos</SelectItem>
                        <SelectItem value="servicios">Servicios</SelectItem>
                        <SelectItem value="alquiler">Alquiler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="concept">Concepto</Label>
                  <Input id="concept" placeholder="Descripción de la compra o servicio" />
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto (RD$)</Label>
                    <Input id="amount" type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                    <Input id="dueDate" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de Pago</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                      <SelectItem value="credit">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="cash">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Registrar Factura</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total por Pagar
            </CardDescription>
            <CardTitle className="text-3xl">{formatPrice(totalPorPagar)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {mockCuentasPorPagar.filter(c => c.pendingAmount > 0).length} facturas pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Pagos Vencidos
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">{formatPrice(totalVencido)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{cuentasVencidas} facturas vencidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Próximos a Vencer
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{formatPrice(totalProximoVencer)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Pagos pendientes este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Pagado Este Mes
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {formatPrice(mockCuentasPorPagar.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.totalAmount, 0))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {mockCuentasPorPagar.filter(c => c.status === 'paid').length} pagos realizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gastos por Categoría */}
      <div className="grid gap-4 sm:grid-cols-4">
        {Object.entries(gastosPorCategoria).map(([category, amount]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                {categoryIcons[category]}
                {categoryLabels[category]}
              </CardDescription>
              <CardTitle className="text-xl">{formatPrice(amount)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="overdue">
            Vencidas
            <Badge variant="destructive" className="ml-2">
              {cuentasVencidas}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">Por Pagar</TabsTrigger>
          <TabsTrigger value="paid">Pagadas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por proveedor o factura..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="insumos">Insumos</SelectItem>
                <SelectItem value="equipos">Equipos</SelectItem>
                <SelectItem value="servicios">Servicios</SelectItem>
                <SelectItem value="alquiler">Alquiler</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCuentas.map((cuenta) => (
                    <TableRow key={cuenta.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cuenta.supplierName}</p>
                          <p className="text-xs text-muted-foreground">
                            RNC: {cuenta.supplierRnc}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{cuenta.invoiceNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {categoryIcons[cuenta.category]}
                          {categoryLabels[cuenta.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {cuenta.concept}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(cuenta.pendingAmount)}
                      </TableCell>
                      <TableCell>{formatDate(cuenta.dueDate)}</TableCell>
                      <TableCell>
                        {getStatusBadge(cuenta.status, cuenta.daysOverdue)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Registrar pago
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Ver factura
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Facturas Vencidas</CardTitle>
              <CardDescription>
                Pagos que requieren atención inmediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCuentasPorPagar
                  .filter((c) => c.status === 'overdue')
                  .map((cuenta) => (
                    <div
                      key={cuenta.id}
                      className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950 dark:border-red-800"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{cuenta.supplierName}</p>
                          <p className="text-sm text-muted-foreground">
                            {cuenta.invoiceNumber} - Vencido hace {cuenta.daysOverdue} días
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg text-red-600">
                            {formatPrice(cuenta.pendingAmount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getPaymentMethodLabel(cuenta.paymentMethod)}
                          </p>
                        </div>
                        <Button size="sm">
                          Pagar Ahora
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagos Pendientes</CardTitle>
              <CardDescription>
                Facturas por pagar ordenadas por fecha de vencimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCuentasPorPagar
                    .filter((c) => c.status === 'pending')
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map((cuenta) => (
                      <TableRow key={cuenta.id}>
                        <TableCell className="font-medium">
                          {cuenta.supplierName}
                        </TableCell>
                        <TableCell>{cuenta.concept}</TableCell>
                        <TableCell>{formatPrice(cuenta.pendingAmount)}</TableCell>
                        <TableCell>{formatDate(cuenta.dueDate)}</TableCell>
                        <TableCell>{getPaymentMethodLabel(cuenta.paymentMethod)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Pagar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Pagos Realizados</CardTitle>
              <CardDescription>
                Historial de pagos completados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha de Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCuentasPorPagar
                    .filter((c) => c.status === 'paid')
                    .map((cuenta) => (
                      <TableRow key={cuenta.id}>
                        <TableCell className="font-medium">
                          {cuenta.supplierName}
                        </TableCell>
                        <TableCell>{cuenta.invoiceNumber}</TableCell>
                        <TableCell>{cuenta.concept}</TableCell>
                        <TableCell>{formatPrice(cuenta.totalAmount)}</TableCell>
                        <TableCell>{formatDate(cuenta.issueDate)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
