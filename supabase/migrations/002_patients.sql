-- =============================================
-- MIGRACIÓN: Módulo de Pacientes
-- Tabla de pacientes con historial médico completo
-- =============================================

-- =============================================
-- TABLA: patients (Pacientes)
-- =============================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Datos personales
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    phone_secondary VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_say')),

    -- Documento de identidad
    document_type VARCHAR(20) DEFAULT 'ine' CHECK (document_type IN ('ine', 'passport', 'curp', 'other')),
    document_number VARCHAR(50),

    -- Dirección
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_zip VARCHAR(20),
    address_country VARCHAR(50) DEFAULT 'México',

    -- Contacto de emergencia
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),

    -- Preferencias
    preferred_contact_method VARCHAR(20) DEFAULT 'whatsapp' CHECK (preferred_contact_method IN ('whatsapp', 'sms', 'email', 'phone')),
    preferred_language VARCHAR(10) DEFAULT 'es',
    preferred_professional_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Segmentación
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'vip', 'blocked')),
    tags TEXT[] DEFAULT '{}',
    source VARCHAR(50), -- instagram, facebook, referral, walk-in, website, etc.
    referred_by_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,

    -- Información adicional
    notes TEXT,
    avatar_url TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Índices para búsqueda
    CONSTRAINT unique_patient_email_per_clinic UNIQUE (clinic_id, email),
    CONSTRAINT unique_patient_document_per_clinic UNIQUE (clinic_id, document_type, document_number)
);

-- Índices para búsqueda
CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_name ON patients(first_name, last_name);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_created ON patients(created_at DESC);

-- =============================================
-- TABLA: patient_medical_history (Historial Médico)
-- =============================================
CREATE TABLE IF NOT EXISTS patient_medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Tipo de piel (Escala Fitzpatrick)
    skin_type_fitzpatrick VARCHAR(10) CHECK (skin_type_fitzpatrick IN ('I', 'II', 'III', 'IV', 'V', 'VI')),

    -- Alergias
    allergies TEXT[] DEFAULT '{}',
    allergies_notes TEXT,

    -- Enfermedades crónicas
    chronic_conditions TEXT[] DEFAULT '{}', -- diabetes, hipertension, heart_disease, etc.
    chronic_conditions_notes TEXT,

    -- Medicamentos actuales
    current_medications TEXT[] DEFAULT '{}',
    medications_notes TEXT,

    -- Condiciones especiales
    is_pregnant BOOLEAN DEFAULT false,
    is_breastfeeding BOOLEAN DEFAULT false,
    has_pacemaker BOOLEAN DEFAULT false,
    has_metal_implants BOOLEAN DEFAULT false,
    has_keloid_tendency BOOLEAN DEFAULT false,
    is_smoker BOOLEAN DEFAULT false,

    -- Cirugías previas
    previous_surgeries TEXT[] DEFAULT '{}',
    previous_surgeries_notes TEXT,

    -- Tratamientos estéticos previos
    previous_treatments TEXT[] DEFAULT '{}',
    previous_treatments_notes TEXT,

    -- Notas adicionales
    additional_notes TEXT,

    -- Control
    last_updated_at TIMESTAMPTZ DEFAULT now(),
    last_updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT unique_medical_history_per_patient UNIQUE (patient_id)
);

CREATE INDEX idx_patient_medical_history_patient ON patient_medical_history(patient_id);

-- =============================================
-- TABLA: patient_images (Fotos Antes/Después)
-- =============================================
CREATE TABLE IF NOT EXISTS patient_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,

    -- Clasificación
    type VARCHAR(20) NOT NULL CHECK (type IN ('before', 'after', 'progress', 'document')),
    body_zone VARCHAR(50), -- face, body, abdomen, arms, legs, etc.

    -- Imagen
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,

    -- Metadatos
    caption TEXT,
    taken_at TIMESTAMPTZ DEFAULT now(),

    -- Control
    is_private BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_patient_images_patient ON patient_images(patient_id);
CREATE INDEX idx_patient_images_session ON patient_images(session_id);
CREATE INDEX idx_patient_images_type ON patient_images(type);

-- =============================================
-- TABLA: patient_documents (Documentos)
-- =============================================
CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Tipo de documento
    document_type VARCHAR(50) NOT NULL, -- consent, prescription, referral, lab_results, etc.
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Archivo
    file_url TEXT NOT NULL,
    file_type VARCHAR(50), -- pdf, image, etc.
    file_size INTEGER, -- bytes

    -- Referencia a consentimiento firmado
    signed_consent_id UUID REFERENCES signed_consents(id) ON DELETE SET NULL,

    -- Control
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_patient_documents_patient ON patient_documents(patient_id);
CREATE INDEX idx_patient_documents_type ON patient_documents(document_type);

