import Link from 'next/link'
import { Plus, Search, LayoutGrid, List, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { getPatients } from '@/actions/medical-history'
import type { PatientListItem } from '@/types/patients'

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'vip', label: 'VIP' },
  { value: 'blocked', label: 'Bloqueados' },
]

export default async function PacientesPage() {
  const dbPatients = await getPatients()

  // Transform database patients to PatientListItem format
  const patients: PatientListItem[] = dbPatients.map((p) => ({
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    email: p.email || '',
    phone: p.phone || '',
    dateOfBirth: p.birth_date || '',
    status: p.status as 'active' | 'inactive' | 'vip' | 'blocked',
    tags: p.tags || [],
    avatarUrl: p.avatar_url,
    totalAppointments: 0, // TODO: Add relationship query
    lastAppointmentAt: null,
    totalSpent: 0, // TODO: Add relationship query
  }))

  const activeCount = patients.filter((p) => p.status === 'active').length
  const vipCount = patients.filter((p) => p.status === 'vip').length
  const inactiveCount = patients.filter((p) => p.status === 'inactive').length
  const newCount = patients.filter((p) => p.status === 'new').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gestiona la información de tus pacientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button asChild>
            <Link href="/pacientes/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Paciente
            </Link>
          </Button>
        </div>
      </div>

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
          <p className="text-sm text-muted-foreground">Nuevos</p>
          <p className="text-2xl font-bold text-blue-600">{newCount}</p>
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

      {/* Filtros rápidos por etiquetas */}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" className="rounded-full">
          Todos ({patients.length})
        </Button>
        <Button variant="outline" size="sm" className="rounded-full">
          <span className="mr-2 h-2 w-2 rounded-full bg-yellow-500" />
          VIP ({vipCount})
        </Button>
        <Button variant="outline" size="sm" className="rounded-full">
          <span className="mr-2 h-2 w-2 rounded-full bg-green-500" />
          Activos ({activeCount})
        </Button>
        <Button variant="outline" size="sm" className="rounded-full">
          <span className="mr-2 h-2 w-2 rounded-full bg-blue-500" />
          Nuevos ({newCount})
        </Button>
      </div>

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {patients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <PatientTable patients={patients} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
