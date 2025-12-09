-- =============================================
-- MIGRACIÓN: Módulo de Inventario
-- Control de productos, stock, lotes y proveedores
-- =============================================

-- =============================================
-- TABLA: product_categories (Categorías de Productos)
-- =============================================
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50),

    -- Tipo de categoría
    type VARCHAR(30) DEFAULT 'consumable' CHECK (
        type IN ('consumable', 'retail', 'equipment', 'disposable')
    ),

    -- Jerarquía
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,

    -- Estado
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_categories_clinic ON product_categories(clinic_id);
CREATE INDEX idx_product_categories_parent ON product_categories(parent_id);

-- =============================================
-- TABLA: products (Productos)
-- =============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,

    -- Identificación
    sku VARCHAR(50),
    barcode VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Tipo
    type VARCHAR(30) DEFAULT 'consumable' CHECK (
        type IN ('consumable', 'retail', 'equipment', 'injectable', 'topical')
    ),

    -- Unidad de medida
    unit VARCHAR(20) DEFAULT 'units', -- units, ml, mg, g, pieces
    unit_label VARCHAR(50), -- "Unidades", "Mililitros", etc.

    -- Precios
    cost_price DECIMAL(12,2), -- Precio de costo
    sell_price DECIMAL(12,2), -- Precio de venta (retail)
    tax_rate DECIMAL(5,2) DEFAULT 16, -- Porcentaje de impuesto

    -- Control de stock
    track_stock BOOLEAN DEFAULT true,
    min_stock INTEGER DEFAULT 0, -- Stock mínimo (alerta)
    max_stock INTEGER, -- Stock máximo
    reorder_point INTEGER, -- Punto de reorden
    reorder_quantity INTEGER, -- Cantidad a reordenar

    -- Para inyectables
    requires_lot_tracking BOOLEAN DEFAULT false,
    requires_refrigeration BOOLEAN DEFAULT false,
    shelf_life_days INTEGER, -- Vida útil en días

    -- Imágenes
    image_url TEXT,
    thumbnail_url TEXT,

    -- Estado
    is_active BOOLEAN DEFAULT true,
    is_sellable BOOLEAN DEFAULT true, -- Si se puede vender en POS

    -- Proveedor principal
    default_supplier_id UUID,

    -- Notas
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_products_clinic ON products(clinic_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(clinic_id, sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_type ON products(type);

-- =============================================
-- TABLA: suppliers (Proveedores)
-- =============================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Información básica
    code VARCHAR(20),
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200),
    tax_id VARCHAR(20), -- RNC

    -- Contacto
    contact_name VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(20),
    phone_secondary VARCHAR(20),
    website VARCHAR(200),

    -- Dirección
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'México',

    -- Términos comerciales
    payment_terms VARCHAR(100), -- "30 días", "Contado", etc.
    credit_limit DECIMAL(12,2),
    discount_percent DECIMAL(5,2),
    min_order_amount DECIMAL(12,2),

    -- Clasificación
    category VARCHAR(50), -- Inyectables, Cosméticos, Equipos, etc.
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),

    -- Datos bancarios
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    clabe VARCHAR(20),

    -- Estado
    is_active BOOLEAN DEFAULT true,

    -- Notas
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_suppliers_clinic ON suppliers(clinic_id);
CREATE INDEX idx_suppliers_category ON suppliers(category);

-- =============================================
-- TABLA: inventory (Stock por Sucursal)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- Stock
    quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(12,2) DEFAULT 0, -- Reservado para citas
    available_quantity DECIMAL(12,2) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,

    -- Valor
    average_cost DECIMAL(12,2), -- Costo promedio ponderado
    total_value DECIMAL(12,2) GENERATED ALWAYS AS (quantity * average_cost) STORED,

    -- Ubicación
    location VARCHAR(100), -- Estante, gaveta, etc.

    -- Último movimiento
    last_movement_at TIMESTAMPTZ,
    last_count_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(branch_id, product_id)
);

