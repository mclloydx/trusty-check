-- Create or update the profiles table to include additional user information
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON profiles
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create indexes for profiles
CREATE INDEX idx_profiles_user_id ON profiles(id);
CREATE INDEX idx_profiles_full_name ON profiles(full_name);

-- Create function to get users by role
CREATE OR REPLACE FUNCTION get_users_by_role(role_param user_role)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    role user_role,
    is_active BOOLEAN,
    email_verified BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        p.full_name,
        p.phone,
        ur.role,
        p.is_active,
        u.email_confirmed_at IS NOT NULL AS email_verified,
        u.created_at,
        p.updated_at,
        u.last_sign_in_at AS last_login
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role = role_param
    ORDER BY u.created_at DESC;
END;
$$;

-- Create function to count users by role
CREATE OR REPLACE FUNCTION count_users_by_role()
RETURNS TABLE (
    role user_role,
    count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.role,
        COUNT(*) AS count
    FROM user_roles ur
    GROUP BY ur.role
    ORDER BY ur.role;
END;
$$;

-- Create function to update user role (admin only)
CREATE OR REPLACE FUNCTION update_user_role(
    admin_user_id UUID,
    target_user_id UUID,
    new_role user_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_exists BOOLEAN;
    result BOOLEAN;
BEGIN
    -- Check if the admin user has admin role
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = admin_user_id AND role = 'admin'
    ) INTO admin_exists;
    
    IF NOT admin_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Update or insert the user role
    INSERT INTO user_roles (user_id, role, assigned_by)
    VALUES (target_user_id, new_role, admin_user_id)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        role = new_role,
        assigned_at = NOW(),
        assigned_by = admin_user_id;
    
    RETURN TRUE;
END;
$$;

-- Create function to create a user with a specific role (for admin use)
CREATE OR REPLACE FUNCTION create_user_with_role(
    email_param TEXT,
    password_param TEXT,
    full_name_param TEXT,
    phone_param TEXT,
    role_param user_role DEFAULT 'user'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_user_id UUID;
    auth_user_id UUID;
BEGIN
    -- Create the auth user
    auth_user_id := auth.uid();
    
    -- This function is typically called from the frontend using Supabase Auth
    -- For this implementation, we'll assume the user is already created
    -- and focus on assigning the role
    
    -- Insert profile information
    INSERT INTO profiles (id, full_name, phone, updated_at)
    VALUES (auth_user_id, full_name_param, phone_param, NOW())
    ON CONFLICT (id) 
    DO UPDATE SET 
        full_name = full_name_param,
        phone = phone_param,
        updated_at = NOW();
    
    -- Insert or update user role
    INSERT INTO user_roles (user_id, role)
    VALUES (auth_user_id, role_param)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        role = role_param,
        assigned_at = NOW();
    
    RETURN auth_user_id;
END;
$$;

-- Create a function to check if a user can manage a specific request
CREATE OR REPLACE FUNCTION can_manage_request(
    user_id_param UUID,
    request_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role_value user_role;
    request_user_id UUID;
    result BOOLEAN;
BEGIN
    -- Get user role
    SELECT get_user_role(user_id_param) INTO user_role_value;
    
    -- Get the user ID associated with the request
    SELECT user_id INTO request_user_id 
    FROM inspection_requests 
    WHERE id = request_id_param;
    
    -- Admins can manage all requests
    IF user_role_value = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Users can manage their own requests
    IF user_id_param = request_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Agents can manage assigned requests
    IF user_role_value = 'agent' THEN
        -- Check if the agent is assigned to this request
        SELECT EXISTS (
            SELECT 1 FROM inspection_requests 
            WHERE id = request_id_param AND assigned_agent_id = user_id_param
        ) INTO result;
        RETURN COALESCE(result, FALSE);
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Create a function to check if a user can view a specific request
CREATE OR REPLACE FUNCTION can_view_request(
    user_id_param UUID,
    request_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role_value user_role;
    request_user_id UUID;
    result BOOLEAN;
BEGIN
    -- Get user role
    SELECT get_user_role(user_id_param) INTO user_role_value;
    
    -- Get the user ID associated with the request
    SELECT user_id INTO request_user_id 
    FROM inspection_requests 
    WHERE id = request_id_param;
    
    -- Admins can view all requests
    IF user_role_value = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Users can view their own requests
    IF user_id_param = request_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Agents can view assigned requests
    IF user_role_value = 'agent' THEN
        -- Check if the agent is assigned to this request
        SELECT EXISTS (
            SELECT 1 FROM inspection_requests 
            WHERE id = request_id_param AND assigned_agent_id = user_id_param
        ) INTO result;
        RETURN COALESCE(result, FALSE);
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_users_by_role(user_role) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION count_users_by_role() TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION update_user_role(UUID, UUID, user_role) TO service_role;
GRANT EXECUTE ON FUNCTION create_user_with_role(TEXT, TEXT, TEXT, TEXT, user_role) TO service_role;
GRANT EXECUTE ON FUNCTION can_manage_request(UUID, UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION can_view_request(UUID, UUID) TO service_role, authenticated;

-- Create updated trigger function to also create a profile
CREATE OR REPLACE FUNCTION create_user_profile_and_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert a default profile for the new user
    INSERT INTO profiles (id, full_name, is_active)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', TRUE);
    
    -- Insert default user role
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- Update the trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_and_role();