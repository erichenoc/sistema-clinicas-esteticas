# Sistema de Gestión para Clínicas Estéticas

Sistema integral de gestión diseñado para clínicas de medicina estética. Permite administrar pacientes, citas, tratamientos, facturación, inventario y más.

## Características Principales

- **Gestión de Pacientes**: Registro completo, historial médico, fotos de progreso, consentimientos informados
- **Agenda y Citas**: Calendario interactivo, programación de citas, recordatorios automáticos
- **Tratamientos**: Catálogo de servicios, paquetes, seguimiento de sesiones
- **Facturación**: Cotizaciones, facturas, múltiples métodos de pago, reportes financieros
- **Inventario**: Control de productos, lotes, alertas de stock, órdenes de compra
- **Profesionales**: Perfiles, horarios, comisiones, evaluaciones
- **POS**: Punto de venta integrado con caja registradora
- **Reportes**: Análisis financiero, ocupación, rendimiento por profesional

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth con RBAC
- **Forms**: React Hook Form + Zod

## Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase

## Instalación

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
```

4. Ejecutar migraciones en Supabase Dashboard o CLI

5. Iniciar servidor de desarrollo:
```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar build de producción |
| `npm run lint` | Ejecutar ESLint |

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas públicas (login, register)
│   └── (dashboard)/       # Rutas protegidas
├── actions/               # Server Actions
├── components/            # Componentes React
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components
├── lib/                   # Utilidades y configuración
│   ├── supabase/         # Clientes de Supabase
│   └── validations/      # Esquemas Zod
├── types/                 # Definiciones TypeScript
└── hooks/                 # Custom hooks
```

## Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| Admin | Acceso total al sistema |
| Owner | Acceso total excepto configuración técnica |
| Doctor | Gestión de pacientes, tratamientos, sesiones |
| Nurse | Asistencia en sesiones, gestión de agenda |
| Receptionist | Agenda, facturación, atención al cliente |

## Seguridad

- Autenticación con Supabase Auth
- Row Level Security (RLS) en todas las tablas
- RBAC (Control de acceso basado en roles)
- Security Headers (CSP, HSTS, X-Frame-Options)
- Validación de contraseñas robusta

## Licencia

Proyecto privado. Todos los derechos reservados.

## Soporte

Para soporte técnico, contactar al equipo de desarrollo.
