-- =============================================
-- MIGRACIÓN 014: CÁLCULO AUTOMÁTICO DE COMISIONES
-- Sistema de Gestión de Clínicas Estéticas
-- =============================================

-- =============================================
-- FUNCIÓN: Calcular y crear comisión automáticamente
-- =============================================

CREATE OR REPLACE FUNCTION auto_calculate_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_professional_user_id UUID;
  v_professional_profile_id UUID;
  v_commission_rate DECIMAL(5,2);
  v_commission_amount DECIMAL(10,2);
  v_base_amount DECIMAL(10,2);
  v_clinic_id UUID;
BEGIN
  -- Solo procesar si la sesión está completada
  IF TG_TABLE_NAME = 'sessions' THEN
    IF NEW.status != 'completed' THEN
      RETURN NEW;
    END IF;

    v_professional_user_id := NEW.professional_id;
    v_base_amount := COALESCE(NEW.total_amount, 0);
    v_clinic_id := NEW.clinic_id;

  ELSIF TG_TABLE_NAME = 'sale_items' THEN
    -- Para items de venta, obtener el profesional de la venta
    SELECT s.professional_id, s.clinic_id, si.subtotal
    INTO v_professional_user_id, v_clinic_id, v_base_amount
    FROM sales s
    JOIN sale_items si ON si.sale_id = s.id
    WHERE si.id = NEW.id;

    IF v_professional_user_id IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Salir si no hay monto base o profesional
  IF v_base_amount IS NULL OR v_base_amount <= 0 OR v_professional_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener el profile_id del profesional y su tasa de comisión
  SELECT pp.id, COALESCE(pp.default_commission_rate, 15)
  INTO v_professional_profile_id, v_commission_rate
  FROM professional_profiles pp
  WHERE pp.user_id = v_professional_user_id
  AND pp.clinic_id = v_clinic_id;

  -- Si no tiene perfil profesional, intentar obtener de la tabla users
  IF v_professional_profile_id IS NULL THEN
    SELECT u.id, COALESCE(u.commission_rate, 15)
    INTO v_professional_profile_id, v_commission_rate
    FROM users u
    WHERE u.id = v_professional_user_id
    AND u.is_professional = true;

    -- Si aún no existe, salir
    IF v_professional_profile_id IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Calcular el monto de comisión
  v_commission_amount := v_base_amount * (v_commission_rate / 100);

  -- Crear la comisión automáticamente
  INSERT INTO commissions (
    clinic_id,
    professional_id,
    reference_type,
    reference_id,
    base_amount,
    commission_rate,
    commission_amount,
    status,
    period_start,
    period_end,
    notes,
    created_at
  ) VALUES (
    v_clinic_id,
    v_professional_profile_id,
    CASE
      WHEN TG_TABLE_NAME = 'sessions' THEN 'session'
      ELSE 'sale_item'
    END,
    NEW.id,
    v_base_amount,
    v_commission_rate,
    v_commission_amount,
    'pending',
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
    'Comisión calculada automáticamente',
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: Comisión automática al completar sesión
-- =============================================

DROP TRIGGER IF EXISTS trigger_session_commission ON sessions;
CREATE TRIGGER trigger_session_commission
  AFTER INSERT OR UPDATE OF status ON sessions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_calculate_commission();

-- =============================================
-- FUNCIÓN: Recalcular todas las comisiones de un período
-- =============================================

CREATE OR REPLACE FUNCTION recalculate_period_commissions(
  p_clinic_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  professional_id UUID,
  professional_name TEXT,
  total_base DECIMAL,
  total_commission DECIMAL,
  commission_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.professional_id,
    COALESCE(u.first_name || ' ' || u.last_name, 'Profesional') as professional_name,
    SUM(c.base_amount) as total_base,
    SUM(c.commission_amount) as total_commission,
    COUNT(*)::INTEGER as commission_count
  FROM commissions c
  LEFT JOIN professional_profiles pp ON pp.id = c.professional_id
  LEFT JOIN users u ON u.id = pp.user_id OR u.id = c.professional_id
  WHERE c.clinic_id = p_clinic_id
  AND c.created_at >= p_start_date
  AND c.created_at < p_end_date + INTERVAL '1 day'
  GROUP BY c.professional_id, u.first_name, u.last_name;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Aprobar comisiones en lote
-- =============================================

CREATE OR REPLACE FUNCTION batch_approve_commissions(
  p_commission_ids UUID[],
  p_approved_by UUID
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE commissions
  SET
    status = 'approved',
    approved_at = NOW(),
    approved_by = p_approved_by
  WHERE id = ANY(p_commission_ids)
  AND status = 'pending';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Pagar comisiones en lote
-- =============================================

CREATE OR REPLACE FUNCTION batch_pay_commissions(
  p_commission_ids UUID[],
  p_paid_by UUID,
  p_payment_reference VARCHAR DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE commissions
  SET
    status = 'paid',
    paid_at = NOW(),
    paid_by = p_paid_by,
    payment_date = CURRENT_DATE,
    payment_reference = p_payment_reference
  WHERE id = ANY(p_commission_ids)
  AND status = 'approved';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VISTA: Resumen de comisiones por profesional
-- =============================================

CREATE OR REPLACE VIEW commission_summary_view AS
SELECT
  c.clinic_id,
  c.professional_id,
  COALESCE(u.first_name || ' ' || u.last_name, 'Profesional') as professional_name,
  DATE_TRUNC('month', c.created_at)::DATE as period_month,
  COUNT(*) FILTER (WHERE c.status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE c.status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE c.status = 'paid') as paid_count,
  SUM(c.commission_amount) FILTER (WHERE c.status = 'pending') as pending_amount,
  SUM(c.commission_amount) FILTER (WHERE c.status = 'approved') as approved_amount,
  SUM(c.commission_amount) FILTER (WHERE c.status = 'paid') as paid_amount,
  SUM(c.commission_amount) as total_amount,
  SUM(c.base_amount) as total_base_amount
FROM commissions c
LEFT JOIN professional_profiles pp ON pp.id = c.professional_id
LEFT JOIN users u ON u.id = pp.user_id OR u.id = c.professional_id
GROUP BY c.clinic_id, c.professional_id, u.first_name, u.last_name, DATE_TRUNC('month', c.created_at);

-- =============================================
-- TABLA: Configuración de comisiones por clínica
-- =============================================

CREATE TABLE IF NOT EXISTS clinic_commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Configuración general
  default_commission_rate DECIMAL(5,2) DEFAULT 15,
  auto_calculate BOOLEAN DEFAULT true,
  auto_approve BOOLEAN DEFAULT false,

  -- Período de pago
  payment_period VARCHAR(20) DEFAULT 'monthly' CHECK (payment_period IN ('weekly', 'biweekly', 'monthly')),
  payment_day INTEGER DEFAULT 15, -- Día del mes/semana para pagar

  -- Notificaciones
  notify_on_commission_created BOOLEAN DEFAULT true,
  notify_on_commission_approved BOOLEAN DEFAULT true,
  notify_on_commission_paid BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(clinic_id)
);

-- Insertar configuración por defecto
INSERT INTO clinic_commission_settings (clinic_id)
SELECT id FROM clinics
ON CONFLICT (clinic_id) DO NOTHING;

-- =============================================
-- ÍNDICES ADICIONALES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at);
CREATE INDEX IF NOT EXISTS idx_commissions_reference ON commissions(reference_type, reference_id);
