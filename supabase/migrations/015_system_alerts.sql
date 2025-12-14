-- =============================================
-- MIGRACIÓN 015: SISTEMA DE ALERTAS GLOBAL
-- Sistema de Gestión de Clínicas Estéticas
-- =============================================

-- =============================================
-- TABLA: Alertas del Sistema
-- =============================================

CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Tipo y prioridad
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),

  -- Contenido
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,

  -- Referencia
  reference_type VARCHAR(50),
  reference_id UUID,
  link TEXT,

  -- Metadata adicional
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_system_alerts_clinic ON system_alerts(clinic_id);
CREATE INDEX idx_system_alerts_status ON system_alerts(status);
CREATE INDEX idx_system_alerts_priority ON system_alerts(priority);
CREATE INDEX idx_system_alerts_type ON system_alerts(type);
CREATE INDEX idx_system_alerts_created ON system_alerts(created_at DESC);
CREATE INDEX idx_system_alerts_reference ON system_alerts(reference_type, reference_id);

-- RLS
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_alerts_clinic_isolation ON system_alerts
  FOR ALL USING (clinic_id = '00000000-0000-0000-0000-000000000001');

-- =============================================
-- TABLA: Preferencias de Alertas por Usuario
-- =============================================

CREATE TABLE IF NOT EXISTS user_alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Preferencias por tipo
  stock_alerts BOOLEAN DEFAULT true,
  appointment_alerts BOOLEAN DEFAULT true,
  payment_alerts BOOLEAN DEFAULT true,
  commission_alerts BOOLEAN DEFAULT true,
  document_alerts BOOLEAN DEFAULT true,
  system_alerts BOOLEAN DEFAULT true,

  -- Canales de notificación
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,

  -- Frecuencia de resumen
  daily_digest BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_user_alert_prefs_user ON user_alert_preferences(user_id);

-- =============================================
-- FUNCIÓN: Limpiar alertas antiguas
-- =============================================

CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Eliminar alertas resueltas de más de 30 días
  DELETE FROM system_alerts
  WHERE status IN ('resolved', 'dismissed')
  AND created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Marcar como expiradas las alertas que han pasado su fecha de expiración
  UPDATE system_alerts
  SET status = 'dismissed'
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW()
  AND status = 'active';

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Generar alertas de stock automáticamente
-- =============================================

CREATE OR REPLACE FUNCTION check_and_create_stock_alerts()
RETURNS INTEGER AS $$
DECLARE
  v_product RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Revisar productos con stock bajo
  FOR v_product IN
    SELECT id, name, current_stock, min_stock, clinic_id
    FROM products
    WHERE is_active = true
    AND current_stock <= min_stock
  LOOP
    -- Verificar si ya existe una alerta activa para este producto
    IF NOT EXISTS (
      SELECT 1 FROM system_alerts
      WHERE reference_type = 'product'
      AND reference_id = v_product.id
      AND status = 'active'
      AND type IN ('stock_low', 'stock_critical')
    ) THEN
      INSERT INTO system_alerts (
        clinic_id,
        type,
        priority,
        title,
        message,
        reference_type,
        reference_id,
        link
      ) VALUES (
        v_product.clinic_id,
        CASE WHEN v_product.current_stock <= 0 THEN 'stock_critical' ELSE 'stock_low' END,
        CASE WHEN v_product.current_stock <= 0 THEN 'critical' ELSE 'high' END,
        CASE WHEN v_product.current_stock <= 0 THEN 'Stock agotado' ELSE 'Stock bajo' END,
        v_product.name || ' tiene ' || v_product.current_stock || ' unidades',
        'product',
        v_product.id,
        '/inventario'
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: Alerta automática cuando stock baja
-- =============================================

CREATE OR REPLACE FUNCTION trigger_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stock <= NEW.min_stock AND
     (OLD.current_stock IS NULL OR OLD.current_stock > OLD.min_stock) THEN
    INSERT INTO system_alerts (
      clinic_id,
      type,
      priority,
      title,
      message,
      reference_type,
      reference_id,
      link
    ) VALUES (
      NEW.clinic_id,
      CASE WHEN NEW.current_stock <= 0 THEN 'stock_critical' ELSE 'stock_low' END,
      CASE WHEN NEW.current_stock <= 0 THEN 'critical' ELSE 'high' END,
      CASE WHEN NEW.current_stock <= 0 THEN 'Stock agotado' ELSE 'Stock bajo' END,
      NEW.name || ' tiene ' || NEW.current_stock || ' unidades',
      'product',
      NEW.id,
      '/inventario'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_product_stock_alert ON products;
CREATE TRIGGER trigger_product_stock_alert
  AFTER UPDATE OF current_stock ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_stock_alert();

-- =============================================
-- VISTA: Resumen de Alertas
-- =============================================

CREATE OR REPLACE VIEW alert_summary_view AS
SELECT
  clinic_id,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged_count,
  COUNT(*) FILTER (WHERE priority = 'critical' AND status = 'active') as critical_count,
  COUNT(*) FILTER (WHERE priority = 'high' AND status = 'active') as high_count,
  COUNT(*) FILTER (WHERE type LIKE 'stock%' AND status = 'active') as stock_alerts,
  COUNT(*) FILTER (WHERE type LIKE 'appointment%' AND status = 'active') as appointment_alerts,
  COUNT(*) FILTER (WHERE type LIKE 'payment%' AND status = 'active') as payment_alerts
FROM system_alerts
GROUP BY clinic_id;
