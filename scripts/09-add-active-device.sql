-- One-device-per-account enforcement
-- We track the currently-active device per user. When a user signs in elsewhere,
-- profiles.active_device_id is rotated and any device whose cookie doesn't match
-- gets force-logged-out by the proxy on its next request.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_device_id UUID,
  ADD COLUMN IF NOT EXISTS active_device_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_active_device_id
  ON public.profiles (active_device_id);
