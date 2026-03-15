'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Edit,
  Send,
  DollarSign,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { getAppointmentById, type AppointmentListItemData } from '@/actions/appointments'
import type { AppointmentStatus } from '@/types/appointments'

const statusConfig: Record<AppointmentStatus, { label: string; color: string; bgColor: string }> = {
  scheduled: { label: 'Programada', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  confirmed: { label: 'Confirmada', color: 'text-green-700', bgColor: 'bg-green-100' },
  waiting: { label: 'En espera', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  in_progress: { label: 'En atención', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  completed: { label: 'Completada', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  cancelled: { label: 'Cancelada', color: 'text-red-700', bgColor: 'bg-red-100' },
  no_show: { label: 'No asistió', color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AppointmentDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const [appointment, setAppointment] = useState<AppointmentListItemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundFlag, setNotFoundFlag] = useState(false)

  useEffect(() => {
    getAppointmentById(id).then(data => {
      if (!data) setNotFoundFlag(true)
      else setAppointment(data)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFoundFlag || !appointment) return notFound()

  const status = statusConfig[appointment.status as AppointmentStatus]
  const scheduledDate = new Date(appointment.scheduled_at)
  const endDate = new Date(appointment.end_at)

  // Filter out internal booking metadata from notes
  const cleanNotes = appointment.notes
    ?.split('\n')
    .filter(line => !line.match(/^(Tratamiento|Servicio|Paciente|Tel[eé]fono|Email):\s*/i))
    .join('\n')
    .trim() || null

  const handleStatusChange = (newStatus: AppointmentStatus) => {
    toast.success(`Estado cambiado a ${statusConfig[newStatus].label}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/agenda">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Detalle de Cita
              </h1>
              <Badge className={`${status?.bgColor} ${status?.color} border-0`}>
                {status?.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Creada el {new Date(appointment.created_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info('Función próximamente')}>
            <Send className="mr-2 h-4 w-4" />
            Enviar Recordatorio
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/agenda/${appointment.id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar cita
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('confirmed')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                <Clock className="mr-2 h-4 w-4" />
                Iniciar atención
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar completada
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleStatusChange('cancelled')}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar cita
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de la cita */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalles de la Cita
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {scheduledDate.toLocaleDateString('es-MX', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Hora</p>
                  <p className="font-medium">
                    {scheduledDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {endDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    <span className="text-muted-foreground ml-2">
                      ({appointment.duration_minutes} min)
                    </span>
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tratamiento</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: appointment.category_color || '#A67C52' }}
                    />
                    <p className="font-medium">{appointment.treatment_display_name || 'Sin tratamiento'}</p>
                  </div>
                  {appointment.category_name && (
                    <Badge variant="outline">{appointment.category_name}</Badge>
                  )}
                </div>
                {appointment.treatment_price != null && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Precio</p>
                    <p className="text-xl font-bold text-primary">
                      RD${appointment.treatment_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Profesional</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {appointment.professional_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{appointment.professional_name}</p>
                  </div>
                </div>
                {appointment.room_name && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Sala</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded"
                        style={{ backgroundColor: appointment.room_color || '#6366f1' }}
                      />
                      <p className="font-medium">{appointment.room_name}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          {cleanNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap break-words">{cleanNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna lateral - Paciente */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={appointment.patient_avatar || undefined} />
                  <AvatarFallback className="text-lg">
                    {appointment.patient_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{appointment.patient_name}</p>
                  <Button variant="link" className="h-auto p-0 text-sm" asChild>
                    <Link href={`/pacientes/${appointment.patient_id}`}>
                      Ver perfil completo
                    </Link>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {appointment.patient_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm">{appointment.patient_phone}</p>
                      <a
                        href={`https://wa.me/${appointment.patient_phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Enviar WhatsApp
                      </a>
                    </div>
                  </div>
                )}
                {appointment.patient_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm break-all">{appointment.patient_email}</p>
                      <a
                        href={`mailto:${appointment.patient_email}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Enviar email
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href={`/sesiones/nueva?appointmentId=${appointment.id}`}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Iniciar Sesión
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/pos?patientId=${appointment.patient_id}`}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Ir al POS
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Origen de reserva */}
          {appointment.google_event_id && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-blue-700 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Reserva Online
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700">
                  Esta cita fue creada desde medluxeclinic.com vía Google Calendar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
