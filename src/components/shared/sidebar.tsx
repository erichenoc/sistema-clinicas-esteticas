'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Sparkles,
  ClipboardList,
  ShoppingCart,
  Receipt,
  Package,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MedLuxeLogoSimple } from './medluxe-logo'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Pacientes',
    href: '/pacientes',
    icon: Users,
  },
  {
    name: 'Agenda',
    href: '/agenda',
    icon: Calendar,
  },
  {
    name: 'Tratamientos',
    href: '/tratamientos',
    icon: Sparkles,
  },
  {
    name: 'Sesiones',
    href: '/sesiones',
    icon: ClipboardList,
  },
  {
    name: 'POS',
    href: '/pos',
    icon: ShoppingCart,
  },
  {
    name: 'Facturacion',
    href: '/facturacion',
    icon: Receipt,
  },
  {
    name: 'Inventario',
    href: '/inventario',
    icon: Package,
  },
  {
    name: 'Profesionales',
    href: '/profesionales',
    icon: UserCog,
  },
  {
    name: 'Consentimientos',
    href: '/consentimientos',
    icon: FileText,
  },
  {
    name: 'Reportes',
    href: '/reportes',
    icon: BarChart3,
  },
]

const bottomNavigation = [
  {
    name: 'Configuracion',
    href: '/configuracion',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-72 flex-col bg-[#3d3632]">
      {/* Logo Section */}
      <div className="flex h-20 items-center justify-center border-b border-[#524b46] px-6">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <MedLuxeLogoSimple inverted />
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[#A67C52] text-white shadow-lg shadow-[#A67C52]/20'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    !isActive && 'group-hover:scale-110'
                  )}
                />
                <span className="tracking-wide">{item.name}</span>
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="border-t border-[#524b46] px-4 py-4">
        <nav className="flex flex-col gap-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[#A67C52] text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="tracking-wide">{item.name}</span>
              </Link>
            )
          })}

          <Separator className="my-3 bg-[#524b46]" />

          {/* User Profile Section */}
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#A67C52] text-sm font-medium text-white">
              ML
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Med Luxe Admin
              </p>
              <p className="text-xs text-white/50 truncate">
                Administrador
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 text-white/60 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            <span className="tracking-wide">Cerrar sesion</span>
          </Button>
        </nav>
      </div>
    </div>
  )
}
