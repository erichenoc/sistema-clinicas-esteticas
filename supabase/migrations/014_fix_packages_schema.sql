-- Migration: Fix packages table schema to match expected structure
-- The packages table was created with a different schema than the migration defined

-- Add missing columns
ALTER TABLE packages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'sessions_pack' CHECK (type IN ('bundle', 'sessions_pack'));
ALTER TABLE packages ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';
ALTER TABLE packages ADD COLUMN IF NOT EXISTS regular_price DECIMAL(10,2);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS sales_count INT DEFAULT 0;

-- Migrate data from 'treatments' to 'items' if 'treatments' column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packages' AND column_name = 'treatments') THEN
        -- Convert treatments array to items JSONB format
        UPDATE packages
        SET items = (
            SELECT COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'treatmentId', elem->>'treatment_id',
                        'treatmentName', COALESCE(t.name, 'Tratamiento'),
                        'quantity', COALESCE((elem->>'quantity')::int, 1),
                        'price', COALESCE(t.price, 0)
                    )
                ),
                '[]'::jsonb
            )
            FROM jsonb_array_elements(packages.treatments::jsonb) AS elem
            LEFT JOIN treatments t ON t.id::text = elem->>'treatment_id'
        )
        WHERE treatments IS NOT NULL;
    END IF;
END $$;

-- Migrate price to sale_price if price exists and sale_price is null
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packages' AND column_name = 'price') THEN
        UPDATE packages SET sale_price = price WHERE sale_price IS NULL AND price IS NOT NULL;
    END IF;
END $$;

-- Calculate regular_price from items if it's null
UPDATE packages
SET regular_price = (
    SELECT COALESCE(SUM((item->>'price')::decimal * (item->>'quantity')::int), 0)
    FROM jsonb_array_elements(items) AS item
)
WHERE regular_price IS NULL AND items IS NOT NULL AND items != '[]'::jsonb;

-- Set regular_price = sale_price if still null (as fallback)
UPDATE packages SET regular_price = sale_price WHERE regular_price IS NULL AND sale_price IS NOT NULL;

-- Set sale_price = regular_price if still null
UPDATE packages SET sale_price = regular_price WHERE sale_price IS NULL AND regular_price IS NOT NULL;

-- Set defaults for any remaining nulls
UPDATE packages SET regular_price = 0 WHERE regular_price IS NULL;
UPDATE packages SET sale_price = 0 WHERE sale_price IS NULL;

-- Make columns NOT NULL after data migration
ALTER TABLE packages ALTER COLUMN regular_price SET NOT NULL;
ALTER TABLE packages ALTER COLUMN sale_price SET NOT NULL;
ALTER TABLE packages ALTER COLUMN items SET NOT NULL;

-- Drop old columns if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packages' AND column_name = 'treatments') THEN
        ALTER TABLE packages DROP COLUMN treatments;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packages' AND column_name = 'total_sessions') THEN
        ALTER TABLE packages DROP COLUMN total_sessions;
    END IF;
END $$;

-- Keep 'price' column for backwards compatibility but it's deprecated
-- New code should use sale_price
