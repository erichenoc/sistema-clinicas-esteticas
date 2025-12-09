'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar,
  Download,
  Filter,
  Pencil,
  Trash2,
  Plus,
  Save,
  X,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

// Mock data
const mockComisiones = [
  {
    id: '1',
    professionalId: '1',
    professionalName: 'Dra. Pamela Moquete',
    professionalAvatar: null,
    period: '2024-01',
    totalSales: 85000,
    commissionRate: 0.15,
    commissionAmount: 12750,
    sessionsCount: 45,
    status: 'paid',
    paidAt: '2024-02-05',
  },
  {
    id: '2',
    professionalId: '2',
    professionalName: 'Dra. Pamela Moquete',
    professionalAvatar: null,
    period: '2024-01',
    totalSales: 120000,
    commissionRate: 0.25,
    commissionAmount: 30000,
    sessionsCount: 32,
    status: 'paid',
    paidAt: '2024-02-05',
  },
  {
    id: '3',
    professionalId: '1',
    professionalName: 'Dra. Pamela Moquete',
    professionalAvatar: null,
    period: '2024-02',
    totalSales: 92000,
    commissionRate: 0.15,
    commissionAmount: 13800,
    sessionsCount: 52,
    status: 'pending',
    paidAt: null,
  },
  {
    id: '4',
    professionalId: '2',
    professionalName: 'Dra. Pamela Moquete',
    professionalAvatar: null,
    period: '2024-02',
    totalSales: 115000,
    commissionRate: 0.25,
    commissionAmount: 28750,
    sessionsCount: 28,
    status: 'pending',
    paidAt: null,
  },
  {
    id: '5',
    professionalId: '3',
    professionalName: 'Dra. Pamela Moquete',
    professionalAvatar: null,
    period: '2024-01',
    totalSales: 45000,
    commissionRate: 0.10,
    commissionAmount: 4500,
    sessionsCount: 30,
    status: 'paid',
    paidAt: '2024-02-05',
  },
]

const mockProfessionals = [
  { id: '1', name: 'Dra. Pamela Moquete', rate: 0.15 },
  { id: '2', name: 'Dra. Pamela Moquete', rate: 0.25 },
  { id: '3', name: 'Dra. Pamela Moquete', rate: 0.10 },
]

interface Comision {
  id: string
  professionalId: string
  professionalName: string
  professionalAvatar: string | null
  period: string
  totalSales: number
  commissionRate: number
  commissionAmount: number
  sessionsCount: number
  status: string
  paidAt: string | null
}

