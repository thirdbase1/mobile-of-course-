-- Session Management for Single-Device Login
-- Tracks device sessions to prevent concurrent logins
-- Automatically invalidates other sessions when user logs in on new device

CREATE TABLE IF NOT EXISTS device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  ip_address INET,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT unique_active_session_per_user UNIQUE(user_id, is_active) WHERE is_active = TRUE
);

-- Index for fast lookups
CREATE INDEX idx_device_sessions_user_id ON device_sessions(user_id);
CREATE INDEX idx_device_sessions_session_id ON device_sessions(session_id);
CREATE INDEX idx_device_sessions_is_active ON device_sessions(is_active);

-- Function to invalidate other sessions when user logs in on new device
CREATE OR REPLACE FUNCTION invalidate_other_sessions(
  user_id UUID,
  new_session_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark all other active sessions as inactive for this user
  UPDATE device_sessions
  SET is_active = FALSE
  WHERE user_id = $1 AND session_id != $2 AND is_active = TRUE;
  
  -- Mark new session as active
  UPDATE device_sessions
  SET is_active = TRUE
  WHERE user_id = $1 AND session_id = $2;
END;
$$;

-- Function to create a new device session
CREATE OR REPLACE FUNCTION create_device_session(
  user_id UUID,
  session_id TEXT,
  device_fingerprint TEXT,
  device_name TEXT DEFAULT NULL,
  ip_address INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  browser TEXT DEFAULT NULL,
  os TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_session_id UUID;
BEGIN
  -- First, invalidate all other sessions
  PERFORM invalidate_other_sessions(user_id, session_id);
  
  -- Insert new session
  INSERT INTO device_sessions (
    user_id,
    session_id,
    device_fingerprint,
    device_name,
    ip_address,
    user_agent,
    browser,
    os,
    is_active
  ) VALUES (
    user_id,
    session_id,
    device_fingerprint,
    device_name,
    ip_address,
    user_agent,
    browser,
    os,
    TRUE
  )
  ON CONFLICT (user_id, is_active) WHERE is_active = TRUE
  DO UPDATE SET
    is_active = FALSE,
    session_id = EXCLUDED.session_id,
    device_fingerprint = EXCLUDED.device_fingerprint,
    device_name = EXCLUDED.device_name,
    ip_address = EXCLUDED.ip_address,
    user_agent = EXCLUDED.user_agent,
    browser = EXCLUDED.browser,
    os = EXCLUDED.os,
    last_activity = NOW()
  RETURNING id INTO new_session_id;
  
  RETURN new_session_id;
END;
$$;

-- Function to check if session is valid (active and belongs to user)
CREATE OR REPLACE FUNCTION is_session_active(
  user_id UUID,
  session_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_active BOOLEAN;
BEGIN
  SELECT is_active INTO session_active
  FROM device_sessions
  WHERE user_id = $1 AND session_id = $2
  LIMIT 1;
  
  RETURN COALESCE(session_active, FALSE);
END;
$$;

-- Function to update session last activity
CREATE OR REPLACE FUNCTION update_session_activity(
  session_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE device_sessions
  SET last_activity = NOW()
  WHERE session_id = $1;
END;
$$;

-- Function to end all sessions for a user (used on logout)
CREATE OR REPLACE FUNCTION end_all_user_sessions(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE device_sessions
  SET is_active = FALSE
  WHERE user_id = $1 AND is_active = TRUE;
END;
$$;

-- Grant permissions to authenticated users
GRANT SELECT ON device_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION invalidate_other_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION create_device_session TO authenticated;
GRANT EXECUTE ON FUNCTION is_session_active TO authenticated;
GRANT EXECUTE ON FUNCTION update_session_activity TO authenticated;
GRANT EXECUTE ON FUNCTION end_all_user_sessions TO authenticated;

-- Row Level Security Policies
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view their own sessions"
  ON device_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only delete their own sessions
CREATE POLICY "Users can delete their own sessions"
  ON device_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Insert is done via functions, so restrict direct inserts
CREATE POLICY "Only functions can insert sessions"
  ON device_sessions
  FOR INSERT
  WITH CHECK (FALSE);
