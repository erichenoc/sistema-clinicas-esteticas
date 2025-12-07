-- =============================================
-- MIGRACIÓN: Módulo de Consentimientos Informados
-- Plantillas y consentimientos firmados digitalmente
-- =============================================

-- =============================================
-- TABLA: consent_templates (Plantillas de Consentimiento)
-- =============================================
CREATE TABLE IF NOT EXISTS consent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Información básica
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50), -- Código interno (ej: CON-001)
    description TEXT,

    -- Categoría y tratamientos asociados
    category VARCHAR(50) DEFAULT 'general' CHECK (
        category IN ('general', 'facial', 'corporal', 'inyectable', 'laser', 'quirurgico', 'otro')
    ),
    treatment_ids UUID[] DEFAULT '{}', -- Tratamientos que requieren este consentimiento

    -- Contenido
    content TEXT NOT NULL, -- Contenido en formato HTML/Markdown con variables
    -- Variables disponibles: {{patient_name}}, {{patient_id}}, {{treatment_name}},
    -- {{professional_name}}, {{date}}, {{clinic_name}}, {{branch_name}}

    -- Secciones opcionales
    risks_section TEXT, -- Riesgos específicos
    alternatives_section TEXT, -- Alternativas al tratamiento
    contraindications_section TEXT, -- Contraindicaciones
    aftercare_section TEXT, -- Cuidados post-tratamiento

    -- Campos adicionales requeridos
    required_fields JSONB DEFAULT '[]',
    -- Ejemplo: [{"key": "weight", "label": "Peso (kg)", "type": "number", "required": true}]

    -- Versionado
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT true,
    previous_version_id UUID REFERENCES consent_templates(id),

    -- Estado
    is_active BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false, -- Si es obligatorio para ciertos tratamientos

    -- Configuración
    requires_witness BOOLEAN DEFAULT false,
    requires_photo_id BOOLEAN DEFAULT false,
    expiry_days INTEGER, -- Días de validez (null = indefinido)

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_consent_templates_clinic ON consent_templates(clinic_id);
CREATE INDEX idx_consent_templates_category ON consent_templates(category);
CREATE INDEX idx_consent_templates_active ON consent_templates(is_active, is_current);
CREATE UNIQUE INDEX idx_consent_templates_code ON consent_templates(clinic_id, code) WHERE code IS NOT NULL;

-- =============================================
-- TABLA: signed_consents (Consentimientos Firmados)
-- =============================================
CREATE TABLE IF NOT EXISTS signed_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,

    -- Referencias
    template_id UUID NOT NULL REFERENCES consent_templates(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,

    -- Profesional que obtuvo el consentimiento
    obtained_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Contenido firmado (snapshot del template al momento de firmar)
    template_version INTEGER NOT NULL,
    content_snapshot TEXT NOT NULL, -- HTML con variables reemplazadas

    -- Campos adicionales completados
    additional_fields JSONB DEFAULT '{}',
    -- Ejemplo: {"weight": 65, "allergies_confirmed": true}

    -- Firmas
    patient_signature_url TEXT NOT NULL,
    patient_signature_data JSONB, -- Metadatos de la firma
    patient_signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Firma del profesional (opcional)
    professional_signature_url TEXT,
    professional_signed_at TIMESTAMPTZ,

    -- Firma del testigo (si aplica)
    witness_name VARCHAR(200),
    witness_id_number VARCHAR(50),
    witness_signature_url TEXT,
    witness_signed_at TIMESTAMPTZ,

    -- Foto de identificación (si aplica)
    patient_id_photo_url TEXT,

    -- Verificación
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB,

    -- PDF generado
    pdf_url TEXT,
    pdf_generated_at TIMESTAMPTZ,

    -- Estado
    status VARCHAR(20) DEFAULT 'signed' CHECK (
        status IN ('signed', 'revoked', 'expired', 'superseded')
    ),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id),
    revocation_reason TEXT,

    -- Vigencia
    expires_at DATE,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_signed_consents_clinic ON signed_consents(clinic_id);
CREATE INDEX idx_signed_consents_patient ON signed_consents(patient_id);
CREATE INDEX idx_signed_consents_template ON signed_consents(template_id);
CREATE INDEX idx_signed_consents_session ON signed_consents(session_id);
CREATE INDEX idx_signed_consents_status ON signed_consents(status);
CREATE INDEX idx_signed_consents_signed_at ON signed_consents(patient_signed_at DESC);

