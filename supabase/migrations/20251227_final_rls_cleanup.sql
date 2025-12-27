-- Final RLS Performance Cleanup
-- Fix remaining auth_rls_initplan and duplicate index issues

-- Fix 1: Drop and recreate tracking_events policy with proper SELECT wrapping
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_events' AND table_schema = 'public') THEN
        -- Drop existing tracking_events policies
        DROP POLICY IF EXISTS "Tracking events optimized access" ON tracking_events;
        DROP POLICY IF EXISTS "Tracking events service role access" ON tracking_events;
        
        -- Create properly optimized tracking_events policy
        CREATE POLICY "Tracking events optimized access" ON tracking_events
            FOR SELECT TO authenticated
            USING (
                (SELECT (SELECT auth.uid()) = user_id) OR
                (tracking_id IS NOT NULL) -- Allow public access by tracking ID
            );
            
        CREATE POLICY "Tracking events service role access" ON tracking_events
            FOR ALL TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Fix 2: Remove duplicate index on profiles table
DROP INDEX IF EXISTS idx_profiles_user_id;

-- Add comment for documentation
COMMENT ON POLICY "Tracking events optimized access" ON tracking_events IS 'Optimized policy with all auth functions properly wrapped in SELECT';
