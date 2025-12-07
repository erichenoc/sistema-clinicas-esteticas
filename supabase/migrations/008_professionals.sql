-- =============================================
-- MIGRACIÓN 008: MÓDULO DE PROFESIONALES
-- Sistema de Gestión de Clínicas Estéticas
-- =============================================

-- =============================================
-- EXTENSIÓN DE USUARIOS (PROFESIONALES)
-- =============================================

-- Perfil profesional extendido
CREATE TABLE IF NOT EXISTS professional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Información profesional
  professional_code VARCHAR(50), -- Cédula profesional
  license_number VARCHAR(100),
  license_expiry DATE,
  specialties TEXT[] DEFAULT '{}',
  title VARCHAR(100), -- Dr., Lic., etc.
  bio TEXT,

  -- Configuración laboral
  employment_type VARCHAR(20) DEFAULT 'employee' CHECK (employment_type IN ('employee', 'contractor', 'partner', 'owner')),
  hire_date DATE,
  termination_date DATE,
  base_salary DECIMAL(12,2),
  salary_type VARCHAR(20) DEFAULT 'monthly' CHECK (salary_type IN ('hourly', 'daily', 'weekly', 'biweekly', 'monthly')),

  -- Configuración de comisiones
  default_commission_rate DECIMAL(5,2) DEFAULT 0,
  commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed', 'tiered')),

  -- Disponibilidad
  max_daily_appointments INTEGER DEFAULT 20,
  appointment_buffer_minutes INTEGER DEFAULT 0, -- Tiempo entre citas
  accepts_walk_ins BOOLEAN DEFAULT true,

  -- Permisos especiales
  can_view_all_patients BOOLEAN DEFAULT false,
  can_modify_prices BOOLEAN DEFAULT false,
  can_give_discounts BOOLEAN DEFAULT false,
  max_discount_percent DECIMAL(5,2) DEFAULT 0,

  -- Estado
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'vacation', 'suspended', 'terminated')),

  -- Imagen y presentación
  profile_image_url TEXT,
  signature_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  show_on_booking BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(clinic_id, user_id),
  UNIQUE(clinic_id, professional_code)
);

-- =============================================
-- DOCUMENTOS DEL PROFESIONAL
-- =============================================

CREATE TABLE IF NOT EXISTS professional_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,

  document_type VARCHAR(50) NOT NULL, -- cedula, titulo, certificacion, etc.
  document_name VARCHAR(200) NOT NULL,
  document_number VARCHAR(100),
  issued_by VARCHAR(200),
  issued_date DATE,
  expiry_date DATE,
  file_url TEXT,
  notes TEXT,

  status VARCHAR(20) DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'pending_renewal', 'revoked')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- HORARIOS DE TRABAJO
-- =============================================

CREATE TABLE IF NOT EXISTS professional_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,

  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,

  is_active BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_until DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_schedule_times CHECK (end_time > start_time),
  CONSTRAINT valid_break_times CHECK (
    break_start IS NULL OR break_end IS NULL OR
    (break_end > break_start AND break_start >= start_time AND break_end <= end_time)
  )
);

-- =============================================
-- BLOQUEOS DE HORARIO
-- =============================================

CREATE TABLE IF NOT EXISTS schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,

  block_type VARCHAR(30) NOT NULL CHECK (block_type IN (
    'vacation', 'sick_leave', 'personal', 'training',
    'meeting', 'maintenance', 'holiday', 'other'
  )),
  title VARCHAR(200),
  description TEXT,

  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,

  recurrence_rule TEXT, -- RRULE format for recurring blocks

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  CONSTRAINT valid_block_dates CHECK (end_datetime > start_datetime)
);

-- =============================================
-- TRATAMIENTOS HABILITADOS POR PROFESIONAL
-- =============================================

CREATE TABLE IF NOT EXISTS professional_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,

  -- Configuración específica
  custom_duration_minutes INTEGER,
  custom_price DECIMAL(10,2),
  commission_rate DECIMAL(5,2), -- Override del rate por defecto

  is_primary BOOLEAN DEFAULT false, -- Si es su especialidad principal
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(professional_id, treatment_id)
);

