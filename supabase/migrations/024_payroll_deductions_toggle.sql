-- =============================================
-- MIGRACIÓN 024: Descuentos de nómina opcionales
-- =============================================
-- Contexto: la nómina aplicaba AFP (2.87%), ARS (3.04%) e ISR a todos los
-- empleados por igual, sin forma de desactivarlos. En la práctica hay personal
-- que se paga por honorarios o de manera informal, a quien se le entrega el
-- monto bruto completo.
--
-- La preferencia se guarda por empleado porque es una característica de la
-- relación laboral, no de la nómina de un mes en particular.
-- =============================================

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS apply_payroll_deductions BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.users.apply_payroll_deductions IS
    'false = se le paga el bruto sin AFP, ARS ni ISR';
