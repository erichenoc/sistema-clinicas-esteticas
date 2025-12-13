-- =============================================
-- MIGRACIÓN 011: AGREGAR COLUMNA COMMISSION_RATE A USERS
-- Para soportar comisiones automáticas por servicio
-- =============================================

-- Agregar columna commission_rate a users si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'commission_rate'
    ) THEN
        ALTER TABLE users ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 0;
    END IF;
END $$;

-- Agregar columna commission_type a users si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'commission_type'
    ) THEN
        ALTER TABLE users ADD COLUMN commission_type VARCHAR(20) DEFAULT 'percentage'
            CHECK (commission_type IN ('percentage', 'fixed', 'tiered'));
    END IF;
END $$;

-- Agregar columna salary_type a users si no existe (para distinguir solo comisiones)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'salary_type'
    ) THEN
        ALTER TABLE users ADD COLUMN salary_type VARCHAR(20) DEFAULT 'monthly'
            CHECK (salary_type IN ('hourly', 'daily', 'weekly', 'biweekly', 'monthly', 'commission_only'));
    END IF;
END $$;

-- Agregar columna base_salary a users si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'base_salary'
    ) THEN
        ALTER TABLE users ADD COLUMN base_salary DECIMAL(12,2);
    END IF;
END $$;

-- Comentarios para documentación
COMMENT ON COLUMN users.commission_rate IS 'Tasa de comisión del profesional (porcentaje)';
COMMENT ON COLUMN users.commission_type IS 'Tipo de comisión: percentage, fixed, tiered';
COMMENT ON COLUMN users.salary_type IS 'Tipo de compensación: monthly, biweekly, weekly, hourly, commission_only';
COMMENT ON COLUMN users.base_salary IS 'Salario base del profesional';
