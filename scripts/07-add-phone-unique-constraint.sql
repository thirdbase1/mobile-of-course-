-- Add UNIQUE constraint to phone_number column
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_phone_number UNIQUE (phone_number) WHERE phone_number IS NOT NULL;

-- Add CHECK constraint for phone_number length (exactly 11 digits)
ALTER TABLE public.profiles
ADD CONSTRAINT phone_number_length CHECK (
  phone_number IS NULL OR (
    LENGTH(REGEXP_REPLACE(phone_number, '\D', '', 'g')) = 11
  )
);

-- Create index for phone_number lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);
