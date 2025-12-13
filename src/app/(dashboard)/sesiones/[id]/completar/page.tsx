'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  CheckCircle,
  FileText,
  Camera,
  Star,
  AlertTriangle,
  Syringe,
  Package,
  User,
  Loader2,
  Plus,
  Trash2,
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

// Mock session data
const mockSession = {
  id: '1',
  patientName: 'Maria Garcia Lopez',
  treatmentName: 'Limpieza Facial Profunda',
  professionalName: 'Dra. Maria Garcia',
  startedAt: new Date().toISOString(),
}

// Mock products
const mockProducts = [
  { id: '1', name: 'Espuma Limpiadora Premium', unit: 'ml', costPrice: 15 },
  { id: '2', name: 'Tonico Facial', unit: 'ml', costPrice: 8 },
  { id: '3', name: 'Mascarilla Purificante', unit: 'unidad', costPrice: 12 },
  { id: '4', name: 'Suero Vitaminico', unit: 'ml', costPrice: 25 },
  { id: '5', name: 'Crema Hidratante', unit: 'gr', costPrice: 18 },
]

// Body zones
const BODY_ZONES = [
  { value: 'face_full', label: 'Rostro completo' },
  { value: 'face_forehead', label: 'Frente' },
  { value: 'face_cheeks', label: 'Mejillas' },
  { value: 'face_chin', label: 'Menton' },
  { value: 'face_nose', label: 'Nariz' },
  { value: 'neck', label: 'Cuello' },
  { value: 'decolletage', label: 'Escote' },
  { value: 'hands', label: 'Manos' },
  { value: 'arms', label: 'Brazos' },
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'back', label: 'Espalda' },
  { value: 'legs', label: 'Piernas' },
]

interface ProductUsed {
  id: string
  productId: string
  productName: string
  quantity: number
  lot: string
}

export default function CompletarSesionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedZones, setSelectedZones] = useState<string[]>([])
  const [productsUsed, setProductsUsed] = useState<ProductUsed[]>([])
  const [rating, setRating] = useState(5)

  const [formData, setFormData] = useState({
    observations: '',
    patientFeedback: '',
    adverseReactions: '',
    hasAdverseReactions: false,
    resultNotes: '',
    followUpRequired: false,
    followUpNotes: '',
    nextSessionDate: '',
  })

  const toggleZone = (zone: string) => {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    )
  }

  const addProduct = () => {
    setProductsUsed([
      ...productsUsed,
      {
        id: Date.now().toString(),
        productId: '',
        productName: '',
        quantity: 1,
        lot: '',
      },
    ])
  }

  const removeProduct = (id: string) => {
    setProductsUsed(productsUsed.filter((p) => p.id !== id))
  }

  const updateProduct = (id: string, field: keyof ProductUsed, value: string | number) => {
    setProductsUsed(
      productsUsed.map((p) => {
        if (p.id === id) {
          if (field === 'productId') {
            const product = mockProducts.find((mp) => mp.id === value)
            return { ...p, productId: value as string, productName: product?.name || '' }
          }
          return { ...p, [field]: value }
        }
        return p
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    toast.loading('Completando sesion...', { id: 'complete-session' })

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast.dismiss('complete-session')
      toast.success('Sesion completada exitosamente')
      router.push(`/sesiones/${sessionId}`)
    } catch (error) {
      toast.dismiss('complete-session')
      toast.error('Error al completar la sesion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/sesiones/${sessionId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Completar Sesion</h1>
            <p className="text-muted-foreground">
              {mockSession.treatmentName} - {mockSession.patientName}
            </p>
          </div>
        </div>
        <Badge className="bg-purple-500">En Progreso</Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Treated Zones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#A67C52]" />
              Zonas Tratadas
            </CardTitle>
            <CardDescription>Selecciona las areas que fueron tratadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {BODY_ZONES.map((zone) => (
                <Badge
                  key={zone.value}
                  variant={selectedZones.includes(zone.value) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${
                    selectedZones.includes(zone.value)
                      ? 'bg-[#A67C52] hover:bg-[#8a6543]'
                      : 'hover:bg-[#A67C52]/10'
                  }`}
                  onClick={() => toggleZone(zone.value)}
                >
                  {zone.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Products Used */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#A67C52]" />
              Productos Utilizados
            </CardTitle>
            <CardDescription>Registra los productos usados durante el tratamiento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {productsUsed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se han agregado productos
              </p>
            ) : (
              productsUsed.map((product) => (
                <div key={product.id} className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Producto</Label>
                    <Select
                      value={product.productId}
                      onValueChange={(v) => updateProduct(product.id, 'productId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) =>
                        updateProduct(product.id, 'quantity', parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Lote</Label>
                    <Input
                      placeholder="LOT-XXX"
                      value={product.lot}
                      onChange={(e) => updateProduct(product.id, 'lot', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProduct(product.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            <Button type="button" variant="outline" onClick={addProduct} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
          </CardContent>
        </Card>

        {/* Observations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#A67C52]" />
              Observaciones del Tratamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones clinicas</Label>
              <Textarea
                id="observations"
                placeholder="Describe como se desarrollo el tratamiento..."
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientFeedback">Feedback del paciente</Label>
              <Textarea
                id="patientFeedback"
                placeholder="Comentarios del paciente durante o despues del tratamiento..."
                value={formData.patientFeedback}
                onChange={(e) => setFormData({ ...formData, patientFeedback: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Adverse Reactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Reacciones Adversas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Hubo reacciones adversas?</Label>
                <p className="text-sm text-muted-foreground">
                  Marca si el paciente presento alguna reaccion
                </p>
              </div>
              <Switch
                checked={formData.hasAdverseReactions}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasAdverseReactions: checked })
                }
              />
            </div>
            {formData.hasAdverseReactions && (
              <div className="space-y-2">
                <Label htmlFor="adverseReactions">Describe las reacciones</Label>
                <Textarea
                  id="adverseReactions"
                  placeholder="Describe las reacciones observadas..."
                  value={formData.adverseReactions}
                  onChange={(e) => setFormData({ ...formData, adverseReactions: e.target.value })}
                  rows={3}
                  className="border-amber-500"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#A67C52]" />
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Calificacion del resultado</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'fill-[#A67C52] text-[#A67C52]'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resultNotes">Notas sobre los resultados</Label>
              <Textarea
                id="resultNotes"
                placeholder="Describe los resultados obtenidos..."
                value={formData.resultNotes}
                onChange={(e) => setFormData({ ...formData, resultNotes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Follow-up */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-[#A67C52]" />
              Seguimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Requiere seguimiento?</Label>
                <p className="text-sm text-muted-foreground">
                  Indica si el paciente necesita otra sesion
                </p>
              </div>
              <Switch
                checked={formData.followUpRequired}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, followUpRequired: checked })
                }
              />
            </div>
            {formData.followUpRequired && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="followUpNotes">Notas de seguimiento</Label>
                  <Textarea
                    id="followUpNotes"
                    placeholder="Recomendaciones para la siguiente sesion..."
                    value={formData.followUpNotes}
                    onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextSessionDate">Fecha sugerida para proxima sesion</Label>
                  <Input
                    id="nextSessionDate"
                    type="date"
                    value={formData.nextSessionDate}
                    onChange={(e) => setFormData({ ...formData, nextSessionDate: e.target.value })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/sesiones/${sessionId}`}>Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#A67C52] hover:bg-[#8a6543]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? 'Completando...' : 'Completar Sesion'}
          </Button>
        </div>
      </form>
    </div>
  )
}
