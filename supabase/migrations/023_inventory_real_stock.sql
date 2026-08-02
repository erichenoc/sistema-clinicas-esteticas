-- =============================================
-- MIGRACIÓN 023: Stock real de inventario
-- =============================================
-- Contexto: el inventario nunca llevó existencias reales. `inventory` e
-- `inventory_movements` existían pero estaban vacías, y el código devolvía
-- `current_stock = 0` fijo. Ademas no habia ninguna sucursal creada, y como
-- `inventory` se identifica por (branch_id, product_id), sin sucursal no habia
-- donde guardar el stock.
--
-- Esta migración:
--   1. Crea la sucursal principal de la clínica (si no existe)
--   2. Agrega `track_stock` a products, para distinguir equipos (HIFU, láser)
--      de productos e insumos que sí se cuentan
--   3. Agrega costo promedio al inventario y costo/balance a los movimientos
--   4. Crea `apply_inventory_movement()`: la ÚNICA vía para mover stock.
--      Hace el movimiento y el saldo en una sola transacción con bloqueo de
--      fila, para que dos ventas simultáneas no dejen el stock descuadrado.
-- =============================================

-- =============================================
-- 1. Sucursal principal
-- =============================================
INSERT INTO public.branches (clinic_id, name, is_main)
SELECT c.id, c.name, true
FROM public.clinics c
WHERE NOT EXISTS (SELECT 1 FROM public.branches WHERE clinic_id = c.id);

-- =============================================
-- 2. products: distinguir lo que se cuenta de lo que no
-- =============================================
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS track_stock BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.products.track_stock IS
    'false para equipos y aparatos: aparecen en el catálogo pero no llevan existencias';

-- Los productos cargados sin costo ni precio son equipos (HIFU, láser, etc.),
-- no mercancía que se cuenta. Se marcan para que no generen alertas de agotado.
-- Reversible desde la ficha del producto.
UPDATE public.products
   SET track_stock = false
 WHERE COALESCE(cost, 0) = 0 AND COALESCE(price, 0) = 0;

-- =============================================
-- 3. Costo promedio y trazabilidad de movimientos
-- =============================================
ALTER TABLE public.inventory
    ADD COLUMN IF NOT EXISTS average_cost DECIMAL(12,2);

COMMENT ON COLUMN public.inventory.average_cost IS
    'Costo promedio ponderado, recalculado en cada entrada con costo';

ALTER TABLE public.inventory_movements
    ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS balance_after DECIMAL(12,2);

COMMENT ON COLUMN public.inventory_movements.quantity IS
    'Con signo: positivo entra, negativo sale';
COMMENT ON COLUMN public.inventory_movements.balance_after IS
    'Existencia resultante despues de aplicar el movimiento';

-- Tipos de movimiento admitidos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_type_check'
    ) THEN
        ALTER TABLE public.inventory_movements
            ADD CONSTRAINT inventory_movements_type_check CHECK (movement_type IN (
                'initial',      -- carga inicial de existencias
                'purchase',     -- entrada por compra a proveedor
                'sale',         -- salida por venta (POS / factura)
                'consumption',  -- salida por uso en una sesion
                'adjustment',   -- ajuste manual (conteo fisico)
                'loss',         -- merma, vencimiento o rotura
                'return',       -- devolucion que reingresa
                'transfer_in',
                'transfer_out'
            ));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inv_movements_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_created ON public.inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_movements_ref     ON public.inventory_movements(reference_type, reference_id);

-- =============================================
-- 4. Movimiento atómico de stock
-- =============================================
-- Unica funcion autorizada para tocar existencias. Bloquea la fila del
-- inventario (FOR UPDATE) antes de calcular, de modo que dos operaciones
-- concurrentes sobre el mismo producto se serializan en vez de pisarse.
CREATE OR REPLACE FUNCTION public.apply_inventory_movement(
    p_branch_id      UUID,
    p_product_id     UUID,
    p_quantity       DECIMAL,          -- con signo: + entra, - sale
    p_movement_type  VARCHAR,
    p_reference_type VARCHAR DEFAULT NULL,
    p_reference_id   UUID    DEFAULT NULL,
    p_unit_cost      DECIMAL DEFAULT NULL,
    p_notes          TEXT    DEFAULT NULL,
    p_created_by     UUID    DEFAULT NULL,
    p_allow_negative BOOLEAN DEFAULT false
)
RETURNS DECIMAL
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_current_qty DECIMAL;
    v_current_avg DECIMAL;
    v_new_qty     DECIMAL;
    v_new_avg     DECIMAL;
BEGIN
    IF p_quantity = 0 THEN
        RAISE EXCEPTION 'La cantidad del movimiento no puede ser cero';
    END IF;

    -- Asegurar que exista la fila de inventario del producto en la sucursal
    INSERT INTO inventory (branch_id, product_id, quantity)
    VALUES (p_branch_id, p_product_id, 0)
    ON CONFLICT (branch_id, product_id) DO NOTHING;

    SELECT quantity, average_cost
      INTO v_current_qty, v_current_avg
      FROM inventory
     WHERE branch_id = p_branch_id AND product_id = p_product_id
     FOR UPDATE;

    v_current_qty := COALESCE(v_current_qty, 0);
    v_new_qty := v_current_qty + p_quantity;

    IF v_new_qty < 0 AND NOT p_allow_negative THEN
        RAISE EXCEPTION 'Stock insuficiente: hay % y se intentan sacar %',
            v_current_qty, abs(p_quantity);
    END IF;

    -- Costo promedio ponderado: solo cambia cuando entra mercancia con costo
    v_new_avg := v_current_avg;
    IF p_quantity > 0 AND p_unit_cost IS NOT NULL AND p_unit_cost > 0 THEN
        v_new_avg := (
            (v_current_qty * COALESCE(v_current_avg, p_unit_cost)) + (p_quantity * p_unit_cost)
        ) / NULLIF(v_current_qty + p_quantity, 0);
    END IF;

    UPDATE inventory
       SET quantity = v_new_qty,
           average_cost = v_new_avg,
           updated_at = now()
     WHERE branch_id = p_branch_id AND product_id = p_product_id;

    INSERT INTO inventory_movements (
        branch_id, product_id, movement_type, quantity,
        reference_type, reference_id, unit_cost, balance_after, notes, created_by
    ) VALUES (
        p_branch_id, p_product_id, p_movement_type, p_quantity,
        p_reference_type, p_reference_id, p_unit_cost, v_new_qty, p_notes, p_created_by
    );

    RETURN v_new_qty;
END;
$$;

COMMENT ON FUNCTION public.apply_inventory_movement IS
    'Unica via para mover existencias: registra el movimiento y actualiza el saldo de forma atomica';

-- La funcion solo debe invocarse desde el servidor (service_role)
REVOKE ALL ON FUNCTION public.apply_inventory_movement FROM PUBLIC, anon, authenticated;
