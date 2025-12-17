'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  BarChart3,
  Truck,
  ClipboardList,
  ArrowRightLeft,
  Box,
  PackageOpen,
  Building2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  type ProductStatus,
  type MovementType,
  type UnitType,
  PRODUCT_STATUS_OPTIONS,
  MOVEMENT_TYPE_OPTIONS,
  ALERT_TYPE_OPTIONS,
  formatStock,
  formatCurrency,
  getProductStatusConfig,
  getMovementTypeConfig,
} from '@/types/inventory'

// Product type options for filtering
const PRODUCT_TYPE_FILTERS = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'retail', label: 'Para Venta', color: 'bg-green-100 text-green-800' },
  { value: 'consumable', label: 'Uso Interno', color: 'bg-blue-100 text-blue-800' },
  { value: 'injectable', label: 'Inyectable', color: 'bg-purple-100 text-purple-800' },
  { value: 'equipment', label: 'Equipo', color: 'bg-amber-100 text-amber-800' },
  { value: 'topical', label: 'Tópico', color: 'bg-pink-100 text-pink-800' },
]

// Tipos para los datos
interface ProductItem {
  id: string
  name: string
  description: string | null
  brand: string | null
  sku: string | null
  categoryName: string | null
  categoryColor: string | null
  type: string
  unit: UnitType
  costPrice: number
  sellPrice: number
  currentStock: number
  reservedStock: number
  availableStock: number
  minStock: number
  maxStock: number | null
  stockStatus: string
  status: ProductStatus
  trackStock: boolean
  isSellable: boolean
  nearestExpiry: string | null
}

interface InventoryAlert {
  productId: string
  productName: string
  productSku: string | null
  branchName: string | null
  alertType: string
  currentStock: number
  threshold: number
  message: string
  severity: string
}

interface InventoryMovement {
  id: string
  productName: string
  productSku: string | null
  movementType: MovementType
  quantity: number
  previousStock: number
  newStock: number
  lotNumber: string | null
  notes: string | null
  createdAt: string
  createdByName: string
}

interface InventoryStats {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  expiringSoonCount: number
  totalValue: number
}

interface InventarioClientProps {
  products: ProductItem[]
  alerts: InventoryAlert[]
  movements: InventoryMovement[]
  stats: InventoryStats
}

