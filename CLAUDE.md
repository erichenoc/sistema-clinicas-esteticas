# Sistema de Gestión para Clínicas Estéticas

## Principios de Desarrollo (Context Engineering)

### Design Philosophy
- **KISS**: Keep It Simple, Stupid - Prefiere soluciones simples
- **YAGNI**: You Aren't Gonna Need It - Implementa solo lo necesario
- **DRY**: Don't Repeat Yourself - Evita duplicación de código
- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion

### Descripción del Proyecto
Sistema completo de gestión para clínicas estéticas que incluye:
- Gestión de pacientes con historial médico completo
- Catálogo de tratamientos y paquetes
- Agenda y citas con recordatorios automáticos
- Sesiones clínicas con registro detallado
- Punto de venta (POS) y facturación
- Control de inventario con trazabilidad de lotes
- Gestión de profesionales y comisiones
- Consentimientos informados con firma digital
- Dashboard y reportes analíticos
- Configuración multi-sucursal

---

## Tech Stack & Architecture

### Core Stack
```yaml
Frontend:
  Runtime: Node.js + TypeScript
  Framework: Next.js 14+ (App Router)
  Styling: Tailwind CSS + shadcn/ui
  Forms: React Hook Form + Zod
  Tables: TanStack Table
  Calendar: FullCalendar / React Big Calendar
  Charts: Recharts
  State: Zustand
  Signatures: react-signature-canvas
  Camera: react-webcam

Backend:
  Platform: Supabase
  Database: PostgreSQL
  Auth: Supabase Auth
  Storage: Supabase Storage
  Realtime: Supabase Realtime
  Functions: Supabase Edge Functions
```

### Architecture: Feature-First (App Router)
```
/src
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/
│   │   ├── page.tsx                 # Dashboard/Home
│   │   ├── pacientes/
│   │   ├── agenda/
│   │   ├── tratamientos/
│   │   ├── sesiones/
│   │   ├── pos/
│   │   ├── inventario/
│   │   ├── profesionales/
│   │   ├── reportes/
│   │   └── configuracion/
│   ├── api/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── forms/                       # Form components
│   ├── tables/                      # Table components
│   ├── calendar/                    # Calendar components
│   └── shared/                      # Shared components
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   ├── middleware.ts           # Auth middleware
│   │   └── admin.ts                # Admin client
│   ├── validations/                # Zod schemas
│   └── utils/                      # Utility functions
│
├── hooks/                          # Custom hooks
│
├── stores/                         # Zustand stores
│
├── types/                          # TypeScript types
│   ├── database.ts                 # Generated from Supabase
│   └── index.ts                    # App types
│
└── actions/                        # Server Actions
```

---

## Módulos del Sistema

### 1. Gestión de Pacientes
**Ruta:** `/pacientes`

**Funcionalidades:**
- CRUD completo de pacientes
- Datos personales y contacto de emergencia
- Historial médico (alergias, enfermedades, medicamentos, condiciones especiales)
- Tipo de piel Fitzpatrick (I-VI)
- Galería de fotos antes/después por zona corporal
- Documentos y consentimientos firmados
- Tags y segmentación (nuevo, recurrente, VIP, inactivo)
- Fuente de captación y referidos
- Timeline de interacciones
- Búsqueda global y filtros avanzados

**Tablas:** `patients`, `patient_medical_history`, `patient_images`, `patient_documents`

### 2. Tratamientos/Servicios
**Ruta:** `/tratamientos`

**Funcionalidades:**
- Catálogo organizado por categorías (facial, corporal, capilar)
- Duración, precios, costos, márgenes
- Contraindicaciones e instrucciones post-tratamiento
- Profesionales habilitados y salas compatibles
- Productos/consumibles con cantidad estándar
- Paquetes y bonos con vigencia
- Promociones temporales

**Tablas:** `treatment_categories`, `treatments`, `packages`

### 3. Agenda/Citas
**Ruta:** `/agenda`

**Funcionalidades:**
- Calendario (día, semana, mes)
- Filtros por profesional, sala, tratamiento
- Verificación de disponibilidad automática
- Estados: programada → confirmada → en espera → en atención → completada/cancelada/no-show
- Recordatorios automáticos (WhatsApp, SMS, Email)
- Lista de espera inteligente
- Bloqueo de horarios (vacaciones, mantenimiento)
- Citas recurrentes y drag & drop

