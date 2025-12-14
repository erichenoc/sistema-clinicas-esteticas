-- =============================================
-- MIGRACION 013: CORREGIR TABLA INVOICE_ITEMS
-- Agrega columnas faltantes para soporte completo de productos y calculos
-- =============================================

-- 1. Agregar columna product_id para referenciar productos
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- 2. Agregar columna total para el total calculado del item
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS total DECIMAL(12,2);

-- 3. Actualizar columnas total existentes basandose en subtotal
UPDATE invoice_items
SET total = subtotal
WHERE total IS NULL;

-- Comentarios para documentacion
COMMENT ON COLUMN invoice_items.product_id IS 'Referencia al producto si el item es un producto';
COMMENT ON COLUMN invoice_items.total IS 'Total del item incluyendo impuestos';
