'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, Eye, Truck, CheckCircle, XCircle, Clock, FileText, MoreHorizontal, Package } from 'lucide-react'
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
  PurchaseOrderData,
  PurchaseOrderStats,
  SupplierData,
  ProductListItemData,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  PurchaseOrderStatus,
} from '@/actions/inventory'

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800', icon: FileText },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Aprobada', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  ordered: { label: 'En Transito', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  partial: { label: 'Parcial', color: 'bg-orange-100 text-orange-800', icon: Package },
  received: { label: 'Recibida', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: XCircle },
}

interface OrderItem {
  product_id: string
  product_name: string
  quantity_ordered: number
  unit_cost: number
  discount_percent: number
  tax_rate: number
}

interface Props {
  initialOrders: PurchaseOrderData[]
  initialStats: PurchaseOrderStats
  suppliers: SupplierData[]
  products: ProductListItemData[]
}

export function OrdenesCompraClient({ initialOrders, initialStats, suppliers, products }: Props) {
  const [orders, setOrders] = useState(initialOrders)
  const [stats] = useState(initialStats)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderData | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_date: '',
    notes: '',
  })
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [newItemProductId, setNewItemProductId] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [newItemCost, setNewItemCost] = useState(0)

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateOrder = async () => {
    if (!formData.supplier_id) {
      toast.error('Selecciona un proveedor')
      return
    }
    if (orderItems.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }

    startTransition(async () => {
      const result = await createPurchaseOrder({
        supplier_id: formData.supplier_id,
        expected_date: formData.expected_date || undefined,
        notes: formData.notes || undefined,
        items: orderItems.map(item => ({
          product_id: item.product_id,
          quantity_ordered: item.quantity_ordered,
          unit_cost: item.unit_cost,
          discount_percent: item.discount_percent,
          tax_rate: item.tax_rate,
        })),
      })

      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        const supplier = suppliers.find(s => s.id === formData.supplier_id)
        setOrders([{
          ...result.data,
          supplier_name: supplier?.name || 'Sin proveedor',
          items_count: orderItems.length,
        }, ...orders])
        setShowCreateDialog(false)
        resetForm()
        toast.success('Orden creada exitosamente')
      }
    })
  }

  const handleStatusChange = async (orderId: string, newStatus: PurchaseOrderStatus) => {
    startTransition(async () => {
      const result = await updatePurchaseOrderStatus(orderId, newStatus)
      if (result.error) {
        toast.error(result.error)
      } else {
        setOrders(orders.map(o =>
          o.id === orderId ? { ...o, status: newStatus } : o
        ))
        toast.success('Estado actualizado')
      }
    })
  }

  const handleDeleteOrder = async (orderId: string) => {
    startTransition(async () => {
      const result = await deletePurchaseOrder(orderId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setOrders(orders.filter(o => o.id !== orderId))
        toast.success('Orden eliminada')
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

    const existingIndex = orderItems.findIndex(i => i.product_id === newItemProductId)
    if (existingIndex >= 0) {
      toast.error('El producto ya esta en la lista')
      return
    }

    setOrderItems([...orderItems, {
      product_id: newItemProductId,
      product_name: product.name,
      quantity_ordered: newItemQuantity,
      unit_cost: newItemCost || product.cost_price || 0,
      discount_percent: 0,
      tax_rate: 16,
    }])

    setNewItemProductId('')
    setNewItemQuantity(1)
    setNewItemCost(0)
  }

  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter(i => i.product_id !== productId))
  }

  const resetForm = () => {
    setFormData({ supplier_id: '', expected_date: '', notes: '' })
    setOrderItems([])
    setNewItemProductId('')
    setNewItemQuantity(1)
    setNewItemCost(0)
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const subtotal = item.quantity_ordered * item.unit_cost * (1 - item.discount_percent / 100)
      const tax = subtotal * (item.tax_rate / 100)
      return sum + subtotal + tax
    }, 0)
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
            <h1 className="text-2xl font-bold">Ordenes de Compra</h1>
            <p className="text-muted-foreground">Gestiona las ordenes de compra a proveedores</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Orden
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">ordenes por procesar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Transito</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">ordenes en camino</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.received}</div>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">en ordenes activas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Ordenes</CardTitle>
          <CardDescription>Todas las ordenes de compra registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por numero o proveedor..."
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
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="approved">Aprobadas</SelectItem>
                <SelectItem value="ordered">En Transito</SelectItem>
                <SelectItem value="received">Recibidas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay ordenes</h3>
              <p className="text-muted-foreground">Crea tu primera orden de compra</p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Orden
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Entrega Esperada</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending
                  const StatusIcon = status.icon
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.supplier_name}</TableCell>
                      <TableCell>{new Date(order.order_date).toLocaleDateString('es-DO')}</TableCell>
                      <TableCell>
                        {order.expected_date
                          ? new Date(order.expected_date).toLocaleDateString('es-DO')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{order.items_count || 0}</TableCell>
                      <TableCell>RD${order.total.toLocaleString()}</TableCell>
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
                              setSelectedOrder(order)
                              setShowViewDialog(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {order.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'approved')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Aprobar
                              </DropdownMenuItem>
                            )}
                            {order.status === 'approved' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'ordered')}>
                                <Truck className="mr-2 h-4 w-4" />
                                Marcar Enviada
                              </DropdownMenuItem>
                            )}
                            {(order.status === 'ordered' || order.status === 'partial') && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'received')}>
                                <Package className="mr-2 h-4 w-4" />
                                Marcar Recibida
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'cancelled' && order.status !== 'received' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleStatusChange(order.id, 'cancelled')}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancelar
                                </DropdownMenuItem>
                              </>
                            )}
                            {(order.status === 'draft' || order.status === 'cancelled') && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
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

      {/* Create Order Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Compra</DialogTitle>
            <DialogDescription>Crea una nueva orden de compra a un proveedor</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Proveedor *</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Entrega Esperada</Label>
                <Input
                  type="date"
                  value={formData.expected_date}
                  onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales para la orden..."
              />
            </div>

            <div className="space-y-4">
              <Label>Productos</Label>
              <div className="grid grid-cols-4 gap-2 items-end">
                <div className="col-span-2">
                  <Label className="text-xs">Producto</Label>
                  <Select value={newItemProductId} onValueChange={(v) => {
                    setNewItemProductId(v)
                    const product = products.find(p => p.id === v)
                    if (product) setNewItemCost(product.cost_price || 0)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                <div>
                  <Label className="text-xs">Costo Unit.</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(Number(e.target.value))}
                  />
                </div>
              </div>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>

              {orderItems.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Costo</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity_ordered}</TableCell>
                        <TableCell>RD${item.unit_cost.toLocaleString()}</TableCell>
                        <TableCell>RD${(item.quantity_ordered * item.unit_cost).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeItem(item.product_id)}>
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-bold">Total (con ITBIS):</TableCell>
                      <TableCell className="font-bold">RD${calculateTotal().toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm() }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOrder} disabled={isPending}>
              {isPending ? 'Creando...' : 'Crear Orden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Orden {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Proveedor</Label>
                  <p className="font-medium">{selectedOrder.supplier_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge className={statusConfig[selectedOrder.status]?.color || 'bg-gray-100'}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Orden</Label>
                  <p>{new Date(selectedOrder.order_date).toLocaleDateString('es-DO')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entrega Esperada</Label>
                  <p>{selectedOrder.expected_date ? new Date(selectedOrder.expected_date).toLocaleDateString('es-DO') : '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Subtotal</Label>
                  <p>RD${selectedOrder.subtotal.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ITBIS</Label>
                  <p>RD${selectedOrder.tax_amount.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Total</Label>
                  <p className="text-xl font-bold">RD${selectedOrder.total.toLocaleString()}</p>
                </div>
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Notas</Label>
                    <p>{selectedOrder.notes}</p>
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
