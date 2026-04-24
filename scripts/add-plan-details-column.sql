-- Add plan_details column to transactions table
-- This stores the plan/package details for data and cable transactions (e.g., "2GB 30 days", "DStv Starter")

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS plan_details TEXT;

-- Add comment to document the new column
COMMENT ON COLUMN transactions.plan_details IS 'Plan or package details for data/cable transactions (e.g., "2GB 30 days", "DStv Starter")';
