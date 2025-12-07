import Link from 'next/link'
import { Plus, Search, Filter, LayoutGrid, List, Package } from 'lucide-react'
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
import { TreatmentCard } from './_components/treatment-card'
import { TreatmentTable } from './_components/treatment-table'

// Mock data - será reemplazado por datos de Supabase
const mockCategories = [
  { id: '1', name: 'Facial', slug: 'facial', color: '#ec4899', treatmentCount: 8 },
  { id: '2', name: 'Corporal', slug: 'corporal', color: '#8b5cf6', treatmentCount: 5 },
  { id: '3', name: 'Láser', slug: 'laser', color: '#ef4444', treatmentCount: 4 },
  { id: '4', name: 'Inyectables', slug: 'inyectables', color: '#06b6d4', treatmentCount: 6 },
]

const mockTreatments = [
  {
    id: '1',
    name: 'Limpieza Facial Profunda',
    categoryName: 'Facial',
    categoryColor: '#ec4899',
    price: 80,
    durationMinutes: 60,
    isActive: true,
    imageUrl: null,
  },
  {
    id: '2',
    name: 'Botox - Frente',
    categoryName: 'Inyectables',
    categoryColor: '#06b6d4',
    price: 350,
    durationMinutes: 30,
    isActive: true,
    imageUrl: null,
  },
  {
    id: '3',
    name: 'Depilación Láser - Axilas',
    categoryName: 'Láser',
    categoryColor: '#ef4444',
    price: 120,
    durationMinutes: 20,
    isActive: true,
    imageUrl: null,
  },
  {
    id: '4',
    name: 'Hidratación Facial',
    categoryName: 'Facial',
    categoryColor: '#ec4899',
    price: 95,
    durationMinutes: 45,
    isActive: true,
    imageUrl: null,
  },
  {
    id: '5',
    name: 'Ácido Hialurónico - Labios',
    categoryName: 'Inyectables',
    categoryColor: '#06b6d4',
    price: 400,
    durationMinutes: 30,
    isActive: true,
    imageUrl: null,
  },
  {
    id: '6',
    name: 'Radiofrecuencia Corporal',
    categoryName: 'Corporal',
    categoryColor: '#8b5cf6',
    price: 150,
    durationMinutes: 60,
    isActive: false,
    imageUrl: null,
  },
]

export default function TratamientosPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tratamientos</h1>
          <p className="text-muted-foreground">
            Gestiona el catálogo de servicios de tu clínica
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/tratamientos/categorias">
              <Filter className="mr-2 h-4 w-4" />
              Categorías
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tratamientos/paquetes">
              <Package className="mr-2 h-4 w-4" />
              Paquetes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/tratamientos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tratamiento
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tratamientos..."
            className="pl-9"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {mockCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Categorías rápidas */}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" className="rounded-full">
          Todos ({mockTreatments.length})
        </Button>
        {mockCategories.map((category) => (
          <Button
            key={category.id}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            <div
              className="mr-2 h-2 w-2 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.name} ({category.treatmentCount})
          </Button>
        ))}
      </div>

      {/* Vista de tratamientos */}
      <Tabs defaultValue="grid" className="w-full">
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
            {mockTreatments.map((treatment) => (
              <TreatmentCard key={treatment.id} treatment={treatment} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <TreatmentTable treatments={mockTreatments} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
