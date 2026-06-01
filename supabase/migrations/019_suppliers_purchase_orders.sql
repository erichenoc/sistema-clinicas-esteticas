-- =============================================
-- MIGRACIÓN 019: Proveedores y Órdenes de Compra
-- =============================================
-- El código (inventory-suppliers.ts, inventory-orders.ts) y las pantallas de
-- Proveedores / Nueva Orden de Compra esperaban estas tablas, que no existían en
-- la BD real. Esta migración las crea alineadas con el código, y vincula cada
-- producto con el proveedor que lo vende (products.supplier_id).
-- =============================================

-- ---------- PROVEEDORES ----------
CREATE TABLE IF NOT EXISTS public.suppliers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  name          varchar(200) NOT NULL,
  contact_name  varchar(200),
  email         varchar(200),
  phone         varchar(50),
  address       text,
  city          varchar(100),
  category      varchar(100),
  tax_id        varchar(50),
  payment_terms varchar(100),
  notes         text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_clinic ON public.suppliers(clinic_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);

-- ---------- ÓRDENES DE COMPRA ----------
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  branch_id       uuid,
  supplier_id     uuid REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  order_number    varchar(50) UNIQUE NOT NULL,
  status          varchar(20) NOT NULL DEFAULT 'pending',
  order_date      date DEFAULT CURRENT_DATE,
  expected_date   date,
  received_date   date,
  subtotal        numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount      numeric(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_cost   numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  discount_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total           numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  payment_status  varchar(20) NOT NULL DEFAULT 'pending',
  paid_amount     numeric(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  notes           text,
  internal_notes  text,
  created_by      uuid,
  approved_by     uuid,
  approved_at     timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_clinic   ON public.purchase_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status   ON public.purchase_orders(status);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id        uuid REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity_ordered  numeric(12,2) NOT NULL DEFAULT 0,
  quantity_received numeric(12,2) NOT NULL DEFAULT 0,
  unit_cost         numeric(12,2) NOT NULL DEFAULT 0,
  discount_percent  numeric(5,2)  NOT NULL DEFAULT 0,
  tax_rate          numeric(5,2)  NOT NULL DEFAULT 0,
  subtotal          numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount        numeric(12,2) NOT NULL DEFAULT 0,
  total             numeric(12,2) NOT NULL DEFAULT 0,
  lot_number        varchar(100),
  expiry_date       date,
  notes             text,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_poi_order   ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_poi_product ON public.purchase_order_items(product_id);

-- ---------- VÍNCULO PRODUCTO -> PROVEEDOR ----------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(supplier_id);

-- RLS (solo service_role accede vía la app)
ALTER TABLE public.suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
