'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PatientsFiltersProps {
  totalCount: number
  vipCount: number
  activeCount: number
  inactiveCount: number
  onFilterChange?: (filter: string) => void
}

export function PatientsFilters({
  totalCount,
  vipCount,
  activeCount,
  inactiveCount,
  onFilterChange,
}: PatientsFiltersProps) {
  const [activeFilter, setActiveFilter] = useState('all')

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter)
    onFilterChange?.(filter)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={activeFilter === 'all' ? 'secondary' : 'outline'}
        size="sm"
        className="rounded-full"
        onClick={() => handleFilterClick('all')}
      >
        Todos ({totalCount})
      </Button>
      <Button
        variant={activeFilter === 'vip' ? 'secondary' : 'outline'}
        size="sm"
        className="rounded-full"
        onClick={() => handleFilterClick('vip')}
      >
        <span className="mr-2 h-2 w-2 rounded-full bg-yellow-500" />
        VIP ({vipCount})
      </Button>
      <Button
        variant={activeFilter === 'active' ? 'secondary' : 'outline'}
        size="sm"
        className="rounded-full"
        onClick={() => handleFilterClick('active')}
      >
        <span className="mr-2 h-2 w-2 rounded-full bg-green-500" />
        Activos ({activeCount})
      </Button>
      <Button
        variant={activeFilter === 'inactive' ? 'secondary' : 'outline'}
        size="sm"
        className="rounded-full"
        onClick={() => handleFilterClick('inactive')}
      >
        <span className="mr-2 h-2 w-2 rounded-full bg-gray-500" />
        Inactivos ({inactiveCount})
      </Button>
    </div>
  )
}
