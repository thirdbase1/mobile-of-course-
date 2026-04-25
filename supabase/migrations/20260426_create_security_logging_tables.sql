-- Security Logging Tables Migration
-- Created for API tracking, rate limiting, and audit trails

-- Table: api_logs
-- Tracks all API requests for monitoring and debugging
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status_code INTEGER NOT NULL,
  duration_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  suspicious_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_ip_address ON api_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_suspicious ON api_logs(suspicious_flag) WHERE suspicious_flag = TRUE;
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint_created ON api_logs(endpoint, created_at DESC);

-- Table: failed_auth_logs
-- Tracks failed authentication attempts for brute force detection
CREATE TABLE IF NOT EXISTS failed_auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  reason TEXT,
  attempt_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for failed auth analysis
CREATE INDEX IF NOT EXISTS idx_failed_auth_email ON failed_auth_logs(email);
CREATE INDEX IF NOT EXISTS idx_failed_auth_ip ON failed_auth_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_auth_created ON failed_auth_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_auth_email_ip ON failed_auth_logs(email, ip_address, created_at DESC);

-- Table: suspicious_activity_logs
-- Tracks potentially malicious activity (injection attempts, unusual patterns, etc)
CREATE TABLE IF NOT EXISTS suspicious_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'INJECTION_ATTEMPT',
    'BRUTE_FORCE',
    'RATE_LIMIT_EXCEEDED',
    'UNAUTHORIZED_ACCESS',
    'INVALID_PARAMETER',
    'BALANCE_MANIPULATION',
    'FRAUD_DETECTED',
    'SUSPICIOUS_PATTERN'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET NOT NULL,
  endpoint TEXT,
  details JSONB,
  severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for suspicious activity analysis
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_type ON suspicious_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_user ON suspicious_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_ip ON suspicious_activity_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_severity ON suspicious_activity_logs(severity);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_resolved ON suspicious_activity_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_created ON suspicious_activity_logs(created_at DESC);

-- Table: audit_logs
-- Tracks administrative actions (promote/demote admin, balance changes, etc)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changes JSONB NOT NULL,
  reason TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit trail
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Enable RLS on all logging tables
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service role can insert logs
CREATE POLICY "service_role_can_insert_api_logs" ON api_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_can_insert_failed_auth" ON failed_auth_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_can_insert_suspicious" ON suspicious_activity_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_can_insert_audit" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- RLS Policy: Admins can read all logs
CREATE POLICY "admins_can_read_api_logs" ON api_logs
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

CREATE POLICY "admins_can_read_failed_auth" ON failed_auth_logs
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

CREATE POLICY "admins_can_read_suspicious" ON suspicious_activity_logs
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

CREATE POLICY "admins_can_read_audit" ON audit_logs
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

-- RLS Policy: Users can only read their own API logs
CREATE POLICY "users_can_read_own_api_logs" ON api_logs
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- Grant access to service role
GRANT ALL ON api_logs TO service_role;
GRANT ALL ON failed_auth_logs TO service_role;
GRANT ALL ON suspicious_activity_logs TO service_role;
GRANT ALL ON audit_logs TO service_role;
