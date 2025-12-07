'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Filter, ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Users, Clock } from 'lucide-react'
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
import type { AppointmentListItem } from '@/types/appointments'

// Importar FullCalendar normalmente (manejaremos SSR con estado)
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'

// Mock data - profesionales
const mockProfessionals = [
  { id: '1', name: 'Dra. María García', color: '#ec4899', specialty: 'Dermatología' },
  { id: '2', name: 'Dr. Carlos López', color: '#3b82f6', specialty: 'Medicina Estética' },
  { id: '3', name: 'Lic. Ana Martínez', color: '#22c55e', specialty: 'Cosmetología' },
]

// Mock data - citas
const today = new Date()
const mockAppointments: AppointmentListItem[] = [
  {
    id: '1',
    clinicId: '1',
    branchId: null,
    patientId: '1',
    professionalId: '1',
    roomId: '1',
    treatmentId: '1',
    treatmentName: 'Limpieza Facial Profunda',
    packageSessionId: null,
    scheduledAt: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
    durationMinutes: 60,
    bufferMinutes: 0,
    status: 'confirmed',
    statusChangedAt: null,
    statusChangedBy: null,
    notes: null,
    patientNotes: null,
    cancellationReason: null,
    reminderSentAt: null,
    confirmationSentAt: null,
    isRecurring: false,
    recurrenceRule: null,
    parentAppointmentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: null,
    patientName: 'María García López',
    patientPhone: '5512345678',
    patientEmail: 'maria@email.com',
    patientAvatar: null,
    professionalName: 'Dra. María García',
    roomName: 'Cabina 1',
    roomColor: '#ec4899',
    treatmentDisplayName: 'Limpieza Facial Profunda',
    treatmentPrice: 80,
    categoryName: 'Facial',
    categoryColor: '#ec4899',
    endAt: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
  },
  {
    id: '2',
    clinicId: '1',
    branchId: null,
    patientId: '2',
    professionalId: '2',
    roomId: '2',
    treatmentId: '2',
    treatmentName: 'Botox - Frente',
    packageSessionId: null,
    scheduledAt: new Date(today.setHours(10, 30, 0, 0)).toISOString(),
    durationMinutes: 30,
    bufferMinutes: 0,
    status: 'scheduled',
    statusChangedAt: null,
    statusChangedBy: null,
    notes: 'Primera vez',
    patientNotes: null,
    cancellationReason: null,
    reminderSentAt: null,
    confirmationSentAt: null,
    isRecurring: false,
    recurrenceRule: null,
    parentAppointmentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: null,
    patientName: 'Ana Martínez Ruiz',
    patientPhone: '5598765432',
    patientEmail: 'ana@email.com',
    patientAvatar: null,
    professionalName: 'Dr. Carlos López',
    roomName: 'Cabina 2',
    roomColor: '#3b82f6',
    treatmentDisplayName: 'Botox - Frente',
    treatmentPrice: 350,
    categoryName: 'Inyectables',
    categoryColor: '#06b6d4',
    endAt: new Date(today.setHours(11, 0, 0, 0)).toISOString(),
  },
  {
    id: '3',
    clinicId: '1',
    branchId: null,
    patientId: '3',
    professionalId: '3',
    roomId: '3',
    treatmentId: '3',
    treatmentName: 'Depilación Láser - Axilas',
    packageSessionId: null,
    scheduledAt: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
    durationMinutes: 20,
    bufferMinutes: 0,
    status: 'waiting',
    statusChangedAt: null,
    statusChangedBy: null,
    notes: null,
    patientNotes: null,
    cancellationReason: null,
    reminderSentAt: null,
    confirmationSentAt: null,
    isRecurring: false,
    recurrenceRule: null,
    parentAppointmentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: null,
    patientName: 'Laura Hernández',
    patientPhone: '5511223344',
    patientEmail: 'laura@email.com',
    patientAvatar: null,
    professionalName: 'Lic. Ana Martínez',
    roomName: 'Sala Láser',
    roomColor: '#ef4444',
    treatmentDisplayName: 'Depilación Láser - Axilas',
    treatmentPrice: 120,
    categoryName: 'Láser',
    categoryColor: '#ef4444',
    endAt: new Date(today.setHours(12, 20, 0, 0)).toISOString(),
  },
]

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
  in_progress: 'En atención',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
}

