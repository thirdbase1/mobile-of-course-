-- Atomic wallet deduction function
-- Prevents race conditions by doing read + deduct + return in one database call
-- This ensures only one request can successfully deduct at a time

CREATE OR REPLACE FUNCTION deduct_wallet_balance(
  user_id UUID,
  deduct_amount NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance NUMERIC;
  new_balance NUMERIC;
BEGIN
  -- Lock the row and read current balance atomically
  SELECT wallet_balance INTO current_balance
  FROM profiles
  WHERE id = user_id
  FOR UPDATE;
  
  -- Check if balance is sufficient
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  IF current_balance < deduct_amount THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;
  
  -- Deduct amount and calculate new balance
  new_balance := current_balance - deduct_amount;
  
  -- Update wallet with new balance
  UPDATE profiles
  SET wallet_balance = new_balance,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Return new balance
  RETURN new_balance;
END;
$$;

-- Atomic wallet refund function
-- For refunding failed transactions atomically
CREATE OR REPLACE FUNCTION refund_wallet_balance(
  user_id UUID,
  refund_amount NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance NUMERIC;
  new_balance NUMERIC;
BEGIN
  -- Lock the row and read current balance atomically
  SELECT wallet_balance INTO current_balance
  FROM profiles
  WHERE id = user_id
  FOR UPDATE;
  
  -- Check if profile exists
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Add refund amount to balance
  new_balance := current_balance + refund_amount;
  
  -- Update wallet with new balance
  UPDATE profiles
  SET wallet_balance = new_balance,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Return new balance
  RETURN new_balance;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION deduct_wallet_balance TO authenticated;
GRANT EXECUTE ON FUNCTION refund_wallet_balance TO authenticated;