CREATE INDEX idx_inventory_clinic ON inventory(clinic_id);
CREATE INDEX idx_inventory_branch ON inventory(branch_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);

-- =============================================
-- TABLA: product_lots (Lotes de Productos)
-- =============================================
CREATE TABLE IF NOT EXISTS product_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- Información del lote
    lot_number VARCHAR(50) NOT NULL,
    batch_number VARCHAR(50),

    -- Fechas
    manufacture_date DATE,
    expiry_date DATE,
    received_date DATE DEFAULT CURRENT_DATE,

    -- Cantidades
    initial_quantity DECIMAL(12,2) NOT NULL,
    current_quantity DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2),

    -- Proveedor
    supplier_id UUID REFERENCES suppliers(id),
    purchase_order_id UUID,

    -- Estado
    status VARCHAR(20) DEFAULT 'active' CHECK (
        status IN ('active', 'low', 'expired', 'depleted', 'quarantine')
    ),

    -- Notas
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_lots_product ON product_lots(product_id);
CREATE INDEX idx_product_lots_expiry ON product_lots(expiry_date);
CREATE INDEX idx_product_lots_status ON product_lots(status);
CREATE UNIQUE INDEX idx_product_lots_number ON product_lots(clinic_id, product_id, lot_number);

-- =============================================
-- TABLA: inventory_movements (Movimientos de Inventario)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES product_lots(id) ON DELETE SET NULL,

    -- Tipo de movimiento
    type VARCHAR(30) NOT NULL CHECK (
        type IN (
            'purchase',      -- Compra
            'sale',          -- Venta
            'consumption',   -- Consumo en sesión
            'adjustment',    -- Ajuste manual
            'transfer_in',   -- Transferencia entrada
            'transfer_out',  -- Transferencia salida
            'return',        -- Devolución
            'damage',        -- Daño/pérdida
            'expiry',        -- Vencimiento
            'initial'        -- Stock inicial
        )
    ),

    -- Cantidad (positiva = entrada, negativa = salida)
    quantity DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2),
    total_cost DECIMAL(12,2),

    -- Balance
    balance_before DECIMAL(12,2),
    balance_after DECIMAL(12,2),

    -- Referencia
    reference_type VARCHAR(30), -- session, sale, purchase_order, transfer
    reference_id UUID,

    -- Detalles
    notes TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX idx_inventory_movements_created ON inventory_movements(created_at DESC);
CREATE INDEX idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);

-- =============================================
-- TABLA: purchase_orders (Órdenes de Compra)
-- =============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,

    -- Número de orden
    order_number VARCHAR(50) NOT NULL,

    -- Estado
    status VARCHAR(20) DEFAULT 'draft' CHECK (
        status IN ('draft', 'pending', 'approved', 'ordered', 'partial', 'received', 'cancelled')
    ),

    -- Fechas
    order_date DATE DEFAULT CURRENT_DATE,
    expected_date DATE,
    received_date DATE,

    -- Totales
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    shipping_cost DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,

    -- Pago
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'partial', 'paid')
    ),
    paid_amount DECIMAL(12,2) DEFAULT 0,

    -- Notas
    notes TEXT,
    internal_notes TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ
);

