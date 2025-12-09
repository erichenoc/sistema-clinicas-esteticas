-- =============================================
-- MIGRACIÓN: Módulo de POS/Facturación
-- Punto de venta, pagos, cajas y paquetes
-- =============================================

-- =============================================
-- TABLA: cash_registers (Cajas Registradoras)
-- =============================================
CREATE TABLE IF NOT EXISTS cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,

    -- Información
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,

    -- Estado actual
    status VARCHAR(20) DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
    current_session_id UUID, -- Sesión de caja actual
    opened_at TIMESTAMPTZ,
    opened_by UUID REFERENCES users(id),
    opening_balance DECIMAL(12,2),
    expected_balance DECIMAL(12,2), -- Calculado
    actual_balance DECIMAL(12,2), -- Al cerrar

    -- Configuración
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cash_registers_clinic ON cash_registers(clinic_id);
CREATE INDEX idx_cash_registers_branch ON cash_registers(branch_id);

-- =============================================
-- TABLA: cash_sessions (Sesiones de Caja)
-- =============================================
CREATE TABLE IF NOT EXISTS cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,

    -- Apertura
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    opened_by UUID NOT NULL REFERENCES users(id),
    opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    opening_notes TEXT,

    -- Cierre
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES users(id),
    closing_balance DECIMAL(12,2),
    expected_balance DECIMAL(12,2),
    difference DECIMAL(12,2),
    closing_notes TEXT,

    -- Totales
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_refunds DECIMAL(12,2) DEFAULT 0,
    total_cash_in DECIMAL(12,2) DEFAULT 0,
    total_cash_out DECIMAL(12,2) DEFAULT 0,

    -- Estado
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'audited')),

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cash_sessions_register ON cash_sessions(cash_register_id);
CREATE INDEX idx_cash_sessions_opened ON cash_sessions(opened_at DESC);

-- =============================================
-- TABLA: cash_movements (Movimientos de Caja)
-- =============================================
CREATE TABLE IF NOT EXISTS cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,

    -- Tipo de movimiento
    type VARCHAR(30) NOT NULL CHECK (
        type IN ('sale', 'refund', 'cash_in', 'cash_out', 'adjustment', 'opening', 'closing')
    ),

    -- Montos
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(30), -- cash, card, transfer, etc.

    -- Referencia
    reference_type VARCHAR(30), -- sale, expense, etc.
    reference_id UUID,

    -- Descripción
    description TEXT,
    notes TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_cash_movements_session ON cash_movements(cash_session_id);
CREATE INDEX idx_cash_movements_type ON cash_movements(type);

-- =============================================
-- TABLA: coupons (Cupones de Descuento)
-- =============================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Identificación
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Tipo de descuento
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    max_discount DECIMAL(10,2), -- Tope máximo para porcentajes

    -- Restricciones
    min_purchase_amount DECIMAL(10,2),
    applicable_to VARCHAR(30) DEFAULT 'all' CHECK (
        applicable_to IN ('all', 'treatments', 'packages', 'products', 'specific')
    ),
    applicable_items UUID[], -- IDs de tratamientos/productos específicos

    -- Límites de uso
    max_uses INTEGER,
    max_uses_per_patient INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,

    -- Vigencia
    valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until TIMESTAMPTZ,

    -- Estado
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_coupons_code ON coupons(clinic_id, code);
CREATE INDEX idx_coupons_clinic ON coupons(clinic_id);
CREATE INDEX idx_coupons_validity ON coupons(valid_from, valid_until);

-- =============================================
-- TABLA: sales (Ventas)
-- =============================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,

    -- Número de venta
    sale_number VARCHAR(50) NOT NULL, -- Ej: VTA-2024-00001
    sale_type VARCHAR(30) DEFAULT 'standard' CHECK (
        sale_type IN ('standard', 'package_purchase', 'package_consumption', 'credit_use')
    ),

    -- Cliente
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    customer_name VARCHAR(200), -- Para ventas sin paciente registrado
    customer_email VARCHAR(200),
    customer_phone VARCHAR(20),

    -- Vendedor
    sold_by UUID NOT NULL REFERENCES users(id),
    professional_id UUID REFERENCES users(id), -- Si aplica comisión

    -- Totales
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    discount_reason TEXT,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- Cupón aplicado
    coupon_id UUID REFERENCES coupons(id),
    coupon_discount DECIMAL(12,2) DEFAULT 0,

    -- Crédito usado
    credit_used DECIMAL(12,2) DEFAULT 0,

    -- Estado
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'paid', 'partial', 'cancelled', 'refunded')
    ),
    paid_at TIMESTAMPTZ,

    -- Notas
    notes TEXT,
    internal_notes TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT
);

