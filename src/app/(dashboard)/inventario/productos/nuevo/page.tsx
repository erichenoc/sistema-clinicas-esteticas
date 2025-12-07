'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Tag,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  PRODUCT_CATEGORY_OPTIONS,
  generateSKU,
  formatCurrency,
} from '@/types/inventory'
import { productSchema, ProductFormData } from '@/lib/validations/inventory'

// Mock categories
const mockCategories = [
  { id: 'cat-1', name: 'Consumibles' },
  { id: 'cat-2', name: 'Cosméticos' },
  { id: 'cat-3', name: 'Equipamiento' },
  { id: 'cat-4', name: 'Suplementos' },
]

export default function NuevoProductoPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const watchCostPrice = form.watch('costPrice')
  const watchSellingPrice = form.watch('sellingPrice')
  const margin = watchCostPrice > 0
    ? ((watchSellingPrice - watchCostPrice) / watchCostPrice) * 100
    : 0

  const handleGenerateSKU = () => {
    const name = form.getValues('name')
    const categoryId = form.getValues('categoryId')
    const category = mockCategories.find(c => c.id === categoryId)
    if (name && category) {
      const sku = generateSKU(name, category.name)
      form.setValue('sku', sku)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      console.log('Producto a crear:', data)
      // Simular creación
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/inventario')
    } catch (error) {
      console.error('Error al crear producto:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inventario">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
          <p className="text-gray-600">Registra un nuevo producto en el inventario</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="general" className="gap-2">
                <Package className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="precios" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Precios
              </TabsTrigger>
              <TabsTrigger value="stock" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Stock
              </TabsTrigger>
              <TabsTrigger value="configuracion" className="gap-2">
                <Settings className="h-4 w-4" />
                Config
              </TabsTrigger>
            </TabsList>

            {/* Tab General */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Datos principales del producto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Nombre del producto *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Botox 100U" {...field} />
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
                          <FormLabel>SKU *</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="CON-BOT-001"
                                {...field}
                                className="font-mono"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleGenerateSKU}
                            >
                              Generar
                            </Button>
                          </div>
                          <FormDescription>
                            Mayúsculas, números y guiones
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código de barras</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="7501234567890"
                              {...field}
                              value={field.value || ''}
                            />
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
                          <FormLabel>Categoría</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
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
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marca</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej: Allergan"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descripción detallada del producto..."
                              rows={3}
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Unidad de medida</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {UNIT_OPTIONS.map((unit) => (
                                <SelectItem key={unit.value} value={unit.value}>
                                  {unit.label} ({unit.abbreviation})
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
                      name="unitsPerPackage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidades por paquete</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormDescription>
                            Cuántas unidades vienen en cada compra
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Precios */}
            <TabsContent value="precios" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Precios y Costos</CardTitle>
                  <CardDescription>
                    Define los precios de compra y venta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio de costo *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="pl-8"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
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
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="pl-8"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {watchCostPrice > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Margen de ganancia</span>
                        <span className={`font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {margin.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">Ganancia por unidad</span>
                        <span className={`font-medium ${(watchSellingPrice - watchCostPrice) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(watchSellingPrice - watchCostPrice)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tasa de impuesto (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          IVA u otros impuestos aplicables
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Stock */}
            <TabsContent value="stock" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Control de Stock</CardTitle>
                  <CardDescription>
                    Configura los niveles de inventario
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock mínimo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Alerta cuando el stock baje de este nivel
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock máximo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Opcional - alerta de sobrestock
                          </FormDescription>
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
                          <FormDescription>
                            Sugiere reordenar al llegar a este nivel
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reorderQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad a reordenar</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormDescription>
                            Cantidad sugerida para la orden
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="trackLots"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Control de lotes</FormLabel>
                          <FormDescription>
                            Rastrear números de lote y fechas de vencimiento
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Configuración */}
            <TabsContent value="configuracion" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración del Producto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRODUCT_STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
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
                      name="isConsumable"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Consumible</FormLabel>
                            <FormDescription>
                              Se consume durante los tratamientos
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="forSale"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Disponible para venta</FormLabel>
                            <FormDescription>
                              Se puede vender directamente a pacientes
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requiresPrescription"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Requiere prescripción</FormLabel>
                            <FormDescription>
                              Solo puede ser aplicado por profesionales
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas internas</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas adicionales sobre el producto..."
                            rows={3}
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
          </Tabs>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/inventario">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Producto
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
