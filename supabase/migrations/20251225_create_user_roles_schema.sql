-- Create user roles table
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'user');

-- Create the user roles table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, role)
);

-- Enable Row Level Security on the user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to view their own roles
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = assigned_by);

-- Create a policy to allow service_role to manage roles
CREATE POLICY "Service role can manage all roles" ON user_roles
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Create a function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id_param UUID)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role_value user_role;
BEGIN
    SELECT role INTO user_role_value
    FROM user_roles
    WHERE user_id = user_id_param
    ORDER BY assigned_at DESC
    LIMIT 1;
    
    IF user_role_value IS NULL THEN
        RETURN 'user'::user_role;
    END IF;
    
    RETURN user_role_value;
END;
$$;

-- Create functions for role checking
CREATE OR REPLACE FUNCTION is_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_id_param AND role = 'admin'
    ) INTO result;
    
    RETURN COALESCE(result, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION is_agent(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_id_param AND role = 'agent'
    ) INTO result;
    
    RETURN COALESCE(result, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION is_user(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_id_param AND role = 'user'
    ) INTO result;
    
    RETURN COALESCE(result, TRUE); -- Default to true since all users are users
END;
$$;

-- Create function to check permissions based on roles
CREATE OR REPLACE FUNCTION can_manage_users(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_id_param AND role = 'admin'
    ) INTO result;
    
    RETURN COALESCE(result, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION can_view_dashboard(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_id_param AND (role = 'admin' OR role = 'agent' OR role = 'user')
    ) INTO result;
    
    RETURN COALESCE(result, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION can_create_request(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_id_param AND (role = 'admin' OR role = 'agent' OR role = 'user')
    ) INTO result;
    
    RETURN COALESCE(result, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION can_view_all_requests(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_id_param AND (role = 'admin' OR role = 'agent')
    ) INTO result;
    
    RETURN COALESCE(result, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION can_manage_payments(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_id_param AND (role = 'admin')
    ) INTO result;
    
    RETURN COALESCE(result, FALSE);
END;
$$;

-- Create a trigger function to create a default user role when a new auth user is created
CREATE OR REPLACE FUNCTION create_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    RETURN NEW;
END;
$$;

-- Create a trigger to automatically assign user role when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_role();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON TABLE user_roles TO service_role;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION is_agent(UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION is_user(UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION can_manage_users(UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION can_view_dashboard(UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION can_create_request(UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION can_view_all_requests(UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION can_manage_payments(UUID) TO service_role, authenticated;