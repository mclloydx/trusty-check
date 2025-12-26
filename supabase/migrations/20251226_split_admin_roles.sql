-- Split Admin Roles: System Administrator vs Administrator
-- This migration separates system administration from normal operations

-- Add new permissions for system-specific vs operational tasks
INSERT INTO permissions (name, description, resource, action) VALUES
  -- System Administrator specific permissions
  ('system.security', 'Manage system security settings', 'system', 'security'),
  ('system.monitoring', 'Access system monitoring tools', 'system', 'monitoring'),
  ('system.backup', 'Manage system backups', 'system', 'backup'),
  ('system.config', 'Modify system configuration', 'system', 'config'),
  ('system.logs', 'Access system logs', 'system', 'logs'),
  
  -- Administrator permissions (normal operations)
  ('user.manage', 'Manage user accounts', 'users', 'manage'),
  ('role.assign', 'Assign non-system roles', 'roles', 'assign'),
  ('inspection.manage', 'Manage all inspection requests', 'inspection_requests', 'manage'),
  ('reports.generate', 'Generate operational reports', 'reports', 'generate'),
  ('audit.read', 'Read audit logs', 'audit', 'read')
ON CONFLICT (name) DO NOTHING;

-- Create new roles
INSERT INTO roles (name, description, is_system_role) VALUES
  ('system_admin', 'System administrator for security and monitoring', true),
  ('administrator', 'Administrator for normal operations', false)
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to system_admin role (system security + monitoring)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'system_admin' AND p.name IN (
  -- System permissions
  'system.admin', 'system.security', 'system.monitoring', 'system.backup', 
  'system.config', 'system.logs', 'system.audit',
  -- User management (for system security)
  'user.read.all', 'user.update.all', 'user.delete', 'user.assign_role',
  -- Full access to all resources for system security
  'profile.read.all', 'profile.update.all', 'profile.create', 'profile.delete',
  'inspection_request.read.all', 'inspection_request.update.all', 'inspection_request.delete',
  'inspection_request.assign', 'inspection_request.reassign'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to administrator role (normal operations)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'administrator' AND p.name IN (
  -- User management (but not system security)
  'user.read.all', 'user.update.all', 'user.manage', 'role.assign',
  -- Profile management
  'profile.read.all', 'profile.update.all', 'profile.create',
  -- Inspection management
  'inspection_request.read.all', 'inspection_request.update.all',
  'inspection_request.assign', 'inspection_request.reassign',
  'inspection_request.delete', 'inspection_request.manage',
  -- Reports and audit
  'reports.generate', 'audit.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Migrate existing admin users to system_admin role (for backward compatibility)
-- Existing admins keep highest privileges by default
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT ur.user_id, r.id, ur.user_id
FROM user_roles ur
JOIN roles r ON r.name = 'system_admin'
WHERE ur.role_id = (SELECT id FROM roles WHERE name = 'admin')
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur2 
  WHERE ur2.user_id = ur.user_id AND ur2.is_active = true
  AND ur2.role_id = r.id
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Update existing admin role to be less privileged (now just normal operations)
UPDATE role_permissions 
SET permission_id = (
  SELECT p.id FROM permissions p 
  WHERE p.name IN (
    'user.read.all', 'user.update.all', 'user.manage', 'role.assign',
    'profile.read.all', 'profile.update.all', 'profile.create',
    'inspection_request.read.all', 'inspection_request.update.all',
    'inspection_request.assign', 'inspection_request.reassign',
    'inspection_request.delete', 'inspection_request.manage',
    'reports.generate', 'audit.read'
  )
)
WHERE role_id = (SELECT id FROM roles WHERE name = 'admin')
AND permission_id IN (
  SELECT p.id FROM permissions p 
  WHERE p.name IN (
    'system.admin', 'system.security', 'system.monitoring', 'system.backup', 
    'system.config', 'system.logs', 'system.audit'
  )
);

-- Update admin role description
UPDATE roles 
SET description = 'Administrator for normal operations (can be reassigned)'
WHERE name = 'admin';

-- Add comments
COMMENT ON ROLE system_admin IS 'System administrator with security and monitoring privileges - not reassignable';
COMMENT ON ROLE administrator IS 'Administrator for normal operations - can be reassigned';
