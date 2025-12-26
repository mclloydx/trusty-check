-- Performance Optimization Indexes
-- This migration adds comprehensive indexes for better query performance

-- Primary key and foreign key indexes (if not already present)
CREATE INDEX IF NOT EXISTS idx_profiles_pkey ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_pkey ON inspection_requests(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_pkey ON user_profiles(user_id);

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Inspection request indexes
CREATE INDEX IF NOT EXISTS idx_inspection_requests_user_id ON inspection_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_status ON inspection_requests(status);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_created_at ON inspection_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_updated_at ON inspection_requests(updated_at);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_priority ON inspection_requests(priority);

-- GIN index for array columns (assigned_agents)
CREATE INDEX IF NOT EXISTS idx_inspection_requests_assigned_agents ON inspection_requests USING GIN(assigned_agents);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_inspection_requests_user_status ON inspection_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_status_created ON inspection_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_priority_status ON inspection_requests(priority, status);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_fts ON profiles USING GIN(to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_inspection_requests_notes_fts ON inspection_requests USING GIN(to_tsvector('english', notes));

-- Receipt-related indexes (if receipt fields exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspection_requests' AND column_name = 'receipt_url') THEN
        CREATE INDEX IF NOT EXISTS idx_inspection_requests_receipt_url ON inspection_requests(receipt_url);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspection_requests' AND column_name = 'receipt_uploaded_at') THEN
        CREATE INDEX IF NOT EXISTS idx_inspection_requests_receipt_uploaded_at ON inspection_requests(receipt_uploaded_at);
    END IF;
END $$;

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_inspection_requests_active ON inspection_requests(created_at) WHERE status NOT IN ('completed', 'cancelled');
CREATE INDEX IF NOT EXISTS idx_inspection_requests_high_priority ON inspection_requests(created_at) WHERE priority = 'high';

-- Statistics and monitoring indexes
CREATE INDEX IF NOT EXISTS idx_inspection_requests_monthly_stats ON inspection_requests(created_at, status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_by_role_created ON user_profiles(role, created_at);

-- Function to analyze table statistics (run periodically)
CREATE OR REPLACE FUNCTION analyze_table_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    ANALYZE profiles;
    ANALYZE inspection_requests;
    ANALYZE user_profiles;
END;
$$;

-- Create a view for common dashboard queries
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_requests,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests,
    COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_requests,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as requests_last_30_days
FROM inspection_requests;

-- Grant permissions on the view
GRANT SELECT ON dashboard_summary TO authenticated;
GRANT SELECT ON dashboard_summary TO anon;

-- Create materialized view for performance (needs manual refresh)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_request_stats AS
SELECT 
    u.id as user_id,
    u.email,
    p.full_name,
    COUNT(ir.id) as total_requests,
    COUNT(CASE WHEN ir.status = 'completed' THEN 1 END) as completed_requests,
    MAX(ir.created_at) as last_request_date,
    AVG(CASE WHEN ir.status = 'completed' THEN 
        EXTRACT(EPOCH FROM (ir.updated_at - ir.created_at))/3600 
    END) as avg_completion_hours
FROM profiles u
LEFT JOIN inspection_requests ir ON u.id = ir.user_id
LEFT JOIN user_profiles up ON u.id = up.user_id
GROUP BY u.id, u.email, p.full_name;

-- Index for materialized view
CREATE INDEX IF NOT EXISTS idx_user_request_stats_user_id ON user_request_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_request_stats_total_requests ON user_request_stats(total_requests);

-- Grant permissions on materialized view
GRANT SELECT ON user_request_stats TO authenticated;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_request_stats;
END;
$$;

-- Add comment documentation
COMMENT ON TABLE dashboard_summary IS 'Summary view for dashboard metrics - auto-updated';
COMMENT ON TABLE user_request_stats IS 'Materialized view for user request statistics - manual refresh required';
COMMENT ON FUNCTION analyze_table_statistics() IS 'Function to analyze table statistics for query optimizer';
COMMENT ON FUNCTION refresh_user_stats() IS 'Function to refresh user request statistics materialized view';
