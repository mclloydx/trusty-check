-- Enhanced RBAC System with Granular Permissions
-- This migration creates a comprehensive permission-based access control system

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  resource text NOT NULL, -- e.g., 'inspection_requests', 'profiles', 'users'
  action text NOT NULL, -- e.g., 'create', 'read', 'update', 'delete', 'assign'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create roles table (enhanced version)
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system_role boolean DEFAULT false, -- For built-in roles like admin, agent, user
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- Create user_roles table to replace user_profiles role field
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES profiles(id), -- Who assigned this role
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- For temporary role assignments
  is_active boolean DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  -- Profile permissions
  ('profile.read.own', 'Read own profile', 'profiles', 'read'),
  ('profile.update.own', 'Update own profile', 'profiles', 'update'),
  ('profile.read.all', 'Read all profiles', 'profiles', 'read'),
  ('profile.update.all', 'Update all profiles', 'profiles', 'update'),
  ('profile.create', 'Create profiles', 'profiles', 'create'),
  ('profile.delete', 'Delete profiles', 'profiles', 'delete'),
  
  -- Inspection request permissions
  ('inspection_request.read.own', 'Read own inspection requests', 'inspection_requests', 'read'),
  ('inspection_request.create.own', 'Create own inspection requests', 'inspection_requests', 'create'),
  ('inspection_request.update.own', 'Update own inspection requests', 'inspection_requests', 'update'),
  ('inspection_request.read.all', 'Read all inspection requests', 'inspection_requests', 'read'),
  ('inspection_request.update.all', 'Update all inspection requests', 'inspection_requests', 'update'),
  ('inspection_request.delete', 'Delete inspection requests', 'inspection_requests', 'delete'),
  ('inspection_request.assign', 'Assign inspection requests to agents', 'inspection_requests', 'assign'),
  ('inspection_request.reassign', 'Reassign inspection requests', 'inspection_requests', 'reassign'),
  
  -- User management permissions
  ('user.read.all', 'Read all users', 'users', 'read'),
  ('user.update.all', 'Update all users', 'users', 'update'),
  ('user.delete', 'Delete users', 'users', 'delete'),
  ('user.assign_role', 'Assign roles to users', 'users', 'assign_role'),
  
  -- System permissions
  ('system.monitor', 'Access system monitoring', 'system', 'monitor'),
  ('system.audit', 'Access audit logs', 'system', 'audit'),
  ('system.admin', 'Full system administration', 'system', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description, is_system_role) VALUES
  ('admin', 'System administrator with full access', true),
  ('agent', 'Inspection agent with limited access', true),
  ('user', 'Regular user with basic access', true),
  ('manager', 'Manager with team oversight', false),
  ('auditor', 'Auditor with read-only access', false)
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Agent permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'agent' AND p.name IN (
  'profile.read.own', 'profile.update.own',
  'inspection_request.read.all', 'inspection_request.update.all',
  'inspection_request.assign'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- User permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'user' AND p.name IN (
  'profile.read.own', 'profile.update.own',
  'inspection_request.read.own', 'inspection_request.create.own', 'inspection_request.update.own'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager permissions (agent + oversight)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager' AND p.name IN (
  'profile.read.own', 'profile.update.own',
  'inspection_request.read.all', 'inspection_request.update.all',
  'inspection_request.assign', 'inspection_request.reassign',
  'user.read.all'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Auditor permissions (read-only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'auditor' AND p.name IN (
  'profile.read.all', 'inspection_request.read.all', 'system.audit'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create helper functions for permission checking
CREATE OR REPLACE FUNCTION user_has_permission(user_id_param uuid, permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_perm boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_id_param
    AND p.name = permission_name
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$;

CREATE OR REPLACE FUNCTION current_user_has_permission(permission_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT user_has_permission(auth.uid(), permission_name);
$$;

CREATE OR REPLACE FUNCTION user_has_role(user_id_param uuid, role_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_role boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id_param
    AND r.name = role_name
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ) INTO has_role;
  
  RETURN has_role;
END;
$$;

CREATE OR REPLACE FUNCTION current_user_has_role(role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT user_has_role(auth.uid(), role_name);
$$;

-- Function to get all user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_id_param uuid)
RETURNS TABLE(permission_name text, resource text, action text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT
    p.name,
    p.resource,
    p.action
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = user_id_param
  AND ur.is_active = true
  AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ORDER BY p.resource, p.action;
$$;

-- Function to assign role to user
CREATE OR REPLACE FUNCTION assign_user_role(
  target_user_id uuid,
  role_name text,
  assigned_by_user_id uuid DEFAULT auth.uid(),
  expires_at timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_id uuid;
BEGIN
  -- Check if assigner has permission to assign roles
  IF NOT current_user_has_permission('user.assign_role') AND NOT current_user_has_role('admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to assign roles';
  END IF;
  
  -- Get role ID
  SELECT id INTO role_id FROM roles WHERE name = role_name;
  
  IF role_id IS NULL THEN
    RAISE EXCEPTION 'Role % does not exist', role_name;
  END IF;
  
  -- Insert or update user role
  INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at)
  VALUES (target_user_id, role_id, assigned_by_user_id, expires_at)
  ON CONFLICT (user_id, role_id) 
  DO UPDATE SET 
    assigned_by = assigned_by_user_id,
    assigned_at = now(),
    expires_at = EXCLUDED.expires_at,
    is_active = true;
  
  RETURN true;
END;
$$;

-- Function to remove user role
CREATE OR REPLACE FUNCTION remove_user_role(target_user_id uuid, role_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_id uuid;
BEGIN
  -- Check if remover has permission to assign roles
  IF NOT current_user_has_permission('user.assign_role') AND NOT current_user_has_role('admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to remove roles';
  END IF;
  
  -- Get role ID
  SELECT id INTO role_id FROM roles WHERE name = role_name;
  
  IF role_id IS NULL THEN
    RAISE EXCEPTION 'Role % does not exist', role_name;
  END IF;
  
  -- Deactivate user role
  UPDATE user_roles 
  SET is_active = false 
  WHERE user_id = target_user_id AND role_id = role_id;
  
  RETURN true;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(user_id) WHERE is_active = true;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON permissions TO authenticated;
GRANT SELECT ON roles TO authenticated;
GRANT SELECT ON role_permissions TO authenticated;
GRANT SELECT ON user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION assign_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION remove_user_role TO authenticated;

-- Migrate existing user_profiles to new system
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT up.user_id, r.id, up.user_id
FROM user_profiles up
JOIN roles r ON r.name = up.role
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = up.user_id AND ur.is_active = true
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Add comments
COMMENT ON TABLE permissions IS 'Granular permissions for RBAC system';
COMMENT ON TABLE roles IS 'Roles with associated permissions';
COMMENT ON TABLE role_permissions IS 'Junction table linking roles to permissions';
COMMENT ON TABLE user_roles IS 'User role assignments with expiration support';
