-- =============================================
-- MIGRACIÓN: Módulo de Agenda y Citas
-- Sistema de citas, salas, horarios y recordatorios
-- =============================================

-- =============================================
-- TABLA: rooms (Salas/Cabinas)
-- =============================================
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'cabin', -- cabin, surgery, consultation
    capacity INTEGER DEFAULT 1,

    -- Equipamiento
    equipment_ids UUID[] DEFAULT '{}',
    features TEXT[] DEFAULT '{}', -- has_laser, has_ac, etc.

    -- Configuración
    color VARCHAR(7) DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rooms_clinic ON rooms(clinic_id);
CREATE INDEX idx_rooms_branch ON rooms(branch_id);

-- =============================================
-- TABLA: professional_schedules (Horarios de profesionales)
-- =============================================
CREATE TABLE IF NOT EXISTS professional_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,

    -- Día de la semana (0 = Domingo, 6 = Sábado)
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),

    -- Horario
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Descanso
    break_start TIME,
    break_end TIME,

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_schedule_per_day UNIQUE (professional_id, branch_id, day_of_week),
    CONSTRAINT valid_schedule CHECK (start_time < end_time),
    CONSTRAINT valid_break CHECK (break_start IS NULL OR break_end IS NULL OR break_start < break_end)
);

CREATE INDEX idx_professional_schedules_professional ON professional_schedules(professional_id);
CREATE INDEX idx_professional_schedules_clinic ON professional_schedules(clinic_id);

-- =============================================
-- TABLA: schedule_blocks (Bloqueos de agenda)
-- =============================================
CREATE TABLE IF NOT EXISTS schedule_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,

    -- Tipo de bloqueo
    type VARCHAR(50) NOT NULL, -- vacation, personal, maintenance, break, holiday

    title VARCHAR(200) NOT NULL,
    notes TEXT,

    -- Período
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,

    -- Recurrencia (opcional)
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- iCalendar RRULE

    is_all_day BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT valid_block_period CHECK (start_at < end_at)
);

CREATE INDEX idx_schedule_blocks_professional ON schedule_blocks(professional_id);
CREATE INDEX idx_schedule_blocks_room ON schedule_blocks(room_id);
CREATE INDEX idx_schedule_blocks_period ON schedule_blocks(start_at, end_at);

-- =============================================
-- TABLA: appointments (Citas)
-- =============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,

    -- Participantes
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,

    -- Tratamiento
    treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
    treatment_name VARCHAR(200), -- Guardamos el nombre por si se elimina el tratamiento
    package_session_id UUID, -- Si es parte de un paquete

    -- Fecha y hora
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    buffer_minutes INTEGER DEFAULT 0,

    -- Estado
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (
        status IN ('scheduled', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show')
    ),
    status_changed_at TIMESTAMPTZ,
    status_changed_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Notas
    notes TEXT, -- Notas internas
    patient_notes TEXT, -- Notas visibles para el paciente
    cancellation_reason TEXT,

    -- Recordatorios
    reminder_sent_at TIMESTAMPTZ,
    confirmation_sent_at TIMESTAMPTZ,

    -- Recurrencia
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    parent_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Para evitar sobreposición
    CONSTRAINT valid_appointment_period CHECK (duration_minutes > 0)
);

CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_professional ON appointments(professional_id);
CREATE INDEX idx_appointments_room ON appointments(room_id);
CREATE INDEX idx_appointments_treatment ON appointments(treatment_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(DATE(scheduled_at));

-- =============================================
-- TABLA: waitlist (Lista de espera)
-- =============================================
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,

    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
    professional_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Preferencias
    preferred_dates JSONB, -- ["2024-01-15", "2024-01-16"]
    preferred_times JSONB, -- ["morning", "afternoon", "evening"]
    flexible BOOLEAN DEFAULT false,

    notes TEXT,
    priority INTEGER DEFAULT 0, -- Mayor = más prioridad

    -- Estado
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'contacted', 'scheduled', 'cancelled')),
    scheduled_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_waitlist_clinic ON waitlist(clinic_id);
CREATE INDEX idx_waitlist_patient ON waitlist(patient_id);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_priority ON waitlist(priority DESC);

