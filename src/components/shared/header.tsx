'use client'

import { Bell, Search, Menu, Sparkles } from 'lucide-react'
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

interface HeaderProps {
  user?: {
    firstName: string
    lastName: string
    email: string
    avatarUrl?: string
    role: string
  }
}

export function Header({ user }: HeaderProps) {
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'ML'

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

      {/* Search */}
      <div className="hidden flex-1 md:flex md:max-w-lg">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#998577]" />
          <Input
            type="search"
            placeholder="Buscar pacientes, citas, tratamientos..."
            className="w-full pl-11 h-11 rounded-xl border-[#e8e4df] bg-[#f5f3f0] placeholder:text-[#998577] focus:border-[#A67C52] focus:ring-[#A67C52]/20 transition-all"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Search Mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-[#998577] hover:text-[#A67C52] hover:bg-[#A67C52]/10"
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-xl text-[#998577] hover:text-[#A67C52] hover:bg-[#A67C52]/10"
            >
              <Bell className="h-5 w-5" />
              <Badge
                className="absolute -right-0.5 -top-0.5 h-5 w-5 rounded-full p-0 text-[10px] bg-[#e8a0c0] text-white border-2 border-white"
              >
                3
              </Badge>
              <span className="sr-only">Notificaciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 rounded-xl border-[#e8e4df] shadow-luxury-lg"
          >
            <DropdownMenuLabel className="font-display text-[#3d3d3d]">
              Notificaciones
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#e8e4df]" />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer hover:bg-[#f5f3f0]">
              <span className="font-medium text-[#3d3d3d]">Nueva cita programada</span>
              <span className="text-sm text-[#998577]">
                Maria Garcia - Limpieza Facial - 10:00 AM
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer hover:bg-[#f5f3f0]">
              <span className="font-medium text-[#3d3d3d]">Stock bajo</span>
              <span className="text-sm text-[#998577]">
                Acido Hialuronico - Quedan 5 unidades
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer hover:bg-[#f5f3f0]">
              <span className="font-medium text-[#3d3d3d]">Cita sin confirmar</span>
              <span className="text-sm text-[#998577]">
                3 citas para manana sin confirmar
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#e8e4df]" />
            <DropdownMenuItem className="text-center py-3 text-[#A67C52] hover:text-[#8a6543] cursor-pointer hover:bg-[#A67C52]/5">
              Ver todas las notificaciones
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
    </header>
  )
}
