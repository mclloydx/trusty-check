-- Multi-Tenancy Support
-- This migration adds organization-based multi-tenancy

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE, -- URL-friendly identifier
  domain text UNIQUE, -- Custom domain for enterprise clients
  logo_url text,
  settings jsonb DEFAULT '{}', -- Organization-specific settings
  subscription_plan text DEFAULT 'basic', -- basic, pro, enterprise
  max_users integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add organization_id to existing tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE inspection_requests ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- Create organization_members table for explicit membership
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member', -- owner, admin, member, viewer
  invited_by uuid REFERENCES profiles(id),
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(organization_id, user_id)
);

-- Create organization_settings table for per-org configuration
CREATE TABLE IF NOT EXISTS organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, key)
);

-- Function to get current user's organization
CREATE OR REPLACE FUNCTION current_user_organization()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT organization_id FROM profiles WHERE id = auth.uid()),
    (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = true LIMIT 1)
  );
$$;

-- Function to check if user belongs to organization
CREATE OR REPLACE FUNCTION user_belongs_to_organization(user_id_param uuid, org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = user_id_param 
    AND organization_id = org_id 
    AND is_active = true
  ) OR (
    SELECT organization_id FROM profiles 
    WHERE id = user_id_param AND organization_id = org_id
  ) IS NOT NULL;
$$;

-- Function to create organization
CREATE OR REPLACE FUNCTION create_organization(
  org_name text,
  org_slug text,
  creator_user_id uuid DEFAULT auth.uid(),
  org_domain text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Create organization
  INSERT INTO organizations (name, slug, domain)
  VALUES (org_name, org_slug, org_domain)
  RETURNING id INTO org_id;
  
  -- Add creator as organization owner
  INSERT INTO organization_members (organization_id, user_id, role, invited_by)
  VALUES (org_id, creator_user_id, 'owner', creator_user_id);
  
  -- Update creator's profile
  UPDATE profiles 
  SET organization_id = org_id 
  WHERE id = creator_user_id;
  
  RETURN org_id;
END;
$$;

-- Function to add user to organization
CREATE OR REPLACE FUNCTION add_user_to_organization(
  target_user_id uuid,
  org_id uuid,
  member_role text DEFAULT 'member',
  invited_by_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if inviter has permission (org admin or owner)
  IF NOT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = invited_by_user_id 
    AND organization_id = org_id 
    AND is_active = true
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to add users to organization';
  END IF;
  
  -- Add user to organization
  INSERT INTO organization_members (organization_id, user_id, role, invited_by)
  VALUES (org_id, target_user_id, member_role, invited_by_user_id)
  ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    is_active = true,
    invited_by = EXCLUDED.invited_by;
  
  -- Update user's profile if not already set
  UPDATE profiles 
  SET organization_id = org_id 
  WHERE id = target_user_id AND organization_id IS NULL;
  
  RETURN true;
END;
$$;

-- Update RLS policies to include organization filtering
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Enhanced RLS policies with organization isolation
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    (organization_id = current_user_organization() AND 
     current_user_has_permission('profile.read.all'))
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    (organization_id = current_user_organization() AND 
     current_user_has_permission('profile.update.all'))
  );

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    (organization_id = current_user_organization() AND 
     current_user_has_permission('profile.create'))
  );

-- Update inspection requests policies
DROP POLICY IF EXISTS "Users can view own inspection requests" ON inspection_requests;
DROP POLICY IF EXISTS "Users can create inspection requests" ON inspection_requests;
DROP POLICY IF EXISTS "Users can update own inspection requests" ON inspection_requests;
DROP POLICY IF EXISTS "Agents can view assigned inspection requests" ON inspection_requests;
DROP POLICY IF EXISTS "Agents can update assigned inspection requests" ON inspection_requests;
DROP POLICY IF EXISTS "Admins can view all inspection requests" ON inspection_requests;
DROP POLICY IF EXISTS "Admins can manage all inspection requests" ON inspection_requests;

