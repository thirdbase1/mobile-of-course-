-- Add plan_details column to transactions table
-- This stores the plan/package information for data, cable, and other services

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS plan_details VARCHAR;

-- Add comment for documentation
COMMENT ON COLUMN transactions.plan_details IS 'Plan or package details (e.g., "2GB 30 days" for data, "Starter" for cable)';

-- Create an index on plan_details for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_plan_details ON transactions(plan_details);
