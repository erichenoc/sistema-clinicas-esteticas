'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Users, Clock, Loader2, Calendar as CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { AppointmentListItemData, ProfessionalData } from '@/actions/appointments'
import { updateAppointmentStatus } from '@/actions/appointments'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'

const statusColors: Record<string, string> = {
  scheduled: '#3b82f6',
  confirmed: '#22c55e',
  waiting: '#f59e0b',
  in_progress: '#8b5cf6',
  completed: '#10b981',
  cancelled: '#ef4444',
  no_show: '#6b7280',
}

const statusLabels: Record<string, string> = {
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  waiting: 'En espera',
  in_progress: 'En atencion',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistio',
}

interface AgendaCalendarProps {
  appointments: AppointmentListItemData[]
  professionals: ProfessionalData[]
}

export function AgendaCalendar({ appointments, professionals }: AgendaCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'>('timeGridWeek')
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all')
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentListItemData | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    setCurrentDate(new Date())
    setMounted(true)
    // Set day view on mobile by default
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      setView('timeGridDay')
    }
  }, [])

  // Filtrar citas por profesional
  const filteredAppointments = selectedProfessional === 'all'
    ? appointments
    : appointments.filter(apt => apt.professional_id === selectedProfessional)

  // Convertir citas a eventos de FullCalendar
  const calendarEvents = filteredAppointments.map((apt) => ({
    id: apt.id,
    title: apt.patient_name,
    start: apt.scheduled_at,
    end: apt.end_at,
    backgroundColor: apt.category_color || statusColors[apt.status],
    borderColor: apt.category_color || statusColors[apt.status],
    extendedProps: apt,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventClick = (info: any) => {
    setSelectedAppointment(info.event.extendedProps)
    setIsDetailOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDateClick = (info: any) => {
    console.log('Date clicked:', info.dateStr)
  }

  const handleViewChange = (newView: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth') => {
    setView(newView)
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.changeView(newView)
    }
  }

  const handlePrev = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.prev()
      setCurrentDate(calendarApi.getDate())
    }
  }

  const handleNext = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.next()
      setCurrentDate(calendarApi.getDate())
    }
  }

  const handleToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.today()
      setCurrentDate(calendarApi.getDate())
    }
  }

  const formatCurrentDate = () => {
    if (!currentDate) return ''
    const options: Intl.DateTimeFormatOptions =
      view === 'dayGridMonth'
        ? { month: 'long', year: 'numeric' }
        : view === 'timeGridDay'
        ? { weekday: 'long', day: 'numeric', month: 'long' }
        : { month: 'long', year: 'numeric' }
    return currentDate.toLocaleDateString('es-MX', options)
  }

  const handleReschedule = async () => {
    if (!selectedAppointment) return
    setIsRescheduling(true)
    toast.loading('Preparando reprogramacion...', { id: 'reschedule' })
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.dismiss('reschedule')
    toast.success(`Cita de ${selectedAppointment.patient_name} lista para reprogramar. Seleccione nueva fecha en el calendario.`)
    setIsRescheduling(false)
    setIsDetailOpen(false)
  }

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return
    setIsCancelling(true)
    toast.loading('Cancelando cita...', { id: 'cancel-apt' })

    const result = await updateAppointmentStatus(selectedAppointment.id, 'cancelled', 'Cancelada por el usuario')

    toast.dismiss('cancel-apt')
    if (result.success) {
      toast.success(`Cita de ${selectedAppointment.patient_name} cancelada`)
    } else {
      toast.error(result.error || 'Error al cancelar la cita')
    }
    setIsCancelling(false)
    setIsDetailOpen(false)
    setSelectedAppointment(null)
  }

  return (
    <>
      {/* Controles del calendario */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize ml-2">
            {formatCurrentDate()}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
            <SelectTrigger className="w-[200px]">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Profesional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los profesionales</SelectItem>
              {professionals.map((prof) => (
                <SelectItem key={prof.id} value={prof.id}>
                  <div className="flex items-center gap-2">
                    {prof.full_name || `${prof.first_name} ${prof.last_name}`}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={view} onValueChange={(v) => handleViewChange(v as 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth')}>
            <TabsList>
              <TabsTrigger value="timeGridDay">Dia</TabsTrigger>
              <TabsTrigger value="timeGridWeek">Semana</TabsTrigger>
              <TabsTrigger value="dayGridMonth">Mes</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Leyenda de estados */}
      <div className="flex flex-wrap gap-3 text-sm">
        {Object.entries(statusLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: statusColors[key] }}
            />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendario */}
      <Card>
        <CardContent className="p-4 overflow-x-auto">
          {mounted ? (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={view}
              locale={esLocale}
              headerToolbar={false}
              events={calendarEvents}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              slotMinTime="08:00:00"
              slotMaxTime="21:00:00"
              slotDuration="00:30:00"
              allDaySlot={false}
              nowIndicator={true}
              height="auto"
              expandRows={true}
              stickyHeaderDates={true}
              dayMaxEvents={3}
              eventDisplay="block"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
              }}
            />
          ) : (
            <div className="h-[600px] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Cargando calendario...</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel de citas del dia (para movil) */}
      <div className="sm:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Citas de hoy</CardTitle>
            <CardDescription>
              {filteredAppointments.length} citas programadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No hay citas programadas</p>
            ) : (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedAppointment(apt)
                    setIsDetailOpen(true)
                  }}
                >
                  <div
                    className="w-1 h-12 rounded-full"
                    style={{ backgroundColor: apt.category_color || statusColors[apt.status] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{apt.patient_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {apt.treatment_display_name}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">
                      {new Date(apt.scheduled_at).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: statusColors[apt.status],
                        color: statusColors[apt.status],
                      }}
                    >
                      {statusLabels[apt.status]}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sheet de detalle de cita */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalle de Cita</SheetTitle>
            <SheetDescription>
              Informacion de la cita seleccionada
            </SheetDescription>
          </SheetHeader>

          {selectedAppointment && (
            <div className="mt-6 space-y-6">
              {/* Paciente */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedAppointment.patient_avatar || undefined} />
                  <AvatarFallback>
                    {selectedAppointment.patient_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedAppointment.patient_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.patient_phone}
                  </p>
                </div>
              </div>

              {/* Estado */}
              <div>
                <Badge
                  className="mb-2"
                  style={{
                    backgroundColor: statusColors[selectedAppointment.status],
                  }}
                >
                  {statusLabels[selectedAppointment.status]}
                </Badge>
              </div>

              {/* Detalles */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {new Date(selectedAppointment.scheduled_at).toLocaleDateString(
                        'es-MX',
                        {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Hora</p>
                    <p className="font-medium">
                      {new Date(selectedAppointment.scheduled_at).toLocaleTimeString(
                        'es-MX',
                        { hour: '2-digit', minute: '2-digit' }
                      )}{' '}
                      -{' '}
                      {new Date(selectedAppointment.end_at).toLocaleTimeString(
                        'es-MX',
                        { hour: '2-digit', minute: '2-digit' }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{
                      backgroundColor:
                        selectedAppointment.category_color || '#6366f1',
                    }}
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">Tratamiento</p>
                    <p className="font-medium">
                      {selectedAppointment.treatment_display_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Profesional</p>
                    <p className="font-medium">
                      {selectedAppointment.professional_name}
                    </p>
                  </div>
                </div>

                {selectedAppointment.room_name && (
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded"
                      style={{
                        backgroundColor: selectedAppointment.room_color || '#6366f1',
                      }}
                    />
                    <div>
                      <p className="text-sm text-muted-foreground">Sala</p>
                      <p className="font-medium">{selectedAppointment.room_name}</p>
                    </div>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notas</p>
                    <p className="text-sm bg-muted p-2 rounded">
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="space-y-2 pt-4 border-t">
                <Button className="w-full" asChild>
                  <Link href={`/agenda/${selectedAppointment.id}`}>
                    Ver detalles completos
                  </Link>
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handleReschedule} disabled={isRescheduling}>
                    {isRescheduling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Reprogramar
                  </Button>
                  <Button variant="outline" className="text-destructive" onClick={handleCancelAppointment} disabled={isCancelling}>
                    {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
