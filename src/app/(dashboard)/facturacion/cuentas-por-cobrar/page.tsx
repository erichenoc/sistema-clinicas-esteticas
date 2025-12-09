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
  Filter,
  Search,
  Plus,
  Eye,
  Mail,
  Phone,
  MoreHorizontal,
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
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Mock data para cuentas por cobrar
const mockCuentasPorCobrar = [
  {
    id: '1',
    patientName: 'María García Pérez',
    patientPhone: '809-555-1234',
    patientEmail: 'maria@email.com',
    invoiceNumber: 'FAC-2024-001',
    concept: 'Paquete Rejuvenecimiento Facial',
    totalAmount: 45000,
    paidAmount: 15000,
    pendingAmount: 30000,
    dueDate: '2024-12-15',
    issueDate: '2024-11-15',
    status: 'partial',
    daysOverdue: 0,
    paymentPlan: true,
    installments: 3,
    currentInstallment: 1,
  },
  {
    id: '2',
    patientName: 'Carmen Rodríguez Luna',
    patientPhone: '829-555-5678',
    patientEmail: 'carmen@email.com',
    invoiceNumber: 'FAC-2024-002',
    concept: 'Tratamiento Corporal Integral',
    totalAmount: 28000,
    paidAmount: 0,
    pendingAmount: 28000,
    dueDate: '2024-12-01',
    issueDate: '2024-11-01',
    status: 'overdue',
    daysOverdue: 8,
    paymentPlan: false,
    installments: 1,
    currentInstallment: 1,
  },
  {
    id: '3',
    patientName: 'Ana Martínez Silva',
    patientPhone: '809-555-9012',
    patientEmail: 'ana@email.com',
    invoiceNumber: 'FAC-2024-003',
    concept: 'Sesión HIFU Facial',
    totalAmount: 15000,
    paidAmount: 15000,
    pendingAmount: 0,
    dueDate: '2024-12-20',
    issueDate: '2024-12-01',
    status: 'paid',
    daysOverdue: 0,
    paymentPlan: false,
    installments: 1,
    currentInstallment: 1,
  },
  {
    id: '4',
    patientName: 'Laura Sánchez Díaz',
    patientPhone: '849-555-3456',
    patientEmail: 'laura@email.com',
    invoiceNumber: 'FAC-2024-004',
    concept: 'Rellenos Faciales + Botox',
    totalAmount: 22000,
    paidAmount: 11000,
    pendingAmount: 11000,
    dueDate: '2024-12-25',
    issueDate: '2024-11-25',
    status: 'partial',
    daysOverdue: 0,
    paymentPlan: true,
    installments: 2,
    currentInstallment: 2,
  },
  {
    id: '5',
    patientName: 'Patricia López Hernández',
    patientPhone: '809-555-7890',
    patientEmail: 'patricia@email.com',
    invoiceNumber: 'FAC-2024-005',
    concept: 'Lipoláser + Radiofrecuencia',
    totalAmount: 35000,
    paidAmount: 0,
    pendingAmount: 35000,
    dueDate: '2024-11-20',
    issueDate: '2024-10-20',
    status: 'overdue',
    daysOverdue: 19,
    paymentPlan: false,
    installments: 1,
    currentInstallment: 1,
  },
]

