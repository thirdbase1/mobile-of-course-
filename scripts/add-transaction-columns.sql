-- Add missing columns to transactions table for airtime/data/cable/electricity/wallet support
-- These columns are needed for all transaction types

-- Add columns if they don't exist
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR,
ADD COLUMN IF NOT EXISTS service_id VARCHAR,
ADD COLUMN IF NOT EXISTS service_name VARCHAR,
ADD COLUMN IF NOT EXISTS phone VARCHAR,
ADD COLUMN IF NOT EXISTS status VARCHAR,
ADD COLUMN IF NOT EXISTS description VARCHAR,
ADD COLUMN IF NOT EXISTS balance_before NUMERIC,
ADD COLUMN IF NOT EXISTS balance_after NUMERIC,
ADD COLUMN IF NOT EXISTS api_response TEXT;

-- Add comment to ensure table is properly documented
COMMENT ON TABLE transactions IS 'Universal transaction log for all services: airtime, data, cable, electricity, wallet funds, recharge pins';
COMMENT ON COLUMN transactions.transaction_id IS 'Unique transaction identifier for tracking';
COMMENT ON COLUMN transactions.service_id IS 'Service-specific ID (e.g., Airtel, MTN, DSTV code)';
COMMENT ON COLUMN transactions.service_name IS 'Human-readable service name';
COMMENT ON COLUMN transactions.phone IS 'Phone number for the transaction (if applicable)';
COMMENT ON COLUMN transactions.status IS 'Transaction status: SUCCESS, FAILED, PENDING';
COMMENT ON COLUMN transactions.description IS 'Detailed transaction description';
COMMENT ON COLUMN transactions.balance_before IS 'Wallet balance before transaction';
COMMENT ON COLUMN transactions.balance_after IS 'Wallet balance after transaction';
COMMENT ON COLUMN transactions.api_response IS 'Raw API response from provider (JSON string)';
