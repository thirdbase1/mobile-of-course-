ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS service_variant VARCHAR;

COMMENT ON COLUMN transactions.service_variant IS 'Service variant (e.g., SME Data, Gifting, AWOOF, Standard)';

CREATE INDEX IF NOT EXISTS idx_transactions_service_variant ON transactions(service_variant);