CREATE INDEX idx_purchase_orders_clinic ON purchase_orders(clinic_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE UNIQUE INDEX idx_purchase_orders_number ON purchase_orders(clinic_id, order_number);

-- =============================================
-- TABLA: purchase_order_items (Items de Orden de Compra)
-- =============================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- Cantidades
    quantity_ordered DECIMAL(12,2) NOT NULL,
    quantity_received DECIMAL(12,2) DEFAULT 0,

    -- Precios
    unit_cost DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 16,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,

    -- Lote (al recibir)
    lot_number VARCHAR(50),
    expiry_date DATE,

    -- Notas
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_po_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_product ON purchase_order_items(product_id);

-- =============================================
-- TABLA: inventory_counts (Conteos de Inventario)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,

    -- Información
    count_number VARCHAR(50) NOT NULL,
    count_type VARCHAR(30) DEFAULT 'full' CHECK (
        count_type IN ('full', 'partial', 'cycle', 'spot')
    ),
    description TEXT,

    -- Estado
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (
        status IN ('in_progress', 'completed', 'approved', 'cancelled')
    ),

    -- Fechas
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,

    -- Resultados
    total_items INTEGER DEFAULT 0,
    items_counted INTEGER DEFAULT 0,
    items_with_difference INTEGER DEFAULT 0,
    total_difference_value DECIMAL(12,2) DEFAULT 0,

    -- Auditoría
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inventory_counts_clinic ON inventory_counts(clinic_id);
CREATE INDEX idx_inventory_counts_status ON inventory_counts(status);

-- =============================================
-- TABLA: inventory_count_items (Items de Conteo)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_count_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES product_lots(id),

    -- Cantidades
    system_quantity DECIMAL(12,2) NOT NULL,
    counted_quantity DECIMAL(12,2),
    difference DECIMAL(12,2) GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,

    -- Valor
    unit_cost DECIMAL(12,2),
    difference_value DECIMAL(12,2),

    -- Estado
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'counted', 'verified')
    ),

    -- Notas
    notes TEXT,

    counted_at TIMESTAMPTZ,
    counted_by UUID REFERENCES users(id)
);

CREATE INDEX idx_count_items_count ON inventory_count_items(count_id);
CREATE INDEX idx_count_items_product ON inventory_count_items(product_id);

-- =============================================
-- TABLA: inventory_transfers (Transferencias entre Sucursales)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Sucursales
    from_branch_id UUID NOT NULL REFERENCES branches(id),
    to_branch_id UUID NOT NULL REFERENCES branches(id),

    -- Número
    transfer_number VARCHAR(50) NOT NULL,

    -- Estado
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'in_transit', 'received', 'cancelled')
    ),

    -- Fechas
    requested_at TIMESTAMPTZ DEFAULT now(),
    shipped_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,

    -- Notas
    notes TEXT,

    -- Auditoría
    requested_by UUID REFERENCES users(id),
    shipped_by UUID REFERENCES users(id),
    received_by UUID REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transfers_clinic ON inventory_transfers(clinic_id);
CREATE INDEX idx_transfers_status ON inventory_transfers(status);

-- =============================================
-- TABLA: inventory_transfer_items (Items de Transferencia)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES inventory_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES product_lots(id),

    quantity_requested DECIMAL(12,2) NOT NULL,
    quantity_shipped DECIMAL(12,2),
    quantity_received DECIMAL(12,2),

    notes TEXT
);

CREATE INDEX idx_transfer_items_transfer ON inventory_transfer_items(transfer_id);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_product_timestamp ON products;
CREATE TRIGGER set_product_timestamp
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_timestamp();

DROP TRIGGER IF EXISTS set_inventory_timestamp ON inventory;
CREATE TRIGGER set_inventory_timestamp
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_timestamp();