CREATE POLICY "Users can view own inspection requests" ON inspection_requests
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (organization_id = current_user_organization() AND 
     current_user_has_permission('inspection_request.read.all'))
  );

CREATE POLICY "Users can create inspection requests" ON inspection_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (organization_id = current_user_organization() AND 
     current_user_has_permission('inspection_request.create.own'))
  );

CREATE POLICY "Users can update own inspection requests" ON inspection_requests
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (organization_id = current_user_organization() AND 
     current_user_has_permission('inspection_request.update.all'))
  );

CREATE POLICY "Agents can view assigned inspection requests" ON inspection_requests
  FOR SELECT USING (
    (auth.uid() = ANY(assigned_agents) AND organization_id = current_user_organization()) OR
    (organization_id = current_user_organization() AND 
     current_user_has_permission('inspection_request.read.all'))
  );

CREATE POLICY "Agents can update assigned inspection requests" ON inspection_requests
  FOR UPDATE USING (
    (auth.uid() = ANY(assigned_agents) AND organization_id = current_user_organization()) OR
    (organization_id = current_user_organization() AND 
     current_user_has_permission('inspection_request.update.all'))
  );

-- Organization-specific indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_organization_id ON inspection_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON user_roles(organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_org_user ON organization_members(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_active ON organization_members(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON organization_members(organization_id, role);

CREATE INDEX IF NOT EXISTS idx_organization_settings_org_key ON organization_settings(organization_id, key);

-- Views for organization management
CREATE OR REPLACE VIEW organization_summary AS
SELECT 
  o.id,
  o.name,
  o.slug,
  o.subscription_plan,
  o.max_users,
  o.created_at,
  COUNT(DISTINCT om.user_id) as current_user_count,
  COUNT(DISTINCT ir.id) as total_inspection_requests,
  COUNT(DISTINCT CASE WHEN ir.status = 'pending' THEN ir.id END) as pending_requests
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.organization_id AND om.is_active = true
LEFT JOIN inspection_requests ir ON o.id = ir.organization_id
WHERE o.is_active = true
GROUP BY o.id, o.name, o.slug, o.subscription_plan, o.max_users, o.created_at;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON organization_members TO authenticated;
GRANT ALL ON organization_settings TO authenticated;
GRANT SELECT ON organization_summary TO authenticated;

GRANT EXECUTE ON FUNCTION current_user_organization TO authenticated;
GRANT EXECUTE ON FUNCTION user_belongs_to_organization TO authenticated;
GRANT EXECUTE ON FUNCTION create_organization TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_to_organization TO authenticated;

-- Create default organization for existing users
INSERT INTO organizations (name, slug, subscription_plan, max_users)
SELECT 
  'Default Organization',
  'default-' || SUBSTRING(md5(id::text), 1, 8),
  'basic',
  10
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM organizations o 
  JOIN organization_members om ON o.id = om.organization_id 
  WHERE om.user_id = p.id AND om.is_active = true
)
AND p.organization_id IS NULL
ON CONFLICT (slug) DO NOTHING;

-- Add existing users to default organizations
INSERT INTO organization_members (organization_id, user_id, role, invited_by)
SELECT 
  o.id,
  p.id,
  'owner',
  p.id
FROM profiles p
JOIN organizations o ON o.slug = 'default-' || SUBSTRING(md5(p.id::text), 1, 8)
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members om 
  WHERE om.user_id = p.id AND om.is_active = true
)
AND p.organization_id IS NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Update profiles with organization_id
UPDATE profiles 
SET organization_id = o.id
FROM organizations o
WHERE o.slug = 'default-' || SUBSTRING(md5(profiles.id::text), 1, 8)
AND profiles.organization_id IS NULL;

-- Add comments
COMMENT ON TABLE organizations IS 'Multi-tenant organizations';
COMMENT ON TABLE organization_members IS 'Organization membership with roles';
COMMENT ON TABLE organization_settings IS 'Per-organization configuration settings';
COMMENT ON VIEW organization_summary IS 'Summary statistics for organizations';
