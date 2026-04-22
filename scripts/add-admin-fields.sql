-- ==========================================
-- Complete Admin System Setup
-- ==========================================

-- 1. Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  phone_number TEXT,
  avatar_url TEXT,
  date_of_birth TEXT,
  bvn TEXT,
  wallet_balance DECIMAL(15,2) DEFAULT 0,
  monnify_account_number TEXT,
  monnify_account_name TEXT,
  monnify_bank_name TEXT,
  monnify_account_reference TEXT,
  dva_created_at TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT false,
  admin_role TEXT DEFAULT 'ADMIN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create transactions table if not exists
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status TEXT DEFAULT 'PENDING',
  payment_reference VARCHAR(50),
  transaction_reference VARCHAR(100),
  monnify_account_number VARCHAR(20),
  monnify_bank_name VARCHAR(100),
  monnify_account_name VARCHAR(255),
  payment_method VARCHAR(20) DEFAULT 'BANK_TRANSFER',
  service_name TEXT,
  phone TEXT,
  balance_before DECIMAL(15, 2),
  balance_after DECIMAL(15, 2),
  api_response JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create monnify_transactions table if not exists
CREATE TABLE IF NOT EXISTS public.monnify_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_reference VARCHAR(50) NOT NULL UNIQUE,
  transaction_reference VARCHAR(100),
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  account_number VARCHAR(20),
  bank_name VARCHAR(100),
  account_name VARCHAR(255),
  bank_code VARCHAR(10),
  ussd_code VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  monnify_response JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  webhook_received_at TIMESTAMPTZ,
  payment_method VARCHAR(20) DEFAULT 'BANK_TRANSFER',
  narration TEXT,
  settled BOOLEAN DEFAULT FALSE,
  settlement_amount DECIMAL(15, 2)
);

-- 4. Create pricing_rules table for dynamic pricing
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network TEXT NOT NULL,
  service_type TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('FIXED', 'PERCENT')),
  value DECIMAL(10, 2) NOT NULL,
  min_amount DECIMAL(15, 2),
  max_amount DECIMAL(15, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(network, service_type)
);

-- 5. Create admin_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monnify_transactions_user_id ON public.monnify_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_monnify_transactions_status ON public.monnify_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON public.pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_network ON public.pricing_rules(network, service_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

-- 7. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monnify_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for profiles
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Users can read their own profile" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can update profiles" ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- 9. RLS Policies for transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions" ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert transactions" ON public.transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- 10. RLS Policies for monnify_transactions
DROP POLICY IF EXISTS "users_can_view_own_transactions" ON public.monnify_transactions;
DROP POLICY IF EXISTS "users_can_insert_own_transactions" ON public.monnify_transactions;
DROP POLICY IF EXISTS "Admins can view all monnify transactions" ON public.monnify_transactions;

CREATE POLICY "users_can_view_own_transactions" ON public.monnify_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_transactions" ON public.monnify_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all monnify transactions" ON public.monnify_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- 11. RLS Policies for pricing_rules (admins only)
DROP POLICY IF EXISTS "Everyone can view active pricing rules" ON public.pricing_rules;
DROP POLICY IF EXISTS "Admins can manage pricing rules" ON public.pricing_rules;

CREATE POLICY "Everyone can view active pricing rules" ON public.pricing_rules
FOR SELECT
USING (is_active = true OR 
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can manage pricing rules" ON public.pricing_rules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- 12. RLS Policies for admin_logs (admins only)
DROP POLICY IF EXISTS "Admins can view logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON public.admin_logs;

CREATE POLICY "Admins can view logs" ON public.admin_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can insert logs" ON public.admin_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);
