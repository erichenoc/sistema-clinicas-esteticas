export const revalidate = 30

import { Search, LayoutGrid, List, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientCard } from './_components/patient-card'
import { PatientTable } from './_components/patient-table'
import { PatientsHeader } from './_components/patients-header'
import { PatientsFilters } from './_components/patients-filters'
import { getPatients, getPatientStats } from '@/actions/patients'
import type { PatientListItem } from '@/types/patients'

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'vip', label: 'VIP' },
  { value: 'blocked', label: 'Bloqueados' },
]

export default async function PacientesPage() {
  const [dbPatients, stats] = await Promise.all([
    getPatients(),
    getPatientStats(),
  ])

  // Transform database patients to PatientListItem format
  const patients: PatientListItem[] = dbPatients.map((p) => ({
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    email: p.email || '',
    phone: p.phone || '',
    dateOfBirth: p.date_of_birth || '',
    status: p.status as 'active' | 'inactive' | 'vip' | 'blocked',
    tags: p.tags || [],
    avatarUrl: p.avatar_url,
    totalAppointments: p.visit_count || 0,
    lastAppointmentAt: p.last_visit_at || null,
    totalSpent: p.total_spent || 0,
  }))

  const { total, active: activeCount, vip: vipCount, inactive: inactiveCount } = stats

  return (
    <div className="space-y-6">
      {/* Header */}
      <PatientsHeader patients={patients} />

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Pacientes</p>
          <p className="text-2xl font-bold">{patients.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Activos</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">VIP</p>
          <p className="text-2xl font-bold text-yellow-600">{vipCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Inactivos</p>
          <p className="text-2xl font-bold text-gray-600">{inactiveCount}</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            className="pl-9"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select defaultValue="createdAt">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Fecha de registro</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="lastAppointment">Última cita</SelectItem>
            <SelectItem value="totalSpent">Total gastado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtros rapidos por etiquetas */}
      <PatientsFilters
        totalCount={patients.length}
        vipCount={vipCount}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
      />

      {/* Vista de pacientes */}
      <Tabs defaultValue="list" className="w-full">
        <div className="flex justify-end">
          <TabsList>
            <TabsTrigger value="grid">
              <LayoutGrid className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid" className="mt-4">
          {patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">No hay pacientes registrados</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Registra tu primer paciente para comenzar</p>
              <a href="/pacientes/nuevo" className="mt-4 inline-flex items-center rounded-lg bg-[#A67C52] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a6543]">
                Nuevo Paciente
              </a>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {patients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          {patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">No hay pacientes registrados</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Registra tu primer paciente para comenzar</p>
              <a href="/pacientes/nuevo" className="mt-4 inline-flex items-center rounded-lg bg-[#A67C52] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a6543]">
                Nuevo Paciente
              </a>
            </div>
          ) : (
            <PatientTable patients={patients} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
