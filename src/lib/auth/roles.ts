// =============================================
// SISTEMA DE CONTROL DE ACCESO POR ROLES (RBAC)
// =============================================

export type UserRole = 'owner' | 'admin' | 'doctor' | 'nurse' | 'receptionist'

// Definición de permisos por módulo
export type Permission =
  // Dashboard
  | 'dashboard:view'
  // Pacientes
  | 'patients:view'
  | 'patients:create'
  | 'patients:edit'
  | 'patients:delete'
  | 'patients:export'
  | 'patients:medical_history'
  // Agenda
  | 'appointments:view'
  | 'appointments:create'
  | 'appointments:edit'
  | 'appointments:delete'
  | 'appointments:cancel'
  // Tratamientos
  | 'treatments:view'
  | 'treatments:create'
  | 'treatments:edit'
  | 'treatments:delete'
  // Sesiones clínicas
  | 'sessions:view'
  | 'sessions:create'
  | 'sessions:edit'
  // POS
  | 'pos:view'
  | 'pos:sell'
  | 'pos:discount'
  | 'pos:void'
  // Facturación
  | 'billing:view'
  | 'billing:create'
  | 'billing:edit'
  | 'billing:void'
  // Inventario
  | 'inventory:view'
  | 'inventory:manage'
  | 'inventory:adjust'
  // Profesionales
  | 'professionals:view'
  | 'professionals:manage'
  // Reportes
  | 'reports:view'
  | 'reports:export'
  | 'reports:financial'
  // Configuración
  | 'settings:view'
  | 'settings:manage'
  // Consentimientos
  | 'consents:view'
  | 'consents:create'
  | 'consents:manage'

// Mapeo de roles a permisos
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    // Acceso total
    'dashboard:view',
    'patients:view', 'patients:create', 'patients:edit', 'patients:delete', 'patients:export', 'patients:medical_history',
    'appointments:view', 'appointments:create', 'appointments:edit', 'appointments:delete', 'appointments:cancel',
    'treatments:view', 'treatments:create', 'treatments:edit', 'treatments:delete',
    'sessions:view', 'sessions:create', 'sessions:edit',
    'pos:view', 'pos:sell', 'pos:discount', 'pos:void',
    'billing:view', 'billing:create', 'billing:edit', 'billing:void',
    'inventory:view', 'inventory:manage', 'inventory:adjust',
    'professionals:view', 'professionals:manage',
    'reports:view', 'reports:export', 'reports:financial',
    'settings:view', 'settings:manage',
    'consents:view', 'consents:create', 'consents:manage',
  ],
  admin: [
    // Casi todo excepto configuración crítica
    'dashboard:view',
    'patients:view', 'patients:create', 'patients:edit', 'patients:delete', 'patients:export', 'patients:medical_history',
    'appointments:view', 'appointments:create', 'appointments:edit', 'appointments:delete', 'appointments:cancel',
    'treatments:view', 'treatments:create', 'treatments:edit', 'treatments:delete',
    'sessions:view', 'sessions:create', 'sessions:edit',
    'pos:view', 'pos:sell', 'pos:discount', 'pos:void',
    'billing:view', 'billing:create', 'billing:edit', 'billing:void',
    'inventory:view', 'inventory:manage', 'inventory:adjust',
    'professionals:view', 'professionals:manage',
    'reports:view', 'reports:export', 'reports:financial',
    'settings:view',
    'consents:view', 'consents:create', 'consents:manage',
  ],
  doctor: [
    // Pacientes, agenda, sesiones, tratamientos
    'dashboard:view',
    'patients:view', 'patients:create', 'patients:edit', 'patients:medical_history',
    'appointments:view', 'appointments:create', 'appointments:edit', 'appointments:cancel',
    'treatments:view',
    'sessions:view', 'sessions:create', 'sessions:edit',
    'pos:view', 'pos:sell',
    'billing:view',
    'inventory:view',
    'professionals:view',
    'reports:view',
    'consents:view', 'consents:create',
  ],
  nurse: [
    // Asistencia en sesiones, pacientes limitado
    'dashboard:view',
    'patients:view', 'patients:medical_history',
    'appointments:view', 'appointments:edit',
    'treatments:view',
    'sessions:view', 'sessions:create', 'sessions:edit',
    'inventory:view',
    'consents:view',
  ],
  receptionist: [
    // Agenda, pacientes básico, POS
    'dashboard:view',
    'patients:view', 'patients:create', 'patients:edit',
    'appointments:view', 'appointments:create', 'appointments:edit', 'appointments:cancel',
    'treatments:view',
    'pos:view', 'pos:sell',
    'billing:view', 'billing:create',
    'consents:view',
  ],
}

// Rutas protegidas por módulo
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/': ['dashboard:view'],
  '/pacientes': ['patients:view'],
  '/pacientes/nuevo': ['patients:create'],
  '/agenda': ['appointments:view'],
  '/agenda/nueva': ['appointments:create'],
  '/tratamientos': ['treatments:view'],
  '/tratamientos/nuevo': ['treatments:create'],
  '/sesiones': ['sessions:view'],
  '/pos': ['pos:view'],
  '/facturacion': ['billing:view'],
  '/inventario': ['inventory:view'],
  '/profesionales': ['professionals:view'],
  '/reportes': ['reports:view'],
  '/configuracion': ['settings:view'],
  '/consentimientos': ['consents:view'],
}

// Helper: Verificar si un rol tiene un permiso
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

// Helper: Verificar si un rol puede acceder a una ruta
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  // Buscar la ruta más específica que coincida
  const matchingRoutes = Object.keys(ROUTE_PERMISSIONS)
    .filter(route => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length) // Más específica primero

  if (matchingRoutes.length === 0) {
    // Rutas no definidas: permitir por defecto (o denegar según política)
    return true
  }

  const requiredPermissions = ROUTE_PERMISSIONS[matchingRoutes[0]]
  return requiredPermissions.some(permission => hasPermission(role, permission))
}

// Helper: Obtener permisos de un rol
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

// Labels para UI
export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  doctor: 'Doctor/a',
  nurse: 'Enfermero/a',
  receptionist: 'Recepcionista',
}

// Colores para badges
export const ROLE_COLORS: Record<UserRole, string> = {
  owner: 'bg-purple-500',
  admin: 'bg-blue-500',
  doctor: 'bg-green-500',
  nurse: 'bg-teal-500',
  receptionist: 'bg-orange-500',
}