**Tablas:** `rooms`, `professional_schedules`, `schedule_blocks`, `appointments`, `waitlist`, `appointment_reminders`

### 4. Sesiones Clínicas
**Ruta:** `/sesiones`

**Funcionalidades:**
- Registro detallado de cada atención
- Zonas tratadas (selector visual en silueta)
- Parámetros técnicos según tipo de tratamiento
- Productos utilizados con lote y cantidad
- Observaciones y reacciones adversas
- Fotografías de la sesión
- Firma digital de paciente y profesional
- Notas clínicas y prescripciones
- Descuento automático de inventario

**Tablas:** `sessions`, `clinical_notes`, `prescriptions`

### 5. POS/Facturación
**Ruta:** `/pos`

**Funcionalidades:**
- Punto de venta rápido
- Múltiples formas de pago
- Descuentos y cupones
- Paquetes del paciente (consumir sesiones)
- Gestión de caja (apertura, cierre, arqueo)
- Notas de crédito y devoluciones

**Tablas:** `sales`, `sale_items`, `payments`, `cash_registers`, `cash_movements`, `patient_packages`, `patient_package_sessions`, `patient_credits`, `coupons`, `coupon_uses`

### 6. Inventario
**Ruta:** `/inventario`

**Funcionalidades:**
- Catálogo de productos (consumibles y retail)
- Stock por sucursal
- Control de lotes y vencimientos
- Movimientos de inventario
- Alertas de stock bajo
- Transferencias entre sucursales
- Proveedores y órdenes de compra

**Tablas:** `products`, `inventory`, `product_lots`, `inventory_movements`, `suppliers`, `purchase_orders`

### 7. Profesionales
**Ruta:** `/profesionales`

**Funcionalidades:**
- Perfiles con especialidades y certificaciones
- Horarios de trabajo por sucursal
- Comisiones por tratamiento/producto
- Métricas de productividad
- Control de asistencia

**Tablas:** `users` (extendida), `professional_documents`, `commission_rules`, `commissions`, `attendance_logs`

### 8. Consentimientos
**Ruta:** `/configuracion/consentimientos`

**Funcionalidades:**
- Biblioteca de plantillas con variables dinámicas
- Versionado
- Firma digital con timestamp
- Generación de PDF
- Envío automático al paciente

**Tablas:** `consent_templates`, `signed_consents`

### 9. Reportes y Dashboard
**Ruta:** `/` y `/reportes`

**Dashboard:** KPIs, gráficos de ingresos, citas del día, alertas, top tratamientos
**Reportes:** Financieros, pacientes, operativos, inventario

### 10. Configuración
**Ruta:** `/configuracion`

**Funcionalidades:** Datos de clínica, sucursales, usuarios/roles, plantillas de mensajes, políticas, integraciones

**Tablas:** `clinics`, `branches`, `roles`, `message_templates`, `integrations`

### Tablas Adicionales Críticas
- `audit_logs` - Auditoría (obligatorio para datos médicos)
- `notifications` - Centro de notificaciones
- `messages_log` - Log de comunicaciones

---

## Comandos Importantes

### Development
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

### Supabase
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
npx supabase db push                    # Push migrations
npx supabase functions deploy           # Deploy edge functions
```

### shadcn/ui
```bash
npx shadcn@latest add [component]       # Agregar componente
```

---

## Convenciones de Código

### File & Function Limits
- **Archivos**: Máximo 500 líneas
- **Funciones**: Máximo 50 líneas
- **Componentes**: Una responsabilidad clara

### Naming Conventions
- **Variables/Functions**: `camelCase`
- **Components**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Files**: `kebab-case.extension`
- **Folders**: `kebab-case`
- **Database columns**: `snake_case`

### TypeScript Guidelines
- Siempre usar type hints
- Interfaces para object shapes
- Types para unions y primitives
- **NUNCA usar `any`** - usar `unknown` si es necesario

### Component Patterns
```typescript
// Server Component (default)
export default async function PatientsList() {
  const patients = await getPatients()
  return <PatientsTable data={patients} />
}

