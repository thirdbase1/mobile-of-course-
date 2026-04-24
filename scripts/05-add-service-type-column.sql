-- Add service_type column to transactions table to store service type (e.g., SME Data, Gifting, etc.)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS service_type VARCHAR;

COMMENT ON COLUMN transactions.service_type IS 'Service type/variant (e.g., SME Data, Gifting, AWOOF, Starter package)';

CREATE INDEX IF NOT EXISTS idx_transactions_service_type ON transactions(service_type);