export default function AgendaPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'>('timeGridWeek')
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all')
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentListItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Manejar SSR - solo renderizar calendario en cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Filtrar citas por profesional
  const filteredAppointments = selectedProfessional === 'all'
    ? mockAppointments
    : mockAppointments.filter(apt => apt.professionalId === selectedProfessional)

  // Convertir citas a eventos de FullCalendar
  const calendarEvents = filteredAppointments.map((apt) => ({
    id: apt.id,
    title: apt.patientName,
    start: apt.scheduledAt,
    end: apt.endAt,
    backgroundColor: apt.categoryColor || statusColors[apt.status],
    borderColor: apt.categoryColor || statusColors[apt.status],
    extendedProps: apt,
  }))

  const handleEventClick = (info: any) => {
    setSelectedAppointment(info.event.extendedProps)
    setIsDetailOpen(true)
  }

  const handleDateClick = (info: any) => {
    // TODO: Abrir modal para crear nueva cita
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
    const options: Intl.DateTimeFormatOptions =
      view === 'dayGridMonth'
        ? { month: 'long', year: 'numeric' }
        : view === 'timeGridDay'
        ? { weekday: 'long', day: 'numeric', month: 'long' }
        : { month: 'long', year: 'numeric' }
    return currentDate.toLocaleDateString('es-MX', options)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gestiona las citas de tus pacientes
          </p>
        </div>
        <Button asChild>
          <Link href="/agenda/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cita
          </Link>
        </Button>
      </div>

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
              {mockProfessionals.map((prof) => (
                <SelectItem key={prof.id} value={prof.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: prof.color }}
                    />
                    {prof.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={view} onValueChange={(v) => handleViewChange(v as any)}>
            <TabsList>
              <TabsTrigger value="timeGridDay">Día</TabsTrigger>
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
        <CardContent className="p-4">
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

      {/* Panel de citas del día (para móvil) */}
      <div className="sm:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Citas de hoy</CardTitle>
            <CardDescription>
              {filteredAppointments.length} citas programadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredAppointments.map((apt) => (
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
                  style={{ backgroundColor: apt.categoryColor || statusColors[apt.status] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{apt.patientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {apt.treatmentDisplayName}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">
                    {new Date(apt.scheduledAt).toLocaleTimeString('es-MX', {
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
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Sheet de detalle de cita */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalle de Cita</SheetTitle>
            <SheetDescription>
              Información de la cita seleccionada
            </SheetDescription>
          </SheetHeader>

          {selectedAppointment && (
            <div className="mt-6 space-y-6">
              {/* Paciente */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedAppointment.patientAvatar || undefined} />
                  <AvatarFallback>
                    {selectedAppointment.patientName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedAppointment.patientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.patientPhone}
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
                      {new Date(selectedAppointment.scheduledAt).toLocaleDateString(
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
                      {new Date(selectedAppointment.scheduledAt).toLocaleTimeString(
                        'es-MX',
                        { hour: '2-digit', minute: '2-digit' }
                      )}{' '}
                      -{' '}
                      {new Date(selectedAppointment.endAt).toLocaleTimeString(
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
                        selectedAppointment.categoryColor || '#6366f1',
                    }}
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">Tratamiento</p>
                    <p className="font-medium">
                      {selectedAppointment.treatmentDisplayName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Profesional</p>
                    <p className="font-medium">
                      {selectedAppointment.professionalName}
                    </p>
                  </div>
                </div>

                {selectedAppointment.roomName && (
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded"
                      style={{
                        backgroundColor: selectedAppointment.roomColor || '#6366f1',
                      }}
                    />
                    <div>
                      <p className="text-sm text-muted-foreground">Sala</p>
                      <p className="font-medium">{selectedAppointment.roomName}</p>
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
                  <Button variant="outline">Reprogramar</Button>
                  <Button variant="outline" className="text-destructive">
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