// Client Component (cuando sea necesario)
'use client'
export function PatientForm({ onSubmit }: Props) {
  const form = useForm<PatientFormData>()
  // ...
}
```

### Form Pattern (React Hook Form + Zod)
```typescript
const patientSchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
})

type PatientFormData = z.infer<typeof patientSchema>

const form = useForm<PatientFormData>({
  resolver: zodResolver(patientSchema),
})
```

---

## Security Best Practices

### Row Level Security (RLS)
- **OBLIGATORIO** en todas las tablas
- Aislamiento por `clinic_id` (multi-tenancy)
- Helper function: `auth.clinic_id()`

### Input Validation
- Validar TODOS los inputs con Zod
- Sanitizar antes de guardar en DB

### Audit Logging
- Log de todas las acciones sensibles
- Requerido legalmente para datos médicos

---

## Supabase Storage Buckets

| Bucket | Público | Uso |
|--------|---------|-----|
| `avatars` | Sí | Fotos de perfil |
| `patient-images` | No | Fotos antes/después |
| `patient-documents` | No | Documentos del paciente |
| `signatures` | No | Firmas digitales |
| `clinic-assets` | Sí | Logo, assets de la clínica |
| `treatment-images` | Sí | Imágenes de tratamientos |
| `consents-pdf` | No | PDFs de consentimientos |
| `exports` | No | Exportaciones temporales |

---

## Supabase Edge Functions

```
/supabase/functions/
├── send-appointment-reminder/   # Enviar recordatorios
├── send-whatsapp/               # WhatsApp via Evolution API
├── send-email/                  # Emails via Resend
├── stripe-webhook/              # Procesar pagos Stripe
├── generate-consent-pdf/        # PDF de consentimiento
├── calculate-commissions/       # Calcular comisiones
├── process-expiring-packages/   # Marcar paquetes vencidos
├── notify-low-stock/            # Alertas inventario
└── daily-report/                # Reporte diario
```

---

## Orden de Desarrollo

1. **Setup Inicial** - Next.js, Supabase, shadcn/ui, estructura
2. **Autenticación** - Login, registro, middleware, layout
3. **Tratamientos** - Catálogo base (prerequisito)
4. **Pacientes** - CRUD con historial médico
5. **Agenda/Citas** - Calendario y reservas
6. **Sesiones Clínicas** - Registro de atenciones
7. **Consentimientos** - Firma digital
8. **POS/Facturación** - Punto de venta
9. **Inventario** - Control de stock
10. **Profesionales** - Equipo y comisiones
11. **Dashboard y Reportes** - Analytics
12. **Configuración** - Settings

---

## No Hacer (Critical)

### Code Quality
- ❌ No usar `any` en TypeScript
- ❌ No omitir manejo de errores
- ❌ No hardcodear configuraciones

### Security
- ❌ No exponer secrets en código
- ❌ No loggear información médica sensible
- ❌ No saltarse validación de entrada
- ❌ No desactivar RLS

### Architecture
- ❌ No crear dependencias circulares
- ❌ No mezclar concerns en un componente
- ❌ No usar Client Components innecesariamente
- ❌ No ignorar estados de loading y error

---

## UI/UX Guidelines

### Idioma
- **Labels y textos de UI**: Español
- **Código y variables**: Inglés

### Estados Visuales
- Loading states con Suspense y skeletons
- Error boundaries para manejo de errores
- Empty states con CTAs claros
- Optimistic updates para mejor UX

---

## Bucle Agéntico con Playwright MCP

### Metodología de Desarrollo Visual
```
1. Código UI → 2. Playwright Screenshot → 3. Visual Compare → 4. Iterate
```

### Playwright MCP Integration
- `browser_snapshot`: Captura estado de la página
- `browser_take_screenshot`: Screenshots para comparación
- `browser_navigate`: Navegación automática
- `browser_click/type`: Interacción con UI
- `browser_resize`: Testing responsive

---

*Este archivo es la fuente de verdad para desarrollo en este proyecto. Todas las decisiones de código deben alinearse con estos principios.*