-- =============================================
-- REGLAS DE COMISIONES
-- =============================================

CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE, -- NULL = regla global

  name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Tipo de comisión
  commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('treatment', 'product', 'package', 'all')),
  calculation_type VARCHAR(20) NOT NULL CHECK (calculation_type IN ('percentage', 'fixed', 'tiered')),

  -- Valores
  rate DECIMAL(5,2), -- Porcentaje o monto fijo
  tiered_rates JSONB, -- Para comisiones escalonadas: [{from: 0, to: 10000, rate: 10}, ...]

  -- Aplicación
  treatment_category_id UUID REFERENCES treatment_categories(id),
  treatment_id UUID REFERENCES treatments(id),
  product_category_id UUID REFERENCES product_categories(id),

  -- Condiciones
  min_amount DECIMAL(10,2),
  max_amount DECIMAL(10,2),
  applies_to_discounted BOOLEAN DEFAULT true,

  -- Vigencia
  effective_from DATE NOT NULL,
  effective_until DATE,

  priority INTEGER DEFAULT 0, -- Mayor prioridad = se aplica primero
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- =============================================
-- COMISIONES GENERADAS
-- =============================================

CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,

  -- Referencia
  reference_type VARCHAR(30) NOT NULL CHECK (reference_type IN ('session', 'sale', 'sale_item', 'package')),
  reference_id UUID NOT NULL,
  commission_rule_id UUID REFERENCES commission_rules(id),

  -- Montos
  base_amount DECIMAL(10,2) NOT NULL, -- Monto base sobre el que se calcula
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,

  -- Estado
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled', 'disputed')),

  -- Período y pago
  period_start DATE,
  period_end DATE,
  payment_date DATE,
  payment_reference VARCHAR(100),

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES users(id)
);

-- =============================================
-- REGISTRO DE ASISTENCIA
-- =============================================

CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),

  date DATE NOT NULL,

  -- Registro de entrada/salida
  clock_in TIMESTAMPTZ,
  clock_in_method VARCHAR(20), -- manual, biometric, app, qr
  clock_in_location POINT,
  clock_in_notes TEXT,

  clock_out TIMESTAMPTZ,
  clock_out_method VARCHAR(20),
  clock_out_location POINT,
  clock_out_notes TEXT,

  -- Descansos
  break_minutes INTEGER DEFAULT 0,

  -- Cálculos
  scheduled_hours DECIMAL(5,2),
  worked_hours DECIMAL(5,2),
  overtime_hours DECIMAL(5,2) DEFAULT 0,

  -- Estado
  status VARCHAR(20) DEFAULT 'present' CHECK (status IN (
    'present', 'absent', 'late', 'early_leave', 'vacation',
    'sick', 'holiday', 'work_from_home', 'partial'
  )),

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES users(id),

  UNIQUE(professional_id, date)
);

-- =============================================
-- METAS Y OBJETIVOS
-- =============================================

CREATE TABLE IF NOT EXISTS professional_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,

  goal_type VARCHAR(30) NOT NULL CHECK (goal_type IN (
    'revenue', 'appointments', 'new_patients', 'retention',
    'treatments', 'products', 'rating', 'custom'
  )),

  name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Período
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Valores
  target_value DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) DEFAULT 0,

  -- Bonificación
  bonus_amount DECIMAL(10,2),
  bonus_percentage DECIMAL(5,2),

  -- Estado
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'missed', 'cancelled')),
  achieved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- =============================================
-- EVALUACIONES DE DESEMPEÑO
-- =============================================

CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,

  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,

  -- Métricas
  total_appointments INTEGER DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  cancelled_appointments INTEGER DEFAULT 0,
  no_show_appointments INTEGER DEFAULT 0,

  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_commissions DECIMAL(12,2) DEFAULT 0,

  average_rating DECIMAL(3,2),
  total_reviews INTEGER DEFAULT 0,

  -- Evaluación cualitativa
  strengths TEXT,
  areas_for_improvement TEXT,
  goals_for_next_period TEXT,

  overall_score DECIMAL(3,2), -- 1-5

  -- Estado
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'acknowledged')),

  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- =============================================
