'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Clock,
  Save,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { getProfessionalById, getProfessionalSchedule, saveProfessionalSchedule } from '@/actions/professionals'

interface DaySchedule {
  enabled: boolean
  start: string
  end: string
  breaks: { start: string; end: string }[]
}

interface WeekSchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

const defaultDaySchedule: DaySchedule = {
  enabled: true,
  start: '09:00',
  end: '18:00',
  breaks: [{ start: '12:00', end: '13:00' }],
}

const defaultWeekSchedule: WeekSchedule = {
  monday: { ...defaultDaySchedule },
  tuesday: { ...defaultDaySchedule },
  wednesday: { ...defaultDaySchedule },
  thursday: { ...defaultDaySchedule },
  friday: { ...defaultDaySchedule },
  saturday: { enabled: true, start: '09:00', end: '14:00', breaks: [] },
  sunday: { enabled: false, start: '09:00', end: '18:00', breaks: [] },
}

const dayNames: Record<keyof WeekSchedule, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miercoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sabado',
  sunday: 'Domingo',
}

export default function HorariosProfesionalPage() {
  const params = useParams()
  const professionalId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [professionalName, setProfessionalName] = useState('')
  const [schedule, setSchedule] = useState<WeekSchedule>(defaultWeekSchedule)

  useEffect(() => {
    async function loadData() {
      try {
        const [professional, savedSchedule] = await Promise.all([
          getProfessionalById(professionalId),
          getProfessionalSchedule(professionalId),
        ])

        if (professional) {
          setProfessionalName(professional.full_name)
        } else {
          toast.error('Profesional no encontrado')
        }

        // Load saved schedule if exists
        if (savedSchedule) {
          setSchedule(savedSchedule)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [professionalId])

  const handleDayToggle = (day: keyof WeekSchedule, enabled: boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled },
    }))
  }

  const handleTimeChange = (
    day: keyof WeekSchedule,
    field: 'start' | 'end',
    value: string
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  const handleBreakChange = (
    day: keyof WeekSchedule,
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: prev[day].breaks.map((b, i) =>
          i === index ? { ...b, [field]: value } : b
        ),
      },
    }))
  }

  const addBreak = (day: keyof WeekSchedule) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: [...prev[day].breaks, { start: '12:00', end: '13:00' }],
      },
    }))
  }

  const removeBreak = (day: keyof WeekSchedule, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: prev[day].breaks.filter((_, i) => i !== index),
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    toast.loading('Guardando horarios...', { id: 'save-schedule' })

    try {
      const result = await saveProfessionalSchedule(professionalId, schedule)

      toast.dismiss('save-schedule')

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Horarios guardados exitosamente')
      }
    } catch (error) {
      toast.dismiss('save-schedule')
      console.error('Error saving schedule:', error)
      toast.error('Error al guardar los horarios')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/profesionales">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Horarios</h1>
          <p className="text-muted-foreground">
            Configuracion de horarios para {professionalName}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horario Semanal
            </CardTitle>
            <CardDescription>
              Define los horarios de trabajo para cada dia de la semana
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(Object.keys(dayNames) as Array<keyof WeekSchedule>).map((day) => (
              <div
                key={day}
                className={`p-4 border rounded-lg ${
                  !schedule[day].enabled ? 'bg-muted/50' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={schedule[day].enabled}
                      onCheckedChange={(checked) => handleDayToggle(day, checked)}
                    />
                    <Label className="text-lg font-medium">{dayNames[day]}</Label>
                  </div>
                  {schedule[day].enabled && (
                    <div className="text-sm text-muted-foreground">
                      {schedule[day].start} - {schedule[day].end}
                    </div>
                  )}
                </div>

                {schedule[day].enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hora de Inicio</Label>
                        <Input
                          type="time"
                          value={schedule[day].start}
                          onChange={(e) =>
                            handleTimeChange(day, 'start', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hora de Fin</Label>
                        <Input
                          type="time"
                          value={schedule[day].end}
                          onChange={(e) =>
                            handleTimeChange(day, 'end', e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* Breaks */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Descansos</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addBreak(day)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar
                        </Button>
                      </div>
                      {schedule[day].breaks.map((breakTime, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs">Desde</Label>
                              <Input
                                type="time"
                                value={breakTime.start}
                                onChange={(e) =>
                                  handleBreakChange(day, index, 'start', e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Hasta</Label>
                              <Input
                                type="time"
                                value={breakTime.end}
                                onChange={(e) =>
                                  handleBreakChange(day, index, 'end', e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeBreak(day, index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {schedule[day].breaks.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Sin descansos programados
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/profesionales">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Horarios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
