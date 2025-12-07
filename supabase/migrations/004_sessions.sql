-- =============================================
-- MIGRACIÓN: Módulo de Sesiones Clínicas
-- Registro detallado de cada atención
-- =============================================

-- =============================================
-- TABLA: sessions (Sesiones Clínicas)
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,

    -- Referencias
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,

    -- Información del tratamiento
    treatment_name VARCHAR(200) NOT NULL,
    package_session_id UUID, -- Si es parte de un paquete

    -- Tiempos
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,

    -- Estado
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (
        status IN ('in_progress', 'completed', 'cancelled', 'incomplete')
    ),

    -- Zonas tratadas (JSON con estructura)
    treated_zones JSONB DEFAULT '[]',
    -- Ejemplo: [{"zone": "face_forehead", "notes": "..."}]

    -- Parámetros técnicos (según tipo de tratamiento)
    technical_parameters JSONB DEFAULT '{}',
    -- Ejemplo láser: {"wavelength": 1064, "fluence": 15, "pulse_duration": 10}
    -- Ejemplo inyectable: {"product": "Botox", "units": 20, "dilution": "2.5ml"}

    -- Productos utilizados
    products_used JSONB DEFAULT '[]',
    -- [{productId, lotNumber, quantity, unit}]

    -- Observaciones
    observations TEXT,
    patient_feedback TEXT,
    adverse_reactions TEXT,

    -- Resultados
    result_rating INTEGER CHECK (result_rating >= 1 AND result_rating <= 5),
    result_notes TEXT,

    -- Firmas
    patient_signature_url TEXT,
    professional_signature_url TEXT,
    signed_at TIMESTAMPTZ,

    -- Seguimiento
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    next_session_recommended_at DATE,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_sessions_clinic ON sessions(clinic_id);
CREATE INDEX idx_sessions_patient ON sessions(patient_id);
CREATE INDEX idx_sessions_professional ON sessions(professional_id);
CREATE INDEX idx_sessions_appointment ON sessions(appointment_id);
CREATE INDEX idx_sessions_treatment ON sessions(treatment_id);
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);
CREATE INDEX idx_sessions_status ON sessions(status);

-- =============================================
-- TABLA: clinical_notes (Notas Clínicas)
-- =============================================
CREATE TABLE IF NOT EXISTS clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Tipo de nota
    type VARCHAR(50) NOT NULL CHECK (
        type IN ('general', 'pre_treatment', 'post_treatment', 'follow_up', 'adverse_reaction', 'private')
    ),

    -- Contenido
    title VARCHAR(200),
    content TEXT NOT NULL,

    -- Visibilidad
    is_important BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false, -- Solo visible para el autor

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_clinical_notes_session ON clinical_notes(session_id);
CREATE INDEX idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX idx_clinical_notes_type ON clinical_notes(type);

-- =============================================
-- TABLA: prescriptions (Recetas/Prescripciones)
-- =============================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Tipo
    type VARCHAR(50) DEFAULT 'treatment' CHECK (
        type IN ('treatment', 'medication', 'care_instructions', 'referral')
    ),

    -- Contenido
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- Items de la prescripción
    items JSONB DEFAULT '[]',
    -- [{name, dosage, frequency, duration, instructions}]

    -- Instrucciones adicionales
    instructions TEXT,
    warnings TEXT,

    -- Vigencia
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,

    -- PDF generado
    pdf_url TEXT,

    -- Estado
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_prescriptions_session ON prescriptions(session_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_professional ON prescriptions(professional_id);

-- =============================================
-- TABLA: session_images (Fotos de la Sesión)
-- =============================================
CREATE TABLE IF NOT EXISTS session_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Clasificación
    type VARCHAR(20) NOT NULL CHECK (type IN ('before', 'during', 'after')),
    body_zone VARCHAR(50),

    -- Imagen
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,

    -- Metadatos
    caption TEXT,
    taken_at TIMESTAMPTZ DEFAULT now(),

    -- Control
    sort_order INTEGER DEFAULT 0,
    is_consent_image BOOLEAN DEFAULT false, -- Imagen del consentimiento firmado

    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_session_images_session ON session_images(session_id);
CREATE INDEX idx_session_images_patient ON session_images(patient_id);

-- =============================================
-- TABLA: session_products (Productos Usados en Sesión)
-- =============================================
CREATE TABLE IF NOT EXISTS session_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES product_lots(id) ON DELETE SET NULL,

    -- Cantidad
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'units', -- units, ml, mg, etc.

    -- Precio al momento (para cálculo de costo)
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),

    -- Notas
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_session_products_session ON session_products(session_id);
CREATE INDEX idx_session_products_product ON session_products(product_id);
CREATE INDEX idx_session_products_lot ON session_products(lot_id);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_session_timestamp ON sessions;
CREATE TRIGGER set_session_timestamp
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_timestamp();

