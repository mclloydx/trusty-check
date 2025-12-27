-- Cleanup Unused Indexes
-- Remove INFO-level unused index warnings
-- NOTE: Only removing indexes that are clearly redundant or not needed for RLS

-- Remove clearly redundant or unused indexes
DROP INDEX IF EXISTS idx_profiles_email_lookup;
DROP INDEX IF EXISTS idx_user_roles_active_admin;
DROP INDEX IF EXISTS idx_user_roles_active_agent;
DROP INDEX IF EXISTS idx_profiles_full_name;
DROP INDEX IF EXISTS idx_user_roles_assigned_by;
DROP INDEX IF EXISTS idx_inspection_requests_status;
DROP INDEX IF EXISTS idx_tracking_events_tracking_id;
DROP INDEX IF EXISTS idx_tracking_events_event_type;
DROP INDEX IF EXISTS idx_tracking_events_created_at;
DROP INDEX IF EXISTS idx_tracking_events_user_id;

-- Keep these indexes as they may be needed for RLS or future queries:
-- - idx_profiles_id (needed for RLS on profiles.id)
-- - idx_user_roles_user_id_role (needed for RLS admin checks)
-- - idx_inspection_requests_assigned_agent_id (needed for RLS agent access)
-- - idx_inspection_requests_user_id (needed for RLS user access)
-- - idx_inspection_requests_tracking_id (needed for public tracking access)

-- Add comment explaining the cleanup
COMMENT ON SCHEMA public IS 'Unused indexes cleaned up on 2025-12-27. Kept indexes essential for RLS performance.';
