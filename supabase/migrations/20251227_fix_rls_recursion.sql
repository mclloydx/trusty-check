-- Fix RLS Infinite Recursion
-- The user_roles policy is causing infinite recursion by referencing itself

-- Drop the problematic user_roles policy
DROP POLICY IF EXISTS "User roles optimized access" ON user_roles;

-- Create a fixed policy that doesn't cause recursion
-- Use a simple approach: only service role can manage user_roles
CREATE POLICY "User roles service role only" ON user_roles
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For authenticated users, create a read-only policy that doesn't reference user_roles
CREATE POLICY "User roles read only" ON user_roles
    FOR SELECT TO authenticated
    USING (true); -- Allow all authenticated users to read user_roles

-- Update other policies to use a simpler admin check without recursion
-- Drop and recreate profiles policy
DROP POLICY IF EXISTS "Profiles optimized access" ON profiles;

CREATE POLICY "Profiles optimized access" ON profiles
    FOR ALL TO authenticated
    USING (
        (SELECT auth.uid() = id) OR
        -- Simple admin check without recursion
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = (SELECT auth.uid()) 
            AND role = 'admin'
            LIMIT 1
        ))
    )
    WITH CHECK (
        (SELECT auth.uid() = id) OR
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = (SELECT auth.uid()) 
            AND role = 'admin'
            LIMIT 1
        ))
    );

-- Drop and recreate inspection_requests policy
DROP POLICY IF EXISTS "Inspection requests optimized access" ON inspection_requests;
DROP POLICY IF EXISTS "Inspection requests optimized update" ON inspection_requests;

CREATE POLICY "Inspection requests optimized access" ON inspection_requests
    FOR SELECT TO authenticated
    USING (
        (SELECT auth.uid() = user_id) OR
        (SELECT auth.uid() = assigned_agent_id) OR
        -- Simple admin check without recursion
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = (SELECT auth.uid()) 
            AND role = 'admin'
            LIMIT 1
        )) OR
        (tracking_id IS NOT NULL)
    );

CREATE POLICY "Inspection requests optimized update" ON inspection_requests
    FOR UPDATE TO authenticated
    USING (
        (SELECT auth.uid() = user_id) OR
        (SELECT auth.uid() = assigned_agent_id) OR
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = (SELECT auth.uid()) 
            AND role = 'admin'
            LIMIT 1
        ))
    )
    WITH CHECK (
        (SELECT auth.uid() = user_id) OR
        (SELECT auth.uid() = assigned_agent_id) OR
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = (SELECT auth.uid()) 
            AND role = 'admin'
            LIMIT 1
        ))
    );

-- Add comments
COMMENT ON POLICY "User roles service role only" ON user_roles IS 'Service role only access to user_roles management';
COMMENT ON POLICY "User roles read only" ON user_roles IS 'Read-only access for all authenticated users';
