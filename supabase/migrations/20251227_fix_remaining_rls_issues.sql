-- Fix Remaining RLS Performance Issues
-- Addresses remaining auth_rls_initplan warnings

-- Drop and recreate policies with proper SELECT wrapping for ALL auth calls

-- Profiles table
DROP POLICY IF EXISTS "Profiles optimized access" ON profiles;
DROP POLICY IF EXISTS "Profiles service role access" ON profiles;

CREATE POLICY "Profiles optimized access" ON profiles
    FOR ALL TO authenticated
    USING (
        (SELECT auth.uid() = id) OR
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = (SELECT auth.uid()) 
            AND user_roles.role = 'admin'
        ))
    )
    WITH CHECK (
        (SELECT auth.uid() = id) OR
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = (SELECT auth.uid()) 
            AND user_roles.role = 'admin'
        ))
    );

CREATE POLICY "Profiles service role access" ON profiles
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Inspection requests table
DROP POLICY IF EXISTS "Inspection requests optimized access" ON inspection_requests;
DROP POLICY IF EXISTS "Inspection requests optimized insert" ON inspection_requests;
DROP POLICY IF EXISTS "Inspection requests optimized update" ON inspection_requests;
DROP POLICY IF EXISTS "Inspection requests service role access" ON inspection_requests;

CREATE POLICY "Inspection requests optimized access" ON inspection_requests
    FOR SELECT TO authenticated
    USING (
        (SELECT auth.uid() = user_id) OR
        (SELECT auth.uid() = assigned_agent_id) OR
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = (SELECT auth.uid()) 
            AND user_roles.role = 'admin'
        )) OR
        (tracking_id IS NOT NULL) -- Allow public access by tracking ID
    );

CREATE POLICY "Inspection requests optimized insert" ON inspection_requests
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Inspection requests optimized update" ON inspection_requests
    FOR UPDATE TO authenticated
    USING (
        (SELECT auth.uid() = user_id) OR
        (SELECT auth.uid() = assigned_agent_id) OR
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = (SELECT auth.uid()) 
            AND user_roles.role = 'admin'
        ))
    )
    WITH CHECK (
        (SELECT auth.uid() = user_id) OR
        (SELECT auth.uid() = assigned_agent_id) OR
        (SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = (SELECT auth.uid()) 
            AND user_roles.role = 'admin'
        ))
    );

CREATE POLICY "Inspection requests service role access" ON inspection_requests
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- User roles table
DROP POLICY IF EXISTS "User roles optimized access" ON user_roles;
DROP POLICY IF EXISTS "User roles service role access" ON user_roles;

CREATE POLICY "User roles optimized access" ON user_roles
    FOR ALL TO authenticated
    USING (
        (SELECT EXISTS (
            SELECT 1 FROM user_roles ur_inner
            WHERE ur_inner.user_id = (SELECT auth.uid()) 
            AND ur_inner.role = 'admin'
        ))
    )
    WITH CHECK (
        (SELECT EXISTS (
            SELECT 1 FROM user_roles ur_inner
            WHERE ur_inner.user_id = (SELECT auth.uid()) 
            AND ur_inner.role = 'admin'
        ))
    );

CREATE POLICY "User roles service role access" ON user_roles
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Tracking events table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_events' AND table_schema = 'public') THEN
        -- Drop existing tracking_events policies
        DROP POLICY IF EXISTS "Tracking events optimized access" ON tracking_events;
        DROP POLICY IF EXISTS "Tracking events service role access" ON tracking_events;
        
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

-- Add missing index for foreign key
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles(assigned_by);

-- Update comments
COMMENT ON POLICY "Profiles optimized access" ON profiles IS 'Optimized policy with all auth functions properly wrapped in SELECT';
COMMENT ON POLICY "Inspection requests optimized access" ON inspection_requests IS 'Optimized policy with all auth functions properly wrapped in SELECT';
COMMENT ON POLICY "User roles optimized access" ON user_roles IS 'Optimized policy with all auth functions properly wrapped in SELECT';
