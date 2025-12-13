'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  Settings,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  PRODUCT_STATUS_OPTIONS,
  UNIT_OPTIONS,
  formatCurrency,
} from '@/types/inventory'
import { productSchema, ProductFormData } from '@/lib/validations/inventory'
import { toast } from 'sonner'
import {
  getProductById,
  getProductCategories,
  updateProduct,
  type ProductData,
  type ProductCategoryData,
} from '@/actions/inventory'

interface CategoryOption {
  id: string
  name: string
}

export default function EditarProductoPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [product, setProduct] = useState<ProductData | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [activeTab, setActiveTab] = useState('general')

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      categoryId: null,
      sku: '',
      barcode: null,
      name: '',
      description: null,
      brand: null,
      unit: 'unit',
      unitsPerPackage: 1,
      costPrice: 0,
      sellingPrice: 0,
      minStock: 0,
      maxStock: null,
      reorderPoint: 5,
      reorderQuantity: 10,
      trackLots: false,
      requiresPrescription: false,
      isConsumable: true,
      forSale: true,
      taxRate: 16,
      status: 'active',
      imageUrl: null,
      notes: null,
    },
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [productData, categoriesData] = await Promise.all([
          getProductById(productId),
          getProductCategories(),
        ])

        if (!productData) {
          toast.error('Producto no encontrado')
          router.push('/inventario')
          return
        }

        setProduct(productData)
        setCategories(
          categoriesData.map((c: ProductCategoryData) => ({
            id: c.id,
            name: c.name,
          }))
        )

        // Set form values
        const validUnits = ['unit', 'box', 'pack', 'ml', 'g', 'kg', 'l', 'cm', 'm'] as const
        type ValidUnit = typeof validUnits[number]
        const productUnit = validUnits.includes(productData.unit as ValidUnit)
          ? (productData.unit as ValidUnit)
          : 'unit'

        form.reset({
          categoryId: productData.category_id || null,
          sku: productData.sku || '',
          barcode: productData.barcode || null,
          name: productData.name,
          description: productData.description || null,
          brand: null,
          unit: productUnit,
          unitsPerPackage: 1,
          costPrice: productData.cost_price || 0,
          sellingPrice: productData.sell_price || 0,
          minStock: productData.min_stock || 0,
          maxStock: productData.max_stock || null,
          reorderPoint: productData.reorder_point || 5,
          reorderQuantity: productData.reorder_quantity || 10,
          trackLots: productData.requires_lot_tracking || false,
          requiresPrescription: false,
          isConsumable: productData.type === 'consumable',
          forSale: productData.is_sellable || true,
          taxRate: productData.tax_rate || 16,
          status: productData.is_active ? 'active' : 'inactive',
          imageUrl: productData.image_url || null,
          notes: null,
        })
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Error al cargar el producto')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [productId, router, form])

  const watchCostPrice = form.watch('costPrice')
  const watchSellingPrice = form.watch('sellingPrice')
  const margin =
    watchCostPrice > 0 ? ((watchSellingPrice - watchCostPrice) / watchCostPrice) * 100 : 0

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    toast.loading('Actualizando producto...', { id: 'update-product' })

    try {
      const result = await updateProduct(productId, {
        category_id: data.categoryId || undefined,
        sku: data.sku || undefined,
        barcode: data.barcode || undefined,
        name: data.name,
        description: data.description || undefined,
        type: data.isConsumable ? 'consumable' : 'retail',
        unit: data.unit,
        cost_price: data.costPrice,
        sell_price: data.sellingPrice,
        tax_rate: data.taxRate,
        track_stock: true,
        min_stock: data.minStock,
        max_stock: data.maxStock || undefined,
        reorder_point: data.reorderPoint,
        reorder_quantity: data.reorderQuantity,
        requires_lot_tracking: data.trackLots,
        is_active: data.status === 'active',
        is_sellable: data.forSale,
        image_url: data.imageUrl || undefined,
      })

      if (result.data && !result.error) {
        toast.dismiss('update-product')
        toast.success('Producto actualizado correctamente')
        router.push(`/inventario/productos/${productId}`)
      } else {
        toast.dismiss('update-product')
        toast.error(result.error || 'Error al actualizar el producto')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      toast.dismiss('update-product')
      toast.error('Error al actualizar el producto')
    } finally {
      setIsSubmitting(false)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/inventario/productos/${productId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Producto</h1>
            <p className="text-muted-foreground">{product.name}</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">
                <Package className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="pricing">
                <DollarSign className="h-4 w-4 mr-2" />
                Precios
              </TabsTrigger>
              <TabsTrigger value="inventory">
                <BarChart3 className="h-4 w-4 mr-2" />
                Inventario
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Opciones
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Informacion General</CardTitle>
                  <CardDescription>Datos basicos del producto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del producto *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Crema hidratante" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: CREMA-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad de medida</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {UNIT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripcion</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripcion del producto..."
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing">
              <Card>
                <CardHeader>
                  <CardTitle>Precios</CardTitle>
                  <CardDescription>Configuracion de precios y margenes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio de costo *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sellingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio de venta *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tasa de impuesto (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Margen de ganancia:</span>
                      <span className={`font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {margin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-muted-foreground">Ganancia por unidad:</span>
                      <span className="font-bold">
                        {formatCurrency(watchSellingPrice - watchCostPrice)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Control de Inventario</CardTitle>
                  <CardDescription>Niveles de stock y reorden</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="minStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock minimo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>Alerta cuando el stock baje de este nivel</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock maximo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseInt(e.target.value) : null)
                              }
                            />
                          </FormControl>
                          <FormDescription>Limite maximo de almacenamiento</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reorderPoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Punto de reorden</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>Cuando pedir mas stock</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reorderQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad a pedir</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormDescription>Cantidad sugerida para ordenes</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Opciones del Producto</CardTitle>
                  <CardDescription>Configuraciones adicionales</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRODUCT_STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="forSale"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Disponible para venta</FormLabel>
                            <FormDescription>
                              El producto puede venderse a clientes
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isConsumable"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Producto consumible</FormLabel>
                            <FormDescription>
                              Se usa internamente en tratamientos
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="trackLots"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Control de lotes</FormLabel>
                            <FormDescription>
                              Rastrear lotes y fechas de vencimiento
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" asChild>
              <Link href={`/inventario/productos/${productId}`}>Cancelar</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#A67C52] hover:bg-[#8a6543]"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