export default function CuentasPorCobrarPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCuentas = mockCuentasPorCobrar.filter((cuenta) => {
    if (statusFilter !== 'all' && cuenta.status !== statusFilter) return false
    if (searchTerm && !cuenta.patientName.toLowerCase().includes(searchTerm.toLowerCase()) &&
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
      case 'partial':
        return <Badge className="bg-blue-500">Parcial</Badge>
      case 'overdue':
        return (
          <Badge className="bg-red-500">
            Vencido ({daysOverdue}d)
          </Badge>
        )
      case 'pending':
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Estadísticas
  const totalPorCobrar = mockCuentasPorCobrar.reduce((acc, c) => acc + c.pendingAmount, 0)
  const totalVencido = mockCuentasPorCobrar
    .filter((c) => c.status === 'overdue')
    .reduce((acc, c) => acc + c.pendingAmount, 0)
  const totalParcial = mockCuentasPorCobrar
    .filter((c) => c.status === 'partial')
    .reduce((acc, c) => acc + c.pendingAmount, 0)
  const cuentasVencidas = mockCuentasPorCobrar.filter((c) => c.status === 'overdue').length

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
              Gestión de pagos pendientes de pacientes
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Pago
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total por Cobrar
            </CardDescription>
            <CardTitle className="text-3xl">{formatPrice(totalPorCobrar)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {mockCuentasPorCobrar.filter(c => c.pendingAmount > 0).length} cuentas pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Saldo Vencido
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
              <Clock className="h-4 w-4 text-blue-500" />
              Pagos Parciales
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">{formatPrice(totalParcial)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {mockCuentasPorCobrar.filter(c => c.status === 'partial').length} planes de pago activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Tasa de Cobro
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">72%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={72} className="h-2" />
          </CardContent>
        </Card>
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
          <TabsTrigger value="partial">En Plan de Pago</TabsTrigger>
          <TabsTrigger value="paid">Pagadas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente o factura..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el tiempo</SelectItem>
                <SelectItem value="this-month">Este mes</SelectItem>
                <SelectItem value="last-month">Mes pasado</SelectItem>
                <SelectItem value="this-year">Este año</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Pendiente</TableHead>
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
                          <p className="font-medium">{cuenta.patientName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {cuenta.patientPhone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/facturacion/facturas/${cuenta.id}`}
                          className="text-primary hover:underline"
                        >
                          {cuenta.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {cuenta.concept}
                      </TableCell>
                      <TableCell>{formatPrice(cuenta.totalAmount)}</TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(cuenta.pendingAmount)}
                        {cuenta.paymentPlan && (
                          <p className="text-xs text-muted-foreground">
                            Cuota {cuenta.currentInstallment}/{cuenta.installments}
                          </p>
                        )}
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
                              <DollarSign className="mr-2 h-4 w-4" />
                              Registrar pago
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Enviar recordatorio
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="mr-2 h-4 w-4" />
                              Contactar
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
                Estas facturas requieren atención inmediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCuentasPorCobrar
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
                          <p className="font-medium">{cuenta.patientName}</p>
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
                            Vencimiento: {formatDate(cuenta.dueDate)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button size="sm">
                            Registrar Pago
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partial" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Planes de Pago Activos</CardTitle>
              <CardDescription>
                Pacientes con pagos en cuotas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCuentasPorCobrar
                  .filter((c) => c.paymentPlan)
                  .map((cuenta) => {
                    const progress = (cuenta.paidAmount / cuenta.totalAmount) * 100
                    return (
                      <div
                        key={cuenta.id}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-medium">{cuenta.patientName}</p>
                            <p className="text-sm text-muted-foreground">
                              {cuenta.concept}
                            </p>
                          </div>
                          <Badge variant="outline">
                            Cuota {cuenta.currentInstallment} de {cuenta.installments}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progreso de pago</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Pagado: {formatPrice(cuenta.paidAmount)}</span>
                            <span>Pendiente: {formatPrice(cuenta.pendingAmount)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                          <span className="text-sm text-muted-foreground">
                            Próximo pago: {formatDate(cuenta.dueDate)}
                          </span>
                          <Button size="sm">Registrar Cuota</Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Facturas Pagadas</CardTitle>
              <CardDescription>
                Historial de pagos completados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha de Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCuentasPorCobrar
                    .filter((c) => c.status === 'paid')
                    .map((cuenta) => (
                      <TableRow key={cuenta.id}>
                        <TableCell className="font-medium">
                          {cuenta.patientName}
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
