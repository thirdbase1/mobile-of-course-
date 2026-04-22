-- Backfill null profile data with safe defaults
UPDATE public.profiles
SET 
  full_name = COALESCE(full_name, ''),
  username = COALESCE(username, SPLIT_PART(email, '@', 1)),
  phone_number = COALESCE(phone_number, ''),
  updated_at = NOW()
WHERE full_name IS NULL OR username IS NULL OR phone_number IS NULL;

-- Ensure all profiles have at least email-based username if still null
UPDATE public.profiles
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL;

-- Create a function to check if profile is complete
CREATE OR REPLACE FUNCTION public.is_profile_complete(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
      AND full_name IS NOT NULL
      AND full_name != ''
      AND username IS NOT NULL
      AND username != ''
      AND phone_number IS NOT NULL
      AND phone_number != ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