-- =============================================
-- TABLA: consent_audit_log (Log de Auditoría de Consentimientos)
-- =============================================
CREATE TABLE IF NOT EXISTS consent_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signed_consent_id UUID NOT NULL REFERENCES signed_consents(id) ON DELETE CASCADE,

    -- Acción
    action VARCHAR(50) NOT NULL CHECK (
        action IN ('created', 'viewed', 'downloaded', 'emailed', 'revoked', 'expired')
    ),

    -- Detalles
    details JSONB,

    -- Quién realizó la acción
    performed_by UUID REFERENCES users(id),
    ip_address VARCHAR(45),

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_consent_audit_consent ON consent_audit_log(signed_consent_id);
CREATE INDEX idx_consent_audit_action ON consent_audit_log(action);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_consent_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_consent_template_timestamp ON consent_templates;
CREATE TRIGGER set_consent_template_timestamp
    BEFORE UPDATE ON consent_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_consent_template_timestamp();

DROP TRIGGER IF EXISTS set_signed_consent_timestamp ON signed_consents;
CREATE TRIGGER set_signed_consent_timestamp
    BEFORE UPDATE ON signed_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_consent_template_timestamp();

-- Función para crear nueva versión de plantilla
CREATE OR REPLACE FUNCTION create_consent_template_version(
    p_template_id UUID,
    p_content TEXT,
    p_updated_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_old_template consent_templates%ROWTYPE;
    v_new_id UUID;
BEGIN
    -- Obtener template actual
    SELECT * INTO v_old_template FROM consent_templates WHERE id = p_template_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template no encontrado';
    END IF;

    -- Marcar versión actual como no actual
    UPDATE consent_templates SET is_current = false WHERE id = p_template_id;

    -- Crear nueva versión
    INSERT INTO consent_templates (
        clinic_id, name, code, description, category, treatment_ids,
        content, risks_section, alternatives_section, contraindications_section,
        aftercare_section, required_fields, version, is_current, previous_version_id,
        is_active, is_required, requires_witness, requires_photo_id, expiry_days,
        created_by
    )
    VALUES (
        v_old_template.clinic_id, v_old_template.name, v_old_template.code,
        v_old_template.description, v_old_template.category, v_old_template.treatment_ids,
        p_content, v_old_template.risks_section, v_old_template.alternatives_section,
        v_old_template.contraindications_section, v_old_template.aftercare_section,
        v_old_template.required_fields, v_old_template.version + 1, true, p_template_id,
        v_old_template.is_active, v_old_template.is_required, v_old_template.requires_witness,
        v_old_template.requires_photo_id, v_old_template.expiry_days, p_updated_by
    )
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un consentimiento está vigente
CREATE OR REPLACE FUNCTION is_consent_valid(p_consent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_consent signed_consents%ROWTYPE;
BEGIN
    SELECT * INTO v_consent FROM signed_consents WHERE id = p_consent_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Verificar estado
    IF v_consent.status != 'signed' THEN
        RETURN false;
    END IF;

    -- Verificar expiración
    IF v_consent.expires_at IS NOT NULL AND v_consent.expires_at < CURRENT_DATE THEN
        -- Marcar como expirado
        UPDATE signed_consents SET status = 'expired' WHERE id = p_consent_id;

        -- Log de auditoría
        INSERT INTO consent_audit_log (signed_consent_id, action, details)
        VALUES (p_consent_id, 'expired', '{"reason": "Fecha de expiración alcanzada"}'::jsonb);

        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener consentimientos pendientes de un paciente
CREATE OR REPLACE FUNCTION get_pending_consents_for_patient(
    p_patient_id UUID,
    p_treatment_id UUID DEFAULT NULL
)
RETURNS TABLE (
    template_id UUID,
    template_name VARCHAR(200),
    category VARCHAR(50),
    is_required BOOLEAN,
    last_signed_at TIMESTAMPTZ,
    is_expired BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.id,
        ct.name,
        ct.category,
        ct.is_required,
        (
            SELECT MAX(sc.patient_signed_at)
            FROM signed_consents sc
            WHERE sc.template_id = ct.id
              AND sc.patient_id = p_patient_id
              AND sc.status = 'signed'
        ),
        (
            SELECT CASE
                WHEN ct.expiry_days IS NULL THEN false
                WHEN MAX(sc.patient_signed_at) IS NULL THEN false
                ELSE (MAX(sc.patient_signed_at) + (ct.expiry_days || ' days')::interval) < now()
            END
            FROM signed_consents sc
            WHERE sc.template_id = ct.id
              AND sc.patient_id = p_patient_id
              AND sc.status = 'signed'
        )
    FROM consent_templates ct
    WHERE ct.is_active = true
      AND ct.is_current = true
      AND ct.clinic_id = (SELECT clinic_id FROM patients WHERE id = p_patient_id)
      AND (
          p_treatment_id IS NULL
          OR p_treatment_id = ANY(ct.treatment_ids)
          OR ct.category = 'general'
      );
END;
$$ LANGUAGE plpgsql;

-- Función para registrar en timeline del paciente
CREATE OR REPLACE FUNCTION log_consent_to_patient_timeline()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_patient_interaction(
            NEW.patient_id,
            'consent',
            'Consentimiento firmado: ' || (SELECT name FROM consent_templates WHERE id = NEW.template_id),
            NULL,
            'consent',
            NEW.id,
            NEW.obtained_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS consent_to_timeline ON signed_consents;
CREATE TRIGGER consent_to_timeline
    AFTER INSERT ON signed_consents
    FOR EACH ROW
    EXECUTE FUNCTION log_consent_to_patient_timeline();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE consent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE signed_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas para consent_templates
CREATE POLICY "Consent templates visible by clinic members"
    ON consent_templates FOR SELECT
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Consent templates manageable by admins"
    ON consent_templates FOR ALL
    USING (clinic_id = auth.clinic_id() AND auth.role() IN ('admin', 'owner'));

-- Políticas para signed_consents
CREATE POLICY "Signed consents visible by clinic members"
    ON signed_consents FOR SELECT
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Signed consents creatable by clinic members"
    ON signed_consents FOR INSERT
    WITH CHECK (clinic_id = auth.clinic_id());

CREATE POLICY "Signed consents updatable by admins"
    ON signed_consents FOR UPDATE
    USING (clinic_id = auth.clinic_id() AND auth.role() IN ('admin', 'owner'));

-- Políticas para consent_audit_log
CREATE POLICY "Consent audit visible by admins"
    ON consent_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM signed_consents sc
            WHERE sc.id = consent_audit_log.signed_consent_id
            AND sc.clinic_id = auth.clinic_id()
        )
    );

CREATE POLICY "Consent audit insertable by members"
    ON consent_audit_log FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM signed_consents sc
            WHERE sc.id = consent_audit_log.signed_consent_id
            AND sc.clinic_id = auth.clinic_id()
        )
    );

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista de consentimientos firmados con información expandida
CREATE OR REPLACE VIEW signed_consent_details AS
SELECT
    sc.*,
    ct.name as template_name,
    ct.category as template_category,
    ct.code as template_code,
    p.first_name || ' ' || p.last_name as patient_name,
    p.document_number as patient_document,
    u.full_name as obtained_by_name,
    t.name as treatment_name,
    CASE
        WHEN sc.status != 'signed' THEN false
        WHEN sc.expires_at IS NULL THEN true
        ELSE sc.expires_at >= CURRENT_DATE
    END as is_valid
