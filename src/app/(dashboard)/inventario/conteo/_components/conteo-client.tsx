'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, ClipboardList, CheckCircle, Clock, AlertTriangle, Eye, MoreHorizontal, XCircle, Play } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  InventoryCountData,
  InventoryCountStats,
  InventoryCountType,
  createInventoryCount,
  completeInventoryCount,
  deleteInventoryCount,
} from '@/actions/inventory'

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: Clock },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  approved: { label: 'Aprobado', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
}

const countTypeLabels: Record<InventoryCountType, string> = {
  full: 'Conteo Completo',
  partial: 'Conteo Parcial',
  cycle: 'Conteo Ciclico',
  spot: 'Conteo Puntual',
}

interface Props {
  initialCounts: InventoryCountData[]
  initialStats: InventoryCountStats
}

export function ConteoClient({ initialCounts, initialStats }: Props) {
  const [counts, setCounts] = useState(initialCounts)
  const [stats] = useState(initialStats)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedCount, setSelectedCount] = useState<InventoryCountData | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    count_type: 'full' as InventoryCountType,
    description: '',
  })

  const filteredCounts = counts.filter(count => {
    const matchesSearch = count.count_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      count.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || count.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateCount = async () => {
    startTransition(async () => {
      const result = await createInventoryCount({
        count_type: formData.count_type,
        description: formData.description || undefined,
      })

      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        setCounts([result.data, ...counts])
        setShowCreateDialog(false)
        setFormData({ count_type: 'full', description: '' })
        toast.success('Conteo creado exitosamente')
      }
    })
  }

  const handleCompleteCount = async (countId: string) => {
    startTransition(async () => {
      const result = await completeInventoryCount(countId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setCounts(counts.map(c =>
          c.id === countId ? { ...c, status: 'completed' as const } : c
        ))
        toast.success('Conteo completado')
      }
    })
  }

  const handleDeleteCount = async (countId: string) => {
    startTransition(async () => {
      const result = await deleteInventoryCount(countId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setCounts(counts.filter(c => c.id !== countId))
        toast.success('Conteo eliminado')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventario">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Conteo de Inventario</h1>
            <p className="text-muted-foreground">Realiza conteos fisicos y ajustes de inventario</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Conteo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">conteos activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">conteos terminados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diferencia Total</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD${Math.abs(stats.totalDifference).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">en ajustes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ultimo Conteo</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastCountDate
                ? new Date(stats.lastCountDate).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' })
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">fecha de ultimo conteo</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Conteos</CardTitle>
          <CardDescription>Todos los conteos de inventario realizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar conteo..."
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
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="approved">Aprobados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredCounts.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay conteos</h3>
              <p className="text-muted-foreground">Inicia tu primer conteo de inventario</p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Conteo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Contados</TableHead>
                  <TableHead>Diferencias</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCounts.map((count) => {
                  const status = statusConfig[count.status] || statusConfig.in_progress
                  const StatusIcon = status.icon
                  return (
                    <TableRow key={count.id}>
                      <TableCell className="font-medium">{count.count_number}</TableCell>
                      <TableCell>{countTypeLabels[count.count_type]}</TableCell>
                      <TableCell>{count.description || '-'}</TableCell>
                      <TableCell>{new Date(count.started_at).toLocaleDateString('es-DO')}</TableCell>
                      <TableCell>{count.total_items}</TableCell>
                      <TableCell>{count.items_counted}</TableCell>
                      <TableCell>
                        {count.items_with_difference > 0 ? (
                          <span className="text-yellow-600 font-medium">{count.items_with_difference}</span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
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
                            <DropdownMenuItem onClick={() => {
                              setSelectedCount(count)
                              setShowViewDialog(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            {count.status === 'in_progress' && (
                              <>
                                <DropdownMenuItem onClick={() => handleCompleteCount(count.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Completar Conteo
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteCount(count.id)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Eliminar
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

      {/* Create Count Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Conteo de Inventario</DialogTitle>
            <DialogDescription>Inicia un nuevo conteo fisico de inventario</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Conteo *</Label>
              <Select
                value={formData.count_type}
                onValueChange={(v) => setFormData({ ...formData, count_type: v as InventoryCountType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Conteo Completo - Todos los productos</SelectItem>
                  <SelectItem value="partial">Conteo Parcial - Categoria especifica</SelectItem>
                  <SelectItem value="cycle">Conteo Ciclico - Rotacion periodica</SelectItem>
                  <SelectItem value="spot">Conteo Puntual - Verificacion rapida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripcion del conteo..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCount} disabled={isPending}>
              <Play className="mr-2 h-4 w-4" />
              {isPending ? 'Iniciando...' : 'Iniciar Conteo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Count Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Conteo {selectedCount?.count_number}</DialogTitle>
          </DialogHeader>
          {selectedCount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="font-medium">{countTypeLabels[selectedCount.count_type]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge className={statusConfig[selectedCount.status]?.color || 'bg-gray-100'}>
                    {statusConfig[selectedCount.status]?.label || selectedCount.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Inicio</Label>
                  <p>{new Date(selectedCount.started_at).toLocaleDateString('es-DO')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Finalizacion</Label>
                  <p>{selectedCount.completed_at ? new Date(selectedCount.completed_at).toLocaleDateString('es-DO') : '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Items</Label>
                  <p>{selectedCount.total_items}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Items Contados</Label>
                  <p>{selectedCount.items_counted}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Items con Diferencia</Label>
                  <p className={selectedCount.items_with_difference > 0 ? 'text-yellow-600 font-medium' : ''}>
                    {selectedCount.items_with_difference}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Diferencia de Valor</Label>
                  <p className={selectedCount.total_difference_value !== 0 ? 'text-yellow-600 font-medium' : ''}>
                    RD${selectedCount.total_difference_value.toLocaleString()}
                  </p>
                </div>
                {selectedCount.description && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Descripcion</Label>
                    <p>{selectedCount.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
