'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, ArrowRightLeft, CheckCircle, Clock, XCircle, Eye, MoreHorizontal, Truck } from 'lucide-react'
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
  InventoryTransferData,
  TransferStats,
  BranchData,
  ProductListItemData,
  TransferStatus,
  createInventoryTransfer,
  updateTransferStatus,
  deleteInventoryTransfer,
} from '@/actions/inventory'

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_transit: { label: 'En Transito', color: 'bg-blue-100 text-blue-800', icon: Truck },
  received: { label: 'Recibida', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: XCircle },
}

interface TransferItem {
  product_id: string
  product_name: string
  quantity_requested: number
}

interface Props {
  initialTransfers: InventoryTransferData[]
  initialStats: TransferStats
  branches: BranchData[]
  products: ProductListItemData[]
}

export function TransferenciasClient({ initialTransfers, initialStats, branches, products }: Props) {
  const [transfers, setTransfers] = useState(initialTransfers)
  const [stats] = useState(initialStats)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<InventoryTransferData | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    from_branch_id: '',
    to_branch_id: '',
    notes: '',
  })
  const [transferItems, setTransferItems] = useState<TransferItem[]>([])
  const [newItemProductId, setNewItemProductId] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = transfer.transfer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.from_branch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_branch_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateTransfer = async () => {
    if (!formData.from_branch_id || !formData.to_branch_id) {
      toast.error('Selecciona origen y destino')
      return
    }
    if (formData.from_branch_id === formData.to_branch_id) {
      toast.error('El origen y destino no pueden ser iguales')
      return
    }
    if (transferItems.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }

    startTransition(async () => {
      const result = await createInventoryTransfer({
        from_branch_id: formData.from_branch_id,
        to_branch_id: formData.to_branch_id,
        notes: formData.notes || undefined,
        items: transferItems.map(item => ({
          product_id: item.product_id,
          quantity_requested: item.quantity_requested,
        })),
      })

      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        const fromBranch = branches.find(b => b.id === formData.from_branch_id)
        const toBranch = branches.find(b => b.id === formData.to_branch_id)
        setTransfers([{
          ...result.data,
          from_branch_name: fromBranch?.name || 'Origen',
          to_branch_name: toBranch?.name || 'Destino',
          items_count: transferItems.length,
        }, ...transfers])
        setShowCreateDialog(false)
        resetForm()
        toast.success('Transferencia creada exitosamente')
      }
    })
  }

  const handleStatusChange = async (transferId: string, newStatus: TransferStatus) => {
    startTransition(async () => {
      const result = await updateTransferStatus(transferId, newStatus)
      if (result.error) {
        toast.error(result.error)
      } else {
        setTransfers(transfers.map(t =>
          t.id === transferId ? { ...t, status: newStatus } : t
        ))
        toast.success('Estado actualizado')
      }
    })
  }

  const handleDeleteTransfer = async (transferId: string) => {
    startTransition(async () => {
      const result = await deleteInventoryTransfer(transferId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setTransfers(transfers.filter(t => t.id !== transferId))
        toast.success('Transferencia eliminada')
      }
    })
  }

  const addItem = () => {
    if (!newItemProductId || newItemQuantity <= 0) {
      toast.error('Selecciona un producto y cantidad valida')
      return
    }
    const product = products.find(p => p.id === newItemProductId)
    if (!product) return

    const existingIndex = transferItems.findIndex(i => i.product_id === newItemProductId)
    if (existingIndex >= 0) {
      toast.error('El producto ya esta en la lista')
      return
    }

    setTransferItems([...transferItems, {
      product_id: newItemProductId,
      product_name: product.name,
      quantity_requested: newItemQuantity,
    }])

    setNewItemProductId('')
    setNewItemQuantity(1)
  }

  const removeItem = (productId: string) => {
    setTransferItems(transferItems.filter(i => i.product_id !== productId))
  }

  const resetForm = () => {
    setFormData({ from_branch_id: '', to_branch_id: '', notes: '' })
    setTransferItems([])
    setNewItemProductId('')
    setNewItemQuantity(1)
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
            <h1 className="text-2xl font-bold">Transferencias</h1>
            <p className="text-muted-foreground">Gestiona transferencias entre ubicaciones</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Transferencia
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">transferencias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">por completar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Transito</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">en camino</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transferencias</CardTitle>
          <CardDescription>Todas las transferencias entre ubicaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar transferencia..."
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
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="in_transit">En Transito</SelectItem>
                <SelectItem value="received">Recibidas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredTransfers.length === 0 ? (
            <div className="text-center py-12">
              <ArrowRightLeft className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay transferencias</h3>
              <p className="text-muted-foreground">Crea tu primera transferencia</p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Transferencia
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer) => {
                  const status = statusConfig[transfer.status] || statusConfig.pending
                  const StatusIcon = status.icon
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.transfer_number}</TableCell>
                      <TableCell>{transfer.from_branch_name}</TableCell>
                      <TableCell>{transfer.to_branch_name}</TableCell>
                      <TableCell>{new Date(transfer.requested_at).toLocaleDateString('es-DO')}</TableCell>
                      <TableCell>{transfer.items_count || 0}</TableCell>
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
                              setSelectedTransfer(transfer)
                              setShowViewDialog(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            {transfer.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(transfer.id, 'in_transit')}>
                                  <Truck className="mr-2 h-4 w-4" />
                                  Marcar Enviada
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteTransfer(transfer.id)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                            {transfer.status === 'in_transit' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(transfer.id, 'received')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marcar Recibida
                              </DropdownMenuItem>
                            )}
                            {transfer.status !== 'cancelled' && transfer.status !== 'received' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleStatusChange(transfer.id, 'cancelled')}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancelar
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

      {/* Create Transfer Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Transferencia</DialogTitle>
            <DialogDescription>Crea una nueva transferencia entre sucursales</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origen *</Label>
                <Select
                  value={formData.from_branch_id}
                  onValueChange={(v) => setFormData({ ...formData, from_branch_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destino *</Label>
                <Select
                  value={formData.to_branch_id}
                  onValueChange={(v) => setFormData({ ...formData, to_branch_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales..."
              />
            </div>

            <div className="space-y-4">
              <Label>Productos a Transferir</Label>
              <div className="grid grid-cols-3 gap-2 items-end">
                <div className="col-span-2">
                  <Label className="text-xs">Producto</Label>
                  <Select value={newItemProductId} onValueChange={setNewItemProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} (Stock: {p.current_stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                  />
                </div>
              </div>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>

              {transferItems.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferItems.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity_requested}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeItem(item.product_id)}>
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm() }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTransfer} disabled={isPending}>
              {isPending ? 'Creando...' : 'Crear Transferencia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Transfer Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Transferencia {selectedTransfer?.transfer_number}</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Origen</Label>
                  <p className="font-medium">{selectedTransfer.from_branch_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Destino</Label>
                  <p className="font-medium">{selectedTransfer.to_branch_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge className={statusConfig[selectedTransfer.status]?.color || 'bg-gray-100'}>
                    {statusConfig[selectedTransfer.status]?.label || selectedTransfer.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Items</Label>
                  <p>{selectedTransfer.items_count || 0} productos</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Solicitud</Label>
                  <p>{new Date(selectedTransfer.requested_at).toLocaleDateString('es-DO')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Envio</Label>
                  <p>{selectedTransfer.shipped_at ? new Date(selectedTransfer.shipped_at).toLocaleDateString('es-DO') : '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Recepcion</Label>
                  <p>{selectedTransfer.received_at ? new Date(selectedTransfer.received_at).toLocaleDateString('es-DO') : '-'}</p>
                </div>
                {selectedTransfer.notes && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Notas</Label>
                    <p>{selectedTransfer.notes}</p>
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