export default function ComisionesPage() {
  const [periodFilter, setPeriodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [professionalFilter, setProfessionalFilter] = useState('all')
  const [comisiones, setComisiones] = useState<Comision[]>(mockComisiones)
  const [editingComision, setEditingComision] = useState<Comision | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteComisionId, setDeleteComisionId] = useState<string | null>(null)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [newComision, setNewComision] = useState({
    professionalId: '',
    period: '',
    totalSales: '',
    commissionRate: '',
    sessionsCount: '',
  })

  const handleEditComision = (comision: Comision) => {
    setEditingComision({ ...comision })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingComision) return

    setComisiones(prev =>
      prev.map(c => c.id === editingComision.id ? {
        ...editingComision,
        commissionAmount: editingComision.totalSales * editingComision.commissionRate
      } : c)
    )
    setIsEditDialogOpen(false)
    setEditingComision(null)
    toast.success('Comision actualizada exitosamente')
  }

  const handleDeleteComision = (id: string) => {
    setComisiones(prev => prev.filter(c => c.id !== id))
    setDeleteComisionId(null)
    toast.success('Comision eliminada exitosamente')
  }

  const handlePayComision = (id: string) => {
    setComisiones(prev =>
      prev.map(c => c.id === id ? { ...c, status: 'paid', paidAt: new Date().toISOString().split('T')[0] } : c)
    )
    toast.success('Comision marcada como pagada')
  }

  const handleCreateComision = () => {
    const professional = mockProfessionals.find(p => p.id === newComision.professionalId)
    if (!professional) {
      toast.error('Seleccione un profesional')
      return
    }

    const totalSales = parseFloat(newComision.totalSales) || 0
    const commissionRate = parseFloat(newComision.commissionRate) / 100 || professional.rate

    const newEntry: Comision = {
      id: Date.now().toString(),
      professionalId: newComision.professionalId,
      professionalName: professional.name,
      professionalAvatar: null,
      period: newComision.period || new Date().toISOString().slice(0, 7),
      totalSales,
      commissionRate,
      commissionAmount: totalSales * commissionRate,
      sessionsCount: parseInt(newComision.sessionsCount) || 0,
      status: 'pending',
      paidAt: null,
    }

    setComisiones(prev => [newEntry, ...prev])
    setIsNewDialogOpen(false)
    setNewComision({ professionalId: '', period: '', totalSales: '', commissionRate: '', sessionsCount: '' })
    toast.success('Comision creada exitosamente')
  }

  const filteredComisiones = comisiones.filter((com) => {
    if (periodFilter !== 'all' && com.period !== periodFilter) return false
    if (statusFilter !== 'all' && com.status !== statusFilter) return false
    if (professionalFilter !== 'all' && com.professionalId !== professionalFilter) return false
    return true
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(price)
  }

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pagada</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case 'processing':
        return <Badge className="bg-blue-500">Procesando</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Stats
  const totalPending = comisiones
    .filter((c) => c.status === 'pending')
    .reduce((acc, c) => acc + c.commissionAmount, 0)
  const totalPaid = comisiones
    .filter((c) => c.status === 'paid')
    .reduce((acc, c) => acc + c.commissionAmount, 0)
  const pendingCount = comisiones.filter((c) => c.status === 'pending').length
  const totalSales = comisiones.reduce((acc, c) => acc + c.totalSales, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/profesionales">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Comisiones</h1>
            <p className="text-muted-foreground">
              Gestión y pago de comisiones al equipo
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Comision
          </Button>
          <Button>
            <CheckCircle className="mr-2 h-4 w-4" />
            Pagar Seleccionadas
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendientes de Pago
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {formatPrice(totalPending)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{pendingCount} comisiones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Pagadas Este Mes
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {formatPrice(totalPaid)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {mockComisiones.filter((c) => c.status === 'paid').length} pagos realizados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tasa Promedio
            </CardDescription>
            <CardTitle className="text-3xl">16.7%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">de comisión</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Generado
            </CardDescription>
            <CardTitle className="text-3xl">{formatPrice(totalSales)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">en ventas del equipo</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes
            <Badge variant="secondary" className="ml-2">
              {pendingCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="paid">Pagadas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row mb-4">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los períodos</SelectItem>
                <SelectItem value="2024-02">Febrero 2024</SelectItem>
                <SelectItem value="2024-01">Enero 2024</SelectItem>
                <SelectItem value="2023-12">Diciembre 2023</SelectItem>
              </SelectContent>
            </Select>
            <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Profesional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los profesionales</SelectItem>
                {mockProfessionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="paid">Pagadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Sesiones</TableHead>
                    <TableHead>Ventas</TableHead>
                    <TableHead>Tasa</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComisiones.map((comision) => (
                    <TableRow key={comision.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comision.professionalAvatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {comision.professionalName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{comision.professionalName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {formatPeriod(comision.period)}
                      </TableCell>
                      <TableCell>{comision.sessionsCount}</TableCell>
                      <TableCell>{formatPrice(comision.totalSales)}</TableCell>
                      <TableCell>{(comision.commissionRate * 100).toFixed(0)}%</TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(comision.commissionAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(comision.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {comision.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => handlePayComision(comision.id)}>
                              Pagar
                            </Button>
                          )}
                          {comision.status === 'paid' && comision.paidAt && (
                            <span className="text-xs text-muted-foreground mr-2">
                              {new Date(comision.paidAt).toLocaleDateString('es-MX')}
                            </span>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleEditComision(comision)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => setDeleteComisionId(comision.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Comisiones Pendientes</CardTitle>
              <CardDescription>
                Comisiones que requieren aprobación y pago
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comisiones
                  .filter((c) => c.status === 'pending')
                  .map((comision) => (
                    <div
                      key={comision.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {comision.professionalName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{comision.professionalName}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {formatPeriod(comision.period)} - {comision.sessionsCount} sesiones
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {formatPrice(comision.commissionAmount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {(comision.commissionRate * 100).toFixed(0)}% de{' '}
                            {formatPrice(comision.totalSales)}
                          </p>
                        </div>
                        <Button>Pagar</Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>Comisiones ya procesadas y pagadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha de Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comisiones
                    .filter((c) => c.status === 'paid')
                    .map((comision) => (
                      <TableRow key={comision.id}>
                        <TableCell>{comision.professionalName}</TableCell>
                        <TableCell className="capitalize">
                          {formatPeriod(comision.period)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(comision.commissionAmount)}
                        </TableCell>
                        <TableCell>
                          {comision.paidAt &&
                            new Date(comision.paidAt).toLocaleDateString('es-MX')}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para Nueva Comision */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Comision</DialogTitle>
            <DialogDescription>
              Crear una nueva comision para un profesional
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Profesional</Label>
              <Select
                value={newComision.professionalId}
                onValueChange={(value) => setNewComision(prev => ({ ...prev, professionalId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar profesional" />
                </SelectTrigger>
                <SelectContent>
                  {mockProfessionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name} ({(prof.rate * 100)}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Periodo</Label>
                <Input
                  type="month"
                  value={newComision.period}
                  onChange={(e) => setNewComision(prev => ({ ...prev, period: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Sesiones</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newComision.sessionsCount}
                  onChange={(e) => setNewComision(prev => ({ ...prev, sessionsCount: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ventas Totales (RD$)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newComision.totalSales}
                  onChange={(e) => setNewComision(prev => ({ ...prev, totalSales: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tasa de Comision (%)</Label>
                <Input
                  type="number"
                  placeholder="15"
                  value={newComision.commissionRate}
                  onChange={(e) => setNewComision(prev => ({ ...prev, commissionRate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateComision}>
              <Save className="h-4 w-4 mr-2" />
              Crear Comision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Comision */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Comision</DialogTitle>
            <DialogDescription>
              Modificar los datos de la comision de {editingComision?.professionalName}
            </DialogDescription>
          </DialogHeader>
          {editingComision && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Periodo</Label>
                  <Input
                    type="month"
                    value={editingComision.period}
                    onChange={(e) => setEditingComision(prev => prev ? { ...prev, period: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sesiones</Label>
                  <Input
                    type="number"
                    value={editingComision.sessionsCount}
                    onChange={(e) => setEditingComision(prev => prev ? { ...prev, sessionsCount: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ventas Totales (RD$)</Label>
                  <Input
                    type="number"
                    value={editingComision.totalSales}
                    onChange={(e) => setEditingComision(prev => prev ? { ...prev, totalSales: parseFloat(e.target.value) || 0 } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tasa de Comision (%)</Label>
                  <Input
                    type="number"
                    value={(editingComision.commissionRate * 100).toFixed(0)}
                    onChange={(e) => setEditingComision(prev => prev ? { ...prev, commissionRate: (parseFloat(e.target.value) || 0) / 100 } : null)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={editingComision.status}
                  onValueChange={(value) => setEditingComision(prev => prev ? { ...prev, status: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="paid">Pagada</SelectItem>
                    <SelectItem value="processing">Procesando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Comision calculada:</p>
                <p className="text-xl font-bold">
                  {formatPrice(editingComision.totalSales * editingComision.commissionRate)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para Eliminar */}
      <AlertDialog open={!!deleteComisionId} onOpenChange={() => setDeleteComisionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Comision</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Esta seguro que desea eliminar esta comision? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteComisionId && handleDeleteComision(deleteComisionId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
