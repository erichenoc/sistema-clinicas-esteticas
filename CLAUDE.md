# Proyecto: Sistema de Gestión para Clínicas Estéticas

## 🎯 Principios de Desarrollo (Context Engineering)

### Design Philosophy
- **KISS**: Keep It Simple, Stupid - Prefiere soluciones simples
- **YAGNI**: You Aren't Gonna Need It - Implementa solo lo necesario
- **DRY**: Don't Repeat Yourself - Evita duplicación de código
- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion

### Descripción del Proyecto
Sistema integral de gestión para clínicas de medicina estética que incluye:
- **Gestión de Pacientes**: Registro, historial médico, consentimientos informados
- **Agenda y Citas**: Calendario, programación, recordatorios
- **Tratamientos**: Catálogo, paquetes, sesiones
- **Facturación**: Cotizaciones, facturas, pagos, reportes
- **Inventario**: Productos, lotes, órdenes de compra, proveedores
- **Profesionales**: Perfiles, horarios, comisiones
- **POS**: Punto de venta integrado
- **Reportes**: Análisis financiero, ocupación, rendimiento

### Identidad Visual (Med Luxe)
- **Color Primario**: `#A67C52` (Dorado/Bronce)
- **Color Hover**: `#8a6543`
- **Estilo**: Elegante, profesional, moderno

## 🏗️ Tech Stack & Architecture

### Core Stack
- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js + TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth con RBAC
- **State**: React Query + Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Calendar**: FullCalendar

### Arquitectura del Proyecto

```
sistema-clinicas-esteticas/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Rutas de autenticación
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   └── (dashboard)/       # Rutas protegidas
│   │       ├── agenda/
│   │       ├── pacientes/
│   │       ├── tratamientos/
│   │       ├── sesiones/
│   │       ├── facturacion/
│   │       ├── inventario/
│   │       ├── profesionales/
│   │       ├── reportes/
│   │       ├── configuracion/
│   │       └── pos/
│   │
│   ├── actions/               # Server Actions (API layer)
│   │   ├── auth.ts
│   │   ├── patients.ts
│   │   ├── appointments.ts
│   │   ├── treatments.ts
│   │   ├── sessions.ts
│   │   ├── billing.ts
│   │   ├── inventory.ts
│   │   └── ...
│   │
│   ├── components/            # UI Components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── layout/           # Layout components
│   │   └── [feature]/        # Feature-specific components
│   │
│   ├── lib/                   # Utilities & Config
│   │   ├── supabase/         # Supabase clients
│   │   ├── validations/      # Zod schemas
│   │   ├── auth/             # Auth helpers & RBAC
│   │   └── utils.ts
│   │
│   ├── types/                 # TypeScript definitions
│   │   ├── database.ts       # Supabase generated types
│   │   └── [domain].ts
│   │
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand stores
│   └── contexts/              # React contexts
│
├── supabase/
│   └── migrations/            # SQL migrations
│
├── public/                    # Static assets
└── .claude/                   # Claude Code config
```

### Patrones de Arquitectura

#### Server Actions Pattern
```typescript
// src/actions/patients.ts
'use server'

import { createAdminClient } from '@/lib/supabase/server'

export async function getPatients() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
  return { data, error: error?.message || null }
}
```

#### Page Component Pattern
```typescript
// src/app/(dashboard)/pacientes/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { getPatients } from '@/actions/patients'

export default function PacientesPage() {
  const [patients, setPatients] = useState([])

  useEffect(() => {
    getPatients().then(({ data }) => setPatients(data || []))
  }, [])

  return <PacientesClient patients={patients} />
}
```

## 🛠️ Comandos Importantes

### Development
```bash
npm run dev          # Servidor de desarrollo (puerto 3000)
npm run build        # Build de producción
npm run start        # Iniciar build de producción
npm run lint         # Ejecutar ESLint
```

### Database (Supabase)
- Migraciones en `supabase/migrations/`
- RLS habilitado en todas las tablas
- Admin client para operaciones server-side