FROM signed_consents sc
JOIN consent_templates ct ON ct.id = sc.template_id
JOIN patients p ON p.id = sc.patient_id
JOIN users u ON u.id = sc.obtained_by
LEFT JOIN treatments t ON t.id = sc.treatment_id;

-- Vista de plantillas con estadísticas
CREATE OR REPLACE VIEW consent_template_stats AS
SELECT
    ct.*,
    (
        SELECT COUNT(*)
        FROM signed_consents sc
        WHERE sc.template_id = ct.id
    ) as total_signed,
    (
        SELECT COUNT(*)
        FROM signed_consents sc
        WHERE sc.template_id = ct.id
          AND sc.status = 'signed'
          AND (sc.expires_at IS NULL OR sc.expires_at >= CURRENT_DATE)
    ) as active_signed,
    (
        SELECT MAX(sc.patient_signed_at)
        FROM signed_consents sc
        WHERE sc.template_id = ct.id
    ) as last_signed_at
FROM consent_templates ct
WHERE ct.is_current = true;

-- =============================================
-- DATOS INICIALES (Plantillas de ejemplo)
-- =============================================

-- Nota: Las plantillas se insertarán con clinic_id específico al crear la clínica

-- Comentarios
COMMENT ON TABLE consent_templates IS 'Plantillas de consentimientos informados con versionado';
COMMENT ON TABLE signed_consents IS 'Consentimientos firmados digitalmente por pacientes';
COMMENT ON TABLE consent_audit_log IS 'Log de auditoría para acciones sobre consentimientos';
COMMENT ON COLUMN consent_templates.content IS 'Contenido HTML/Markdown con variables: {{patient_name}}, {{treatment_name}}, etc.';
COMMENT ON COLUMN signed_consents.content_snapshot IS 'Copia del contenido con variables reemplazadas al momento de firmar';
