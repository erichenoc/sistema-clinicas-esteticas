'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Loader2,
  X,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { getTreatmentById, getCategories, updateTreatment } from '@/actions/treatments'

interface PageProps {
  params: Promise<{ id: string }>
}

interface ProtocolStep {
  order: number
  title: string
  description: string
  durationMinutes: number
}

export default function EditTreatmentPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [treatment, setTreatment] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    descriptionInternal: '',
    durationMinutes: 60,
    bufferMinutes: 10,
    price: 0,
    cost: 0,
    recommendedSessions: 1,
    sessionIntervalDays: 30,
    aftercareInstructions: '',
    isActive: true,
    isPublic: true,
  })

  const [contraindications, setContraindications] = useState<string[]>([])
  const [newContraindication, setNewContraindication] = useState('')
  const [protocolSteps, setProtocolSteps] = useState<ProtocolStep[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [treatmentData, categoriesData] = await Promise.all([
          getTreatmentById(id),
          getCategories(),
        ])

        setCategories(categoriesData)

        if (!treatmentData) {
          notFound()
        }

        setTreatment(treatmentData)

        // Populate form with treatment data from database
        setFormData({
          name: treatmentData.name || '',
          categoryId: treatmentData.category_id || '',
          description: treatmentData.description || '',
          descriptionInternal: treatmentData.description_internal || '',
          durationMinutes: treatmentData.duration_minutes || 60,
          bufferMinutes: treatmentData.buffer_minutes || 0,
          price: treatmentData.price || 0,
          cost: treatmentData.cost || 0,
          recommendedSessions: treatmentData.recommended_sessions || 1,
          sessionIntervalDays: treatmentData.session_interval_days || 30,
          aftercareInstructions: treatmentData.aftercare_instructions || '',
          isActive: treatmentData.is_active ?? true,
          isPublic: treatmentData.is_public ?? true,
        })

        setContraindications(treatmentData.contraindications || [])
        setProtocolSteps(treatmentData.protocol_steps?.map((step: { order: number; title: string; description: string; duration_minutes?: number }) => ({
          order: step.order,
          title: step.title,
          description: step.description,
          durationMinutes: step.duration_minutes || 5,
        })) || [])

        setIsLoading(false)
      } catch (error) {
        console.error('Error loading treatment:', error)
        toast.error('Error al cargar el tratamiento')
        setIsLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addContraindication = () => {
    if (newContraindication.trim()) {
      setContraindications(prev => [...prev, newContraindication.trim()])
      setNewContraindication('')
    }
  }

  const removeContraindication = (index: number) => {
    setContraindications(prev => prev.filter((_, i) => i !== index))
  }

  const addProtocolStep = () => {
    setProtocolSteps(prev => [
      ...prev,
      {
        order: prev.length + 1,
        title: '',
        description: '',
        durationMinutes: 5,
      },
    ])
  }

  const updateProtocolStep = (index: number, field: keyof ProtocolStep, value: any) => {
    setProtocolSteps(prev =>
      prev.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      )
    )
  }

  const removeProtocolStep = (index: number) => {
    setProtocolSteps(prev =>
      prev.filter((_, i) => i !== index).map((step, i) => ({ ...step, order: i + 1 }))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Build update data - only include fields that exist in the actual DB schema
      const updateData = {
        name: formData.name,
        category_id: formData.categoryId || undefined,
        description: formData.description || undefined,
        duration_minutes: formData.durationMinutes,
        price: formData.price,
        cost: formData.cost,
        is_active: formData.isActive,
        contraindications: contraindications,
      }

      const { data, error } = await updateTreatment(id, updateData)

      if (error) {
        toast.error(error)
        return
      }

      toast.success('Tratamiento actualizado exitosamente')
      router.push(`/tratamientos/${id}`)
    } catch (error) {
      console.error('Error updating treatment:', error)
      toast.error('Error al guardar el tratamiento')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!treatment) {
    return notFound()
  }

  const margin = formData.price - formData.cost
  const marginPercent = formData.price > 0 ? ((margin / formData.price) * 100).toFixed(1) : '0'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" type="button" asChild>
            <Link href={`/tratamientos/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Tratamiento</h1>
            <p className="text-muted-foreground">{treatment.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" asChild>
            <Link href={`/tratamientos/${id}`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="precios">Precios</TabsTrigger>
          <TabsTrigger value="protocolo">Protocolo</TabsTrigger>
          <TabsTrigger value="contraindicaciones">Contraindicaciones</TabsTrigger>
        </TabsList>

        {/* Tab General */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informacion Basica</CardTitle>
              <CardDescription>Datos principales del tratamiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Tratamiento</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => handleInputChange('categoryId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion Publica</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  placeholder="Descripcion visible para pacientes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionInternal">Notas Internas</Label>
                <Textarea
                  id="descriptionInternal"
                  value={formData.descriptionInternal}
                  onChange={(e) => handleInputChange('descriptionInternal', e.target.value)}
                  rows={3}
                  placeholder="Notas visibles solo para el personal"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duracion (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => handleInputChange('durationMinutes', parseInt(e.target.value))}
                    min={5}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buffer">Tiempo Buffer (minutos)</Label>
                  <Input
                    id="buffer"
                    type="number"
                    value={formData.bufferMinutes}
                    onChange={(e) => handleInputChange('bufferMinutes', parseInt(e.target.value))}
                    min={0}
                    step={5}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Tratamiento Activo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                  />
                  <Label htmlFor="isPublic">Visible Publicamente</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Precios */}
        <TabsContent value="precios" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Precios y Costos</CardTitle>
              <CardDescription>Configuracion financiera del tratamiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio de Venta (RD$)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    min={0}
                    step={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Costo (RD$)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                    min={0}
                    step={100}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Margen de Ganancia</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600">{marginPercent}%</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (RD${margin.toLocaleString('es-MX')})
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sessions">Sesiones Recomendadas</Label>
                  <Input
                    id="sessions"
                    type="number"
                    value={formData.recommendedSessions}
                    onChange={(e) => handleInputChange('recommendedSessions', parseInt(e.target.value))}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Intervalo entre Sesiones (dias)</Label>
                  <Input
                    id="interval"
                    type="number"
                    value={formData.sessionIntervalDays}
                    onChange={(e) => handleInputChange('sessionIntervalDays', parseInt(e.target.value))}
                    min={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Protocolo */}
        <TabsContent value="protocolo" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Protocolo del Tratamiento</CardTitle>
              <CardDescription>Pasos a seguir durante el procedimiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {protocolSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 rounded-lg border"
                >
                  <div className="flex items-center">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  </div>
                  <div className="flex-1 grid gap-3 sm:grid-cols-4">
                    <div className="sm:col-span-1">
                      <Label className="text-xs">Titulo</Label>
                      <Input
                        value={step.title}
                        onChange={(e) => updateProtocolStep(index, 'title', e.target.value)}
                        placeholder="Paso"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Descripcion</Label>
                      <Input
                        value={step.description}
                        onChange={(e) => updateProtocolStep(index, 'description', e.target.value)}
                        placeholder="Descripcion del paso"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Label className="text-xs">Duracion (min)</Label>
                      <Input
                        type="number"
                        value={step.durationMinutes}
                        onChange={(e) => updateProtocolStep(index, 'durationMinutes', parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProtocolStep(index)}
                    disabled={protocolSteps.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addProtocolStep}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Paso
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cuidados Post-Tratamiento</CardTitle>
              <CardDescription>Instrucciones para el paciente despues del tratamiento</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.aftercareInstructions}
                onChange={(e) => handleInputChange('aftercareInstructions', e.target.value)}
                rows={4}
                placeholder="Ej: Evitar exposicion solar por 24 horas..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Contraindicaciones */}
        <TabsContent value="contraindicaciones" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contraindicaciones</CardTitle>
              <CardDescription>Condiciones que impiden realizar este tratamiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newContraindication}
                  onChange={(e) => setNewContraindication(e.target.value)}
                  placeholder="Nueva contraindicacion"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addContraindication()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addContraindication}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {contraindications.map((item, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 py-1 px-3"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeContraindication(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {contraindications.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay contraindicaciones registradas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