-- CALIFICACIONES DE PACIENTES
-- =============================================

CREATE TABLE IF NOT EXISTS professional_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  appointment_id UUID REFERENCES appointments(id),

  -- Calificación
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  results_rating INTEGER CHECK (results_rating BETWEEN 1 AND 5),

  comment TEXT,

  -- Moderación
  is_public BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,

  -- Respuesta del profesional
  response TEXT,
  response_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_professional_profiles_clinic ON professional_profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_user ON professional_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_status ON professional_profiles(status);

CREATE INDEX IF NOT EXISTS idx_professional_documents_professional ON professional_documents(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_documents_expiry ON professional_documents(expiry_date) WHERE status = 'valid';

CREATE INDEX IF NOT EXISTS idx_professional_schedules_professional ON professional_schedules(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_schedules_day ON professional_schedules(day_of_week);

CREATE INDEX IF NOT EXISTS idx_schedule_blocks_professional ON schedule_blocks(professional_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_dates ON schedule_blocks(start_datetime, end_datetime);

CREATE INDEX IF NOT EXISTS idx_professional_treatments_professional ON professional_treatments(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_treatments_treatment ON professional_treatments(treatment_id);

CREATE INDEX IF NOT EXISTS idx_commission_rules_professional ON commission_rules(professional_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_effective ON commission_rules(effective_from, effective_until);

CREATE INDEX IF NOT EXISTS idx_commissions_professional ON commissions(professional_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_period ON commissions(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_professional ON attendance_logs(professional_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON attendance_logs(date);

CREATE INDEX IF NOT EXISTS idx_professional_goals_professional ON professional_goals(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_goals_period ON professional_goals(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_professional_ratings_professional ON professional_ratings(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_ratings_patient ON professional_ratings(patient_id);

-- =============================================
-- FUNCIONES
-- =============================================

-- Función para verificar disponibilidad del profesional
CREATE OR REPLACE FUNCTION check_professional_availability(
  p_professional_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
  v_start_time TIME;
  v_end_time TIME;
  v_has_schedule BOOLEAN;
  v_has_block BOOLEAN;
  v_has_appointment BOOLEAN;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_start_time);
  v_start_time := p_start_time::TIME;
  v_end_time := p_end_time::TIME;

  -- Verificar si tiene horario para ese día
  SELECT EXISTS (
    SELECT 1 FROM professional_schedules
    WHERE professional_id = p_professional_id
    AND day_of_week = v_day_of_week
    AND is_active = true
    AND start_time <= v_start_time
    AND end_time >= v_end_time
    AND (effective_from IS NULL OR effective_from <= p_start_time::DATE)
    AND (effective_until IS NULL OR effective_until >= p_start_time::DATE)
  ) INTO v_has_schedule;

  IF NOT v_has_schedule THEN
    RETURN false;
  END IF;

  -- Verificar bloqueos de horario
  SELECT EXISTS (
    SELECT 1 FROM schedule_blocks
    WHERE professional_id = p_professional_id
    AND start_datetime < p_end_time
    AND end_datetime > p_start_time
  ) INTO v_has_block;

  IF v_has_block THEN
    RETURN false;
  END IF;

  -- Verificar citas existentes
  SELECT EXISTS (
    SELECT 1 FROM appointments
    WHERE professional_id = (
      SELECT user_id FROM professional_profiles WHERE id = p_professional_id
    )
    AND start_time < p_end_time
    AND end_time > p_start_time
    AND status NOT IN ('cancelled', 'no_show')
  ) INTO v_has_appointment;

  RETURN NOT v_has_appointment;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular comisión
CREATE OR REPLACE FUNCTION calculate_commission(
  p_professional_id UUID,
  p_amount DECIMAL,
  p_reference_type VARCHAR,
  p_treatment_id UUID DEFAULT NULL,
  p_product_id UUID DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
  v_rule RECORD;
  v_commission DECIMAL := 0;
  v_rate DECIMAL;
BEGIN
  -- Buscar regla de comisión aplicable
  SELECT * INTO v_rule
  FROM commission_rules
  WHERE clinic_id = (SELECT clinic_id FROM professional_profiles WHERE id = p_professional_id)
  AND (professional_id = p_professional_id OR professional_id IS NULL)
  AND is_active = true
  AND effective_from <= CURRENT_DATE
  AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
  AND (
    commission_type = 'all'
    OR (commission_type = 'treatment' AND p_treatment_id IS NOT NULL)
    OR (commission_type = 'product' AND p_product_id IS NOT NULL)
  )
  ORDER BY
    CASE WHEN professional_id IS NOT NULL THEN 0 ELSE 1 END,
    priority DESC
  LIMIT 1;

  IF v_rule IS NULL THEN
    -- Usar tasa por defecto del profesional
    SELECT default_commission_rate INTO v_rate
    FROM professional_profiles
    WHERE id = p_professional_id;

    RETURN COALESCE(p_amount * (v_rate / 100), 0);
  END IF;

  -- Calcular según tipo
  IF v_rule.calculation_type = 'percentage' THEN
    v_commission := p_amount * (v_rule.rate / 100);
  ELSIF v_rule.calculation_type = 'fixed' THEN
    v_commission := v_rule.rate;
  ELSIF v_rule.calculation_type = 'tiered' THEN
    -- Implementar lógica escalonada
    SELECT INTO v_rate
      (tier->>'rate')::DECIMAL
    FROM jsonb_array_elements(v_rule.tiered_rates) AS tier
    WHERE (tier->>'from')::DECIMAL <= p_amount
    AND ((tier->>'to')::DECIMAL IS NULL OR (tier->>'to')::DECIMAL >= p_amount)
    LIMIT 1;

    v_commission := p_amount * (COALESCE(v_rate, 0) / 100);
  END IF;

  RETURN v_commission;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar métricas del profesional
CREATE OR REPLACE FUNCTION update_professional_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_professional_id UUID;
BEGIN
  -- Obtener el professional_id
  IF TG_TABLE_NAME = 'sessions' THEN
    SELECT pp.id INTO v_professional_id
    FROM professional_profiles pp
    WHERE pp.user_id = NEW.professional_id;
  END IF;

  IF v_professional_id IS NOT NULL THEN
    -- Actualizar metas activas si aplica
    UPDATE professional_goals
    SET current_value = current_value + CASE
      WHEN goal_type = 'appointments' THEN 1
      WHEN goal_type = 'revenue' THEN COALESCE(NEW.total_amount, 0)
      ELSE 0
    END,
    status = CASE
      WHEN current_value >= target_value THEN 'achieved'
      ELSE status
    END,
    achieved_at = CASE
      WHEN current_value >= target_value AND achieved_at IS NULL THEN NOW()
      ELSE achieved_at
    END
    WHERE professional_id = v_professional_id
    AND status = 'active'
    AND period_start <= CURRENT_DATE
    AND period_end >= CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_professionals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_professional_profiles_timestamp
  BEFORE UPDATE ON professional_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_professionals_timestamp();

CREATE TRIGGER update_professional_documents_timestamp
  BEFORE UPDATE ON professional_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_professionals_timestamp();

CREATE TRIGGER update_professional_schedules_timestamp
  BEFORE UPDATE ON professional_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_professionals_timestamp();

CREATE TRIGGER update_attendance_logs_timestamp
  BEFORE UPDATE ON attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_professionals_timestamp();

-- =============================================
-- VISTAS
-- =============================================

-- Vista de resumen del profesional
CREATE OR REPLACE VIEW professional_summary_view AS
SELECT
  pp.id,
  pp.clinic_id,
  pp.user_id,
  u.first_name,
  u.last_name,
  u.email,
  pp.title,
  pp.specialties,
  pp.status,
  pp.employment_type,
  pp.default_commission_rate,
  pp.profile_image_url,
  pp.show_on_booking,

  -- Estadísticas del mes actual
  (
    SELECT COUNT(*)
    FROM appointments a
    WHERE a.professional_id = pp.user_id
    AND DATE_TRUNC('month', a.start_time) = DATE_TRUNC('month', CURRENT_DATE)
    AND a.status = 'completed'
  ) as appointments_this_month,

  (
    SELECT COALESCE(SUM(s.total_amount), 0)
    FROM sessions s
    WHERE s.professional_id = pp.user_id
    AND DATE_TRUNC('month', s.created_at) = DATE_TRUNC('month', CURRENT_DATE)
  ) as revenue_this_month,

  (
    SELECT COALESCE(AVG(pr.overall_rating), 0)
    FROM professional_ratings pr
    WHERE pr.professional_id = pp.id
  ) as average_rating,

  (
    SELECT COUNT(*)
    FROM professional_ratings pr
    WHERE pr.professional_id = pp.id
  ) as total_ratings

FROM professional_profiles pp
JOIN users u ON u.id = pp.user_id;

-- Vista de disponibilidad semanal
CREATE OR REPLACE VIEW professional_weekly_schedule_view AS
SELECT
  ps.professional_id,
  pp.user_id,
  u.first_name || ' ' || u.last_name as professional_name,
  ps.branch_id,
  b.name as branch_name,
  ps.day_of_week,
  CASE ps.day_of_week
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
  END as day_name,
  ps.start_time,
  ps.end_time,
  ps.break_start,
  ps.break_end,
  ps.is_active
FROM professional_schedules ps
JOIN professional_profiles pp ON pp.id = ps.professional_id
JOIN users u ON u.id = pp.user_id
LEFT JOIN branches b ON b.id = ps.branch_id
WHERE ps.is_active = true
ORDER BY ps.professional_id, ps.day_of_week;

-- Vista de comisiones pendientes
CREATE OR REPLACE VIEW pending_commissions_view AS
SELECT
  c.id,
  c.clinic_id,
  c.professional_id,
  u.first_name || ' ' || u.last_name as professional_name,
  c.reference_type,
  c.reference_id,
  c.base_amount,
  c.commission_rate,
  c.commission_amount,
  c.status,
  c.period_start,
  c.period_end,
  c.created_at
FROM commissions c
JOIN professional_profiles pp ON pp.id = c.professional_id
JOIN users u ON u.id = pp.user_id
WHERE c.status = 'pending'
ORDER BY c.created_at DESC;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas para professional_profiles
CREATE POLICY professional_profiles_clinic_isolation ON professional_profiles
  FOR ALL USING (clinic_id = auth.clinic_id());

-- Políticas para professional_documents
CREATE POLICY professional_documents_clinic_isolation ON professional_documents
  FOR ALL USING (clinic_id = auth.clinic_id());

-- Políticas para professional_schedules
CREATE POLICY professional_schedules_clinic_isolation ON professional_schedules
  FOR ALL USING (clinic_id = auth.clinic_id());

-- Políticas para schedule_blocks
CREATE POLICY schedule_blocks_clinic_isolation ON schedule_blocks
  FOR ALL USING (clinic_id = auth.clinic_id());

-- Políticas para professional_treatments
CREATE POLICY professional_treatments_clinic_isolation ON professional_treatments
  FOR ALL USING (clinic_id = auth.clinic_id());

-- Políticas para commission_rules
CREATE POLICY commission_rules_clinic_isolation ON commission_rules
  FOR ALL USING (clinic_id = auth.clinic_id());

-- Políticas para commissions
CREATE POLICY commissions_clinic_isolation ON commissions
  FOR ALL USING (clinic_id = auth.clinic_id());

-- Políticas para attendance_logs
CREATE POLICY attendance_logs_clinic_isolation ON attendance_logs
  FOR ALL USING (clinic_id = auth.clinic_id());

-- Políticas para professional_goals
CREATE POLICY professional_goals_clinic_isolation ON professional_goals
  FOR ALL USING (clinic_id = auth.clinic_id());

-- Políticas para performance_reviews
CREATE POLICY performance_reviews_clinic_isolation ON performance_reviews
  FOR ALL USING (clinic_id = auth.clinic_id());

-- Políticas para professional_ratings
CREATE POLICY professional_ratings_clinic_isolation ON professional_ratings
  FOR ALL USING (clinic_id = auth.clinic_id());

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Los datos iniciales se crean cuando se registran los usuarios profesionales
