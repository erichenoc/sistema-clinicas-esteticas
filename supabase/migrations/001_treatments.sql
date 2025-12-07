-- =============================================
-- MÓDULO DE TRATAMIENTOS - Sistema Clínicas Estéticas
-- =============================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: treatment_categories
-- Categorías de tratamientos (facial, corporal, capilar, etc.)
-- =============================================
CREATE TABLE treatment_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#6366f1',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(clinic_id, slug)
);

-- =============================================
-- TABLA: treatments
-- Catálogo de tratamientos/servicios
-- =============================================
CREATE TABLE treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL,
    category_id UUID REFERENCES treatment_categories(id) ON DELETE SET NULL,

    -- Información básica
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,                          -- Para pacientes
    description_internal TEXT,                 -- Protocolo para profesionales

    -- Duración y tiempos
    duration_minutes INT NOT NULL DEFAULT 60,
    buffer_minutes INT DEFAULT 0,              -- Tiempo entre citas

    -- Precios
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_from DECIMAL(10,2),                  -- "Desde $X" para rangos
    cost DECIMAL(10,2) DEFAULT 0,              -- Costo interno

    -- Sesiones
    recommended_sessions INT DEFAULT 1,
    session_interval_days INT,                 -- Intervalo entre sesiones

    -- Información clínica
    contraindications TEXT[],
    aftercare_instructions TEXT,

    -- Relaciones
    required_consent_id UUID,                  -- Consentimiento requerido
    allowed_professional_ids UUID[],           -- Profesionales habilitados
    required_room_types TEXT[],                -- Tipos de sala compatibles
    required_equipment_ids UUID[],             -- Equipos necesarios

    -- Consumibles estándar
    consumables JSONB DEFAULT '[]',            -- [{product_id, quantity}]

    -- Protocolo paso a paso
    protocol_steps JSONB DEFAULT '[]',

    -- Imágenes
    image_url TEXT,
    gallery_urls TEXT[],

    -- Configuración
    is_public BOOLEAN DEFAULT true,            -- Visible en portal paciente
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(clinic_id, slug)
);

-- =============================================
-- TABLA: packages
-- Paquetes y bonos de tratamientos
-- =============================================
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL,

    -- Información básica
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('bundle', 'sessions_pack')),
    -- bundle: combo de tratamientos diferentes
    -- sessions_pack: N sesiones del mismo tratamiento

    -- Items del paquete
    items JSONB NOT NULL DEFAULT '[]',         -- [{treatment_id, quantity, price_override}]

    -- Precios
    regular_price DECIMAL(10,2) NOT NULL,      -- Precio sin descuento
    sale_price DECIMAL(10,2) NOT NULL,         -- Precio con descuento

    -- Vigencia
    validity_days INT,                         -- Días de validez tras compra
    valid_from TIMESTAMPTZ,                    -- Fecha inicio de venta
    valid_until TIMESTAMPTZ,                   -- Fecha fin de venta

    -- Límites
    max_sales INT,                             -- Máximo de ventas
    sales_count INT DEFAULT 0,                 -- Contador de ventas

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_treatment_categories_clinic ON treatment_categories(clinic_id);
CREATE INDEX idx_treatment_categories_active ON treatment_categories(clinic_id, is_active);

CREATE INDEX idx_treatments_clinic ON treatments(clinic_id);
CREATE INDEX idx_treatments_category ON treatments(category_id);
CREATE INDEX idx_treatments_active ON treatments(clinic_id, is_active);
CREATE INDEX idx_treatments_public ON treatments(clinic_id, is_public, is_active);

CREATE INDEX idx_packages_clinic ON packages(clinic_id);
CREATE INDEX idx_packages_active ON packages(clinic_id, is_active);
CREATE INDEX idx_packages_validity ON packages(valid_from, valid_until);

-- =============================================
-- TRIGGERS: updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_treatment_categories
    BEFORE UPDATE ON treatment_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_treatments
    BEFORE UPDATE ON treatments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_packages
    BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE treatment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener clinic_id del usuario
CREATE OR REPLACE FUNCTION auth.clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Políticas para treatment_categories
CREATE POLICY "tenant_isolation_select" ON treatment_categories
    FOR SELECT USING (clinic_id = auth.clinic_id());
CREATE POLICY "tenant_isolation_insert" ON treatment_categories
    FOR INSERT WITH CHECK (clinic_id = auth.clinic_id());
CREATE POLICY "tenant_isolation_update" ON treatment_categories
    FOR UPDATE USING (clinic_id = auth.clinic_id());
CREATE POLICY "tenant_isolation_delete" ON treatment_categories
    FOR DELETE USING (clinic_id = auth.clinic_id());

-- Políticas para treatments
CREATE POLICY "tenant_isolation_select" ON treatments
    FOR SELECT USING (clinic_id = auth.clinic_id());
CREATE POLICY "tenant_isolation_insert" ON treatments
    FOR INSERT WITH CHECK (clinic_id = auth.clinic_id());
CREATE POLICY "tenant_isolation_update" ON treatments
    FOR UPDATE USING (clinic_id = auth.clinic_id());
CREATE POLICY "tenant_isolation_delete" ON treatments
    FOR DELETE USING (clinic_id = auth.clinic_id());

-- Políticas para packages
CREATE POLICY "tenant_isolation_select" ON packages
    FOR SELECT USING (clinic_id = auth.clinic_id());
CREATE POLICY "tenant_isolation_insert" ON packages
    FOR INSERT WITH CHECK (clinic_id = auth.clinic_id());
CREATE POLICY "tenant_isolation_update" ON packages
    FOR UPDATE USING (clinic_id = auth.clinic_id());
CREATE POLICY "tenant_isolation_delete" ON packages
    FOR DELETE USING (clinic_id = auth.clinic_id());

-- =============================================
-- DATOS DE EJEMPLO (Opcional - para desarrollo)
-- =============================================
-- Descomentar para insertar datos de prueba
/*
INSERT INTO treatment_categories (clinic_id, name, slug, description, icon, color, sort_order) VALUES
('00000000-0000-0000-0000-000000000001', 'Facial', 'facial', 'Tratamientos para el rostro', 'sparkles', '#ec4899', 1),
('00000000-0000-0000-0000-000000000001', 'Corporal', 'corporal', 'Tratamientos para el cuerpo', 'body', '#8b5cf6', 2),
('00000000-0000-0000-0000-000000000001', 'Capilar', 'capilar', 'Tratamientos para el cabello', 'scissors', '#f59e0b', 3),
('00000000-0000-0000-0000-000000000001', 'Láser', 'laser', 'Tratamientos con láser', 'zap', '#ef4444', 4),
('00000000-0000-0000-0000-000000000001', 'Inyectables', 'inyectables', 'Toxina botulínica y rellenos', 'syringe', '#06b6d4', 5);
*/
