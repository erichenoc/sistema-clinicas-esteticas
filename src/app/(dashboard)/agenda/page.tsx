export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AgendaCalendar } from './_components/agenda-calendar'
import { getAppointments, getProfessionals } from '@/actions/appointments'

export default async function AgendaPage() {
  // Obtener citas del mes actual (30 dias antes y despues)
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 30)
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + 60)

  const [appointments, professionals] = await Promise.all([
    getAppointments({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
    getProfessionals(),
  ])

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

      {/* Calendario */}
      <AgendaCalendar appointments={appointments} professionals={professionals} />
    </div>
  )
}