-- =============================================
-- TABLA: appointment_reminders (Recordatorios enviados)
-- =============================================
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

    -- Tipo de recordatorio
    type VARCHAR(20) NOT NULL CHECK (type IN ('reminder', 'confirmation', 'followup')),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),

    -- Estado
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),

    -- Contenido
    message_template_id UUID,
    message_content TEXT,

    -- Tiempos
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,

    -- Error (si falló)
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_appointment_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX idx_appointment_reminders_scheduled ON appointment_reminders(scheduled_for);
CREATE INDEX idx_appointment_reminders_status ON appointment_reminders(status);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para verificar disponibilidad
CREATE OR REPLACE FUNCTION check_appointment_availability(
    p_professional_id UUID,
    p_room_id UUID,
    p_start_at TIMESTAMPTZ,
    p_duration INTEGER,
    p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_end_at TIMESTAMPTZ;
    v_conflict_count INTEGER;
BEGIN
    v_end_at := p_start_at + (p_duration || ' minutes')::INTERVAL;

    -- Verificar conflictos con otras citas del profesional
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments a
    WHERE a.professional_id = p_professional_id
      AND a.status NOT IN ('cancelled', 'no_show')
      AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
      AND (
          (a.scheduled_at, a.scheduled_at + (a.duration_minutes || ' minutes')::INTERVAL)
          OVERLAPS
          (p_start_at, v_end_at)
      );

    IF v_conflict_count > 0 THEN
        RETURN FALSE;
    END IF;

    -- Verificar conflictos con la sala (si se especificó)
    IF p_room_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_conflict_count
        FROM appointments a
        WHERE a.room_id = p_room_id
          AND a.status NOT IN ('cancelled', 'no_show')
          AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
          AND (
              (a.scheduled_at, a.scheduled_at + (a.duration_minutes || ' minutes')::INTERVAL)
              OVERLAPS
              (p_start_at, v_end_at)
          );

        IF v_conflict_count > 0 THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- Verificar que no haya bloqueos
    SELECT COUNT(*) INTO v_conflict_count
    FROM schedule_blocks sb
    WHERE (sb.professional_id = p_professional_id OR sb.room_id = p_room_id)
      AND (sb.start_at, sb.end_at) OVERLAPS (p_start_at, v_end_at);

    IF v_conflict_count > 0 THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_appointment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_appointment_timestamp ON appointments;
CREATE TRIGGER set_appointment_timestamp
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_timestamp();

-- Trigger para registrar cambio de estado
CREATE OR REPLACE FUNCTION log_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        NEW.status_changed_at = now();
        -- Registrar en timeline del paciente
        PERFORM log_patient_interaction(
            NEW.patient_id,
            'appointment_status',
            'Estado de cita cambiado a ' || NEW.status,
            NULL,
            'appointment',
            NEW.id,
            NEW.status_changed_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_appointment_status ON appointments;
CREATE TRIGGER track_appointment_status
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION log_appointment_status_change();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas para rooms
CREATE POLICY "Rooms visible by clinic members"
    ON rooms FOR SELECT
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Rooms manageable by admins"
    ON rooms FOR ALL
    USING (clinic_id = auth.clinic_id() AND auth.role() IN ('admin', 'owner'));

-- Políticas para professional_schedules
CREATE POLICY "Schedules visible by clinic members"
    ON professional_schedules FOR SELECT
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Schedules manageable by admins or owner"
    ON professional_schedules FOR ALL
    USING (
        clinic_id = auth.clinic_id()
        AND (auth.role() IN ('admin', 'owner') OR professional_id = auth.uid())
    );

-- Políticas para schedule_blocks
CREATE POLICY "Blocks visible by clinic members"
    ON schedule_blocks FOR SELECT
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Blocks manageable by admins or owner"
    ON schedule_blocks FOR ALL
    USING (
        clinic_id = auth.clinic_id()
        AND (auth.role() IN ('admin', 'owner') OR professional_id = auth.uid())
    );

-- Políticas para appointments
CREATE POLICY "Appointments visible by clinic members"
    ON appointments FOR SELECT
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Appointments manageable by clinic members"
    ON appointments FOR INSERT
    WITH CHECK (clinic_id = auth.clinic_id());

CREATE POLICY "Appointments updatable by clinic members"
    ON appointments FOR UPDATE
    USING (clinic_id = auth.clinic_id())
    WITH CHECK (clinic_id = auth.clinic_id());

CREATE POLICY "Appointments deletable by admins"
    ON appointments FOR DELETE
    USING (clinic_id = auth.clinic_id() AND auth.role() IN ('admin', 'owner'));

-- Políticas para waitlist
CREATE POLICY "Waitlist visible by clinic members"
    ON waitlist FOR SELECT
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Waitlist manageable by clinic members"
    ON waitlist FOR ALL
    USING (clinic_id = auth.clinic_id());

-- Políticas para appointment_reminders
CREATE POLICY "Reminders follow appointment access"
    ON appointment_reminders FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.id = appointment_reminders.appointment_id
            AND a.clinic_id = auth.clinic_id()
        )
    );

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista de citas del día con información expandida
CREATE OR REPLACE VIEW daily_appointments AS
SELECT
    a.*,
    p.first_name || ' ' || p.last_name as patient_name,
    p.phone as patient_phone,
    p.email as patient_email,
    p.avatar_url as patient_avatar,
    u.full_name as professional_name,
    r.name as room_name,
    r.color as room_color,
    t.name as treatment_display_name,
    t.price as treatment_price,
    tc.name as category_name,
    tc.color as category_color,
    a.scheduled_at + (a.duration_minutes || ' minutes')::INTERVAL as end_at
FROM appointments a
JOIN patients p ON p.id = a.patient_id
JOIN users u ON u.id = a.professional_id
LEFT JOIN rooms r ON r.id = a.room_id
LEFT JOIN treatments t ON t.id = a.treatment_id
LEFT JOIN treatment_categories tc ON tc.id = t.category_id;

-- Vista de disponibilidad semanal de profesionales
CREATE OR REPLACE VIEW professional_weekly_availability AS
SELECT
    ps.professional_id,
    ps.branch_id,
    ps.day_of_week,
    ps.start_time,
    ps.end_time,
    ps.break_start,
    ps.break_end,
    u.full_name as professional_name,
    u.avatar_url as professional_avatar
FROM professional_schedules ps
JOIN users u ON u.id = ps.professional_id
WHERE ps.is_active = true;

-- Comentarios
COMMENT ON TABLE rooms IS 'Salas y cabinas de la clínica';
COMMENT ON TABLE professional_schedules IS 'Horarios de trabajo de cada profesional';
COMMENT ON TABLE schedule_blocks IS 'Bloqueos de agenda (vacaciones, mantenimiento, etc.)';
COMMENT ON TABLE appointments IS 'Citas programadas';
COMMENT ON TABLE waitlist IS 'Lista de espera para citas';
COMMENT ON TABLE appointment_reminders IS 'Registro de recordatorios enviados';
