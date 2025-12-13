'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  Edit,
  Trash2,
  BarChart3,
  DollarSign,
  Tag,
  Box,
  AlertTriangle,
  TrendingUp,
  Loader2,
  ShoppingCart,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { getProductById, deleteProduct, type ProductListItemData } from '@/actions/inventory'
import { formatCurrency } from '@/types/inventory'

export default function ProductoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState<ProductListItemData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await getProductById(productId)
        if (data) {
          setProduct(data)
        } else {
          toast.error('Producto no encontrado')
          router.push('/inventario')
        }
      } catch (error) {
        console.error('Error loading product:', error)
        toast.error('Error al cargar el producto')
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [productId, router])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteProduct(productId)
      if (result.success) {
        toast.success('Producto eliminado correctamente')
        router.push('/inventario')
      } else {
        toast.error(result.error || 'Error al eliminar el producto')
      }
    } catch (error) {
      toast.error('Error al eliminar el producto')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#A67C52]" />
      </div>
    )
  }

  if (!product) {
    return null
  }

  const costPrice = product.cost_price || 0
  const sellPrice = product.sell_price || 0
  const margin = costPrice > 0
    ? ((sellPrice - costPrice) / costPrice) * 100
    : 0

  const stockStatus = product.current_stock <= (product.min_stock || 0)
    ? 'critical'
    : product.current_stock <= (product.reorder_point || 5)
      ? 'low'
      : 'normal'

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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
              <Badge variant={product.is_active ? 'default' : 'secondary'}>
                {product.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              SKU: {product.sku || 'Sin SKU'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/inventario/productos/${productId}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar Producto</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion no se puede deshacer. El producto sera eliminado permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Actual</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{product.current_stock}</div>
            <div className="flex items-center gap-2 mt-1">
              {stockStatus === 'critical' && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Stock critico
                </Badge>
              )}
              {stockStatus === 'low' && (
                <Badge className="bg-amber-500 text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Stock bajo
                </Badge>
              )}
              {stockStatus === 'normal' && (
                <p className="text-xs text-muted-foreground">
                  Min: {product.min_stock || 0}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precio Costo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costPrice)}</div>
            <p className="text-xs text-muted-foreground">Por unidad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precio Venta</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#A67C52]">{formatCurrency(sellPrice)}</div>
            <p className="text-xs text-muted-foreground">ITBIS: {product.tax_rate || 0}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {margin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Ganancia: {formatCurrency(sellPrice - costPrice)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">
            <Package className="h-4 w-4 mr-2" />
            Detalles
          </TabsTrigger>
          <TabsTrigger value="stock">
            <BarChart3 className="h-4 w-4 mr-2" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Informacion del Producto</CardTitle>
              <CardDescription>Detalles generales del producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{product.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-medium">{product.sku || 'Sin SKU'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Codigo de Barras</p>
                  <p className="font-medium">{product.barcode || 'Sin codigo'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-medium">{product.category_name || 'Sin categoria'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant="outline">
                    {product.type === 'consumable' ? 'Consumible' : 'Venta'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Unidad</p>
                  <p className="font-medium">{product.unit}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Descripcion</p>
                <p>{product.description || 'Sin descripcion'}</p>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {product.is_sellable ? 'Disponible para venta' : 'No disponible para venta'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {product.track_stock ? 'Control de stock activo' : 'Sin control de stock'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {product.requires_lot_tracking ? 'Requiere lote' : 'No requiere lote'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Control de Inventario</CardTitle>
              <CardDescription>Configuracion y niveles de stock</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Stock Minimo</p>
                  <p className="text-2xl font-bold">{product.min_stock || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Stock Maximo</p>
                  <p className="text-2xl font-bold">{product.max_stock || '-'}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Punto de Reorden</p>
                  <p className="text-2xl font-bold">{product.reorder_point || 5}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Cantidad a Pedir</p>
                  <p className="text-2xl font-bold">{product.reorder_quantity || 10}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">Valor del Inventario</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor a Costo</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(product.current_stock * costPrice)}
                    </p>
                  </div>
                  <div className="p-4 bg-[#A67C52]/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor a Venta</p>
                    <p className="text-xl font-bold text-[#A67C52]">
                      {formatCurrency(product.current_stock * sellPrice)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
              <CardDescription>Registro de entradas y salidas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay movimientos registrados</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Los movimientos de inventario apareceran aqui
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
