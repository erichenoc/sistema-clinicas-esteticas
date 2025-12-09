'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Category {
  id: string
  name: string
  color: string
  treatmentCount: number
}

interface TreatmentFiltersProps {
  categories: Category[]
  totalCount: number
  onFilterChange?: (categoryId: string | null) => void
}

export function TreatmentFilters({
  categories,
  totalCount,
  onFilterChange,
}: TreatmentFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const handleFilterClick = (categoryId: string | null) => {
    setActiveFilter(categoryId)
    onFilterChange?.(categoryId)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={activeFilter === null ? 'secondary' : 'outline'}
        size="sm"
        className="rounded-full"
        onClick={() => handleFilterClick(null)}
      >
        Todos ({totalCount})
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={activeFilter === category.id ? 'secondary' : 'outline'}
          size="sm"
          className="rounded-full"
          onClick={() => handleFilterClick(category.id)}
        >
          <div
            className="mr-2 h-2 w-2 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          {category.name} ({category.treatmentCount})
        </Button>
      ))}
    </div>
  )
}
