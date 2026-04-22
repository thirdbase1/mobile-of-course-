-- Create pricing_rules table for managing markups/discounts per service and plan
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL, -- e.g., "mtn", "glo", "airtel", "dstv", "gotv"
  plan_name TEXT NOT NULL, -- e.g., "1GB Daily", "2GB - 30days"
  base_price DECIMAL(10, 2) NOT NULL, -- Base price from gsubz
  markup_type TEXT NOT NULL CHECK (markup_type IN ('fixed', 'percentage')),
  markup_value DECIMAL(10, 2) NOT NULL, -- Can be negative for discounts
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_pricing_rule UNIQUE(service_id, plan_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pricing_rules_service_active 
  ON pricing_rules(service_id, is_active);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_plan_name 
  ON pricing_rules(plan_name);

-- Enable RLS
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can insert pricing rules
CREATE POLICY pricing_rules_insert_admin ON pricing_rules FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'authenticated');

-- Policy: Anyone can read active pricing rules
CREATE POLICY pricing_rules_read_public ON pricing_rules FOR SELECT
  USING (is_active = true);

-- Policy: Only admins can update
CREATE POLICY pricing_rules_update_admin ON pricing_rules FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'authenticated')
  WITH CHECK (auth.jwt() ->> 'role' = 'authenticated');

-- Policy: Only admins can delete
CREATE POLICY pricing_rules_delete_admin ON pricing_rules FOR DELETE
  USING (auth.jwt() ->> 'role' = 'authenticated');
