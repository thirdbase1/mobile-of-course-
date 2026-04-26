-- Add is_admin and admin_role columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_role TEXT;

-- Create function to set admin flag based on ADMIN_EMAIL environment variable
-- This function will be called when a new user is created
CREATE OR REPLACE FUNCTION public.set_admin_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  admin_email TEXT;
BEGIN
  -- Get the admin email from a settings table (we'll use a constant for now)
  -- In production, this could be stored in a config table
  -- For now, we'll rely on the proxy.ts logic to set it via the API
  
  -- Set is_admin based on email match (this will be supplemented by proxy.ts)
  NEW.is_admin = FALSE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update is_admin when a user's email matches ADMIN_EMAIL
-- This should be called from the application after signup
CREATE OR REPLACE FUNCTION public.verify_and_set_admin(user_id UUID, user_email TEXT)
RETURNS TABLE(is_admin BOOLEAN, admin_role TEXT) AS $$
DECLARE
  admin_email TEXT;
BEGIN
  -- In production, ADMIN_EMAIL would be stored in a settings table
  -- For now, return success and let proxy.ts handle the admin check
  RETURN QUERY
  SELECT profiles.is_admin, profiles.admin_role
  FROM public.profiles
  WHERE profiles.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = TRUE;