-- =============================================
-- TABLA: patient_interactions (Timeline de interacciones)
-- =============================================
CREATE TABLE IF NOT EXISTS patient_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Tipo de interacción
    type VARCHAR(50) NOT NULL, -- appointment, session, call, message, note, payment, etc.

    -- Descripción
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Referencias
    reference_type VARCHAR(50), -- appointment, session, sale, etc.
    reference_id UUID,

    -- Metadatos
    metadata JSONB DEFAULT '{}',

    -- Control
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_patient_interactions_patient ON patient_interactions(patient_id);
CREATE INDEX idx_patient_interactions_type ON patient_interactions(type);
CREATE INDEX idx_patient_interactions_created ON patient_interactions(created_at DESC);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_patient_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para patients
DROP TRIGGER IF EXISTS set_patient_timestamp ON patients;
CREATE TRIGGER set_patient_timestamp
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_timestamp();

-- Función para crear historial médico automáticamente
CREATE OR REPLACE FUNCTION create_patient_medical_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO patient_medical_history (patient_id)
    VALUES (NEW.id)
    ON CONFLICT (patient_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear historial médico al crear paciente
DROP TRIGGER IF EXISTS auto_create_medical_history ON patients;
CREATE TRIGGER auto_create_medical_history
    AFTER INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION create_patient_medical_history();

-- Función para registrar interacción automáticamente
CREATE OR REPLACE FUNCTION log_patient_interaction(
    p_patient_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_interaction_id UUID;
BEGIN
    INSERT INTO patient_interactions (patient_id, type, title, description, reference_type, reference_id, created_by)
    VALUES (p_patient_id, p_type, p_title, p_description, p_reference_type, p_reference_id, p_created_by)
    RETURNING id INTO v_interaction_id;

    RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Habilitar RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas para patients
CREATE POLICY "Users can view patients in their clinic"
    ON patients FOR SELECT
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Users can insert patients in their clinic"
    ON patients FOR INSERT
    WITH CHECK (clinic_id = auth.clinic_id());

CREATE POLICY "Users can update patients in their clinic"
    ON patients FOR UPDATE
    USING (clinic_id = auth.clinic_id())
    WITH CHECK (clinic_id = auth.clinic_id());

CREATE POLICY "Only admins can delete patients"
    ON patients FOR DELETE
    USING (
        clinic_id = auth.clinic_id()
        AND auth.role() IN ('admin', 'owner')
    );

-- Políticas para patient_medical_history
CREATE POLICY "Medical history follows patient access"
    ON patient_medical_history FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM patients p
            WHERE p.id = patient_medical_history.patient_id
            AND p.clinic_id = auth.clinic_id()
        )
    );

-- Políticas para patient_images
CREATE POLICY "Patient images follow patient access"
    ON patient_images FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM patients p
            WHERE p.id = patient_images.patient_id
            AND p.clinic_id = auth.clinic_id()
        )
    );

-- Políticas para patient_documents
CREATE POLICY "Patient documents follow patient access"
    ON patient_documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM patients p
            WHERE p.id = patient_documents.patient_id
            AND p.clinic_id = auth.clinic_id()
        )
    );

-- Políticas para patient_interactions
CREATE POLICY "Patient interactions follow patient access"
    ON patient_interactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM patients p
            WHERE p.id = patient_interactions.patient_id
            AND p.clinic_id = auth.clinic_id()
        )
    );

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista de pacientes con resumen
CREATE OR REPLACE VIEW patient_summary AS
SELECT
    p.*,
    pmh.skin_type_fitzpatrick,
    pmh.allergies,
    pmh.chronic_conditions,
    pmh.is_pregnant,
    pmh.is_breastfeeding,
    (
        SELECT COUNT(*)
        FROM appointments a
        WHERE a.patient_id = p.id AND a.status = 'completed'
    ) as total_appointments,
    (
        SELECT MAX(a.scheduled_at)
        FROM appointments a
        WHERE a.patient_id = p.id
    ) as last_appointment_at,
    (
        SELECT COALESCE(SUM(s.total), 0)
        FROM sales s
        WHERE s.patient_id = p.id AND s.status = 'completed'
    ) as total_spent
FROM patients p
LEFT JOIN patient_medical_history pmh ON pmh.patient_id = p.id;

-- Comentarios para documentación
COMMENT ON TABLE patients IS 'Tabla principal de pacientes de la clínica';
COMMENT ON TABLE patient_medical_history IS 'Historial médico completo de cada paciente';
COMMENT ON TABLE patient_images IS 'Galería de fotos antes/después por paciente';
COMMENT ON TABLE patient_documents IS 'Documentos adjuntos del paciente (consentimientos, recetas, etc.)';
COMMENT ON TABLE patient_interactions IS 'Timeline de todas las interacciones con el paciente';
