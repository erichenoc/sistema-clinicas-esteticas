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
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  getAppointmentById,
  updateAppointment,
  getProfessionals,
  getRooms,
  type ProfessionalData,
  type RoomData,
} from '@/actions/appointments'

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Programada', color: 'bg-blue-500' },
  { value: 'confirmed', label: 'Confirmada', color: 'bg-green-500' },
  { value: 'waiting', label: 'En espera', color: 'bg-amber-500' },
  { value: 'in_progress', label: 'En atencion', color: 'bg-purple-500' },
  { value: 'completed', label: 'Completada', color: 'bg-emerald-500' },
  { value: 'cancelled', label: 'Cancelada', color: 'bg-red-500' },
  { value: 'no_show', label: 'No asistio', color: 'bg-gray-500' },
]

const DURATION_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1h 30min' },
  { value: '120', label: '2 horas' },
]

export default function EditarCitaPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [treatmentName, setTreatmentName] = useState('')
  const [professionals, setProfessionals] = useState<ProfessionalData[]>([])
  const [rooms, setRooms] = useState<RoomData[]>([])

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    durationMinutes: 60,
    professionalId: '',
    roomId: 'none',
    status: 'scheduled',
    notes: '',
  })

  useEffect(() => {
    async function load() {
      const [appt, profs, roomList] = await Promise.all([
        getAppointmentById(appointmentId),
        getProfessionals(),
        getRooms(),
      ])

      if (!appt) {
        toast.error('Cita no encontrada')
        router.push('/agenda')
        return
      }

      const scheduledDate = new Date(appt.scheduled_at)
      setPatientName(appt.patient_name)
      setPatientPhone(appt.patient_phone || '')
      setTreatmentName(appt.treatment_display_name || '')
      setProfessionals(profs)
      setRooms(roomList)
      setFormData({
        date: format(scheduledDate, 'yyyy-MM-dd'),
        time: format(scheduledDate, 'HH:mm'),
        durationMinutes: appt.duration_minutes,
        professionalId: appt.professional_id,
        roomId: appt.room_id || 'none',
        status: appt.status,
        notes: appt.notes || '',
      })
      setIsLoading(false)
    }
    load()
  }, [appointmentId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.date || !formData.time) {
      toast.error('La fecha y hora son requeridas')
      return
    }
    setIsSubmitting(true)
    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}`).toISOString()
      const result = await updateAppointment(appointmentId, {
        professional_id: formData.professionalId,
        room_id: formData.roomId !== 'none' ? formData.roomId : undefined,
        scheduled_at: scheduledAt,
        duration_minutes: formData.durationMinutes,
        status: formData.status as Parameters<typeof updateAppointment>[1]['status'],
        notes: formData.notes || undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Cita actualizada correctamente')
      router.push(`/agenda/${appointmentId}`)
    } catch {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/agenda/${appointmentId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Cita</h1>
          <p className="text-muted-foreground">{treatmentName} — {patientName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Paciente (solo lectura) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#A67C52]" />
              Paciente
            </CardTitle>
            <CardDescription>Datos no editables desde esta pantalla</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Paciente</p>
                <p className="font-medium">{patientName}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium">{patientPhone || '—'}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Tratamiento</p>
                <p className="font-medium">{treatmentName || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fecha y hora */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#A67C52]" />
              Fecha y Hora
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Hora</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duración</Label>
                <Select
                  value={formData.durationMinutes.toString()}
                  onValueChange={v => setFormData({ ...formData, durationMinutes: parseInt(v) })}
                >
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asignación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-[#A67C52]" />
              Asignación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="professional">Profesional</Label>
                <Select
                  value={formData.professionalId}
                  onValueChange={v => setFormData({ ...formData, professionalId: v })}
                >
                  <SelectTrigger id="professional">
                    <SelectValue placeholder="Selecciona un profesional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Sala/Cabina</Label>
                <Select
                  value={formData.roomId}
                  onValueChange={v => setFormData({ ...formData, roomId: v })}
                >
                  <SelectTrigger id="room">
                    <SelectValue placeholder="Sin sala asignada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin sala</SelectItem>
                    {rooms.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#A67C52]" />
              Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="status">Estado de la cita</Label>
              <Select
                value={formData.status}
                onValueChange={v => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${s.color}`} />
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#A67C52]" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              placeholder="Notas internas de la cita..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/agenda/${appointmentId}`}>Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#A67C52] hover:bg-[#8a6543]"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}
