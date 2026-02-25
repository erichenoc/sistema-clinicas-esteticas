# Sistema de Gestion para Clinicas Esteticas (Med Luxe)

Sistema integral de gestion disenado para clinicas de medicina estetica. Permite administrar pacientes, citas, tratamientos, facturacion, inventario y mas.

## Caracteristicas Principales

- **Gestion de Pacientes**: Registro completo, historial medico, fotos de progreso, consentimientos informados
- **Agenda y Citas**: Calendario interactivo, programacion de citas, recordatorios automaticos
- **Tratamientos**: Catalogo de servicios, paquetes, seguimiento de sesiones
- **Facturacion**: Cotizaciones, facturas, multiples metodos de pago, reportes financieros
- **Inventario**: Control de productos, lotes, alertas de stock, ordenes de compra, reportes de inventario
- **Profesionales**: Perfiles, horarios, comisiones, evaluaciones
- **POS**: Punto de venta integrado con caja registradora
- **Reportes**: Analisis financiero, ocupacion, rendimiento por profesional

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth con RBAC
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Calendar**: FullCalendar

## Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase

## Instalacion

1. Clonar el repositorio:
```bash
git clone https://github.com/erichenoc/sistema-clinicas-esteticas.git
cd sistema-clinicas-esteticas
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

4. Ejecutar migraciones en Supabase Dashboard o CLI

5. Iniciar servidor de desarrollo:
```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Scripts Disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de produccion |
| `npm run start` | Iniciar build de produccion |
| `npm run lint` | Ejecutar ESLint |

## Estructura del Proyecto

```
src/
├── app/                        # Next.js App Router
│   ├── error.tsx               # Error boundary global
│   ├── not-found.tsx           # Pagina 404 global
│   ├── sitemap.ts              # Sitemap dinamico
│   ├── layout.tsx              # Layout root (metadata OG, robots)
│   ├── (auth)/                 # Rutas publicas (login, register)
│   └── (dashboard)/            # Rutas protegidas
│       ├── error.tsx           # Error boundary del dashboard
│       ├── not-found.tsx       # 404 del dashboard
│       ├── agenda/
│       │   └── loading.tsx     # Skeleton de carga
│       ├── pacientes/
│       │   └── loading.tsx
│       ├── tratamientos/
│       │   └── loading.tsx
│       ├── sesiones/
│       │   └── loading.tsx
│       ├── facturacion/
│       │   └── loading.tsx
│       ├── inventario/
│       │   └── loading.tsx
│       ├── profesionales/
│       │   └── loading.tsx
│       ├── reportes/
│       ├── configuracion/
│       └── pos/
├── actions/                    # Server Actions
│   ├── auth.ts
│   ├── patients.ts
│   ├── appointments.ts
│   ├── treatments.ts
│   ├── sessions.ts
│   ├── billing.ts
│   ├── inventory.ts            # Barrel file (re-exports)
│   ├── inventory-products.ts   # CRUD de productos
│   ├── inventory-lots.ts       # Gestion de lotes
│   ├── inventory-suppliers.ts  # CRUD de proveedores
│   ├── inventory-orders.ts     # Ordenes de compra
│   ├── inventory-stock.ts      # Stock, transferencias, conteos
│   ├── inventory-reports.ts    # Reportes de inventario
│   ├── professionals.ts
│   ├── reports.ts
│   ├── pos.ts
│   └── ...
├── components/                 # Componentes React
│   ├── ui/                    # shadcn/ui components
│   └── layout/                # Layout components
├── lib/                        # Utilidades y configuracion
│   ├── supabase/              # Clientes de Supabase
│   ├── validations/           # Esquemas Zod
│   ├── auth/                  # Auth helpers y RBAC
│   └── clinic.ts              # Helper getClinicId()
├── types/                      # Definiciones TypeScript
├── hooks/                      # Custom hooks
├── stores/                     # Zustand stores
└── contexts/                   # React contexts

public/
└── robots.txt                  # Directivas de crawling

EVOLUTION_LOG.md                # Registro de mejora continua
```

## Roles de Usuario

| Rol | Descripcion |
|-----|-------------|
| Admin | Acceso total al sistema |
| Owner | Acceso total excepto configuracion tecnica |
| Doctor | Gestion de pacientes, tratamientos, sesiones |
| Nurse | Asistencia en sesiones, gestion de agenda |
| Receptionist | Agenda, facturacion, atencion al cliente |

## Seguridad

- Autenticacion con Supabase Auth
- Row Level Security (RLS) en todas las tablas
- RBAC (Control de acceso basado en roles)
- Security Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Content Security Policy sin `unsafe-inline` en scripts (proteccion XSS reforzada)
- Validacion de contrasenas robusta (8+ caracteres, mayuscula, minuscula, numero, caracter especial)

## Error Handling

- Error boundaries globales (`error.tsx`) y por seccion (`(dashboard)/error.tsx`)
- Paginas 404 personalizadas a nivel global y de dashboard
- Empty states en listas vacias (pacientes, sesiones)
- Confirmacion con AlertDialog antes de acciones destructivas (cancelar sesiones)

## SEO

- `robots.txt` con directivas para proteger rutas privadas del dashboard
- `sitemap.ts` dinamico para rutas publicas
- Metadata Open Graph configurada en el layout root
- Meta robots configurados para evitar indexacion de la aplicacion interna

## UX y Loading States

Cada seccion principal del dashboard cuenta con `loading.tsx` que muestra skeletons
de carga contextuales:
- Pacientes, Sesiones, Agenda, Tratamientos, Facturacion, Inventario, Profesionales

## Licencia

Proyecto privado. Todos los derechos reservados.

## Soporte

Para soporte tecnico, contactar al equipo de desarrollo.
