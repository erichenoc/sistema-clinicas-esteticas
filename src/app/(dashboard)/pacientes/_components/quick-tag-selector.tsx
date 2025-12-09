'use client'

import { useState } from 'react'
import { Check, Plus, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface QuickTagSelectorProps {
  label: string
  selectedTags: string[]
  suggestedTags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  variant?: 'default' | 'destructive' | 'warning'
  allowCustom?: boolean
  disabled?: boolean
  maxDisplay?: number
}

export function QuickTagSelector({
  label,
  selectedTags,
  suggestedTags,
  onChange,
  placeholder = 'Buscar o agregar...',
  variant = 'default',
  allowCustom = true,
  disabled = false,
  maxDisplay = 12,
}: QuickTagSelectorProps) {
  const [searchValue, setSearchValue] = useState('')
  const [showAll, setShowAll] = useState(false)

  const filteredSuggestions = suggestedTags.filter(
    (tag) =>
      tag.toLowerCase().includes(searchValue.toLowerCase()) &&
      !selectedTags.includes(tag)
  )

  const displayedSuggestions = showAll
    ? filteredSuggestions
    : filteredSuggestions.slice(0, maxDisplay)

  const handleToggleTag = (tag: string) => {
    if (disabled) return
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag))
    } else {
      onChange([...selectedTags, tag])
    }
  }

  const handleAddCustom = () => {
    if (!allowCustom || disabled || !searchValue.trim()) return
    const newTag = searchValue.trim()
    if (!selectedTags.includes(newTag)) {
      onChange([...selectedTags, newTag])
    }
    setSearchValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCustom()
    }
  }

  const variantStyles = {
    default: {
      selected: 'bg-primary text-primary-foreground hover:bg-primary/90',
      unselected: 'bg-secondary hover:bg-secondary/80',
      badge: 'secondary' as const,
    },
    destructive: {
      selected: 'bg-red-500 text-white hover:bg-red-600',
      unselected: 'bg-red-100 text-red-700 hover:bg-red-200',
      badge: 'destructive' as const,
    },
    warning: {
      selected: 'bg-amber-500 text-white hover:bg-amber-600',
      unselected: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
      badge: 'outline' as const,
    },
  }

  const styles = variantStyles[variant]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {selectedTags.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {selectedTags.length} seleccionado{selectedTags.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant={styles.badge}
              className="gap-1 pr-1 cursor-pointer"
              onClick={() => handleToggleTag(tag)}
            >
              {tag}
              {!disabled && (
                <X className="h-3 w-3 ml-1 hover:text-white" />
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Search/Add Input */}
      {allowCustom && !disabled && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-9 pr-20"
            disabled={disabled}
          />
          {searchValue.trim() && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleAddCustom}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          )}
        </div>
      )}

      {/* Quick Selection Chips */}
      <div className="flex flex-wrap gap-2">
        {displayedSuggestions.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleToggleTag(tag)}
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              'border border-transparent',
              selectedTags.includes(tag) ? styles.selected : styles.unselected,
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {selectedTags.includes(tag) && <Check className="h-3 w-3" />}
            {tag}
          </button>
        ))}
        {filteredSuggestions.length > maxDisplay && !showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            +{filteredSuggestions.length - maxDisplay} mas
          </button>
        )}
        {showAll && filteredSuggestions.length > maxDisplay && (
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Ver menos
          </button>
        )}
      </div>

      {/* Empty State */}
      {selectedTags.length === 0 && filteredSuggestions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No hay opciones disponibles. {allowCustom && 'Escribe para agregar una nueva.'}
        </p>
      )}
    </div>
  )
}
