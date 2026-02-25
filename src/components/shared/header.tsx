'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Menu, Sparkles, User, Stethoscope, CalendarDays, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import { NotificationsDropdown } from './notifications-dropdown'
import { globalSearch, type SearchResult, type GlobalSearchResponse } from '@/actions/search'

interface HeaderProps {
  user?: {
    firstName: string
    lastName: string
    email: string
    avatarUrl?: string
    role: string
  }
}

const CATEGORY_ICONS = {
  patient: User,
  treatment: Stethoscope,
  appointment: CalendarDays,
} as const

const EMPTY_RESULTS: GlobalSearchResponse = {
  patients: [],
  treatments: [],
  appointments: [],
  error: null,
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResponse>(EMPTY_RESULTS)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'ML'

  // Cmd+K / Ctrl+K shortcut to open dialog
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults(EMPTY_RESULTS)
      setIsLoading(false)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [open])

  // Debounced search
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setResults(EMPTY_RESULTS)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await globalSearch(value)
        setResults(data)
      } catch {
        setResults(EMPTY_RESULTS)
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }, [])

  function handleSelectResult(result: SearchResult) {
    setOpen(false)
    router.push(result.href)
  }

  const totalResults =
    results.patients.length + results.treatments.length + results.appointments.length

  const hasQuery = query.trim().length >= 2
  const showEmpty = hasQuery && !isLoading && totalResults === 0

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#e8e4df] bg-white/80 backdrop-blur-sm px-4 lg:px-8">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden text-[#3d3d3d]">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 border-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Search trigger (desktop) */}
      <div className="hidden flex-1 md:flex md:max-w-lg">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative w-full flex items-center h-11 rounded-xl border border-[#e8e4df] bg-[#f5f3f0] px-4 gap-3 text-left cursor-pointer hover:border-[#A67C52] hover:bg-[#faf8f6] transition-all group"
          aria-label="Abrir busqueda global"
        >
          <Search className="h-4 w-4 text-[#998577] group-hover:text-[#A67C52] flex-shrink-0 transition-colors" />
          <span className="flex-1 text-sm text-[#998577]">
            Buscar pacientes, citas, tratamientos...
          </span>
          <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] text-[#c4b8ac] border border-[#e8e4df] rounded px-1.5 py-0.5 font-mono bg-white">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Search trigger (mobile) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="md:hidden text-[#998577] hover:text-[#A67C52] hover:bg-[#A67C52]/10"
          aria-label="Buscar"
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Buscar</span>
        </Button>

        {/* Quick Action Button */}
        <Button
          className="hidden sm:flex h-10 gap-2 rounded-xl bg-[#A67C52] text-white hover:bg-[#8a6543] shadow-lg shadow-[#A67C52]/20 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>Nueva Cita</span>
        </Button>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 gap-3 rounded-xl px-2 hover:bg-[#f5f3f0]"
            >
              <Avatar className="h-8 w-8 border-2 border-[#A67C52]/20">
                <AvatarImage src={user?.avatarUrl} alt={user?.firstName} />
                <AvatarFallback className="bg-[#A67C52] text-white text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-medium text-[#3d3d3d]">
                  {user ? `${user.firstName} ${user.lastName}` : 'Med Luxe'}
                </span>
                <span className="text-xs text-[#998577]">
                  {user?.role || 'Administrador'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl border-[#e8e4df] shadow-luxury-lg"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-[#3d3d3d]">
                  {user ? `${user.firstName} ${user.lastName}` : 'Med Luxe Admin'}
                </p>
                <p className="text-xs text-[#998577]">
                  {user?.email || 'admin@medluxe.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#e8e4df]" />
            <DropdownMenuItem className="cursor-pointer hover:bg-[#f5f3f0] text-[#3d3d3d]">
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-[#f5f3f0] text-[#3d3d3d]">
              Configuracion
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#e8e4df]" />
            <DropdownMenuItem className="cursor-pointer hover:bg-red-50 text-red-600">
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Global Search Dialog */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Busqueda global"
        description="Busca pacientes, tratamientos y citas"
        showCloseButton={false}
        className="rounded-2xl border-[#e8e4df] shadow-2xl max-w-xl"
      >
        <CommandInput
          placeholder="Buscar pacientes, tratamientos, citas..."
          value={query}
          onValueChange={handleQueryChange}
          className="text-[#3d3d3d] placeholder:text-[#998577] h-12"
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#998577]">
            <Loader2 className="h-4 w-4 animate-spin text-[#A67C52]" />
            <span>Buscando...</span>
          </div>
        )}

        {/* Results list */}
        {!isLoading && (
          <CommandList className="max-h-[420px]">
            {showEmpty && (
              <CommandEmpty className="py-10 text-sm text-[#998577]">
                Sin resultados para &quot;{query}&quot;
              </CommandEmpty>
            )}

            {!hasQuery && (
              <div className="py-8 text-center text-sm text-[#998577]">
                Escribe al menos 2 caracteres para buscar
              </div>
            )}

            {results.patients.length > 0 && (
              <CommandGroup
                heading="Pacientes"
                className="[&_[cmdk-group-heading]]:text-[#A67C52] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:py-2"
              >
                {results.patients.map((result) => {
                  const Icon = CATEGORY_ICONS[result.type]
                  return (
                    <CommandItem
                      key={result.id}
                      value={`patient-${result.id}-${result.title}`}
                      onSelect={() => handleSelectResult(result)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-[#A67C52]/10 data-[selected=true]:text-[#3d3d3d]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#A67C52]/10 text-[#A67C52] flex-shrink-0">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-[#3d3d3d] truncate">
                          {result.title}
                        </span>
                        <span className="text-xs text-[#998577] truncate">
                          {result.subtitle}
                        </span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {results.patients.length > 0 && results.treatments.length > 0 && (
              <CommandSeparator className="bg-[#e8e4df] my-1" />
            )}

            {results.treatments.length > 0 && (
              <CommandGroup
                heading="Tratamientos"
                className="[&_[cmdk-group-heading]]:text-[#A67C52] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:py-2"
              >
                {results.treatments.map((result) => {
                  const Icon = CATEGORY_ICONS[result.type]
                  return (
                    <CommandItem
                      key={result.id}
                      value={`treatment-${result.id}-${result.title}`}
                      onSelect={() => handleSelectResult(result)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-[#A67C52]/10 data-[selected=true]:text-[#3d3d3d]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#A67C52]/10 text-[#A67C52] flex-shrink-0">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-[#3d3d3d] truncate">
                          {result.title}
                        </span>
                        <span className="text-xs text-[#998577] truncate">
                          {result.subtitle}
                        </span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {(results.patients.length > 0 || results.treatments.length > 0) &&
              results.appointments.length > 0 && (
                <CommandSeparator className="bg-[#e8e4df] my-1" />
              )}

            {results.appointments.length > 0 && (
              <CommandGroup
                heading="Citas"
                className="[&_[cmdk-group-heading]]:text-[#A67C52] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:py-2"
              >
                {results.appointments.map((result) => {
                  const Icon = CATEGORY_ICONS[result.type]
                  return (
                    <CommandItem
                      key={result.id}
                      value={`appointment-${result.id}-${result.title}`}
                      onSelect={() => handleSelectResult(result)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-[#A67C52]/10 data-[selected=true]:text-[#3d3d3d]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#A67C52]/10 text-[#A67C52] flex-shrink-0">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-[#3d3d3d] truncate">
                          {result.title}
                        </span>
                        <span className="text-xs text-[#998577] truncate">
                          {result.subtitle}
                        </span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        )}

        {/* Footer hint */}
        <div className="border-t border-[#e8e4df] px-4 py-2.5 flex items-center gap-4 text-xs text-[#c4b8ac]">
          <span className="flex items-center gap-1">
            <kbd className="border border-[#e8e4df] rounded px-1 py-0.5 font-mono bg-[#f5f3f0] text-[10px]">
              Enter
            </kbd>
            para navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-[#e8e4df] rounded px-1 py-0.5 font-mono bg-[#f5f3f0] text-[10px]">
              Esc
            </kbd>
            para cerrar
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <kbd className="border border-[#e8e4df] rounded px-1 py-0.5 font-mono bg-[#f5f3f0] text-[10px]">
              ⌘K
            </kbd>
            busqueda global
          </span>
        </div>
      </CommandDialog>
    </header>
  )
}
