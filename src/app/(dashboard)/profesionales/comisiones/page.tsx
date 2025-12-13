'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar,
  Download,
  Pencil,
  Trash2,
  Plus,
  Save,
  X,
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
import {
  getAllCommissionsWithProfessionals,
  createCommission,
  updateCommission,
  deleteCommission,
  type CommissionData,
} from '@/actions/professionals'

interface Professional {
  id: string
  name: string
  defaultRate: number
}

interface CommissionWithUI extends CommissionData {
  professionalName: string
  professionalAvatar?: string | null
}

export default function ComisionesPage() {
  const [periodFilter, setPeriodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [professionalFilter, setProfessionalFilter] = useState('all')
  const [comisiones, setComisiones] = useState<CommissionWithUI[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingComision, setEditingComision] = useState<CommissionWithUI | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteComisionId, setDeleteComisionId] = useState<string | null>(null)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [newComision, setNewComision] = useState({
    professionalId: '',
    period: '',
    totalSales: '',
    commissionRate: '',
    notes: '',
  })

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const { commissions, professionals: profs } = await getAllCommissionsWithProfessionals()

      // Map commissions to UI format
      const mappedCommissions: CommissionWithUI[] = commissions.map(c => ({
        ...c,
        professionalName: c.professional_name || 'Profesional',
        professionalAvatar: null,
      }))

      setComisiones(mappedCommissions)
      setProfessionals(profs)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar las comisiones')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditComision = (comision: CommissionWithUI) => {
    setEditingComision({ ...comision })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingComision) return

    setIsSaving(true)
    try {
      const result = await updateCommission(editingComision.id, {
        baseAmount: editingComision.base_amount,
        commissionRate: editingComision.commission_rate,
        periodStart: editingComision.period_start || undefined,
        periodEnd: editingComision.period_end || undefined,
        notes: editingComision.notes || undefined,
        status: editingComision.status,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      // Update local state
      setComisiones(prev =>
        prev.map(c => c.id === editingComision.id ? {
          ...editingComision,
          commission_amount: editingComision.base_amount * (editingComision.commission_rate / 100)
        } : c)
      )
      setIsEditDialogOpen(false)
      setEditingComision(null)
      toast.success('Comisión actualizada exitosamente')
    } catch (error) {
      console.error('Error saving commission:', error)
      toast.error('Error al guardar la comisión')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteComision = async (id: string) => {
    setIsSaving(true)
    try {
      const result = await deleteCommission(id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      setComisiones(prev => prev.filter(c => c.id !== id))
      setDeleteComisionId(null)
      toast.success('Comisión eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting commission:', error)
      toast.error('Error al eliminar la comisión')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePayComision = async (id: string) => {
    setIsSaving(true)
    try {
      const result = await updateCommission(id, { status: 'paid' })

      if (result.error) {
        toast.error(result.error)
        return
      }

      setComisiones(prev =>
        prev.map(c => c.id === id ? { ...c, status: 'paid', paid_at: new Date().toISOString() } : c)
      )
      toast.success('Comisión marcada como pagada')
    } catch (error) {
      console.error('Error updating commission:', error)
      toast.error('Error al marcar como pagada')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateComision = async () => {
    const professional = professionals.find(p => p.id === newComision.professionalId)
    if (!professional) {
      toast.error('Seleccione un profesional')
      return
    }

    const totalSales = parseFloat(newComision.totalSales) || 0
    const commissionRate = parseFloat(newComision.commissionRate) || professional.defaultRate

    if (totalSales <= 0) {
      toast.error('El monto de ventas debe ser mayor a 0')
      return
    }

    setIsSaving(true)
    try {
      const result = await createCommission({
        professionalId: newComision.professionalId,
        baseAmount: totalSales,
        commissionRate: commissionRate,
        periodStart: newComision.period ? `${newComision.period}-01` : undefined,
        periodEnd: newComision.period ? getLastDayOfMonth(newComision.period) : undefined,
        notes: newComision.notes || undefined,
        referenceType: 'manual',
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.data) {
        const newEntry: CommissionWithUI = {
          ...result.data,
          professionalName: professional.name,
          professionalAvatar: null,
        }
        setComisiones(prev => [newEntry, ...prev])
      }

      setIsNewDialogOpen(false)
      setNewComision({ professionalId: '', period: '', totalSales: '', commissionRate: '', notes: '' })
      toast.success('Comisión creada exitosamente')
    } catch (error) {
      console.error('Error creating commission:', error)
      toast.error('Error al crear la comisión')
    } finally {
      setIsSaving(false)
    }
  }

  // Helper function to get last day of month
  function getLastDayOfMonth(yearMonth: string): string {
    const [year, month] = yearMonth.split('-').map(Number)
    const lastDay = new Date(year, month, 0).getDate()
    return `${yearMonth}-${String(lastDay).padStart(2, '0')}`
  }

  // Get unique periods from commissions
  const uniquePeriods = Array.from(new Set(
    comisiones
      .filter(c => c.period_start)
      .map(c => c.period_start!.substring(0, 7))
  )).sort().reverse()

  const filteredComisiones = comisiones.filter((com) => {
    if (periodFilter !== 'all' && (!com.period_start || !com.period_start.startsWith(periodFilter))) return false
    if (statusFilter !== 'all' && com.status !== statusFilter) return false
    if (professionalFilter !== 'all' && com.professional_id !== professionalFilter) return false
    return true
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(price)
  }

  const formatPeriod = (period: string | null) => {
    if (!period) return 'Sin período'
    const [year, month] = period.substring(0, 7).split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pagada</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case 'approved':
        return <Badge className="bg-blue-500">Aprobada</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Stats
  const totalPending = comisiones
    .filter((c) => c.status === 'pending')
    .reduce((acc, c) => acc + (c.commission_amount || 0), 0)
  const totalPaid = comisiones
    .filter((c) => c.status === 'paid')
    .reduce((acc, c) => acc + (c.commission_amount || 0), 0)
  const pendingCount = comisiones.filter((c) => c.status === 'pending').length
  const totalSales = comisiones.reduce((acc, c) => acc + (c.base_amount || 0), 0)
  const avgRate = comisiones.length > 0
    ? comisiones.reduce((acc, c) => acc + (c.commission_rate || 0), 0) / comisiones.length
    : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

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
          <Button onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Comisión
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
              Pagadas
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {formatPrice(totalPaid)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {comisiones.filter((c) => c.status === 'paid').length} pagos realizados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tasa Promedio
            </CardDescription>
            <CardTitle className="text-3xl">{avgRate.toFixed(1)}%</CardTitle>
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
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount}
              </Badge>
            )}
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
                {uniquePeriods.map((period) => (
                  <SelectItem key={period} value={period}>
                    {formatPeriod(period + '-01')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Profesional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los profesionales</SelectItem>
                {professionals.map((prof) => (
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
                <SelectItem value="approved">Aprobadas</SelectItem>
                <SelectItem value="paid">Pagadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {filteredComisiones.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin comisiones</h3>
                  <p className="text-muted-foreground mb-4">
                    No hay comisiones registradas. Crea una nueva comisión para comenzar.
                  </p>
                  <Button onClick={() => setIsNewDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Comisión
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profesional</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Ventas</TableHead>
                      <TableHead>Tasa</TableHead>
                      <TableHead>Comisión</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[150px]"></TableHead>
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
                          {formatPeriod(comision.period_start)}
                        </TableCell>
                        <TableCell>{formatPrice(comision.base_amount || 0)}</TableCell>
                        <TableCell>{comision.commission_rate?.toFixed(0)}%</TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(comision.commission_amount || 0)}
                        </TableCell>
                        <TableCell>{getStatusBadge(comision.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {comision.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePayComision(comision.id)}
                                disabled={isSaving}
                              >
                                Pagar
                              </Button>
                            )}
                            {comision.status === 'paid' && comision.paid_at && (
                              <span className="text-xs text-muted-foreground mr-2">
                                {new Date(comision.paid_at).toLocaleDateString('es-MX')}
                              </span>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleEditComision(comision)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => setDeleteComisionId(comision.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
                            {formatPeriod(comision.period_start)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {formatPrice(comision.commission_amount || 0)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {comision.commission_rate?.toFixed(0)}% de{' '}
                            {formatPrice(comision.base_amount || 0)}
                          </p>
                        </div>
                        <Button
                          onClick={() => handlePayComision(comision.id)}
                          disabled={isSaving}
                        >
                          Pagar
                        </Button>
                      </div>
                    </div>
                  ))}
                {comisiones.filter(c => c.status === 'pending').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay comisiones pendientes
                  </div>
                )}
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
              {comisiones.filter(c => c.status === 'paid').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay comisiones pagadas
                </div>
              ) : (
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
                            {formatPeriod(comision.period_start)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(comision.commission_amount || 0)}
                          </TableCell>
                          <TableCell>
                            {comision.paid_at &&
                              new Date(comision.paid_at).toLocaleDateString('es-MX')}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para Nueva Comisión */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Comisión</DialogTitle>
            <DialogDescription>
              Crear una nueva comisión para un profesional
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Profesional</Label>
              <Select
                value={newComision.professionalId}
                onValueChange={(value) => {
                  const prof = professionals.find(p => p.id === value)
                  setNewComision(prev => ({
                    ...prev,
                    professionalId: value,
                    commissionRate: prof ? String(prof.defaultRate) : prev.commissionRate
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar profesional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name} ({prof.defaultRate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Período</Label>
                <Input
                  type="month"
                  value={newComision.period}
                  onChange={(e) => setNewComision(prev => ({ ...prev, period: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ventas Totales (RD$)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newComision.totalSales}
                  onChange={(e) => setNewComision(prev => ({ ...prev, totalSales: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tasa de Comisión (%)</Label>
                <Input
                  type="number"
                  placeholder="15"
                  value={newComision.commissionRate}
                  onChange={(e) => setNewComision(prev => ({ ...prev, commissionRate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Comisión Calculada</Label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center">
                  {formatPrice(
                    (parseFloat(newComision.totalSales) || 0) *
                    ((parseFloat(newComision.commissionRate) || 0) / 100)
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Input
                placeholder="Notas adicionales..."
                value={newComision.notes}
                onChange={(e) => setNewComision(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateComision} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Crear Comisión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Comisión */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Comisión</DialogTitle>
            <DialogDescription>
              Modificar los datos de la comisión de {editingComision?.professionalName}
            </DialogDescription>
          </DialogHeader>
          {editingComision && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Período Inicio</Label>
                  <Input
                    type="date"
                    value={editingComision.period_start?.split('T')[0] || ''}
                    onChange={(e) => setEditingComision(prev => prev ? { ...prev, period_start: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Período Fin</Label>
                  <Input
                    type="date"
                    value={editingComision.period_end?.split('T')[0] || ''}
                    onChange={(e) => setEditingComision(prev => prev ? { ...prev, period_end: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ventas Totales (RD$)</Label>
                  <Input
                    type="number"
                    value={editingComision.base_amount}
                    onChange={(e) => setEditingComision(prev => prev ? { ...prev, base_amount: parseFloat(e.target.value) || 0 } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tasa de Comisión (%)</Label>
                  <Input
                    type="number"
                    value={editingComision.commission_rate}
                    onChange={(e) => setEditingComision(prev => prev ? { ...prev, commission_rate: parseFloat(e.target.value) || 0 } : null)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={editingComision.status}
                  onValueChange={(value) => setEditingComision(prev => prev ? { ...prev, status: value as 'pending' | 'approved' | 'paid' | 'cancelled' | 'disputed' } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="approved">Aprobada</SelectItem>
                    <SelectItem value="paid">Pagada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Input
                  placeholder="Notas adicionales..."
                  value={editingComision.notes || ''}
                  onChange={(e) => setEditingComision(prev => prev ? { ...prev, notes: e.target.value } : null)}
                />
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Comisión calculada:</p>
                <p className="text-xl font-bold">
                  {formatPrice(editingComision.base_amount * (editingComision.commission_rate / 100))}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para Eliminar */}
      <AlertDialog open={!!deleteComisionId} onOpenChange={() => setDeleteComisionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Comisión</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar esta comisión? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteComisionId && handleDeleteComision(deleteComisionId)}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
