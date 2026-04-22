-- MANUAL FIX - Run this directly in Supabase SQL Editor
-- This updates the profile trigger to properly capture signup data

CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    phone_number,
    is_admin,
    admin_role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    false,
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name, ''),
    username = COALESCE(NEW.raw_user_meta_data->>'username', profiles.username, SPLIT_PART(NEW.email, '@', 1)),
    phone_number = COALESCE(NEW.raw_user_meta_data->>'phone', profiles.phone_number, ''),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
