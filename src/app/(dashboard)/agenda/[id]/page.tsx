'use client'

import { use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Edit,
  Printer,
  Send,
  DollarSign,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { AppointmentListItem, AppointmentStatus } from '@/types/appointments'

// Mock data - en producción vendría de la base de datos
const mockAppointments: Record<string, AppointmentListItem> = {
  '1': {
    id: '1',
    clinicId: '1',
    branchId: null,
    patientId: 'ea19a372-8de2-4258-b963-9bb8d5044ffa',
    professionalId: '1',
    roomId: '1',
    treatmentId: '1',
    treatmentName: 'Limpieza Facial Profunda',
    packageSessionId: null,
    scheduledAt: new Date().toISOString(),
    durationMinutes: 60,
    bufferMinutes: 0,
    status: 'confirmed',
    statusChangedAt: null,
    statusChangedBy: null,
    notes: 'Paciente tiene piel sensible. Usar productos hipoalergénicos.',
    patientNotes: 'Prefiere que no usen productos con fragancia.',
    cancellationReason: null,
    reminderSentAt: new Date(Date.now() - 86400000).toISOString(),
    confirmationSentAt: new Date(Date.now() - 3600000).toISOString(),
    isRecurring: false,
    recurrenceRule: null,
    parentAppointmentId: null,
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: null,
    patientName: 'María García López',
    patientPhone: '5512345678',
    patientEmail: 'maria.garcia@email.com',
    patientAvatar: null,
    professionalName: 'Dra. María García',
    roomName: 'Cabina 1',
    roomColor: '#ec4899',
    treatmentDisplayName: 'Limpieza Facial Profunda',
    treatmentPrice: 1200,
    categoryName: 'Facial',
    categoryColor: '#ec4899',
    endAt: new Date(new Date().getTime() + 60 * 60000).toISOString(),
  },
  '2': {
    id: '2',
    clinicId: '1',
    branchId: null,
    patientId: '66280efb-8296-4fd5-8e8d-f71d2787de21',
    professionalId: '2',
    roomId: '2',
    treatmentId: '2',
    treatmentName: 'Botox - Frente',
    packageSessionId: null,
    scheduledAt: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    durationMinutes: 30,
    bufferMinutes: 0,
    status: 'scheduled',
    statusChangedAt: null,
    statusChangedBy: null,
    notes: 'Primera vez con tratamiento de Botox',
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
    patientEmail: 'ana.martinez@email.com',
    patientAvatar: null,
    professionalName: 'Dr. Carlos López',
    roomName: 'Cabina 2',
    roomColor: '#3b82f6',
    treatmentDisplayName: 'Botox - Frente',
    treatmentPrice: 5500,
    categoryName: 'Inyectables',
    categoryColor: '#06b6d4',
    endAt: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
  },
  '3': {
    id: '3',
    clinicId: '1',
    branchId: null,
    patientId: '636beca5-3a92-4616-a4b2-a5335af96b7f',
    professionalId: '3',
    roomId: '3',
    treatmentId: '3',
    treatmentName: 'Depilación Láser - Axilas',
    packageSessionId: null,
    scheduledAt: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
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
    patientEmail: 'laura.h@email.com',
    patientAvatar: null,
    professionalName: 'Lic. Ana Martínez',
    roomName: 'Sala Láser',
    roomColor: '#ef4444',
    treatmentDisplayName: 'Depilación Láser - Axilas',
    treatmentPrice: 2800,
    categoryName: 'Láser',
    categoryColor: '#ef4444',
    endAt: new Date(new Date().setHours(12, 20, 0, 0)).toISOString(),
  },
}

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
  const appointment = mockAppointments[id]

  if (!appointment) {
    notFound()
  }

  const status = statusConfig[appointment.status]
  const scheduledDate = new Date(appointment.scheduledAt)
  const endDate = new Date(appointment.endAt)

  const handleStatusChange = (newStatus: AppointmentStatus) => {
    toast.success(`Estado cambiado a ${statusConfig[newStatus].label}`)
  }

  const handleSendReminder = () => {
    toast.success('Recordatorio enviado al paciente')
  }

  const handlePrint = () => {
    window.print()
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
                Cita #{appointment.id}
              </h1>
              <Badge className={`${status.bgColor} ${status.color} border-0`}>
                {status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Creada el {new Date(appointment.createdAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={handleSendReminder}>
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
                    {scheduledDate.toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {endDate.toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    <span className="text-muted-foreground ml-2">
                      ({appointment.durationMinutes} min)
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
                      style={{ backgroundColor: appointment.categoryColor || '#6366f1' }}
                    />
                    <p className="font-medium">{appointment.treatmentDisplayName}</p>
                  </div>
                  <Badge variant="outline">{appointment.categoryName}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Precio</p>
                  <p className="text-xl font-bold text-primary">
                    RD${appointment.treatmentPrice?.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Profesional</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {appointment.professionalName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{appointment.professionalName}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Sala</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: appointment.roomColor || '#6366f1' }}
                    />
                    <p className="font-medium">{appointment.roomName}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="clinical">
                <TabsList>
                  <TabsTrigger value="clinical">Notas Clínicas</TabsTrigger>
                  <TabsTrigger value="patient">Notas del Paciente</TabsTrigger>
                </TabsList>
                <TabsContent value="clinical" className="mt-4">
                  {appointment.notes ? (
                    <p className="text-sm">{appointment.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Sin notas clínicas
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="patient" className="mt-4">
                  {appointment.patientNotes ? (
                    <p className="text-sm">{appointment.patientNotes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Sin notas del paciente
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Historial de estados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointment.confirmationSentAt && (
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium">Confirmación enviada</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appointment.confirmationSentAt).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                )}
                {appointment.reminderSentAt && (
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Recordatorio enviado</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appointment.reminderSentAt).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Cita creada</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(appointment.createdAt).toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                  <AvatarImage src={appointment.patientAvatar || undefined} />
                  <AvatarFallback className="text-lg">
                    {appointment.patientName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{appointment.patientName}</p>
                  <Button variant="link" className="h-auto p-0 text-sm" asChild>
                    <Link href={`/pacientes/${appointment.patientId}`}>
                      Ver perfil completo
                    </Link>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{appointment.patientPhone}</p>
                    <a
                      href={`https://wa.me/${appointment.patientPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Enviar WhatsApp
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{appointment.patientEmail}</p>
                    <a
                      href={`mailto:${appointment.patientEmail}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Enviar email
                    </a>
                  </div>
                </div>
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
                  <Link href={`/pos?patientId=${appointment.patientId}`}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Ir al POS
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alertas */}
          {appointment.notes && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-amber-700 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Recordatorio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700">{appointment.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
