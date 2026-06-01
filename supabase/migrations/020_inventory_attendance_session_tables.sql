-- =============================================
-- MIGRACIÓN 020: Tablas faltantes de Inventario, Asistencia y Sesiones
-- =============================================
-- El código usa estas tablas pero no existían en la BD real (las migraciones
-- 002/004/007/008 no se aplicaron por completo). Esto rompía: categorías de
-- producto, lotes, conteo de inventario, transferencias, asistencia de
-- profesionales e imágenes de sesión. Se crean alineadas al uso real del código.
-- =============================================

-- 1) Categorías de producto
CREATE TABLE IF NOT EXISTS public.product_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   uuid NOT NULL,
  name        text NOT NULL,
  description text,
  color       text NOT NULL DEFAULT '#6366f1',
  icon        text,
  type        text NOT NULL DEFAULT 'consumable',
  parent_id   uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_categories_clinic ON public.product_categories(clinic_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON public.product_categories(is_active);

-- 2) Lotes de producto
CREATE TABLE IF NOT EXISTS public.product_lots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id        uuid NOT NULL,
  branch_id        uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  lot_number       text NOT NULL,
  batch_number     text,
  manufacture_date date,
  expiry_date      date,
  received_date    date NOT NULL DEFAULT CURRENT_DATE,
  initial_quantity integer NOT NULL DEFAULT 0,
  current_quantity integer NOT NULL DEFAULT 0,
  unit_cost        numeric(12,2),
  supplier_id      uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status           text NOT NULL DEFAULT 'active',
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_lots_product  ON public.product_lots(product_id);
CREATE INDEX IF NOT EXISTS idx_product_lots_supplier ON public.product_lots(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_lots_expiry   ON public.product_lots(expiry_date);
CREATE INDEX IF NOT EXISTS idx_product_lots_status   ON public.product_lots(status);

-- 3) Conteos de inventario
CREATE TABLE IF NOT EXISTS public.inventory_counts (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id              uuid NOT NULL,
  branch_id              uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  count_number           text NOT NULL UNIQUE,
  count_type             text NOT NULL DEFAULT 'full',
  description            text,
  status                 text NOT NULL DEFAULT 'in_progress',
  started_at             timestamptz NOT NULL DEFAULT now(),
  completed_at           timestamptz,
  approved_at            timestamptz,
  total_items            integer NOT NULL DEFAULT 0,
  items_counted          integer NOT NULL DEFAULT 0,
  items_with_difference  integer NOT NULL DEFAULT 0,
  total_difference_value numeric(12,2) NOT NULL DEFAULT 0,
  created_by             uuid,
  approved_by            uuid,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_status ON public.inventory_counts(status);

CREATE TABLE IF NOT EXISTS public.inventory_count_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id         uuid NOT NULL REFERENCES public.inventory_counts(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  lot_id           uuid REFERENCES public.product_lots(id) ON DELETE SET NULL,
  system_quantity  integer NOT NULL DEFAULT 0,
  counted_quantity integer,
  difference       integer GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
  unit_cost        numeric(12,2),
  difference_value numeric(12,2),
  status           text NOT NULL DEFAULT 'pending',
  notes            text,
  counted_at       timestamptz,
  counted_by       uuid,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inv_count_items_count   ON public.inventory_count_items(count_id);
CREATE INDEX IF NOT EXISTS idx_inv_count_items_product ON public.inventory_count_items(product_id);

-- 4) Transferencias de inventario (dos FKs a branches -> nombres explícitos por el embed)
CREATE TABLE IF NOT EXISTS public.inventory_transfers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid NOT NULL,
  from_branch_id  uuid NOT NULL,
  to_branch_id    uuid NOT NULL,
  transfer_number text NOT NULL UNIQUE,
  status          text NOT NULL DEFAULT 'pending',
  requested_at    timestamptz NOT NULL DEFAULT now(),
  shipped_at      timestamptz,
  received_at     timestamptz,
  notes           text,
  requested_by    uuid,
  shipped_by      uuid,
  received_by     uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_transfers_from_branch_id_fkey FOREIGN KEY (from_branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT,
  CONSTRAINT inventory_transfers_to_branch_id_fkey   FOREIGN KEY (to_branch_id)   REFERENCES public.branches(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_status ON public.inventory_transfers(status);

CREATE TABLE IF NOT EXISTS public.inventory_transfer_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id        uuid NOT NULL REFERENCES public.inventory_transfers(id) ON DELETE CASCADE,
  product_id         uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  lot_id             uuid REFERENCES public.product_lots(id) ON DELETE SET NULL,
  quantity_requested integer NOT NULL DEFAULT 0,
  quantity_shipped   integer,
  quantity_received  integer,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inv_transfer_items_transfer ON public.inventory_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_inv_transfer_items_product  ON public.inventory_transfer_items(product_id);

-- 5) Asistencia de profesionales
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id        uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id        uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  date             date NOT NULL,
  clock_in         timestamptz,
  clock_in_method  varchar(20),
  clock_in_notes   text,
  clock_out        timestamptz,
  clock_out_method varchar(20),
  clock_out_notes  text,
  break_minutes    integer DEFAULT 0,
  scheduled_hours  numeric(5,2),
  worked_hours     numeric(5,2),
  overtime_hours   numeric(5,2) DEFAULT 0,
  status           varchar(20) DEFAULT 'present',
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  approved_by      uuid REFERENCES public.users(id),
  UNIQUE (professional_id, date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_professional ON public.attendance_logs(professional_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON public.attendance_logs(date);

-- 6) Imágenes de sesión
CREATE TABLE IF NOT EXISTS public.session_images (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  patient_id       uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  type             varchar(20) NOT NULL DEFAULT 'during',
  body_zone        varchar(50),
  image_url        text NOT NULL,
  thumbnail_url    text,
  caption          text,
  taken_at         timestamptz DEFAULT now(),
  sort_order       integer DEFAULT 0,
  is_consent_image boolean DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  created_by       uuid REFERENCES public.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_session_images_session ON public.session_images(session_id);
CREATE INDEX IF NOT EXISTS idx_session_images_patient ON public.session_images(patient_id);

-- RLS (solo service_role accede vía la app)
ALTER TABLE public.product_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_lots             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_counts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_count_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_images           ENABLE ROW LEVEL SECURITY;
