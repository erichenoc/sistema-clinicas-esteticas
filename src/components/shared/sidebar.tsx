'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MedLuxeLogoSimple } from './medluxe-logo'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useUser } from '@/contexts/user-context'
import type { Permission } from '@/lib/auth/roles'

interface NavItem {
  name: string
  href: string
  icon: typeof LayoutDashboard
  permission?: Permission
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Pacientes',
    href: '/pacientes',
    icon: Users,
    permission: 'patients:view',
  },
  {
    name: 'Agenda',
    href: '/agenda',
    icon: Calendar,
    permission: 'appointments:view',
  },
  {
    name: 'Tratamientos',
    href: '/tratamientos',
    icon: Sparkles,
    permission: 'treatments:view',
  },
  {
    name: 'Sesiones',
    href: '/sesiones',
    icon: ClipboardList,
    permission: 'sessions:view',
  },
  {
    name: 'POS',
    href: '/pos',
    icon: ShoppingCart,
    permission: 'pos:view',
  },
  {
    name: 'Facturacion',
    href: '/facturacion',
    icon: Receipt,
    permission: 'billing:view',
  },
  {
    name: 'Inventario',
    href: '/inventario',
    icon: Package,
    permission: 'inventory:view',
  },
  {
    name: 'Profesionales',
    href: '/profesionales',
    icon: UserCog,
    permission: 'professionals:view',
  },
  {
    name: 'Nomina',
    href: '/nomina',
    icon: Wallet,
    permission: 'professionals:manage', // sueldos: solo admin/dueno
  },
  {
    name: 'Consentimientos',
    href: '/consentimientos',
    icon: FileText,
    permission: 'consents:view',
  },
  {
    name: 'Reportes',
    href: '/reportes',
    icon: BarChart3,
    permission: 'reports:view',
  },
]

const bottomNavigation: NavItem[] = [
  {
    name: 'Configuracion',
    href: '/configuracion',
    icon: Settings,
    permission: 'settings:view',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { hasPermission } = useUser()

  // Mostrar solo lo que el rol puede usar (oculta Nomina/sueldos a la cajera, etc.)
  const canSee = (item: NavItem) => !item.permission || hasPermission(item.permission)
  const visibleNavigation = navigation.filter(canSee)
  const visibleBottomNavigation = bottomNavigation.filter(canSee)

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success('Sesion cerrada exitosamente')
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesion:', error)
      toast.error('Error al cerrar sesion')
    }
  }

  return (
    <div className="flex h-full w-72 flex-col bg-sidebar">
      {/* Logo Section */}
      <div className="flex h-20 items-center justify-center border-b border-sidebar-border px-6">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <MedLuxeLogoSimple inverted />
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="flex flex-col gap-1">
          {visibleNavigation.map((item) => {
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
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
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
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary-foreground/80" />
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <nav className="flex flex-col gap-1">
          {visibleBottomNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="tracking-wide">{item.name}</span>
              </Link>
            )
          })}

          <Separator className="my-3 bg-sidebar-border" />

          {/* User Profile Section */}
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-sidebar-accent px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground">
              ML
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                Med Luxe Admin
              </p>
              <p className="text-xs text-sidebar-foreground/50 truncate">
                Administrador
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 text-white/60 hover:bg-red-500/10 hover:text-red-400"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="tracking-wide">Cerrar sesion</span>
          </Button>
        </nav>
      </div>
    </div>
  )
}
