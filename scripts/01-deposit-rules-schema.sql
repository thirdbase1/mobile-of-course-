-- Deposit Rules Configuration Table
CREATE TABLE IF NOT EXISTS deposit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_fee DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
  percentage_fee DECIMAL(5, 2) NOT NULL DEFAULT 1.5,
  threshold_amount DECIMAL(15, 2) NOT NULL DEFAULT 2500.00,
  max_fee DECIMAL(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deposit_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to view deposit rules (for fee calculation)
CREATE POLICY "Users can view deposit rules"
  ON deposit_rules FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow only admins to manage deposit rules
CREATE POLICY "Only admins can update deposit rules"
  ON deposit_rules FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Ensure only one active deposit rule set exists
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_deposit_rule 
  ON deposit_rules(is_active) 
  WHERE is_active = true;

-- Seed default deposit rule
INSERT INTO deposit_rules (base_fee, percentage_fee, threshold_amount, max_fee, is_active)
VALUES (50.00, 1.5, 2500.00, NULL, true)
ON CONFLICT DO NOTHING;
