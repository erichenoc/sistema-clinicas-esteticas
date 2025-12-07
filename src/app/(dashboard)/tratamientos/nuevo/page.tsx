'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  treatmentSchema,
  type TreatmentFormData,
  generateSlug,
} from '@/lib/validations/treatments'
import { toast } from 'sonner'

// Mock categories
const mockCategories = [
  { id: '1', name: 'Facial', color: '#ec4899' },
  { id: '2', name: 'Corporal', color: '#8b5cf6' },
  { id: '3', name: 'Láser', color: '#ef4444' },
  { id: '4', name: 'Inyectables', color: '#06b6d4' },
]

export default function NuevoTratamientoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [contraindication, setContraindication] = useState('')

  const form = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      name: '',
      slug: '',
      categoryId: null,
      description: '',
      descriptionInternal: '',
      durationMinutes: 60,
      bufferMinutes: 0,
      price: 0,
      priceFrom: null,
      cost: 0,
      recommendedSessions: 1,
      sessionIntervalDays: null,
      contraindications: [],
      aftercareInstructions: '',
      isPublic: true,
      isActive: true,
    },
  })

  const contraindications = form.watch('contraindications')

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    form.setValue('name', name)
    form.setValue('slug', generateSlug(name))
  }

  const addContraindication = () => {
    if (contraindication.trim()) {
      form.setValue('contraindications', [
        ...contraindications,
        contraindication.trim(),
      ])
      setContraindication('')
    }
  }

  const removeContraindication = (index: number) => {
    form.setValue(
      'contraindications',
      contraindications.filter((_, i) => i !== index)
    )
  }

  async function onSubmit(data: TreatmentFormData) {
    setIsLoading(true)

    try {
      // TODO: Llamar a Server Action para crear tratamiento
      console.log('Datos del tratamiento:', data)

      toast.success('Tratamiento creado exitosamente')
      router.push('/tratamientos')
    } catch (error) {
      toast.error('Error al crear el tratamiento')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tratamientos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Tratamiento</h1>
          <p className="text-muted-foreground">
            Agrega un nuevo servicio al catálogo
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="pricing">Precios</TabsTrigger>
              <TabsTrigger value="clinical">Clínico</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>

            {/* TAB: General */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Datos principales del tratamiento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del tratamiento *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej: Limpieza Facial Profunda"
                              {...field}
                              onChange={handleNameChange}
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
                                <SelectValue placeholder="Selecciona categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockCategories.map((cat) => (
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug (URL)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="limpieza-facial-profunda"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Identificador único para URLs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción para pacientes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe el tratamiento para los pacientes..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="durationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duración (minutos) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={5}
                              max={480}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bufferMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiempo buffer (minutos)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={60}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Tiempo entre citas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Pricing */}
            <TabsContent value="pricing" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Precios y Sesiones</CardTitle>
                  <CardDescription>
                    Configura los precios y sesiones recomendadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                className="pl-7"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priceFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio desde (opcional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                className="pl-7"
                                placeholder="0.00"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : null
                                  )
                                }
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Para rangos de precio</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo interno</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                className="pl-7"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Para calcular margen</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="recommendedSessions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sesiones recomendadas</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sessionIntervalDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intervalo entre sesiones (días)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Ej: 21"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : null
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Clinical */}
            <TabsContent value="clinical" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información Clínica</CardTitle>
                  <CardDescription>
                    Protocolo e indicaciones médicas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="descriptionInternal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protocolo interno</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Instrucciones detalladas para el profesional..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Visible solo para profesionales
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Contraindicaciones</FormLabel>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Agregar contraindicación..."
                        value={contraindication}
                        onChange={(e) => setContraindication(e.target.value)}
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
                    {contraindications.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {contraindications.map((item, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="gap-1"
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
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="aftercareInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instrucciones post-tratamiento</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cuidados y recomendaciones después del tratamiento..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Settings */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración</CardTitle>
                  <CardDescription>
                    Visibilidad y estado del tratamiento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Tratamiento activo
                          </FormLabel>
                          <FormDescription>
                            Los tratamientos inactivos no aparecen en la agenda
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
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Visible para pacientes
                          </FormLabel>
                          <FormDescription>
                            Mostrar en el portal de pacientes y reservas online
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
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/tratamientos">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Tratamiento
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
