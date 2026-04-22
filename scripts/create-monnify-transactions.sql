-- Migration: Create monnify_transactions table for production checkout system
-- Tracks all payment transactions with persistent state and expiry handling

CREATE TABLE IF NOT EXISTS public.monnify_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment reference (unique, persistent checkout URL)
  -- Format: MOZO_<userId8>_<timestamp>_<rand>
  payment_reference VARCHAR(50) NOT NULL UNIQUE,
  
  -- Monnify transaction reference (returned from init-transaction)
  transaction_reference VARCHAR(100),
  
  -- Payment amount in NGN
  amount DECIMAL(15, 2) NOT NULL,
  
  -- Payment status: PENDING, SUCCESS, EXPIRED, CANCELLED
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  
  -- Account details for checkout display
  account_number VARCHAR(20),
  bank_name VARCHAR(100),
  account_name VARCHAR(255),
  
  -- Bank code for USSD
  bank_code VARCHAR(10),
  ussd_code VARCHAR(50),
  
  -- Payment timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- Set to NOW() + 20 minutes
  paid_at TIMESTAMPTZ,
  
  -- Monnify webhook data
  monnify_response JSONB, -- Store full Monnify response
  
  -- For idempotency and audit
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  webhook_received_at TIMESTAMPTZ,
  
  -- Payment method metadata
  payment_method VARCHAR(20) DEFAULT 'BANK_TRANSFER',
  narration TEXT,
  
  -- Settlement tracking
  settled BOOLEAN DEFAULT FALSE,
  settlement_amount DECIMAL(15, 2),
  
  CONSTRAINT valid_status CHECK (status IN ('PENDING', 'SUCCESS', 'EXPIRED', 'CANCELLED')),
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_monnify_transactions_user_id 
  ON public.monnify_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_monnify_transactions_payment_reference 
  ON public.monnify_transactions(payment_reference);

CREATE INDEX IF NOT EXISTS idx_monnify_transactions_transaction_reference 
  ON public.monnify_transactions(transaction_reference);

CREATE INDEX IF NOT EXISTS idx_monnify_transactions_status 
  ON public.monnify_transactions(status);

CREATE INDEX IF NOT EXISTS idx_monnify_transactions_created_at 
  ON public.monnify_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_monnify_transactions_expires_at 
  ON public.monnify_transactions(expires_at);

-- RLS: Users can only see their own transactions
ALTER TABLE public.monnify_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_transactions"
  ON public.monnify_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_transactions"
  ON public.monnify_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_transactions"
  ON public.monnify_transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Extend transactions table with payment tracking fields (if using existing transaction history)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(50),
  ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(100),
  ADD COLUMN IF NOT EXISTS monnify_account_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS monnify_bank_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS monnify_account_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'BANK_TRANSFER',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_payment_reference 
  ON public.transactions(payment_reference);
