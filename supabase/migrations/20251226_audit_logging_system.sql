-- Comprehensive Audit Logging System
-- This migration creates a complete audit trail for compliance and security

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  operation text NOT NULL, -- INSERT, UPDATE, DELETE, SELECT (for sensitive data)
  user_id uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  record_id uuid, -- ID of the affected record
  old_values jsonb, -- Previous values (for UPDATE)
  new_values jsonb, -- New values (for INSERT/UPDATE)
  changed_fields text[], -- List of changed field names
  ip_address inet,
  user_agent text,
  session_id text,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}' -- Additional context
);

-- Create audit_log_retention table for automated cleanup
CREATE TABLE IF NOT EXISTS audit_log_retention (
  table_name text PRIMARY KEY,
  retention_days integer NOT NULL DEFAULT 365,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default retention policies
INSERT INTO audit_log_retention (table_name, retention_days) VALUES
  ('profiles', 2555), -- 7 years for user data
  ('inspection_requests', 1825), -- 5 years for business records
  ('user_roles', 2555), -- 7 years for access changes
  ('organizations', 3650) -- 10 years for org data
ON CONFLICT (table_name) DO NOTHING;

-- Function to log changes
CREATE OR REPLACE FUNCTION log_audit_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  audit_record audit_logs%ROWTYPE;
  changed_fields text[] := '{}';
BEGIN
  -- Skip if audit logging is disabled for this table
  IF NOT EXISTS (SELECT 1 FROM audit_log_retention WHERE table_name = TG_TABLE_NAME AND is_active = true) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Get user and organization context
  audit_record.user_id := auth.uid();
  audit_record.organization_id := current_user_organization();
  audit_record.table_name := TG_TABLE_NAME;
  audit_record.operation := TG_OP;
  audit_record.ip_address := inet_client_addr();
  audit_record.user_agent := current_setting('request.headers', true)::json->>'user-agent';
  audit_record.session_id := current_setting('request.headers', true)::json->>'authorization';
  
  CASE TG_OP
    WHEN 'INSERT' THEN
      audit_record.record_id := NEW.id;
      audit_record.new_values := to_jsonb(NEW);
      audit_record.changed_fields := array(SELECT jsonb_object_keys(to_jsonb(NEW)));
      
    WHEN 'UPDATE' THEN
      audit_record.record_id := NEW.id;
      audit_record.old_values := to_jsonb(OLD);
      audit_record.new_values := to_jsonb(NEW);
      
      -- Calculate changed fields
      SELECT array_agg(key) INTO changed_fields
      FROM jsonb_each(to_jsonb(OLD)) old_kv
      JOIN jsonb_each(to_jsonb(NEW)) new_kv ON old_kv.key = new_kv.key
      WHERE old_kv.value IS DISTINCT FROM new_kv.value;
      
      audit_record.changed_fields := COALESCE(changed_fields, '{}');
      
    WHEN 'DELETE' THEN
      audit_record.record_id := OLD.id;
      audit_record.old_values := to_jsonb(OLD);
      audit_record.changed_fields := array(SELECT jsonb_object_keys(to_jsonb(OLD)));
  END CASE;

  -- Insert audit record
  INSERT INTO audit_logs (
    table_name, operation, user_id, organization_id, record_id,
    old_values, new_values, changed_fields, ip_address, user_agent,
    session_id, metadata
  ) VALUES (
    audit_record.table_name, audit_record.operation, audit_record.user_id,
    audit_record.organization_id, audit_record.record_id, audit_record.old_values,
    audit_record.new_values, audit_record.changed_fields, audit_record.ip_address,
    audit_record.user_agent, audit_record.session_id, audit_record.metadata
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for audit logging
CREATE TRIGGER audit_profiles_insert
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

CREATE TRIGGER audit_profiles_update
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

CREATE TRIGGER audit_profiles_delete
  AFTER DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

CREATE TRIGGER audit_inspection_requests_insert
  AFTER INSERT ON inspection_requests
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

CREATE TRIGGER audit_inspection_requests_update
  AFTER UPDATE ON inspection_requests
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

CREATE TRIGGER audit_inspection_requests_delete
  AFTER DELETE ON inspection_requests
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

CREATE TRIGGER audit_user_roles_insert
  AFTER INSERT ON user_roles
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

CREATE TRIGGER audit_user_roles_update
  AFTER UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

CREATE TRIGGER audit_user_roles_delete
  AFTER DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

CREATE TRIGGER audit_organization_members_insert
  AFTER INSERT ON organization_members
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

CREATE TRIGGER audit_organization_members_update
  AFTER UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

CREATE TRIGGER audit_organization_members_delete
  AFTER DELETE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

-- Function to manually log custom events
CREATE OR REPLACE FUNCTION log_custom_audit_event(
  p_table_name text,
  p_operation text,
  p_record_id uuid DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO audit_logs (
    table_name, operation, user_id, organization_id, record_id,
    old_values, new_values, ip_address, user_agent, session_id, metadata
  ) VALUES (
    p_table_name, p_operation, auth.uid(), current_user_organization(),
    p_record_id, p_old_values, p_new_values, inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    current_setting('request.headers', true)::json->>'authorization',
    p_metadata
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Function to get audit trail for a record
CREATE OR REPLACE FUNCTION get_audit_trail(
  p_table_name text,
  p_record_id uuid,
  p_organization_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  operation text,
  user_id uuid,
  user_email text,
  timestamp timestamptz,
  changed_fields text[],
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    al.id,
    al.operation,
    al.user_id,
    p.email as user_email,
    al.timestamp,
    al.changed_fields,
    al.old_values,
    al.new_values,
    al.ip_address,
    al.user_agent
  FROM audit_logs al
  LEFT JOIN profiles p ON al.user_id = p.id
  WHERE al.table_name = p_table_name
  AND al.record_id = p_record_id
  AND (p_organization_id IS NULL OR al.organization_id = p_organization_id)
  ORDER BY al.timestamp DESC;
$$;

-- Function to cleanup old audit logs
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer := 0;
  retention_record audit_log_retention%ROWTYPE;
BEGIN
  FOR retention_record IN SELECT * FROM audit_log_retention WHERE is_active = true LOOP
    DELETE FROM audit_logs 
    WHERE table_name = retention_record.table_name
    AND timestamp < now() - (retention_record.retention_days || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup
    RAISE LOG 'Cleaned up % old audit log entries for table %', deleted_count, retention_record.table_name;
  END LOOP;
  
  RETURN deleted_count;
END;
$$;

-- Views for audit reporting
CREATE OR REPLACE VIEW audit_summary AS
SELECT 
  table_name,
  operation,
  COUNT(*) as operation_count,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', timestamp) as day
FROM audit_logs
WHERE timestamp >= now() - interval '30 days'
GROUP BY table_name, operation, DATE_TRUNC('day', timestamp)
ORDER BY day DESC, table_name, operation;

CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  p.id as user_id,
  p.email,
  COUNT(*) as total_actions,
  COUNT(DISTINCT al.table_name) as tables_accessed,
  MAX(al.timestamp) as last_activity,
  DATE_TRUNC('day', al.timestamp) as day
FROM audit_logs al
JOIN profiles p ON al.user_id = p.id
WHERE al.timestamp >= now() - interval '7 days'
GROUP BY p.id, p.email, DATE_TRUNC('day', al.timestamp)
ORDER BY day DESC, total_actions DESC;

CREATE OR REPLACE VIEW security_events AS
SELECT 
  al.*,
  p.email as user_email
FROM audit_logs al
JOIN profiles p ON al.user_id = p.id
WHERE al.operation IN ('DELETE', 'UPDATE')
AND al.table_name IN ('user_roles', 'organization_members', 'profiles')
AND al.timestamp >= now() - interval '24 hours'
ORDER BY al.timestamp DESC;

-- Indexes for audit performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_user_time ON audit_logs(table_name, user_id, timestamp);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON audit_log_retention TO authenticated;
GRANT SELECT ON audit_summary TO authenticated;
GRANT SELECT ON user_activity_summary TO authenticated;
GRANT SELECT ON security_events TO authenticated;

GRANT EXECUTE ON FUNCTION log_custom_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_trail TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_audit_logs TO authenticated;

-- Only allow admins to execute cleanup
CREATE POLICY "Admins can cleanup audit logs" ON audit_logs
  FOR DELETE USING (
    current_user_has_role('admin')
  );

-- RLS for audit logs (read-only for most users)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view organization audit logs" ON audit_logs
  FOR SELECT USING (
    organization_id = current_user_organization() AND
    current_user_has_permission('system.audit')
  );

CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (current_user_has_role('admin'));

-- Add comments
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all data changes';
COMMENT ON TABLE audit_log_retention IS 'Retention policies for audit log cleanup';
COMMENT ON VIEW audit_summary IS 'Daily summary of audit activities';
COMMENT ON VIEW user_activity_summary IS 'User activity metrics for last 7 days';
COMMENT ON VIEW security_events IS 'Recent security-relevant events';
