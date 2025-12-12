-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number VARCHAR(20) NOT NULL UNIQUE,
  clinic_id UUID REFERENCES clinics(id),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,

  -- Pricing
  currency VARCHAR(3) NOT NULL DEFAULT 'DOP' CHECK (currency IN ('DOP', 'USD')),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
  valid_until DATE NOT NULL,

  -- Content
  notes TEXT,
  terms_conditions TEXT,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  converted_invoice_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create quotation_items table
CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,

  -- Item type
  type VARCHAR(20) NOT NULL CHECK (type IN ('treatment', 'product', 'package', 'custom')),
  reference_id UUID, -- References treatment_id, product_id, or package_id depending on type

  -- Item details
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_type VARCHAR(10) NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quotations_patient_id ON quotations(patient_id);
CREATE INDEX IF NOT EXISTS idx_quotations_clinic_id ON quotations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_quotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_quotations_updated_at ON quotations;
CREATE TRIGGER trigger_quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_quotations_updated_at();

-- Enable RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for service role)
DROP POLICY IF EXISTS "Allow all for service role" ON quotations;
CREATE POLICY "Allow all for service role" ON quotations
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for service role" ON quotation_items;
CREATE POLICY "Allow all for service role" ON quotation_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON quotations TO authenticated;
GRANT ALL ON quotations TO service_role;
GRANT ALL ON quotation_items TO authenticated;
GRANT ALL ON quotation_items TO service_role;
