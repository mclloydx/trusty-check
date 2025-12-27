-- RLS Performance Optimization Migration
-- Fixes auth_rls_initplan and multiple_permissive_policies warnings

-- Drop all existing policies that need optimization
DROP POLICY IF EXISTS "Users can view own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can create requests" ON inspection_requests;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own inspection requests" ON inspection_requests;
DROP POLICY IF EXISTS "Users can update own inspection requests" ON inspection_requests;

-- Drop any remaining problematic policies from earlier migrations
DROP POLICY IF EXISTS "Anyone can create requests" ON inspection_requests;
DROP POLICY IF EXISTS "Agents can view assigned requests" ON inspection_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON inspection_requests;
DROP POLICY IF EXISTS "Agents can update assigned requests" ON inspection_requests;
DROP POLICY IF EXISTS "Anyone can view requests by tracking ID" ON inspection_requests;
DROP POLICY IF EXISTS "Allow authenticated users to manage profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read all user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow service role to manage all user_roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can view tracking events by tracking ID" ON tracking_events;
DROP POLICY IF EXISTS "Users can view own tracking events" ON tracking_events;

-- Create optimized policies for profiles table
CREATE POLICY "Profiles optimized access" ON profiles
    FOR ALL TO authenticated
    USING (
        (SELECT auth.uid() = id) OR
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        ))
    )
    WITH CHECK (
        (SELECT auth.uid() = id) OR
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        ))
    );

CREATE POLICY "Profiles service role access" ON profiles
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Create optimized policies for inspection_requests table
CREATE POLICY "Inspection requests optimized access" ON inspection_requests
    FOR SELECT TO authenticated
    USING (
        (SELECT auth.uid() = user_id) OR
        (SELECT auth.uid() = assigned_agent_id) OR
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )) OR
        (tracking_id IS NOT NULL) -- Allow public access by tracking ID
    );

CREATE POLICY "Inspection requests optimized insert" ON inspection_requests
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Inspection requests optimized update" ON inspection_requests
    FOR UPDATE TO authenticated
    USING (
        (SELECT auth.uid() = user_id) OR
        (SELECT auth.uid() = assigned_agent_id) OR
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        ))
    )
    WITH CHECK (
        (SELECT auth.uid() = user_id) OR
        (SELECT auth.uid() = assigned_agent_id) OR
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        ))
    );

CREATE POLICY "Inspection requests service role access" ON inspection_requests
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Create optimized policies for user_roles table
CREATE POLICY "User roles optimized access" ON user_roles
    FOR ALL TO authenticated
    USING (
        (SELECT EXISTS (
            SELECT 1 FROM user_roles ur_inner
            WHERE ur_inner.user_id = auth.uid() 
            AND ur_inner.role = 'admin'
        ))
    )
    WITH CHECK (
        (SELECT EXISTS (
            SELECT 1 FROM user_roles ur_inner
            WHERE ur_inner.user_id = auth.uid() 
            AND ur_inner.role = 'admin'
        ))
    );

CREATE POLICY "User roles service role access" ON user_roles
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Create optimized policies for tracking_events table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_events' AND table_schema = 'public') THEN
        -- Drop existing tracking_events policies
        DROP POLICY IF EXISTS "Users can view own tracking events" ON tracking_events;
        DROP POLICY IF EXISTS "Anyone can view tracking events by tracking ID" ON tracking_events;
        
        -- Create optimized tracking_events policy
        CREATE POLICY "Tracking events optimized access" ON tracking_events
            FOR SELECT TO authenticated
            USING (
                (SELECT auth.uid() = user_id) OR
                (tracking_id IS NOT NULL) -- Allow public access by tracking ID
            );
            
        CREATE POLICY "Tracking events service role access" ON tracking_events
            FOR ALL TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Create optimized helper functions with SELECT wrapper
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

-- Add performance indexes for RLS optimization
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_user_id ON inspection_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_assigned_agent_id ON inspection_requests(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_tracking_id ON inspection_requests(tracking_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON user_roles(user_id, role);

-- Add comments for documentation
COMMENT ON POLICY "Profiles optimized access" ON profiles IS 'Optimized policy that consolidates user profile access with SELECT-wrapped auth functions';
COMMENT ON POLICY "Inspection requests optimized access" ON inspection_requests IS 'Optimized policy that consolidates inspection request access with SELECT-wrapped auth functions';
COMMENT ON POLICY "User roles optimized access" ON user_roles IS 'Optimized policy for admin-only user role management with SELECT-wrapped auth functions';
COMMENT ON FUNCTION current_user_id() IS 'Optimized function to get current user ID with SELECT wrapper for RLS performance';
COMMENT ON FUNCTION is_current_user_admin() IS 'Optimized function to check if current user is admin with SELECT wrapper for RLS performance';
