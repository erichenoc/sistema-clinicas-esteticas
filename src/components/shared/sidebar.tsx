'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  ClipboardList,
  ShoppingCart,
  Receipt,
  Package,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

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
    icon: Stethoscope,
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
    name: 'Facturación',
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
    name: 'Reportes',
    href: '/reportes',
    icon: BarChart3,
  },
]

const bottomNavigation = [
  {
    name: 'Configuración',
    href: '/configuracion',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">Clínica Estética</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="border-t px-3 py-4">
        <nav className="flex flex-col gap-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
          <Separator className="my-2" />
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </Button>
        </nav>
      </div>
    </div>
  )
}
