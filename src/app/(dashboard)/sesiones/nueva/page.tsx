'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
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
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { sessionSchema, type SessionFormData } from '@/lib/validations/sessions'
import { BODY_ZONES } from '@/types/patients'
import { getParametersForTreatmentType } from '@/types/sessions'
import { TreatmentTemplateSelector } from '@/components/treatment-templates'
import type { TreatmentTemplateData } from '@/types/treatment-templates'
import { inferTemplateType } from '@/types/treatment-templates'

// Actions
import { getPatients, type PatientData } from '@/actions/patients'
import { getProfessionals, type ProfessionalSummaryData } from '@/actions/professionals'
import { getTreatments, type TreatmentListItemData } from '@/actions/treatments'
import { getProducts, type ProductListItemData } from '@/actions/inventory'
import { createSession } from '@/actions/sessions'

// Tipos para datos transformados
interface PatientOption {
  id: string
  name: string
  phone: string
}

interface ProfessionalOption {
  id: string
  name: string
  specialty: string | null
}

interface TreatmentOption {
  id: string
  name: string
  category: string | null
  categoryColor: string | null
  type: string
}

interface ProductOption {
  id: string
  name: string
  unit: string
  stock: number
}

function NuevaSesionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Estados para datos cargados de la BD
  const [patients, setPatients] = useState<PatientOption[]>([])
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([])
  const [treatments, setTreatments] = useState<TreatmentOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentOption | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [treatmentParameters, setTreatmentParameters] = useState<any[]>([])

  // Estado para plantillas de tratamiento
  const [useTemplate, setUseTemplate] = useState(false)
  const [templateData, setTemplateData] = useState<TreatmentTemplateData | null>(null)
  const [detectedTemplateType, setDetectedTemplateType] = useState<'facial' | 'injectable' | null>(null)

  const appointmentId = searchParams.get('cita')
  const patientId = searchParams.get('paciente')

  // Cargar datos de la BD al montar
  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true)
      try {
        const [patientsData, professionalsData, treatmentsData, productsData] = await Promise.all([
          getPatients(),
          getProfessionals({ status: 'active' }),
          getTreatments({ isActive: true }),
          getProducts({ isActive: true }),
        ])

        // Transformar pacientes
        setPatients(patientsData.map((p: PatientData) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          phone: p.phone,
        })))

        // Transformar profesionales
        setProfessionals(professionalsData.map((p: ProfessionalSummaryData) => ({
          id: p.id,
          name: p.full_name || `${p.first_name} ${p.last_name}`,
          specialty: p.title || null,
        })))

        // Transformar tratamientos con tipo inferido
        setTreatments(treatmentsData.map((t: TreatmentListItemData) => ({
          id: t.id,
          name: t.name,
          category: t.category_name,
          categoryColor: t.category_color,
          type: inferTreatmentType(t.name, t.category_name),
        })))

        // Transformar productos
        setProducts(productsData.map((p: ProductListItemData) => ({
          id: p.id,
          name: p.name,
          unit: p.unit || 'units',
          stock: p.current_stock,
        })))
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoadingData(false)
      }
    }
    loadData()
  }, [])

  // Inferir tipo de tratamiento basado en nombre y categoría
  function inferTreatmentType(name: string, category: string | null): string {
    const lowerName = name.toLowerCase()
    const lowerCat = (category || '').toLowerCase()

    if (lowerName.includes('láser') || lowerName.includes('laser') || lowerCat.includes('láser')) {
      return 'laser'
    }
    if (lowerName.includes('botox') || lowerName.includes('inyect') || lowerCat.includes('inyect')) {
      return 'injectable'
    }
    if (lowerName.includes('radiofrecuencia') || lowerName.includes('rf')) {
      return 'rf'
    }
    if (lowerCat.includes('facial') || lowerName.includes('facial')) {
      return 'facial'
    }
    return 'general'
  }

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
      const treatment = treatments.find((t) => t.id === watchTreatment)
      if (treatment) {
        setSelectedTreatment(treatment)
        form.setValue('treatmentName', treatment.name)
        setTreatmentParameters(getParametersForTreatmentType(treatment.type))

        // Detectar tipo de plantilla
        const templateType = inferTemplateType(treatment.name, treatment.category)
        setDetectedTemplateType(templateType)

        // Auto-activar plantilla si se detecta un tipo
        if (templateType) {
          setUseTemplate(true)
        }
      }
    } else {
      setDetectedTemplateType(null)
      setUseTemplate(false)
      setTemplateData(null)
    }
  }, [watchTreatment, form, treatments])

  // Callback para manejar cambios en la plantilla
  const handleTemplateChange = useCallback((data: TreatmentTemplateData) => {
    setTemplateData(data)
  }, [])

  const handleAddZone = () => {
    appendZone({ zone: '', notes: '' })
  }

  async function onSubmit(data: SessionFormData) {
    setIsLoading(true)
    toast.loading('Iniciando sesión...', { id: 'create-session' })

    try {
      // Combinar parámetros técnicos con datos de plantilla
      const combinedParameters = {
        ...data.technicalParameters,
        ...(useTemplate && templateData ? { treatmentTemplate: templateData } : {}),
      }

      const result = await createSession({
        appointment_id: data.appointmentId || undefined,
        patient_id: data.patientId,
        professional_id: data.professionalId,
        treatment_id: data.treatmentId || undefined,
        treatment_name: data.treatmentName,
        observations: data.observations || undefined,
        treated_zones: data.treatedZones,
        technical_parameters: combinedParameters,
      })

      toast.dismiss('create-session')

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Sesión iniciada correctamente')
        router.push('/sesiones')
      }
    } catch (error) {
      toast.dismiss('create-session')
      console.error('Error creating session:', error)
      toast.error('Error al iniciar la sesión')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando datos...</span>
      </div>
    )
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
                            {patients.map((patient) => (
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
                            {professionals.map((prof) => (
                              <SelectItem key={prof.id} value={prof.id}>
                                {prof.name}{prof.specialty ? ` - ${prof.specialty}` : ''}
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
                            {treatments.map((treatment) => (
                              <SelectItem key={treatment.id} value={treatment.id}>
                                <div className="flex items-center gap-2">
                                  {treatment.categoryColor && (
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: treatment.categoryColor }}
                                    />
                                  )}
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

                  {selectedTreatment && selectedTreatment.category && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <Badge
                        style={{
                          backgroundColor: (selectedTreatment.categoryColor || '#888') + '20',
                          color: selectedTreatment.categoryColor || '#888',
                        }}
                      >
                        {selectedTreatment.category}
                      </Badge>
                    </div>
                  )}

                  {/* Opción de usar plantilla de tratamiento */}
                  {detectedTemplateType && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#A67C52]/10 border border-[#A67C52]/20">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#A67C52]" />
                        <Label htmlFor="use-template" className="cursor-pointer">
                          Usar plantilla de {detectedTemplateType === 'facial' ? 'tratamiento facial' : 'inyectables'}
                        </Label>
                      </div>
                      <Switch
                        id="use-template"
                        checked={useTemplate}
                        onCheckedChange={setUseTemplate}
                      />
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

          {/* Plantilla de Tratamiento */}
          {useTemplate && selectedTreatment && (
            <div className="mt-6">
              <TreatmentTemplateSelector
                treatmentName={selectedTreatment.name}
                categoryName={selectedTreatment.category}
                patientName={
                  patients.find((p) => p.id === form.watch('patientId'))?.name || ''
                }
                professionalName={
                  professionals.find((p) => p.id === form.watch('professionalId'))?.name || ''
                }
                onChange={handleTemplateChange}
                forceTemplateType={detectedTemplateType}
                sessionNumber={1}
              />
            </div>
          )}

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