CREATE INDEX idx_sales_clinic ON sales(clinic_id);
CREATE INDEX idx_sales_patient ON sales(patient_id);
CREATE INDEX idx_sales_session ON sales(cash_session_id);
CREATE INDEX idx_sales_created ON sales(created_at DESC);
CREATE INDEX idx_sales_status ON sales(status);
CREATE UNIQUE INDEX idx_sales_number ON sales(clinic_id, sale_number);

-- =============================================
-- TABLA: sale_items (Items de Venta)
-- =============================================
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,

    -- Tipo de item
    item_type VARCHAR(30) NOT NULL CHECK (
        item_type IN ('treatment', 'package', 'product', 'session_consumption', 'other')
    ),

    -- Referencias
    treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
    package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    patient_package_id UUID, -- Para consumo de sesiones

    -- Descripción
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Precios
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,

    -- Profesional (para comisiones)
    professional_id UUID REFERENCES users(id),
    commission_rate DECIMAL(5,2),
    commission_amount DECIMAL(12,2),

    -- Sesión relacionada
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_treatment ON sale_items(treatment_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- =============================================
-- TABLA: payments (Pagos)
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,

    -- Método de pago
    payment_method VARCHAR(30) NOT NULL CHECK (
        payment_method IN ('cash', 'card_debit', 'card_credit', 'transfer', 'check', 'patient_credit', 'other')
    ),

    -- Montos
    amount DECIMAL(12,2) NOT NULL,
    amount_received DECIMAL(12,2), -- Para pagos en efectivo
    change_given DECIMAL(12,2), -- Cambio dado

    -- Detalles del pago
    reference_number VARCHAR(100), -- Número de autorización, transferencia, etc.
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20), -- Visa, Mastercard, etc.
    bank_name VARCHAR(100),

    -- Estado
    status VARCHAR(20) DEFAULT 'completed' CHECK (
        status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')
    ),

    -- Notas
    notes TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id),
    refunded_at TIMESTAMPTZ,
    refunded_by UUID REFERENCES users(id),
    refund_reason TEXT
);

CREATE INDEX idx_payments_sale ON payments(sale_id);
CREATE INDEX idx_payments_session ON payments(cash_session_id);
CREATE INDEX idx_payments_method ON payments(payment_method);

-- =============================================
-- TABLA: patient_packages (Paquetes del Paciente)
-- =============================================
CREATE TABLE IF NOT EXISTS patient_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,

    -- Venta asociada
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,

    -- Precio al momento de compra
    purchase_price DECIMAL(12,2) NOT NULL,

    -- Sesiones
    total_sessions INTEGER NOT NULL,
    used_sessions INTEGER DEFAULT 0,
    remaining_sessions INTEGER NOT NULL,

    -- Vigencia
    purchased_at TIMESTAMPTZ DEFAULT now(),
    starts_at DATE DEFAULT CURRENT_DATE,
    expires_at DATE,

    -- Estado
    status VARCHAR(20) DEFAULT 'active' CHECK (
        status IN ('active', 'completed', 'expired', 'cancelled', 'paused')
    ),

    -- Notas
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_patient_packages_patient ON patient_packages(patient_id);
CREATE INDEX idx_patient_packages_package ON patient_packages(package_id);
CREATE INDEX idx_patient_packages_status ON patient_packages(status);

-- =============================================
-- TABLA: patient_package_sessions (Sesiones de Paquete)
-- =============================================
CREATE TABLE IF NOT EXISTS patient_package_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_package_id UUID NOT NULL REFERENCES patient_packages(id) ON DELETE CASCADE,

    -- Sesión usada
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,

    -- Información
    session_number INTEGER NOT NULL, -- 1, 2, 3...
    treatment_name VARCHAR(200),

    -- Estado
    status VARCHAR(20) DEFAULT 'available' CHECK (
        status IN ('available', 'used', 'expired', 'cancelled')
    ),

    -- Fechas
    used_at TIMESTAMPTZ,
    scheduled_at DATE,

    -- Notas
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_package_sessions_package ON patient_package_sessions(patient_package_id);
CREATE INDEX idx_package_sessions_session ON patient_package_sessions(session_id);

