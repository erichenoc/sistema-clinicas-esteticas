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
  Building2
} from 'lucide-react'
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
  ProductWithStock,
  InventoryAlert,
  InventoryMovementWithDetails,
  PRODUCT_STATUS_OPTIONS,
  MOVEMENT_TYPE_OPTIONS,
  ALERT_TYPE_OPTIONS,
  formatStock,
  formatCurrency,
  getProductStatusConfig,
  getMovementTypeConfig,
} from '@/types/inventory'

// Mock data
const mockProducts: ProductWithStock[] = [
  {
    id: '1',
    clinicId: 'clinic-1',
    categoryId: 'cat-1',
    categoryName: 'Consumibles',
    sku: 'CON-BOT-001',
    barcode: '7501234567890',
    name: 'Botox 100U',
    description: 'Toxina botulínica tipo A',
    brand: 'Allergan',
    unit: 'unit',
    unitsPerPackage: 1,
    costPrice: 3500,
    sellingPrice: 5500,
    minStock: 5,
    maxStock: 50,
    reorderPoint: 10,
    reorderQuantity: 20,
    trackLots: true,
    requiresPrescription: true,
    isConsumable: true,
    forSale: false,
    taxRate: 0,
    status: 'active',
    imageUrl: null,
    notes: null,
    currentStock: 15,
    reservedStock: 2,
    availableStock: 13,
    stockValue: 52500,
    lastPurchaseDate: '2024-01-15',
    lastPurchasePrice: 3400,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
  },
  {
    id: '2',
    clinicId: 'clinic-1',
    categoryId: 'cat-1',
    categoryName: 'Consumibles',
    sku: 'CON-ACI-001',
    barcode: null,
    name: 'Ácido Hialurónico 1ml',
    description: 'Relleno dérmico ácido hialurónico',
    brand: 'Juvederm',
    unit: 'unit',
    unitsPerPackage: 1,
    costPrice: 2800,
    sellingPrice: 4500,
    minStock: 10,
    maxStock: 100,
    reorderPoint: 20,
    reorderQuantity: 30,
    trackLots: true,
    requiresPrescription: true,
    isConsumable: true,
    forSale: false,
    taxRate: 0,
    status: 'active',
    imageUrl: null,
    notes: null,
    currentStock: 8,
    reservedStock: 0,
    availableStock: 8,
    stockValue: 22400,
    lastPurchaseDate: '2024-01-10',
    lastPurchasePrice: 2750,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-10',
  },
  {
    id: '3',
    clinicId: 'clinic-1',
    categoryId: 'cat-2',
    categoryName: 'Cosméticos',
    sku: 'COS-CRE-001',
    barcode: '7502345678901',
    name: 'Crema Hidratante Post-tratamiento',
    description: 'Crema hidratante especial post procedimientos',
    brand: 'SkinMed',
    unit: 'unit',
    unitsPerPackage: 1,
    costPrice: 450,
    sellingPrice: 850,
    minStock: 20,
    maxStock: 200,
    reorderPoint: 40,
    reorderQuantity: 50,
    trackLots: false,
    requiresPrescription: false,
    isConsumable: false,
    forSale: true,
    taxRate: 16,
    status: 'active',
    imageUrl: null,
    notes: null,
    currentStock: 45,
    reservedStock: 0,
    availableStock: 45,
    stockValue: 20250,
    lastPurchaseDate: '2024-01-12',
    lastPurchasePrice: 440,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-12',
  },
]

const mockAlerts: InventoryAlert[] = [
  {
    productId: '2',
    productName: 'Ácido Hialurónico 1ml',
    productSku: 'CON-ACI-001',
    branchId: null,
    branchName: 'Principal',
    alertType: 'low_stock',
    currentStock: 8,
    threshold: 10,
    message: 'Stock por debajo del mínimo',
    severity: 'high',
    createdAt: new Date().toISOString(),
  },
  {
    productId: '4',
    productName: 'Vitamina C Serum',
    productSku: 'COS-SER-001',
    branchId: null,
    branchName: 'Principal',
    alertType: 'expiring_soon',
    currentStock: 12,
    threshold: 30,
    message: 'Vence en 25 días',
    severity: 'medium',
    createdAt: new Date().toISOString(),
  },
]

const mockMovements: InventoryMovementWithDetails[] = [
  {
    id: '1',
    clinicId: 'clinic-1',
    branchId: null,
    productId: '1',
    productName: 'Botox 100U',
    productSku: 'CON-BOT-001',
    lotId: 'lot-1',
    lotNumber: 'LOT-2024-001',
    movementType: 'purchase',
    quantity: 20,
    previousStock: 0,
    newStock: 20,
    unitCost: 3400,
    totalCost: 68000,
    referenceType: 'purchase_order',
    referenceId: 'po-1',
    reason: 'Compra inicial',
    notes: null,
    createdAt: '2024-01-15T10:30:00Z',
    createdBy: 'user-1',
    createdByName: 'Admin',
  },
  {
    id: '2',
    clinicId: 'clinic-1',
    branchId: null,
    productId: '1',
    productName: 'Botox 100U',
    productSku: 'CON-BOT-001',
    lotId: 'lot-1',
    lotNumber: 'LOT-2024-001',
    movementType: 'sale',
    quantity: 5,
    previousStock: 20,
    newStock: 15,
    unitCost: 3500,
    totalCost: 17500,
    referenceType: 'session',
    referenceId: 'session-1',
    reason: null,
    notes: 'Sesión de botox facial',
    createdAt: '2024-01-16T14:00:00Z',
    createdBy: 'user-2',
    createdByName: 'Dra. García',
  },
]

export default function InventarioPage() {
  const [activeTab, setActiveTab] = useState('productos')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add')
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')

  // Stats
  const totalProducts = mockProducts.length
  const totalValue = mockProducts.reduce((acc, p) => acc + p.stockValue, 0)
  const lowStockCount = mockProducts.filter(p => p.currentStock <= p.minStock).length
  const alertsCount = mockAlerts.length

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAdjustment = (product: ProductWithStock, type: 'add' | 'remove') => {
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
    setAdjustmentDialogOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">Control de stock, productos y movimientos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventario/ordenes-compra">
              <Truck className="h-4 w-4 mr-2" />
              Órdenes de Compra
            </Link>
          </Button>
          <Button asChild>
            <Link href="/inventario/productos/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
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
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-gray-500 mt-1">productos en catálogo</p>
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
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
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
            <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
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
            <div className="text-2xl font-bold text-red-600">{alertsCount}</div>
            <p className="text-xs text-gray-500 mt-1">requieren atención</p>
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
            {alertsCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {alertsCount}
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
            <Button variant="outline" size="icon">
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
                  <TableHead>Categoría</TableHead>
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
                    <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                      <PackageOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const statusConfig = getProductStatusConfig(product.status)
                    const isLowStock = product.currentStock <= product.minStock
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.brand}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>{product.categoryName}</TableCell>
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
                          {formatCurrency(product.sellingPrice)}
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
                              <DropdownMenuItem className="text-red-600">
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
                  {mockMovements.map((movement) => {
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
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertas Tab */}
        <TabsContent value="alertas" className="space-y-4">
          {mockAlerts.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-gray-600">No hay alertas activas</p>
                <p className="text-sm text-gray-400">
                  Todo el inventario está en orden
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {mockAlerts.map((alert, index) => {
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
                      <Button size="sm" variant="outline">
                        Resolver
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
