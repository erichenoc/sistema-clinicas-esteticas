'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole, Permission } from '@/lib/auth/roles'
import { hasPermission, getRolePermissions, ROLE_LABELS } from '@/lib/auth/roles'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: UserRole
  clinicId: string
  avatarUrl: string | null
}

interface UserContextType {
  user: User | null
  isLoading: boolean
  hasPermission: (permission: Permission) => boolean
  permissions: Permission[]
  roleLabel: string
  refresh: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        setUser(null)
        return
      }

      // Buscar datos del usuario en la tabla users
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userData } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userData) {
        const user = userData as {
          id: string
          email: string
          first_name: string
          last_name: string
          role: string
          clinic_id: string
          avatar_url: string | null
        }
        setUser({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name} ${user.last_name}`,
          role: user.role as UserRole || 'receptionist',
          clinicId: user.clinic_id,
          avatarUrl: user.avatar_url,
        })
      } else {
        // Usuario autenticado pero sin registro en tabla users
        // Usar user_metadata.role si está disponible (configurado en Supabase Auth)
        const metaRole = authUser.user_metadata?.role as string | undefined
        let userRole: UserRole = 'receptionist'
        if (metaRole === 'admin' || metaRole === 'owner' || metaRole === 'doctor' || metaRole === 'nurse') {
          userRole = metaRole as UserRole
        }

        setUser({
          id: authUser.id,
          email: authUser.email || '',
          firstName: authUser.user_metadata?.first_name || 'Usuario',
          lastName: authUser.user_metadata?.last_name || '',
          fullName: `${authUser.user_metadata?.first_name || 'Usuario'} ${authUser.user_metadata?.last_name || ''}`.trim(),
          role: userRole,
          clinicId: '',
          avatarUrl: null,
        })
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()

    // Escuchar cambios de autenticación
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false
    return hasPermission(user.role, permission)
  }

  const permissions = user ? getRolePermissions(user.role) : []
  const roleLabel = user ? ROLE_LABELS[user.role] : ''

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        hasPermission: checkPermission,
        permissions,
        roleLabel,
        refresh: fetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Hook para verificar permisos específicos
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useUser()
  return hasPermission(permission)
}

// Componente para mostrar contenido solo si tiene permiso
export function RequirePermission({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}) {
  const hasAccess = usePermission(permission)
  return hasAccess ? <>{children}</> : <>{fallback}</>
}
