-- =============================================
-- MIGRACIÓN 018: Reconciliar esquema de Sesiones y crear tablas del POS
-- =============================================
-- El código (src/actions/sessions.ts y pos.ts) esperaba columnas/tablas que no
-- existían en la BD real, dejando ambos módulos rotos. Esta migración alinea la
-- BD con el código. La tabla `sessions` tiene 0 filas, por lo que los renombres
-- son seguros.
-- =============================================

-- ---------- SESSIONS ----------
-- Renombrar columnas a los nombres que usa el código
ALTER TABLE public.sessions RENAME COLUMN zones_treated TO treated_zones;
ALTER TABLE public.sessions RENAME COLUMN parameters     TO technical_parameters;

-- Agregar columnas faltantes que el código lee/escribe
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS branch_id                    uuid,
  ADD COLUMN IF NOT EXISTS treatment_name               varchar(200),
  ADD COLUMN IF NOT EXISTS package_session_id           uuid,
  ADD COLUMN IF NOT EXISTS started_at                   timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at                     timestamptz,
  ADD COLUMN IF NOT EXISTS duration_minutes             integer,
  ADD COLUMN IF NOT EXISTS status                       varchar(20) DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS patient_feedback             text,
  ADD COLUMN IF NOT EXISTS result_rating                integer,
  ADD COLUMN IF NOT EXISTS result_notes                 text,
  ADD COLUMN IF NOT EXISTS signed_at                    timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_required           boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS follow_up_notes              text,
  ADD COLUMN IF NOT EXISTS next_session_recommended_at  timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason          text,
  ADD COLUMN IF NOT EXISTS created_by                   uuid;

CREATE INDEX IF NOT EXISTS idx_sessions_status  ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON public.sessions(patient_id);

-- ---------- POS: sales / sale_items ----------
CREATE TABLE IF NOT EXISTS public.sales (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         uuid REFERENCES public.clinics(id) ON DELETE RESTRICT,
  branch_id         uuid,
  sale_number       varchar(50) UNIQUE NOT NULL,
  sale_type         varchar(20) DEFAULT 'pos',
  patient_id        uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  customer_name     varchar(200),
  subtotal          numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_total    numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  tax_amount        numeric(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total             numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  status            varchar(20) NOT NULL DEFAULT 'paid',
  paid_amount       numeric(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  payment_method    varchar(20),
  payment_reference varchar(100),
  notes             text,
  completed_at      timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id         uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  item_type       varchar(20) NOT NULL,
  item_id         uuid,
  item_name       varchar(200) NOT NULL,
  treatment_id    uuid REFERENCES public.treatments(id) ON DELETE SET NULL,
  quantity        numeric(10,2) NOT NULL DEFAULT 1,
  unit_price      numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  subtotal        numeric(12,2) NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_clinic         ON public.sales(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sales_status_created ON public.sales(status, created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale      ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_treatment ON public.sale_items(treatment_id);

-- RLS: consistente con el modelo (solo service_role accede vía la app)
ALTER TABLE public.sales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