-- Función para calcular duración al completar sesión
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calc_session_duration ON sessions;
CREATE TRIGGER calc_session_duration
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_session_duration();

-- Función para registrar sesión en timeline del paciente
CREATE OR REPLACE FUNCTION log_session_to_patient_timeline()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        PERFORM log_patient_interaction(
            NEW.patient_id,
            'session',
            'Sesión completada: ' || NEW.treatment_name,
            NEW.observations,
            'session',
            NEW.id,
            NEW.professional_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS session_to_timeline ON sessions;
CREATE TRIGGER session_to_timeline
    AFTER UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION log_session_to_patient_timeline();

-- Función para descontar inventario automáticamente
CREATE OR REPLACE FUNCTION deduct_session_products_from_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- Descontar del inventario
    UPDATE inventory
    SET quantity = quantity - NEW.quantity,
        updated_at = now()
    WHERE product_id = NEW.product_id
      AND clinic_id = (SELECT clinic_id FROM sessions WHERE id = NEW.session_id);

    -- Registrar movimiento de inventario
    INSERT INTO inventory_movements (
        clinic_id,
        product_id,
        lot_id,
        type,
        quantity,
        reference_type,
        reference_id,
        notes
    )
    SELECT
        s.clinic_id,
        NEW.product_id,
        NEW.lot_id,
        'consumption',
        -NEW.quantity,
        'session',
        NEW.session_id,
        'Consumo en sesión'
    FROM sessions s
    WHERE s.id = NEW.session_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deduct_inventory_on_session_product ON session_products;
CREATE TRIGGER deduct_inventory_on_session_product
    AFTER INSERT ON session_products
    FOR EACH ROW
    EXECUTE FUNCTION deduct_session_products_from_inventory();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_products ENABLE ROW LEVEL SECURITY;

-- Políticas para sessions
CREATE POLICY "Sessions visible by clinic members"
    ON sessions FOR SELECT
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Sessions creatable by clinic members"
    ON sessions FOR INSERT
    WITH CHECK (clinic_id = auth.clinic_id());

CREATE POLICY "Sessions updatable by clinic members"
    ON sessions FOR UPDATE
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Sessions deletable by admins"
    ON sessions FOR DELETE
    USING (clinic_id = auth.clinic_id() AND auth.role() IN ('admin', 'owner'));

-- Políticas para clinical_notes
CREATE POLICY "Clinical notes visible by clinic members"
    ON clinical_notes FOR SELECT
    USING (
        clinic_id = auth.clinic_id()
        AND (NOT is_private OR created_by = auth.uid())
    );

CREATE POLICY "Clinical notes manageable by author"
    ON clinical_notes FOR ALL
    USING (clinic_id = auth.clinic_id());

-- Políticas para prescriptions
CREATE POLICY "Prescriptions visible by clinic members"
    ON prescriptions FOR SELECT
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Prescriptions manageable by professionals"
    ON prescriptions FOR ALL
    USING (clinic_id = auth.clinic_id());

-- Políticas para session_images
CREATE POLICY "Session images follow session access"
    ON session_images FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_images.session_id
            AND s.clinic_id = auth.clinic_id()
        )
    );

-- Políticas para session_products
CREATE POLICY "Session products follow session access"
    ON session_products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_products.session_id
            AND s.clinic_id = auth.clinic_id()
        )
    );

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista de sesiones con información expandida
CREATE OR REPLACE VIEW session_details AS
SELECT
    s.*,
    p.first_name || ' ' || p.last_name as patient_name,
    p.phone as patient_phone,
    p.avatar_url as patient_avatar,
    u.full_name as professional_name,
    t.name as treatment_display_name,
    t.price as treatment_price,
    tc.name as category_name,
    tc.color as category_color,
    a.scheduled_at as appointment_scheduled_at,
    (
        SELECT COUNT(*)
        FROM session_images si
        WHERE si.session_id = s.id
    ) as image_count,
    (
        SELECT COALESCE(SUM(sp.total_cost), 0)
        FROM session_products sp
        WHERE sp.session_id = s.id
    ) as total_product_cost
FROM sessions s
JOIN patients p ON p.id = s.patient_id
JOIN users u ON u.id = s.professional_id
LEFT JOIN treatments t ON t.id = s.treatment_id
LEFT JOIN treatment_categories tc ON tc.id = t.category_id
LEFT JOIN appointments a ON a.id = s.appointment_id;

-- Comentarios
COMMENT ON TABLE sessions IS 'Registro de cada sesión de tratamiento realizada';
COMMENT ON TABLE clinical_notes IS 'Notas clínicas asociadas a sesiones o pacientes';
COMMENT ON TABLE prescriptions IS 'Recetas y prescripciones generadas';
COMMENT ON TABLE session_images IS 'Fotos tomadas durante la sesión';
COMMENT ON TABLE session_products IS 'Productos consumidos durante la sesión';
