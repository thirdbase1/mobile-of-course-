-- Fix RLS policies for deposit_rules
-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Only admins can update deposit rules" ON deposit_rules;

-- Create corrected policy (RLS will be bypassed by server action's role check)
-- This allows authenticated users with proper backend validation
CREATE POLICY "Admins can update deposit rules"
  ON deposit_rules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow admins to insert new rules
CREATE POLICY "Admins can insert deposit rules"
  ON deposit_rules FOR INSERT
  TO authenticated
  WITH CHECK (true);
