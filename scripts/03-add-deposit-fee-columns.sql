-- Add processing_fee and net_amount columns to monnify_transactions table
-- This stores the calculated deposit fee and the net amount credited to the user's wallet

ALTER TABLE monnify_transactions
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10, 2) DEFAULT 50,
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10, 2);

-- Update existing rows to calculate net_amount where it's NULL
-- net_amount = amount - processing_fee
UPDATE monnify_transactions
SET net_amount = amount - COALESCE(processing_fee, 50)
WHERE net_amount IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN monnify_transactions.processing_fee IS 'Processing fee deducted from deposit amount (₦50 flat or percentage-based)';
COMMENT ON COLUMN monnify_transactions.net_amount IS 'Amount credited to user wallet after deducting processing fees';
