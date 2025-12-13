'use client'

import { Search, Menu, LogOut, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import { NotificationsDropdown } from './notifications-dropdown'
import { useUser } from '@/contexts/user-context'
import { logout } from '@/actions/auth'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth/roles'
import Link from 'next/link'

export function HeaderWrapper() {
  const { user, isLoading, roleLabel } = useUser()

  const initials = user
    ? `${user.firstName[0] || 'U'}${user.lastName[0] || 'S'}`.toUpperCase()
    : 'US'

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="hidden flex-1 md:flex md:max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar pacientes, citas..."
            className="w-full pl-9"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Search Mobile */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="h-5 w-5" />
          <span className="sr-only">Buscar</span>
        </Button>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl || undefined} alt={user?.firstName} />
                <AvatarFallback>{isLoading ? '...' : initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user ? user.fullName : 'Cargando...'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || 'usuario@clinica.com'}
                </p>
                {user && (
                  <Badge
                    variant="secondary"
                    className={`mt-1 w-fit text-xs text-white ${ROLE_COLORS[user.role]}`}
                  >
                    {ROLE_LABELS[user.role]}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/perfil" className="flex items-center cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/configuracion" className="flex items-center cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configuracion
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
