export const dynamic = 'force-dynamic'

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
import { TreatmentFilters } from './_components/treatment-filters'
import { getTreatments, getCategories } from '@/actions/treatments'
import type { TreatmentListItem } from '@/types/treatments'

export default async function TratamientosPage() {
  const [dbTreatments, dbCategories] = await Promise.all([
    getTreatments(),
    getCategories(),
  ])

  // Transform to expected format for components
  const treatments: TreatmentListItem[] = dbTreatments.map((t) => ({
    id: t.id,
    name: t.name,
    categoryName: t.category_name,
    categoryColor: t.category_color,
    price: t.price,
    durationMinutes: t.duration_minutes,
    isActive: t.is_active,
    imageUrl: t.image_url,
  }))

  const categories = dbCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    color: c.color,
    treatmentCount: c.treatment_count,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tratamientos</h1>
          <p className="text-muted-foreground">
            Gestiona el catalogo de servicios de tu clinica
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/tratamientos/categorias">
              <Filter className="mr-2 h-4 w-4" />
              Categorias
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

      {/* Filtros y busqueda */}
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
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorias</SelectItem>
            {categories.map((category) => (
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

      {/* Categorias rapidas */}
      <TreatmentFilters
        categories={categories}
        totalCount={treatments.length}
      />

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
          {treatments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay tratamientos registrados</p>
              <Button asChild className="mt-4">
                <Link href="/tratamientos/nuevo">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer tratamiento
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {treatments.map((treatment) => (
                <TreatmentCard key={treatment.id} treatment={treatment} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <TreatmentTable treatments={treatments} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
