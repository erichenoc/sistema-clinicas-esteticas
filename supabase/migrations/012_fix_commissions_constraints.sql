-- =============================================
-- MIGRACIÓN 012: CORREGIR CONSTRAINTS DE COMMISSIONS
-- Permite usar users.id como professional_id y agregar 'manual' como reference_type
-- =============================================

-- 1. Eliminar el constraint de foreign key existente en professional_id
ALTER TABLE commissions
DROP CONSTRAINT IF EXISTS commissions_professional_id_fkey;

-- 2. Agregar nuevo constraint que referencia users(id) en lugar de professional_profiles(id)
ALTER TABLE commissions
ADD CONSTRAINT commissions_professional_id_fkey
FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. Eliminar el constraint de check existente en reference_type
ALTER TABLE commissions
DROP CONSTRAINT IF EXISTS commissions_reference_type_check;

-- 4. Agregar nuevo constraint que incluye 'manual' como tipo válido
ALTER TABLE commissions
ADD CONSTRAINT commissions_reference_type_check
CHECK (reference_type IN ('session', 'sale', 'sale_item', 'package', 'manual'));

-- Comentario para documentación
COMMENT ON TABLE commissions IS 'Tabla de comisiones - professional_id referencia users(id), reference_type incluye manual';
