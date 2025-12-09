'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Loader2,
  User,
  Stethoscope,
  MapPin,
  Package,
  Plus,
  X,
  Camera,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { sessionSchema, type SessionFormData } from '@/lib/validations/sessions'
import { BODY_ZONES } from '@/types/patients'
import {
  LASER_PARAMETERS,
  INJECTABLE_PARAMETERS,
  getParametersForTreatmentType,
} from '@/types/sessions'

// Mock data
const mockPatients = [
  { id: '1', name: 'María García López', phone: '8095551234' },
  { id: '2', name: 'Ana Martínez Ruiz', phone: '8295552345' },
  { id: '3', name: 'Laura Hernández', phone: '8095553456' },
]

const mockProfessionals = [
  { id: '1', name: 'Dra. Pamela Moquete', specialty: 'Medicina Estética' },
]

const mockTreatments = [
  { id: '1', name: 'Limpieza Facial Profunda', category: 'Facial', categoryColor: '#ec4899', type: 'facial' },
  { id: '2', name: 'Botox - Frente', category: 'Inyectables', categoryColor: '#06b6d4', type: 'injectable' },
  { id: '3', name: 'Depilación Láser - Axilas', category: 'Láser', categoryColor: '#ef4444', type: 'laser' },
  { id: '4', name: 'Hidratación Facial', category: 'Facial', categoryColor: '#ec4899', type: 'facial' },
  { id: '5', name: 'Radiofrecuencia Corporal', category: 'Corporal', categoryColor: '#8b5cf6', type: 'rf' },
]

const mockProducts = [
  { id: '1', name: 'Gel conductor', unit: 'ml', stock: 500 },
  { id: '2', name: 'Crema hidratante', unit: 'ml', stock: 200 },
  { id: '3', name: 'Botox 100U', unit: 'units', stock: 50 },
  { id: '4', name: 'Ácido Hialurónico 1ml', unit: 'ml', stock: 20 },
]

function NuevaSesionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<typeof mockTreatments[0] | null>(null)
  const [treatmentParameters, setTreatmentParameters] = useState<any[]>([])

  const appointmentId = searchParams.get('cita')
  const patientId = searchParams.get('paciente')

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      appointmentId: appointmentId || undefined,
      patientId: patientId || '',
      professionalId: '',
      treatmentId: '',
      treatmentName: '',
      treatedZones: [],
      technicalParameters: {},
      observations: '',
      followUpRequired: false,
      followUpNotes: '',
    },
  })

  const { fields: zoneFields, append: appendZone, remove: removeZone } = useFieldArray({
    control: form.control,
    name: 'treatedZones',
  })

  const watchTreatment = form.watch('treatmentId')

  // Actualizar tratamiento seleccionado y parámetros
  useEffect(() => {
    if (watchTreatment) {
      const treatment = mockTreatments.find((t) => t.id === watchTreatment)
      if (treatment) {
        setSelectedTreatment(treatment)
        form.setValue('treatmentName', treatment.name)
        setTreatmentParameters(getParametersForTreatmentType(treatment.type))
      }
    }
  }, [watchTreatment, form])

  const handleAddZone = () => {
    appendZone({ zone: '', notes: '' })
  }

  async function onSubmit(data: SessionFormData) {
    setIsLoading(true)

    try {
      // TODO: Llamar a Server Action para crear sesión
      console.log('Session data:', data)

      toast.success('Sesión iniciada correctamente')
      router.push('/sesiones')
    } catch (error) {
      toast.error('Error al iniciar la sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sesiones">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Sesión</h1>
          <p className="text-muted-foreground">
            Registra una nueva sesión clínica
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Columna izquierda */}
            <div className="space-y-6">
              {/* Paciente y Profesional */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Participantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paciente *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un paciente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockPatients.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{patient.name}</span>
                                </div>
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
                    name="professionalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profesional *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un profesional" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockProfessionals.map((prof) => (
                              <SelectItem key={prof.id} value={prof.id}>
                                {prof.name} - {prof.specialty}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Tratamiento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Tratamiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="treatmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tratamiento *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tratamiento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockTreatments.map((treatment) => (
                              <SelectItem key={treatment.id} value={treatment.id}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: treatment.categoryColor }}
                                  />
                                  {treatment.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedTreatment && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <Badge
                        style={{
                          backgroundColor: selectedTreatment.categoryColor + '20',
                          color: selectedTreatment.categoryColor,
                        }}
                      >
                        {selectedTreatment.category}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Zonas tratadas */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Zonas Tratadas
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddZone}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Agregar zona
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {zoneFields.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No hay zonas agregadas. Haz clic en "Agregar zona" para comenzar.
                    </p>
                  ) : (
                    zoneFields.map((field, index) => (
                      <div key={field.id} className="flex gap-3 items-start">
                        <FormField
                          control={form.control}
                          name={`treatedZones.${index}.zone`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona zona" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {BODY_ZONES.map((zone) => (
                                    <SelectItem key={zone.value} value={zone.value}>
                                      {zone.label}
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
                          name={`treatedZones.${index}.notes`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Notas de la zona"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeZone(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Columna derecha */}
            <div className="space-y-6">
              {/* Parámetros técnicos */}
              {treatmentParameters.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Parámetros Técnicos</CardTitle>
                    <CardDescription>
                      Configura los parámetros del tratamiento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {treatmentParameters.map((param) => (
                        <FormField
                          key={param.key}
                          control={form.control}
                          name={`technicalParameters.${param.key}` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{param.label}</FormLabel>
                              <FormControl>
                                <Input
                                  type={param.type}
                                  placeholder={param.label}
                                  {...field}
                                  onChange={(e) => {
                                    const value = param.type === 'number'
                                      ? parseFloat(e.target.value) || ''
                                      : e.target.value
                                    field.onChange(value)
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Productos utilizados */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Productos
                    </CardTitle>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="mr-1 h-3 w-3" />
                      Agregar producto
                    </Button>
                  </div>
                  <CardDescription>
                    Se descontarán automáticamente del inventario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-4">
                    No hay productos agregados
                  </p>
                </CardContent>
              </Card>

              {/* Observaciones */}
              <Card>
                <CardHeader>
                  <CardTitle>Observaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observaciones del tratamiento</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas sobre el procedimiento, reacciones, etc."
                            className="min-h-[100px]"
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
                    name="followUpRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">
                          Requiere seguimiento
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {form.watch('followUpRequired') && (
                    <>
                      <FormField
                        control={form.control}
                        name="followUpNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notas de seguimiento</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Indicaciones para el seguimiento..."
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nextSessionRecommendedAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Próxima sesión recomendada</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Fotos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Fotografías
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    <Button type="button" variant="outline" className="h-24 flex-col">
                      <Camera className="h-6 w-6 mb-1" />
                      <span className="text-xs">Antes</span>
                    </Button>
                    <Button type="button" variant="outline" className="h-24 flex-col">
                      <Camera className="h-6 w-6 mb-1" />
                      <span className="text-xs">Durante</span>
                    </Button>
                    <Button type="button" variant="outline" className="h-24 flex-col">
                      <Camera className="h-6 w-6 mb-1" />
                      <span className="text-xs">Después</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/sesiones">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Iniciar Sesión
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default function NuevaSesionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <NuevaSesionContent />
    </Suspense>
  )
}