-- Función para registrar movimiento de inventario
CREATE OR REPLACE FUNCTION register_inventory_movement(
    p_clinic_id UUID,
    p_branch_id UUID,
    p_product_id UUID,
    p_lot_id UUID,
    p_type VARCHAR(30),
    p_quantity DECIMAL(12,2),
    p_unit_cost DECIMAL(12,2),
    p_reference_type VARCHAR(30),
    p_reference_id UUID,
    p_notes TEXT,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_movement_id UUID;
    v_balance_before DECIMAL(12,2);
    v_balance_after DECIMAL(12,2);
BEGIN
    -- Obtener balance actual
    SELECT COALESCE(quantity, 0) INTO v_balance_before
    FROM inventory
    WHERE product_id = p_product_id AND (branch_id = p_branch_id OR (branch_id IS NULL AND p_branch_id IS NULL));

    v_balance_after := v_balance_before + p_quantity;

    -- Insertar movimiento
    INSERT INTO inventory_movements (
        clinic_id, branch_id, product_id, lot_id, type, quantity,
        unit_cost, total_cost, balance_before, balance_after,
        reference_type, reference_id, notes, created_by
    )
    VALUES (
        p_clinic_id, p_branch_id, p_product_id, p_lot_id, p_type, p_quantity,
        p_unit_cost, p_quantity * COALESCE(p_unit_cost, 0), v_balance_before, v_balance_after,
        p_reference_type, p_reference_id, p_notes, p_user_id
    )
    RETURNING id INTO v_movement_id;

    -- Actualizar inventario
    INSERT INTO inventory (clinic_id, branch_id, product_id, quantity, last_movement_at)
    VALUES (p_clinic_id, p_branch_id, p_product_id, p_quantity, now())
    ON CONFLICT (branch_id, product_id) DO UPDATE
    SET quantity = inventory.quantity + p_quantity,
        last_movement_at = now(),
        updated_at = now();

    RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar stock bajo
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el stock cae por debajo del mínimo, generar alerta
    IF NEW.quantity <= (SELECT min_stock FROM products WHERE id = NEW.product_id) THEN
        -- Aquí se podría insertar en una tabla de alertas
        RAISE NOTICE 'Stock bajo para producto %', NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_stock_level ON inventory;
CREATE TRIGGER check_stock_level
    AFTER UPDATE ON inventory
    FOR EACH ROW
    WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity)
    EXECUTE FUNCTION check_low_stock();

-- Función para actualizar estado de lotes
CREATE OR REPLACE FUNCTION update_lot_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar estado basado en cantidad y fecha de vencimiento
    IF NEW.current_quantity <= 0 THEN
        NEW.status := 'depleted';
    ELSIF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
        NEW.status := 'expired';
    ELSIF NEW.current_quantity <= NEW.initial_quantity * 0.1 THEN
        NEW.status := 'low';
    ELSE
        NEW.status := 'active';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lot_status_trigger ON product_lots;
CREATE TRIGGER update_lot_status_trigger
    BEFORE UPDATE ON product_lots
    FOR EACH ROW
    EXECUTE FUNCTION update_lot_status();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transfer_items ENABLE ROW LEVEL SECURITY;

-- Políticas genéricas por clínica
CREATE POLICY "Products by clinic" ON products FOR ALL USING (clinic_id = auth.clinic_id());
CREATE POLICY "Product categories by clinic" ON product_categories FOR ALL USING (clinic_id = auth.clinic_id());
CREATE POLICY "Suppliers by clinic" ON suppliers FOR ALL USING (clinic_id = auth.clinic_id());
CREATE POLICY "Inventory by clinic" ON inventory FOR ALL USING (clinic_id = auth.clinic_id());
CREATE POLICY "Product lots by clinic" ON product_lots FOR ALL USING (clinic_id = auth.clinic_id());
CREATE POLICY "Inventory movements by clinic" ON inventory_movements FOR ALL USING (clinic_id = auth.clinic_id());
CREATE POLICY "Purchase orders by clinic" ON purchase_orders FOR ALL USING (clinic_id = auth.clinic_id());
CREATE POLICY "Inventory counts by clinic" ON inventory_counts FOR ALL USING (clinic_id = auth.clinic_id());
CREATE POLICY "Inventory transfers by clinic" ON inventory_transfers FOR ALL USING (clinic_id = auth.clinic_id());

-- Políticas para items (siguen al padre)
CREATE POLICY "PO items follow order" ON purchase_order_items FOR ALL
    USING (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND po.clinic_id = auth.clinic_id()));

