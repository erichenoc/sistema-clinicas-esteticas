'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  User,
  Search,
  Check,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  appointmentSchema,
  type AppointmentFormData,
  generateTimeSlots,
} from '@/lib/validations/appointments'
import { DURATION_OPTIONS } from '@/types/appointments'
import { cn } from '@/lib/utils'

// Mock data
const mockPatients = [
  { id: '1', name: 'María García López', phone: '5512345678', email: 'maria@email.com' },
  { id: '2', name: 'Ana Martínez Ruiz', phone: '5598765432', email: 'ana@email.com' },
  { id: '3', name: 'Laura Hernández', phone: '5511223344', email: 'laura@email.com' },
  { id: '4', name: 'Carmen Rodríguez Soto', phone: '5544332211', email: 'carmen@email.com' },
  { id: '5', name: 'Patricia Morales', phone: '5566778899', email: 'paty@email.com' },
]

const mockProfessionals = [
  { id: '1', name: 'Dra. María García', specialty: 'Dermatología', color: '#ec4899' },
  { id: '2', name: 'Dr. Carlos López', specialty: 'Medicina Estética', color: '#3b82f6' },
  { id: '3', name: 'Lic. Ana Martínez', specialty: 'Cosmetología', color: '#22c55e' },
]

const mockTreatments = [
  { id: '1', name: 'Limpieza Facial Profunda', duration: 60, price: 80, category: 'Facial', categoryColor: '#ec4899' },
  { id: '2', name: 'Botox - Frente', duration: 30, price: 350, category: 'Inyectables', categoryColor: '#06b6d4' },
  { id: '3', name: 'Depilación Láser - Axilas', duration: 20, price: 120, category: 'Láser', categoryColor: '#ef4444' },
  { id: '4', name: 'Hidratación Facial', duration: 45, price: 95, category: 'Facial', categoryColor: '#ec4899' },
  { id: '5', name: 'Ácido Hialurónico - Labios', duration: 30, price: 400, category: 'Inyectables', categoryColor: '#06b6d4' },
]

const mockRooms = [
  { id: '1', name: 'Cabina 1', color: '#ec4899' },
  { id: '2', name: 'Cabina 2', color: '#3b82f6' },
  { id: '3', name: 'Sala Láser', color: '#ef4444' },
  { id: '4', name: 'Quirófano', color: '#8b5cf6' },
]

function NuevaCitaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [patientSearchOpen, setPatientSearchOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<typeof mockPatients[0] | null>(null)
  const [selectedTreatment, setSelectedTreatment] = useState<typeof mockTreatments[0] | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  const preselectedPatientId = searchParams.get('paciente')

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: preselectedPatientId || '',
      professionalId: '',
      treatmentId: '',
      treatmentName: '',
      scheduledAt: '',
      durationMinutes: 60,
      roomId: '',
      bufferMinutes: 0,
      notes: '',
      patientNotes: '',
      isRecurring: false,
    },
  })

  const watchDate = form.watch('scheduledAt')
  const watchProfessional = form.watch('professionalId')
  const watchTreatment = form.watch('treatmentId')

  // Cargar paciente preseleccionado
  useEffect(() => {
    if (preselectedPatientId) {
      const patient = mockPatients.find(p => p.id === preselectedPatientId)
      if (patient) {
        setSelectedPatient(patient)
        form.setValue('patientId', patient.id)
      }
    }
  }, [preselectedPatientId, form])

  // Actualizar tratamiento seleccionado
  useEffect(() => {
    if (watchTreatment) {
      const treatment = mockTreatments.find(t => t.id === watchTreatment)
      if (treatment) {
        setSelectedTreatment(treatment)
        form.setValue('durationMinutes', treatment.duration)
        form.setValue('treatmentName', treatment.name)
      }
    }
  }, [watchTreatment, form])

  // Generar slots disponibles
  useEffect(() => {
    if (watchDate && watchProfessional) {
      // TODO: Consultar disponibilidad real del profesional
      const slots = generateTimeSlots('09:00', '20:00', 30)
      setAvailableSlots(slots)
    }
  }, [watchDate, watchProfessional])

  const handlePatientSelect = (patient: typeof mockPatients[0]) => {
    setSelectedPatient(patient)
    form.setValue('patientId', patient.id)
    setPatientSearchOpen(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(price)
  }

  async function onSubmit(data: AppointmentFormData) {
    setIsLoading(true)

    try {
      // TODO: Llamar a Server Action para crear cita
      console.log('Appointment data:', data)

      toast.success('Cita creada exitosamente')
      router.push('/agenda')
    } catch (error) {
      toast.error('Error al crear la cita')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/agenda">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Cita</h1>
          <p className="text-muted-foreground">
            Programa una nueva cita para un paciente
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Columna izquierda */}
            <div className="space-y-6">
              {/* Paciente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Paciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPatient ? (
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedPatient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedPatient.phone}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(null)
                          form.setValue('patientId', '')
                        }}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Search className="mr-2 h-4 w-4" />
                          Buscar paciente...
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar por nombre o teléfono..." />
                          <CommandList>
                            <CommandEmpty>No se encontraron pacientes</CommandEmpty>
                            <CommandGroup>
                              {mockPatients.map((patient) => (
                                <CommandItem
                                  key={patient.id}
                                  onSelect={() => handlePatientSelect(patient)}
                                >
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback className="text-xs">
                                      {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{patient.name}</p>
                                    <p className="text-xs text-muted-foreground">{patient.phone}</p>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={() => (
                      <FormItem className="hidden">
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Tratamiento */}
              <Card>
                <CardHeader>
                  <CardTitle>Tratamiento</CardTitle>
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
                                <div className="flex items-center justify-between w-full gap-4">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: treatment.categoryColor }}
                                    />
                                    <span>{treatment.name}</span>
                                  </div>
                                  <span className="text-muted-foreground">
                                    {treatment.duration} min
                                  </span>
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
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <Badge
                          style={{
                            backgroundColor: selectedTreatment.categoryColor + '20',
                            color: selectedTreatment.categoryColor,
                          }}
                        >
                          {selectedTreatment.category}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Duración: {selectedTreatment.duration} minutos
                        </p>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(selectedTreatment.price)}
                      </p>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="durationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DURATION_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value.toString()}>
                                {opt.label}
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

              {/* Notas */}
              <Card>
                <CardHeader>
                  <CardTitle>Notas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas internas</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas visibles solo para el equipo..."
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
                    name="patientNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas para el paciente</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Indicaciones o recordatorios para el paciente..."
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Se enviarán en el recordatorio de la cita
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Columna derecha */}
            <div className="space-y-6">
              {/* Fecha y hora */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Fecha y Hora
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha *</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value ? field.value.slice(0, 16) : ''}
                            onChange={(e) => {
                              const date = e.target.value
                              if (date) {
                                field.onChange(new Date(date).toISOString())
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Profesional */}
              <Card>
                <CardHeader>
                  <CardTitle>Profesional</CardTitle>
                </CardHeader>
                <CardContent>
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
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: prof.color }}
                                  />
                                  <span>{prof.name}</span>
                                  <span className="text-muted-foreground">
                                    ({prof.specialty})
                                  </span>
                                </div>
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

              {/* Sala */}
              <Card>
                <CardHeader>
                  <CardTitle>Sala / Cabina</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sala (opcional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sin sala asignada" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sin sala asignada</SelectItem>
                            {mockRooms.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-3 w-3 rounded"
                                    style={{ backgroundColor: room.color }}
                                  />
                                  {room.name}
                                </div>
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

              {/* Resumen */}
              {selectedPatient && selectedTreatment && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle>Resumen de la Cita</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paciente</span>
                      <span className="font-medium">{selectedPatient.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tratamiento</span>
                      <span className="font-medium">{selectedTreatment.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duración</span>
                      <span className="font-medium">
                        {form.watch('durationMinutes')} min
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precio</span>
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(selectedTreatment.price)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/agenda">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Cita
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default function NuevaCitaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <NuevaCitaContent />
    </Suspense>
  )
}