-- =============================================
-- TABLA: patient_credits (Créditos del Paciente)
-- =============================================
CREATE TABLE IF NOT EXISTS patient_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Tipo de crédito
    credit_type VARCHAR(30) NOT NULL CHECK (
        credit_type IN ('refund', 'promotion', 'gift', 'compensation', 'adjustment')
    ),

    -- Monto
    amount DECIMAL(12,2) NOT NULL,
    used_amount DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) NOT NULL,

    -- Origen
    source_sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    reason TEXT,

    -- Vigencia
    expires_at DATE,

    -- Estado
    status VARCHAR(20) DEFAULT 'active' CHECK (
        status IN ('active', 'used', 'expired', 'cancelled')
    ),

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_patient_credits_patient ON patient_credits(patient_id);
CREATE INDEX idx_patient_credits_status ON patient_credits(status);

-- =============================================
-- TABLA: coupon_uses (Usos de Cupones)
-- =============================================
CREATE TABLE IF NOT EXISTS coupon_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,

    discount_applied DECIMAL(12,2) NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_coupon_uses_coupon ON coupon_uses(coupon_id);
CREATE INDEX idx_coupon_uses_patient ON coupon_uses(patient_id);

-- =============================================
-- TABLA: invoices (Facturas - si se requiere facturación electrónica)
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,

    -- Número de factura
    invoice_number VARCHAR(50) NOT NULL,
    invoice_series VARCHAR(10),

    -- Datos fiscales del cliente
    customer_tax_id VARCHAR(20), -- RNC o Cédula
    customer_legal_name VARCHAR(200),
    customer_address TEXT,
    customer_email VARCHAR(200),

    -- Totales
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,

    -- Archivo
    pdf_url TEXT,
    xml_url TEXT,

    -- Estado
    status VARCHAR(20) DEFAULT 'issued' CHECK (
        status IN ('draft', 'issued', 'sent', 'cancelled')
    ),

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT
);

CREATE INDEX idx_invoices_sale ON invoices(sale_id);
CREATE UNIQUE INDEX idx_invoices_number ON invoices(clinic_id, invoice_series, invoice_number);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_sale_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_sale_timestamp ON sales;
CREATE TRIGGER set_sale_timestamp
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_sale_timestamp();

