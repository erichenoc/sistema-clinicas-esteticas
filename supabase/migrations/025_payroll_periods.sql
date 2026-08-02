-- =============================================
-- MIGRACIÓN 025: Nómina persistente
-- =============================================
-- Contexto: la nómina se calculaba en memoria cada vez que se abría la
-- pantalla y el historial de meses anteriores era de ejemplo. No se podía
-- cerrar un mes ni consultar despues lo que realmente se pagó.
--
--   payroll_periods -> la nómina de un mes (se cierra y queda congelada)
--   payroll_items   -> lo que le tocó a cada empleado en ese mes
--
-- Los items guardan una FOTO del momento del cierre (nombre, sueldo, tasas
-- aplicadas). Si mañana cambia el sueldo de alguien o se le desactivan los
-- descuentos, la nómina ya cerrada no se altera: es un documento histórico.
--
-- Al marcarse como pagada se genera un gasto en la categoría 'nomina', para
-- que el pago aparezca en el flujo de caja como cualquier otra salida.
--
-- RLS habilitado sin políticas (criterio de la migración 017): la app entra
-- por service_role y el acceso directo con la anon key queda denegado.
-- =============================================

CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,

    period VARCHAR(7) NOT NULL,                    -- '2026-08'
    status VARCHAR(20) NOT NULL DEFAULT 'closed',  -- closed | paid | cancelled

    -- Totales congelados al cierre
    employee_count INTEGER NOT NULL DEFAULT 0,
    total_gross DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_net DECIMAL(12,2) NOT NULL DEFAULT 0,
    employer_cost DECIMAL(12,2) NOT NULL DEFAULT 0,

    notes TEXT,

    closed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    closed_at TIMESTAMPTZ DEFAULT now(),
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(20),

    -- Gasto generado al pagar, para que se refleje en el flujo de caja
    expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT payroll_periods_status_check CHECK (status IN ('closed', 'paid', 'cancelled')),
    CONSTRAINT payroll_periods_format_check CHECK (period ~ '^\d{4}-\d{2}$'),
    CONSTRAINT payroll_periods_unique UNIQUE (clinic_id, period)
);

CREATE INDEX IF NOT EXISTS idx_payroll_periods_period ON public.payroll_periods(period DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON public.payroll_periods(status);

CREATE TABLE IF NOT EXISTS public.payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,

    -- Se conserva el empleado aunque despues se elimine del sistema
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    employee_name VARCHAR(200) NOT NULL,
    employee_document VARCHAR(30),
    position VARCHAR(120),

    -- Ingresos
    base_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    commissions DECIMAL(12,2) NOT NULL DEFAULT 0,
    bonuses DECIMAL(12,2) NOT NULL DEFAULT 0,
    overtime DECIMAL(12,2) NOT NULL DEFAULT 0,
    gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- Deducciones (apply_deductions = false: se paga el bruto completo)
    apply_deductions BOOLEAN NOT NULL DEFAULT true,
    afp_employee DECIMAL(12,2) NOT NULL DEFAULT 0,
    ars_employee DECIMAL(12,2) NOT NULL DEFAULT 0,
    isr_withholding DECIMAL(12,2) NOT NULL DEFAULT 0,
    other_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,

    net_salary DECIMAL(12,2) NOT NULL DEFAULT 0,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT payroll_items_net_check CHECK (net_salary >= 0)
);

CREATE INDEX IF NOT EXISTS idx_payroll_items_period ON public.payroll_items(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_user   ON public.payroll_items(user_id);

ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_items   ENABLE ROW LEVEL SECURITY;