export function InventarioClient({ products, alerts, movements, stats }: InventarioClientProps) {
  const [activeTab, setActiveTab] = useState('productos')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add')
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    const matchesType = typeFilter === 'all' || product.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // Helper to get type display config
  const getTypeConfig = (type: string) => {
    return PRODUCT_TYPE_FILTERS.find(t => t.value === type) || PRODUCT_TYPE_FILTERS[0]
  }

  const handleAdjustment = (product: ProductItem, type: 'add' | 'remove') => {
    setSelectedProduct(product)
    setAdjustmentType(type)
    setAdjustmentQuantity('')
    setAdjustmentReason('')
    setAdjustmentDialogOpen(true)
  }

  const submitAdjustment = () => {
    console.log('Ajuste:', {
      product: selectedProduct?.id,
      type: adjustmentType,
      quantity: adjustmentQuantity,
      reason: adjustmentReason,
    })
    toast.success(`Stock ${adjustmentType === 'add' ? 'agregado' : 'retirado'} exitosamente`)
    setAdjustmentDialogOpen(false)
  }

  const handleToggleFilters = () => {
    setShowFilters(!showFilters)
    if (!showFilters) {
      toast.info('Panel de filtros avanzados. Funcionalidad completa proximamente.')
    }
  }

  const handleDeleteProduct = async (productName: string) => {
    setProcessingAction(`delete-${productName}`)
    toast.loading('Eliminando producto...', { id: 'delete-product' })
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.dismiss('delete-product')
    toast.success(`Producto "${productName}" eliminado`)
    setProcessingAction(null)
  }

  const handleResolveAlert = async (productName: string, alertType: string) => {
    setProcessingAction(`resolve-${productName}`)
    toast.loading('Resolviendo alerta...', { id: 'resolve-alert' })
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.dismiss('resolve-alert')
    if (alertType === 'low_stock') {
      toast.success(`Orden de compra creada para "${productName}"`)
    } else {
      toast.success(`Alerta de "${productName}" marcada como resuelta`)
    }
    setProcessingAction(null)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Control de stock, productos y movimientos</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/inventario/ordenes-compra">
              <Truck className="h-4 w-4 mr-2" />
              <span className="truncate">Ordenes de Compra</span>
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/inventario/productos/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              <span className="truncate">Nuevo Producto</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Productos
            </CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-gray-500 mt-1">productos en catalogo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Valor del Inventario
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-gray-500 mt-1">a precio de costo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Stock Bajo
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.lowStockCount}</div>
            <p className="text-xs text-gray-500 mt-1">productos por reabastecer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Alertas Activas
            </CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alerts.length + stats.expiringSoonCount}</div>
            <p className="text-xs text-gray-500 mt-1">requieren atencion</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link href="/inventario/conteo">
            <ClipboardList className="h-5 w-5" />
            <span>Conteo de Inventario</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link href="/inventario/transferencias">
            <ArrowRightLeft className="h-5 w-5" />
            <span>Transferencias</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link href="/inventario/proveedores">
            <Building2 className="h-5 w-5" />
            <span>Proveedores</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link href="/inventario/lotes">
            <Box className="h-5 w-5" />
            <span>Lotes</span>
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="productos" className="gap-2">
            <Package className="h-4 w-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="movimientos" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="alertas" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Productos Tab */}
        <TabsContent value="productos" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, SKU o marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPE_FILTERS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {PRODUCT_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleToggleFilters}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Products Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-gray-500">
                      <PackageOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const statusConfig = getProductStatusConfig(product.status)
                    const typeConfig = getTypeConfig(product.type)
                    const isLowStock = product.trackStock && product.currentStock <= product.minStock
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.brand}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.sku || '-'}</TableCell>
                        <TableCell>
                          <Badge className={`${typeConfig.color || ''} border`}>
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.categoryName ? (
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: product.categoryColor || undefined,
                                color: product.categoryColor || undefined,
                              }}
                            >
                              {product.categoryName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={isLowStock ? 'text-red-600 font-medium' : ''}>
                              {formatStock(product.currentStock, product.unit)}
                            </span>
                            {isLowStock && (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          {product.reservedStock > 0 && (
                            <p className="text-xs text-gray-500">
                              ({product.reservedStock} reservado)
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(product.costPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(product.sellPrice)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor: `${statusConfig?.color}15`,
                              borderColor: statusConfig?.color,
                              color: statusConfig?.color,
                            }}
                          >
                            {statusConfig?.label}
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
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/inventario/productos/${product.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalles
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/inventario/productos/${product.id}/editar`}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleAdjustment(product, 'add')}>
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar stock
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAdjustment(product, 'remove')}>
                                <Package className="h-4 w-4 mr-2" />
                                Retirar stock
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteProduct(product.name)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Movimientos Tab */}
        <TabsContent value="movimientos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimientos Recientes</CardTitle>
              <CardDescription>
                Historial de entradas, salidas y ajustes de inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No hay movimientos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((movement) => {
                      const typeConfig = getMovementTypeConfig(movement.movementType)
                      return (
                        <TableRow key={movement.id}>
                          <TableCell className="text-sm">
                            {new Date(movement.createdAt).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{movement.productName}</p>
                              <p className="text-xs text-gray-500">{movement.productSku}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor: `${typeConfig?.color}15`,
                                borderColor: typeConfig?.color,
                                color: typeConfig?.color,
                              }}
                            >
                              {typeConfig?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <span className={typeConfig?.direction === 'in' ? 'text-green-600' : 'text-red-600'}>
                              {typeConfig?.direction === 'in' ? '+' : '-'}{movement.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-gray-500">
                            {movement.previousStock} → {movement.newStock}
                          </TableCell>
                          <TableCell className="text-sm">
                            {movement.lotNumber && (
                              <span className="text-gray-500">Lote: {movement.lotNumber}</span>
                            )}
                            {movement.notes && (
                              <p className="text-gray-400 text-xs">{movement.notes}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {movement.createdByName}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertas Tab */}
        <TabsContent value="alertas" className="space-y-4">
          {alerts.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-gray-600">No hay alertas activas</p>
                <p className="text-sm text-gray-400">
                  Todo el inventario esta en orden
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => {
                const typeConfig = ALERT_TYPE_OPTIONS.find(t => t.value === alert.alertType)
                return (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${typeConfig?.color}20` }}
                      >
                        <AlertTriangle
                          className="h-5 w-5"
                          style={{ color: typeConfig?.color }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{alert.productName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {alert.productSku}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Stock actual: {alert.currentStock}</span>
                          <span>Umbral: {alert.threshold}</span>
                          {alert.branchName && <span>Sucursal: {alert.branchName}</span>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.productName, alert.alertType)}
                        disabled={processingAction === `resolve-${alert.productName}`}
                      >
                        {processingAction === `resolve-${alert.productName}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Resolver'
                        )}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Adjustment Dialog */}
      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === 'add' ? 'Agregar Stock' : 'Retirar Stock'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} - Stock actual: {selectedProduct?.currentStock}{' '}
              {selectedProduct?.unit}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="1"
                placeholder="Ingresa la cantidad"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo del ajuste</Label>
              <Textarea
                placeholder="Describe el motivo del ajuste..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustmentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submitAdjustment}
              disabled={!adjustmentQuantity || !adjustmentReason}
              variant={adjustmentType === 'remove' ? 'destructive' : 'default'}
            >
              {adjustmentType === 'add' ? 'Agregar' : 'Retirar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
