-- ========================================
-- FIX AUTH UNIQUENESS (email, username, phone)
-- Idempotent + repairs the broken script 07
-- ========================================

-- 1) Make sure profiles table exists with the columns we depend on.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  username TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  wallet_balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2) Drop the broken constraint from script 07 if it ever applied.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_phone_number;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS phone_number_length;

-- 3) Normalize existing data: lowercase emails/usernames, strip non-digits from phone.
UPDATE public.profiles
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL AND email <> LOWER(TRIM(email));

UPDATE public.profiles
SET username = LOWER(TRIM(username))
WHERE username IS NOT NULL AND username <> LOWER(TRIM(username));

UPDATE public.profiles
SET phone_number = REGEXP_REPLACE(phone_number, '\D', '', 'g')
WHERE phone_number IS NOT NULL
  AND phone_number <> REGEXP_REPLACE(phone_number, '\D', '', 'g');

-- 4) Partial UNIQUE INDEXes (this is the correct way to do "unique when not null").
--    These will FAIL if duplicates already exist; if so, you must dedupe first.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_profiles_email_lower
  ON public.profiles ((LOWER(email)))
  WHERE email IS NOT NULL AND email <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_profiles_username_lower
  ON public.profiles ((LOWER(username)))
  WHERE username IS NOT NULL AND username <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_profiles_phone_number
  ON public.profiles (phone_number)
  WHERE phone_number IS NOT NULL AND phone_number <> '';

-- 5) Length check for phone (CHECK constraints DO support boolean expressions).
ALTER TABLE public.profiles
  ADD CONSTRAINT phone_number_length_check
  CHECK (
    phone_number IS NULL
    OR phone_number = ''
    OR LENGTH(REGEXP_REPLACE(phone_number, '\D', '', 'g')) = 11
  );

-- 6) Helpful lookup indexes (non-unique, for the API checks).
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles (phone_number);

-- 7) Re-create the signup trigger so new auth.users always get a profile row,
--    and so phone_number is digits-only and lowercased email/username.
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_phone    TEXT;
BEGIN
  v_username := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))));
  v_phone    := REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'phone', ''), '\D', '', 'g');

  INSERT INTO public.profiles (id, email, full_name, username, phone_number, created_at, updated_at)
  VALUES (
    NEW.id,
    LOWER(TRIM(NEW.email)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_username,
    NULLIF(v_phone, ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email        = LOWER(TRIM(EXCLUDED.email)),
    full_name    = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    username     = COALESCE(EXCLUDED.username, public.profiles.username),
    phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
    updated_at   = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_on_signup();
