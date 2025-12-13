'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Calendar,
  Clock,
  User,
  Stethoscope,
  MapPin,
  FileText,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Status options
const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Programada', color: 'bg-blue-500' },
  { value: 'confirmed', label: 'Confirmada', color: 'bg-green-500' },
  { value: 'waiting', label: 'En espera', color: 'bg-amber-500' },
  { value: 'in_progress', label: 'En atencion', color: 'bg-purple-500' },
  { value: 'completed', label: 'Completada', color: 'bg-emerald-500' },
  { value: 'cancelled', label: 'Cancelada', color: 'bg-red-500' },
  { value: 'no_show', label: 'No asistio', color: 'bg-gray-500' },
]

// Mock data
const mockAppointment = {
  id: '1',
  patientId: '1',
  patientName: 'Maria Garcia Lopez',
  patientPhone: '809-555-1234',
  patientEmail: 'maria.garcia@email.com',
  professionalId: '1',
  professionalName: 'Dra. Maria Garcia',
  treatmentId: '1',
  treatmentName: 'Limpieza Facial Profunda',
  roomId: '1',
  roomName: 'Cabina 1',
  scheduledAt: new Date().toISOString(),
  durationMinutes: 60,
  status: 'confirmed',
  notes: 'Paciente tiene piel sensible.',
  patientNotes: 'Prefiere productos sin fragancia.',
}

const mockProfessionals = [
  { id: '1', name: 'Dra. Maria Garcia' },
  { id: '2', name: 'Dr. Carlos Martinez' },
  { id: '3', name: 'Lic. Ana Rodriguez' },
]

const mockRooms = [
  { id: '1', name: 'Cabina 1' },
  { id: '2', name: 'Cabina 2' },
  { id: '3', name: 'Sala de Tratamientos' },
]

export default function EditarCitaPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [appointment, setAppointment] = useState(mockAppointment)

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    durationMinutes: 60,
    professionalId: '',
    roomId: '',
    status: 'confirmed',
    notes: '',
    patientNotes: '',
  })

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const scheduledDate = new Date(mockAppointment.scheduledAt)
      setFormData({
        date: format(scheduledDate, 'yyyy-MM-dd'),
        time: format(scheduledDate, 'HH:mm'),
        durationMinutes: mockAppointment.durationMinutes,
        professionalId: mockAppointment.professionalId,
        roomId: mockAppointment.roomId,
        status: mockAppointment.status,
        notes: mockAppointment.notes,
        patientNotes: mockAppointment.patientNotes,
      })
      setIsLoading(false)
    }, 500)
  }, [appointmentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    toast.loading('Guardando cambios...', { id: 'save-appointment' })

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.dismiss('save-appointment')
      toast.success('Cita actualizada correctamente')
      router.push(`/agenda/${appointmentId}`)
    } catch (error) {
      toast.dismiss('save-appointment')
      toast.error('Error al actualizar la cita')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#A67C52]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/agenda/${appointmentId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Cita</h1>
            <p className="text-muted-foreground">
              {appointment.treatmentName} - {appointment.patientName}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Info Card (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#A67C52]" />
              Informacion del Paciente
            </CardTitle>
            <CardDescription>Datos del paciente (no editables)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Paciente</p>
                <p className="font-medium">{appointment.patientName}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Telefono</p>
                <p className="font-medium">{appointment.patientPhone}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Tratamiento</p>
                <p className="font-medium">{appointment.treatmentName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#A67C52]" />
              Fecha y Hora
            </CardTitle>
            <CardDescription>Modifica la programacion de la cita</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Hora</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duracion (minutos)</Label>
                <Select
                  value={formData.durationMinutes.toString()}
                  onValueChange={(v) => setFormData({ ...formData, durationMinutes: parseInt(v) })}
                >
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1h 30min</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-[#A67C52]" />
              Asignacion
            </CardTitle>
            <CardDescription>Profesional y ubicacion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="professional">Profesional</Label>
                <Select
                  value={formData.professionalId}
                  onValueChange={(v) => setFormData({ ...formData, professionalId: v })}
                >
                  <SelectTrigger id="professional">
                    <SelectValue placeholder="Selecciona un profesional" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProfessionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Sala/Cabina</Label>
                <Select
                  value={formData.roomId}
                  onValueChange={(v) => setFormData({ ...formData, roomId: v })}
                >
                  <SelectTrigger id="room">
                    <SelectValue placeholder="Selecciona una sala" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockRooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#A67C52]" />
              Estado de la Cita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notes Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#A67C52]" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notas internas</Label>
              <Textarea
                id="notes"
                placeholder="Notas para el equipo..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientNotes">Notas del paciente</Label>
              <Textarea
                id="patientNotes"
                placeholder="Preferencias o instrucciones del paciente..."
                value={formData.patientNotes}
                onChange={(e) => setFormData({ ...formData, patientNotes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/agenda/${appointmentId}`}>Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#A67C52] hover:bg-[#8a6543]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}