-- Función para generar número de venta
CREATE OR REPLACE FUNCTION generate_sale_number(p_clinic_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_year TEXT;
    v_sequence INTEGER;
    v_number VARCHAR(50);
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

    SELECT COALESCE(MAX(
        CAST(SUBSTRING(sale_number FROM 'VTA-' || v_year || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO v_sequence
    FROM sales
    WHERE clinic_id = p_clinic_id
      AND sale_number LIKE 'VTA-' || v_year || '-%';

    v_number := 'VTA-' || v_year || '-' || LPAD(v_sequence::TEXT, 5, '0');

    RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular totales de venta
CREATE OR REPLACE FUNCTION calculate_sale_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sales
    SET subtotal = (
            SELECT COALESCE(SUM(subtotal), 0) FROM sale_items WHERE sale_id = NEW.sale_id
        ),
        tax_amount = (
            SELECT COALESCE(SUM(tax_amount), 0) FROM sale_items WHERE sale_id = NEW.sale_id
        ),
        total = (
            SELECT COALESCE(SUM(total), 0) FROM sale_items WHERE sale_id = NEW.sale_id
        ) - COALESCE((SELECT discount_amount FROM sales WHERE id = NEW.sale_id), 0)
            - COALESCE((SELECT coupon_discount FROM sales WHERE id = NEW.sale_id), 0)
            - COALESCE((SELECT credit_used FROM sales WHERE id = NEW.sale_id), 0)
    WHERE id = NEW.sale_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sale_totals ON sale_items;
CREATE TRIGGER update_sale_totals
    AFTER INSERT OR UPDATE OR DELETE ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_sale_totals();

-- Función para actualizar uso de cupón
CREATE OR REPLACE FUNCTION update_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coupons
    SET current_uses = current_uses + 1
    WHERE id = NEW.coupon_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_coupon_use ON coupon_uses;
CREATE TRIGGER increment_coupon_use
    AFTER INSERT ON coupon_uses
    FOR EACH ROW
    EXECUTE FUNCTION update_coupon_usage();

-- Función para actualizar sesiones de paquete
CREATE OR REPLACE FUNCTION update_patient_package_sessions()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'used' AND OLD.status != 'used' THEN
        UPDATE patient_packages
        SET used_sessions = used_sessions + 1,
            remaining_sessions = remaining_sessions - 1,
            status = CASE
                WHEN remaining_sessions - 1 = 0 THEN 'completed'
                ELSE status
            END,
            updated_at = now()
        WHERE id = NEW.patient_package_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_package_session_use ON patient_package_sessions;
CREATE TRIGGER track_package_session_use
    AFTER UPDATE ON patient_package_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_package_sessions();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_package_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Políticas para sales
CREATE POLICY "Sales visible by clinic members"
    ON sales FOR SELECT
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Sales creatable by clinic members"
    ON sales FOR INSERT
    WITH CHECK (clinic_id = auth.clinic_id());

CREATE POLICY "Sales updatable by clinic members"
    ON sales FOR UPDATE
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Sales deletable by admins"
    ON sales FOR DELETE
    USING (clinic_id = auth.clinic_id() AND auth.role() IN ('admin', 'owner'));

-- Políticas similares para otras tablas...
CREATE POLICY "Cash registers by clinic"
    ON cash_registers FOR ALL
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Cash sessions by clinic"
    ON cash_sessions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cash_registers cr
            WHERE cr.id = cash_sessions.cash_register_id
            AND cr.clinic_id = auth.clinic_id()
        )
    );

CREATE POLICY "Payments follow sales"
    ON payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM sales s WHERE s.id = payments.sale_id AND s.clinic_id = auth.clinic_id()
        )
    );

CREATE POLICY "Patient packages by clinic"
    ON patient_packages FOR ALL
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Patient credits by clinic"
    ON patient_credits FOR ALL
    USING (clinic_id = auth.clinic_id());

CREATE POLICY "Coupons by clinic"
    ON coupons FOR ALL
    USING (clinic_id = auth.clinic_id());

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista de ventas con detalles
CREATE OR REPLACE VIEW sale_details AS
SELECT
    s.*,
    p.first_name || ' ' || p.last_name as patient_full_name,
    p.phone as patient_phone,
    u.full_name as sold_by_name,
    cs.id as cash_session_id,
    (
        SELECT json_agg(json_build_object(
            'id', si.id,
            'item_type', si.item_type,
            'name', si.name,
            'quantity', si.quantity,
            'unit_price', si.unit_price,
            'total', si.total
        ))
        FROM sale_items si WHERE si.sale_id = s.id
    ) as items,
    (
        SELECT COALESCE(SUM(amount), 0) FROM payments WHERE sale_id = s.id AND status = 'completed'
    ) as paid_amount,
    (
        SELECT s.total - COALESCE(SUM(amount), 0) FROM payments WHERE sale_id = s.id AND status = 'completed'
    ) as pending_amount
FROM sales s
LEFT JOIN patients p ON p.id = s.patient_id
JOIN users u ON u.id = s.sold_by
LEFT JOIN cash_sessions cs ON cs.id = s.cash_session_id;

-- Vista de estado de caja
CREATE OR REPLACE VIEW cash_register_status AS
SELECT
    cr.*,
    cs.id as current_session_id,
    cs.opened_at as session_opened_at,
    cs.opening_balance as session_opening_balance,
    u.full_name as opened_by_name,
    COALESCE(cs.total_sales, 0) as session_total_sales,
    COALESCE(cs.total_refunds, 0) as session_total_refunds,
    COALESCE(cs.total_cash_in, 0) - COALESCE(cs.total_cash_out, 0) as session_net_cash
FROM cash_registers cr
LEFT JOIN cash_sessions cs ON cs.cash_register_id = cr.id AND cs.status = 'open'
LEFT JOIN users u ON u.id = cs.opened_by
WHERE cr.is_active = true;

-- Comentarios
COMMENT ON TABLE sales IS 'Registro de todas las ventas realizadas';
COMMENT ON TABLE sale_items IS 'Items individuales de cada venta';
COMMENT ON TABLE payments IS 'Pagos recibidos por cada venta';
COMMENT ON TABLE cash_registers IS 'Cajas registradoras de la clínica';
COMMENT ON TABLE cash_sessions IS 'Sesiones de apertura/cierre de caja';
COMMENT ON TABLE patient_packages IS 'Paquetes comprados por pacientes';
COMMENT ON TABLE coupons IS 'Cupones de descuento disponibles';
