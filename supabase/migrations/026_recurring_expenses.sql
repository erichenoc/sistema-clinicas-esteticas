-- =============================================
-- MIGRACIÓN 026: Gastos fijos recurrentes
-- =============================================
-- Contexto: la renta, la luz, el internet y el teléfono se pagan todos los
-- meses, pero había que registrarlos a mano uno por uno cada mes.
--
--   recurring_expenses -> la plantilla del gasto fijo (qué, a quién, cuánto)
--   expenses.recurring_expense_id -> qué plantilla generó ese gasto
--
-- Con el enlace, generar el mes es idempotente: si un fijo ya se registró en
-- el período no se vuelve a crear, aunque se presione el botón dos veces.
--
-- El monto de la plantilla es una estimación: la luz varía cada mes, así que
-- el gasto generado se puede editar después sin tocar la plantilla.
-- =============================================

CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,

    -- A quién se le paga
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(200),
    supplier_rnc VARCHAR(20),

    -- Qué es
    category VARCHAR(30) NOT NULL DEFAULT 'servicios',
    subcategory VARCHAR(50),
    concept TEXT NOT NULL,

    -- Cuánto (estimado) y cuándo vence
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    includes_tax BOOLEAN NOT NULL DEFAULT false,
    due_day SMALLINT,                              -- día del mes: 1-28
    payment_method VARCHAR(20),

    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,

    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT recurring_expenses_category_check CHECK (category IN (
        'servicios', 'inversion', 'nomina', 'equipos', 'mantenimiento',
        'impuestos', 'marketing', 'transporte', 'otros'
    )),
    CONSTRAINT recurring_expenses_amount_check CHECK (amount >= 0),
    -- Se limita a 28 para que exista en todos los meses, incluido febrero
    CONSTRAINT recurring_expenses_due_day_check CHECK (due_day IS NULL OR (due_day >= 1 AND due_day <= 28))
);

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_clinic ON public.recurring_expenses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_active ON public.recurring_expenses(is_active);

-- Enlace del gasto con la plantilla que lo genero
ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS recurring_expense_id UUID
    REFERENCES public.recurring_expenses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_recurring ON public.expenses(recurring_expense_id);

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