CREATE POLICY "Count items follow count" ON inventory_count_items FOR ALL
    USING (EXISTS (SELECT 1 FROM inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND ic.clinic_id = auth.clinic_id()));

CREATE POLICY "Transfer items follow transfer" ON inventory_transfer_items FOR ALL
    USING (EXISTS (SELECT 1 FROM inventory_transfers it WHERE it.id = inventory_transfer_items.transfer_id AND it.clinic_id = auth.clinic_id()));

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista de productos con stock
CREATE OR REPLACE VIEW product_stock_view AS
SELECT
    p.*,
    pc.name as category_name,
    pc.color as category_color,
    COALESCE(i.quantity, 0) as current_stock,
    COALESCE(i.reserved_quantity, 0) as reserved_stock,
    COALESCE(i.available_quantity, 0) as available_stock,
    i.average_cost,
    i.total_value,
    i.location,
    i.last_movement_at,
    CASE
        WHEN NOT p.track_stock THEN 'not_tracked'
        WHEN COALESCE(i.quantity, 0) <= 0 THEN 'out_of_stock'
        WHEN COALESCE(i.quantity, 0) <= p.min_stock THEN 'low_stock'
        WHEN p.max_stock IS NOT NULL AND COALESCE(i.quantity, 0) >= p.max_stock THEN 'over_stock'
        ELSE 'in_stock'
    END as stock_status,
    (
        SELECT COUNT(*) FROM product_lots pl
        WHERE pl.product_id = p.id AND pl.status = 'active'
    ) as active_lots,
    (
        SELECT MIN(expiry_date) FROM product_lots pl
        WHERE pl.product_id = p.id AND pl.status = 'active' AND pl.current_quantity > 0
    ) as nearest_expiry
FROM products p
LEFT JOIN product_categories pc ON pc.id = p.category_id
LEFT JOIN inventory i ON i.product_id = p.id;

-- Vista de alertas de inventario
CREATE OR REPLACE VIEW inventory_alerts_view AS
SELECT
    'low_stock' as alert_type,
    p.id as product_id,
    p.name as product_name,
    p.sku,
    i.quantity as current_quantity,
    p.min_stock,
    p.reorder_point,
    NULL::DATE as expiry_date,
    i.branch_id
FROM products p
JOIN inventory i ON i.product_id = p.id
WHERE p.track_stock = true
  AND i.quantity <= p.min_stock
  AND p.is_active = true

UNION ALL

SELECT
    'expiring_soon' as alert_type,
    p.id as product_id,
    p.name as product_name,
    p.sku,
    pl.current_quantity,
    NULL::INTEGER,
    NULL::INTEGER,
    pl.expiry_date,
    pl.branch_id
FROM product_lots pl
JOIN products p ON p.id = pl.product_id
WHERE pl.status = 'active'
  AND pl.current_quantity > 0
  AND pl.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  AND pl.expiry_date > CURRENT_DATE

UNION ALL

SELECT
    'expired' as alert_type,
    p.id as product_id,
    p.name as product_name,
    p.sku,
    pl.current_quantity,
    NULL::INTEGER,
    NULL::INTEGER,
    pl.expiry_date,
    pl.branch_id
FROM product_lots pl
JOIN products p ON p.id = pl.product_id
WHERE pl.expiry_date < CURRENT_DATE
  AND pl.current_quantity > 0;

-- Comentarios
COMMENT ON TABLE products IS 'Catálogo de productos (consumibles y retail)';
COMMENT ON TABLE inventory IS 'Stock actual por producto y sucursal';
COMMENT ON TABLE product_lots IS 'Lotes con trazabilidad y vencimiento';
COMMENT ON TABLE inventory_movements IS 'Historial de todos los movimientos de inventario';
COMMENT ON TABLE suppliers IS 'Proveedores de productos';
COMMENT ON TABLE purchase_orders IS 'Órdenes de compra a proveedores';
