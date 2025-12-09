'use client'

import { useState, useMemo } from 'react'
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
import { TreatmentCard } from './treatment-card'
import { TreatmentTable } from './treatment-table'
import { TreatmentFilters } from './treatment-filters'
import type { TreatmentListItem } from '@/types/treatments'

interface Category {
  id: string
  name: string
  slug: string
  color: string
  treatmentCount: number
}

interface TreatmentsClientProps {
  treatments: TreatmentListItem[]
  categories: Category[]
}

export function TreatmentsClient({ treatments, categories }: TreatmentsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  // Filter treatments based on search, category, and status
  const filteredTreatments = useMemo(() => {
    return treatments.filter(treatment => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          treatment.name.toLowerCase().includes(query) ||
          treatment.categoryName?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Category filter from dropdown or quick filters
      const categoryToFilter = filterCategory || (selectedCategory !== 'all' ? selectedCategory : null)
      if (categoryToFilter) {
        const category = categories.find(c => c.id === categoryToFilter)
        if (category && treatment.categoryName !== category.name) {
          return false
        }
      }

      // Status filter
      if (selectedStatus === 'active' && !treatment.isActive) return false
      if (selectedStatus === 'inactive' && treatment.isActive) return false

      return true
    })
  }, [treatments, searchQuery, selectedCategory, selectedStatus, filterCategory, categories])

  // Update category counts for quick filters based on actual data
  const categoriesWithCounts = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      treatmentCount: treatments.filter(t => t.categoryName === cat.name).length,
    }))
  }, [categories, treatments])

  const handleFilterChange = (categoryId: string | null) => {
    setFilterCategory(categoryId)
    // Also sync with dropdown
    setSelectedCategory(categoryId || 'all')
  }

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value)
    // Also sync with quick filters
    setFilterCategory(value === 'all' ? null : value)
  }

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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/tratamientos/categorias">
              <Filter className="mr-2 h-4 w-4" />
              Categorias
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tratamientos/paquetes">
              <Package className="mr-2 h-4 w-4" />
              Paquetes
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/tratamientos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Tratamiento</span>
              <span className="sm:hidden">Nuevo</span>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={handleCategorySelect}>
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
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
        categories={categoriesWithCounts}
        totalCount={treatments.length}
        onFilterChange={handleFilterChange}
      />

      {/* Resultado de busqueda */}
      {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Mostrando {filteredTreatments.length} de {treatments.length} tratamientos
          </span>
          {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setSelectedStatus('all')
                setFilterCategory(null)
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      )}

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
          {filteredTreatments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {treatments.length === 0 ? (
                <>
                  <p>No hay tratamientos registrados</p>
                  <Button asChild className="mt-4">
                    <Link href="/tratamientos/nuevo">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear primer tratamiento
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <p>No se encontraron tratamientos con los filtros aplicados</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('all')
                      setSelectedStatus('all')
                      setFilterCategory(null)
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTreatments.map((treatment) => (
                <TreatmentCard key={treatment.id} treatment={treatment} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <TreatmentTable treatments={filteredTreatments} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
