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
  User,
  Search,
  AlertTriangle,
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  appointmentSchema,
  type AppointmentFormData,
} from '@/lib/validations/appointments'
import { DURATION_OPTIONS } from '@/types/appointments'
import { cn } from '@/lib/utils'
import {
  createAppointment,
  getAppointments,
  getProfessionals,
  getRooms,
  type ProfessionalData,
  type RoomData,
} from '@/actions/appointments'
import { getPatients, type PatientData } from '@/actions/patients'
import { getTreatments, type TreatmentListItemData } from '@/actions/treatments'

function NuevaCitaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [patientSearchOpen, setPatientSearchOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null)
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentListItemData | null>(null)
  const [bookingConflict, setBookingConflict] = useState<string | null>(null)

  // Real data from DB
  const [patients, setPatients] = useState<PatientData[]>([])
  const [professionals, setProfessionals] = useState<ProfessionalData[]>([])
  const [treatments, setTreatments] = useState<TreatmentListItemData[]>([])
  const [rooms, setRooms] = useState<RoomData[]>([])

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
  const watchDuration = form.watch('durationMinutes')

  // Load all reference data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true)
      const [patientsData, professionalsData, treatmentsData, roomsData] = await Promise.all([
        getPatients(),
        getProfessionals(),
        getTreatments({ isActive: true }),
        getRooms(),
      ])
      setPatients(patientsData)
      setProfessionals(professionalsData)
      setTreatments(treatmentsData)
      setRooms(roomsData)
      setIsLoadingData(false)
    }
    loadData()
  }, [])

  // Apply preselected patient once patients are loaded
  useEffect(() => {
    if (preselectedPatientId && patients.length > 0) {
      const patient = patients.find(p => p.id === preselectedPatientId)
      if (patient) {
        setSelectedPatient(patient)
        form.setValue('patientId', patient.id)
      }
    }
  }, [preselectedPatientId, patients, form])

  // Update duration when treatment changes
  useEffect(() => {
    if (watchTreatment) {
      const treatment = treatments.find(t => t.id === watchTreatment)
      if (treatment) {
        setSelectedTreatment(treatment)
        form.setValue('durationMinutes', treatment.duration_minutes)
        form.setValue('treatmentName', treatment.name)
      }
    }
  }, [watchTreatment, treatments, form])

  // Check for double-booking when professional, date, or duration changes
  useEffect(() => {
    async function checkConflicts() {
      if (!watchProfessional || !watchDate) {
        setBookingConflict(null)
        return
      }

      const newStart = new Date(watchDate).getTime()
      const newEnd = newStart + watchDuration * 60000

      // Fetch that professional's appointments for the same day
      const dayStart = new Date(watchDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(watchDate)
      dayEnd.setHours(23, 59, 59, 999)

      const existing = await getAppointments({
        professionalId: watchProfessional,
        startDate: dayStart.toISOString(),
        endDate: dayEnd.toISOString(),
      })

      const conflict = existing.find(apt => {
        if (apt.status === 'cancelled' || apt.status === 'no_show') return false
        const aptStart = new Date(apt.scheduled_at).getTime()
        const aptEnd = new Date(apt.end_at).getTime()
        // Overlap: new starts before existing ends AND new ends after existing starts
        return newStart < aptEnd && newEnd > aptStart
      })

      if (conflict) {
        const conflictTime = new Date(conflict.scheduled_at).toLocaleTimeString('es-DO', {
          hour: '2-digit',
          minute: '2-digit',
        })
        setBookingConflict(
          `El profesional ya tiene una cita con ${conflict.patient_name} a las ${conflictTime} (${conflict.treatment_display_name || 'sin tratamiento'})`
        )
      } else {
        setBookingConflict(null)
      }
    }

    checkConflicts()
  }, [watchProfessional, watchDate, watchDuration])

  const handlePatientSelect = (patient: PatientData) => {
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

  const getPatientInitials = (patient: PatientData) => {
    return `${patient.first_name[0] || ''}${patient.last_name[0] || ''}`.toUpperCase()
  }

  const getPatientFullName = (patient: PatientData) => {
    return `${patient.first_name} ${patient.last_name}`.trim()
  }

  async function onSubmit(data: AppointmentFormData) {
    if (bookingConflict) {
      toast.error('Resuelve el conflicto de horario antes de continuar')
      return
    }

    setIsLoading(true)

    try {
      const result = await createAppointment({
        patient_id: data.patientId,
        professional_id: data.professionalId,
        treatment_id: data.treatmentId || undefined,
        treatment_name: data.treatmentName || undefined,
        scheduled_at: data.scheduledAt,
        duration_minutes: data.durationMinutes,
        room_id: data.roomId && data.roomId !== 'none' ? data.roomId : undefined,
        buffer_minutes: data.bufferMinutes || 0,
        notes: data.notes || undefined,
        patient_notes: data.patientNotes || undefined,
        is_recurring: data.isRecurring || false,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Cita creada exitosamente')
      router.push('/agenda')
    } catch {
      toast.error('Ocurrió un error inesperado al crear la cita')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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
                            {getPatientInitials(selectedPatient)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{getPatientFullName(selectedPatient)}</p>
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
                              {patients.map((patient) => (
                                <CommandItem
                                  key={patient.id}
                                  value={`${patient.first_name} ${patient.last_name} ${patient.phone}`}
                                  onSelect={() => handlePatientSelect(patient)}
                                >
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback className="text-xs">
                                      {getPatientInitials(patient)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{getPatientFullName(patient)}</p>
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
                            {treatments.map((treatment) => (
                              <SelectItem key={treatment.id} value={treatment.id}>
                                <div className="flex items-center justify-between w-full gap-4">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-2 w-2 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: treatment.category_color || '#A67C52' }}
                                    />
                                    <span>{treatment.name}</span>
                                  </div>
                                  <span className="text-muted-foreground">
                                    {treatment.duration_minutes} min
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
                            backgroundColor: (selectedTreatment.category_color || '#A67C52') + '20',
                            color: selectedTreatment.category_color || '#A67C52',
                          }}
                        >
                          {selectedTreatment.category_name || 'Sin categoría'}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Duración: {selectedTreatment.duration_minutes} minutos
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

                  {/* Double-booking conflict alert */}
                  {bookingConflict && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{bookingConflict}</AlertDescription>
                    </Alert>
                  )}
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
                            {professionals.map((prof) => (
                              <SelectItem key={prof.id} value={prof.id}>
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                  <span>{prof.full_name}</span>
                                  <span className="text-muted-foreground capitalize">
                                    ({prof.role})
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
                            {rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-3 w-3 rounded flex-shrink-0"
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
                      <span className="font-medium">{getPatientFullName(selectedPatient)}</span>
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
            <Button
              type="submit"
              disabled={isLoading || !!bookingConflict}
              className={cn(bookingConflict && 'opacity-50 cursor-not-allowed')}
            >
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