## 📝 Convenciones de Código

### File & Function Limits
- **Archivos**: Máximo 500 líneas
- **Funciones**: Máximo 50 líneas
- **Componentes**: Una responsabilidad clara

### Naming Conventions
- **Variables/Functions**: `camelCase`
- **Components**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Files**: `kebab-case.extension` o `PascalCase.tsx` para componentes
- **Server Actions**: `camelCase` (ej: `getPatients`, `createAppointment`)

### TypeScript Guidelines
- **Siempre usar type hints** para function signatures
- **Interfaces** para object shapes
- **Types** para unions y primitives
- **Evitar `any`** - usar `unknown` si es necesario
- Importar tipos de `@/types/database` para entidades de BD

### Component Patterns
```typescript
// ✅ GOOD: Client component con Server Action
'use client'

import { useState } from 'react'
import { createPatient } from '@/actions/patients'
import { toast } from 'sonner'

export function PatientForm() {
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(data: PatientFormData) {
    setIsLoading(true)
    const result = await createPatient(data)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Paciente creado')
    }
    setIsLoading(false)
  }

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>
}
```

## 🔒 Security Best Practices

### Implementado
- ✅ Security Headers (CSP, HSTS, X-Frame-Options, etc.)
- ✅ Password validation (8+ chars, mayúscula, minúscula, número, especial)
- ✅ RLS en todas las tablas de Supabase
- ✅ RBAC middleware con roles (admin, owner, doctor, nurse, receptionist)
- ✅ Server Actions con `'use server'` directive
- ✅ Zod validation en formularios
- ✅ .env files excluidos de git

### Roles del Sistema
| Rol | Permisos |
|-----|----------|
| admin | Acceso total |
| owner | Acceso total excepto configuración técnica |
| doctor | Pacientes, tratamientos, sesiones, agenda |
| nurse | Pacientes, sesiones, agenda |
| receptionist | Agenda, pacientes (lectura), facturación |

## ⚡ Performance Guidelines

### Implementado
- Route-based code splitting (App Router)
- Server Components por defecto
- Client Components solo cuando necesario
- Supabase queries optimizadas con `select()` específico

### Database
- Índices en columnas frecuentemente consultadas
- RLS policies optimizadas
- Paginación en listados grandes

## 🔄 Git Workflow

### Commit Convention (Conventional Commits)
```
type(scope): description

feat(patients): add medical history view
fix(billing): correct tax calculation
security: add CSP headers
docs(readme): update installation steps
```

### Tipos de Commit
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `security`: Mejoras de seguridad
- `docs`: Documentación
- `style`: Formateo, sin cambios de código
- `refactor`: Refactorización
- `test`: Agregar/modificar tests
- `chore`: Tareas de mantenimiento

## ❌ No Hacer (Critical)

### Code Quality
- ❌ No usar `any` en TypeScript
- ❌ No omitir manejo de errores en Server Actions
- ❌ No hardcodear configuraciones (usar .env)

### Security
- ❌ No exponer secrets en código
- ❌ No usar `createAdminClient` en componentes client
- ❌ No saltarse validación Zod
- ❌ No commitear .env files

### Architecture
- ❌ No crear dependencias circulares
- ❌ No mezclar lógica de UI y datos en un componente
- ❌ No usar `dangerouslySetInnerHTML`

## 📚 Referencias & Context

### Archivos Clave
- `src/lib/supabase/server.ts` - Clientes de Supabase
- `src/lib/supabase/middleware.ts` - Auth + RBAC middleware
- `src/lib/auth/roles.ts` - Definición de roles y permisos
- `supabase/migrations/` - Schema de base de datos

### Dependencias Principales
- Next.js 16 con App Router
- Supabase para Auth y Database
- shadcn/ui para componentes
- React Hook Form + Zod para formularios
- Recharts para gráficos
- FullCalendar para agenda
- date-fns para fechas (locale: es)

---

*Este archivo es la fuente de verdad para desarrollo en este proyecto. Todas las decisiones de código deben alinearse con estos principios.*
