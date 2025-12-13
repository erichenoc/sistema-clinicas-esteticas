'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Package,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  Percent,
  Search,
  Loader2,
  Gift,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getTreatments } from '@/actions/treatments'

interface Treatment {
  id: string
  name: string
  price: number
  duration: number
  category: string
}

interface PackageItem {
  id: string
  treatmentId: string
  treatmentName: string
  quantity: number
  unitPrice: number
}

// Mock treatments (will be replaced with real data)
const mockTreatments: Treatment[] = [
  { id: '1', name: 'Limpieza Facial Profunda', price: 3000, duration: 60, category: 'Facial' },
  { id: '2', name: 'Botox', price: 25000, duration: 45, category: 'Facial' },
  { id: '3', name: 'Radiofrecuencia Facial', price: 4000, duration: 45, category: 'Facial' },
  { id: '4', name: 'Mesoterapia Facial', price: 4500, duration: 30, category: 'Facial' },
  { id: '5', name: 'Drenaje Linfatico', price: 2800, duration: 60, category: 'Corporal' },
]

function NuevoPaqueteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTreatmentId = searchParams.get('treatmentId')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [treatments, setTreatments] = useState<Treatment[]>(mockTreatments)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 15,
    validityDays: 90,
    isActive: true,
  })

  const [items, setItems] = useState<PackageItem[]>([])

  useEffect(() => {
    // If we have an initial treatment, add it
    if (initialTreatmentId) {
      const treatment = mockTreatments.find((t) => t.id === initialTreatmentId)
      if (treatment) {
        setItems([
          {
            id: Date.now().toString(),
            treatmentId: treatment.id,
            treatmentName: treatment.name,
            quantity: 1,
            unitPrice: treatment.price,
          },
        ])
      }
    }
  }, [initialTreatmentId])

  const addItem = (treatment: Treatment) => {
    // Check if already added
    const existing = items.find((i) => i.treatmentId === treatment.id)
    if (existing) {
      // Increase quantity
      setItems(
        items.map((i) =>
          i.treatmentId === treatment.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      )
    } else {
      setItems([
        ...items,
        {
          id: Date.now().toString(),
          treatmentId: treatment.id,
          treatmentName: treatment.name,
          quantity: 1,
          unitPrice: treatment.price,
        },
      ])
    }
    setSearchTerm('')
  }

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id))
  }

  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return
    setItems(items.map((i) => (i.id === id ? { ...i, quantity } : i)))
  }

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const discount =
    formData.discountType === 'percentage'
      ? subtotal * (formData.discountValue / 100)
      : formData.discountValue
  const total = subtotal - discount
  const savingsPercentage = subtotal > 0 ? ((discount / subtotal) * 100).toFixed(0) : 0

  const filteredTreatments = treatments.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Ingresa un nombre para el paquete')
      return
    }

    if (items.length === 0) {
      toast.error('Agrega al menos un tratamiento al paquete')
      return
    }

    setIsSubmitting(true)
    toast.loading('Creando paquete...', { id: 'create-package' })

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast.dismiss('create-package')
      toast.success('Paquete creado exitosamente')
      router.push('/tratamientos/paquetes')
    } catch (error) {
      toast.dismiss('create-package')
      toast.error('Error al crear el paquete')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tratamientos/paquetes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nuevo Paquete</h1>
            <p className="text-muted-foreground">
              Crea un paquete combinando tratamientos con descuento
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-[#A67C52]" />
                  Informacion del Paquete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del paquete *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Paquete Rejuvenecimiento Facial"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripcion</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe los beneficios del paquete..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Add Treatments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#A67C52]" />
                  Tratamientos Incluidos
                </CardTitle>
                <CardDescription>Agrega los tratamientos que formaran parte del paquete</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tratamientos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Search Results */}
                {searchTerm && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {filteredTreatments.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">
                        No se encontraron tratamientos
                      </p>
                    ) : (
                      filteredTreatments.map((treatment) => (
                        <button
                          key={treatment.id}
                          type="button"
                          className="w-full p-3 text-left hover:bg-muted flex items-center justify-between border-b last:border-b-0"
                          onClick={() => addItem(treatment)}
                        >
                          <div>
                            <p className="font-medium">{treatment.name}</p>
                            <p className="text-sm text-muted-foreground">{treatment.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-[#A67C52]">
                              {formatCurrency(treatment.price)}
                            </p>
                            <Plus className="h-4 w-4 ml-auto text-muted-foreground" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                <Separator />

                {/* Selected Items */}
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay tratamientos agregados</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Busca y agrega tratamientos al paquete
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.treatmentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.unitPrice)} c/u
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <p className="w-24 text-right font-medium">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discount Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-[#A67C52]" />
                  Descuento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de descuento</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(v: 'percentage' | 'fixed') =>
                        setFormData({ ...formData, discountType: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                        <SelectItem value="fixed">Monto fijo (RD$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountValue">
                      {formData.discountType === 'percentage' ? 'Porcentaje' : 'Monto'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="discountValue"
                        type="number"
                        min="0"
                        max={formData.discountType === 'percentage' ? 100 : undefined}
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountValue: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {formData.discountType === 'percentage' ? '%' : 'RD$'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validity">Validez (dias)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="validity"
                      type="number"
                      min="1"
                      value={formData.validityDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          validityDays: parseInt(e.target.value) || 30,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    El paquete sera valido por {formData.validityDays} dias desde la compra
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Summary */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#A67C52]" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento (-{savingsPercentage}%)</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#A67C52]">{formatCurrency(total)}</span>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">
                      El cliente ahorra {formatCurrency(discount)}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Paquete activo</Label>
                    <p className="text-xs text-muted-foreground">
                      Visible para la venta
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || items.length === 0}
                    className="w-full bg-[#A67C52] hover:bg-[#8a6543]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isSubmitting ? 'Guardando...' : 'Crear Paquete'}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link href="/tratamientos/paquetes">Cancelar</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

export default function NuevoPaquetePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-[#A67C52]" />
        </div>
      }
    >
      <NuevoPaqueteContent />
    </Suspense>
  )
}
