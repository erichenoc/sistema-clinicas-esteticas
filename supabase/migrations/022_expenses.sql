-- =============================================
-- MIGRACIÓN 022: Gastos y pagos a proveedores
-- =============================================
-- Contexto: la pantalla "Cuentas por Pagar" mostraba datos inventados en el
-- código (mock). Sin persistencia era imposible saber cuánto se le debe a los
-- proveedores ni cuánto dinero queda realmente en el negocio.
--
-- Este módulo registra:
--   - expenses:         la factura/gasto que recibe la clínica (lo que se debe)
--   - expense_payments: cada abono real que se le hace a ese gasto (lo que salió)
--
-- Con eso, el flujo de caja es: cobros (payments) - pagos (expense_payments).
--
-- Se guarda NCF, RNC del proveedor e ITBIS pagado por separado porque son
-- obligatorios para el reporte 606 de la DGII.
--
-- RLS: se habilita sin políticas, siguiendo el criterio de la migración 017.
-- La app accede vía service_role (createAdminClient), que bypassea RLS; el
-- acceso directo con la anon key queda denegado.
-- =============================================

-- =============================================
-- TABLA: expenses (Gastos / facturas de proveedor)
-- =============================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,

    -- Proveedor: puede estar registrado en `suppliers` o ser un gasto suelto
    -- (servicios como luz o internet que no ameritan ficha de proveedor)
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(200),
    supplier_rnc VARCHAR(20),

    -- Identificación
    expense_number VARCHAR(30) NOT NULL,          -- consecutivo interno: GAS-2026-00001
    supplier_invoice_number VARCHAR(50),          -- No. de factura del proveedor
    ncf VARCHAR(20),                              -- NCF del comprobante recibido (606 DGII)

    -- Clasificación y concepto
    -- category = grupo contable; subcategory = detalle libre dentro del grupo
    -- (ej: category 'servicios' + subcategory 'luz' / 'renta' / 'limpieza')
    category VARCHAR(30) NOT NULL DEFAULT 'otros',
    subcategory VARCHAR(50),
    concept TEXT NOT NULL,

    -- Fechas
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,

    -- Montos (tax_amount = ITBIS pagado, separado para el 606)
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'DOP',

    -- Estado de pago (se recalcula desde expense_payments)
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(20),                   -- método previsto de pago

    notes TEXT,

    -- Enlace opcional con la orden de compra que originó el gasto
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,

    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Grupos de gasto tal como los maneja la clínica:
    --   servicios     -> renta, luz, agua, comunicaciones, limpieza
    --   inversion     -> compra de productos e insumos para inventario
    --   nomina        -> sueldos y pagos a empleados
    --   equipos       -> aparatos y activos fijos
    --   mantenimiento -> reparaciones
    --   impuestos     -> DGII, TSS, arbitrios
    CONSTRAINT expenses_category_check CHECK (category IN (
        'servicios', 'inversion', 'nomina', 'equipos', 'mantenimiento',
        'impuestos', 'marketing', 'transporte', 'otros'
    )),
    CONSTRAINT expenses_status_check CHECK (status IN (
        'pending', 'partial', 'paid', 'cancelled'
    )),
    CONSTRAINT expenses_total_check CHECK (total >= 0),
    CONSTRAINT expenses_number_unique UNIQUE (clinic_id, expense_number)
);

CREATE INDEX IF NOT EXISTS idx_expenses_clinic    ON public.expenses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier  ON public.expenses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status    ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category  ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_issued    ON public.expenses(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_due       ON public.expenses(due_date);

-- =============================================
-- TABLA: expense_payments (Abonos a gastos)
-- =============================================
CREATE TABLE IF NOT EXISTS public.expense_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,

    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference VARCHAR(100),                       -- No. de cheque, transferencia, etc.
    notes TEXT,

    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT expense_payments_amount_check CHECK (amount > 0),
    CONSTRAINT expense_payments_method_check CHECK (payment_method IN (
        'cash', 'card', 'transfer', 'check', 'other'
    ))
);

CREATE INDEX IF NOT EXISTS idx_expense_payments_expense ON public.expense_payments(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_payments_date    ON public.expense_payments(payment_date DESC);

-- =============================================
-- SEGURIDAD: RLS habilitado sin políticas públicas
-- =============================================
ALTER TABLE public.expenses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_payments ENABLE ROW LEVEL SECURITY;
