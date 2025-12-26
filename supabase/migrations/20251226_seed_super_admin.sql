-- Seed a system administrator user
-- This script creates a system administrator with system_admin role and all necessary permissions

-- Variables for the system admin user (you can modify these)
\set admin_email admin@trustycheck.com
\set admin_password ChangeThisPassword123!
\set admin_name 'System Administrator'

-- Create the admin user using Supabase auth
-- Note: This needs to be run with service role privileges
DO $$
DECLARE
    admin_id UUID;
    admin_role_id UUID;
    profile_id UUID;
BEGIN
    -- First, create the auth user using the built-in function
    -- This will automatically trigger the create_user_profile_and_role function
    -- which creates a profile and assigns a default 'user' role
    
    -- Check if user already exists in auth.users
    SELECT id INTO admin_id 
    FROM auth.users 
    WHERE email = :'admin_email';
    
    IF admin_id IS NULL THEN
        -- Create the auth user
        -- Note: In a real deployment, you would use the Supabase client to create users
        -- For now, we'll create a placeholder and expect the user to be created via signup
        RAISE NOTICE 'User % does not exist. Please create the user first via the application signup or Supabase dashboard.', :'admin_email';
        RAISE NOTICE 'After creating the user, run this script again to assign admin role.';
        RETURN;
    END IF;
    
    -- Get the system_admin role ID
    SELECT id INTO admin_role_id 
    FROM roles 
    WHERE name = 'system_admin';
    
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'System admin role not found in roles table';
    END IF;
    
    -- Check if user already has system_admin role
    IF EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = admin_id 
        AND ur.role_id = admin_role_id 
        AND ur.is_active = true
    ) THEN
        RAISE NOTICE 'User % already has system_admin role', :'admin_email';
    ELSE
        -- Assign system_admin role to the user
        INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
        VALUES (admin_id, admin_role_id, admin_id, NOW(), true)
        ON CONFLICT (user_id, role_id) 
        DO UPDATE SET 
            assigned_by = admin_id,
            assigned_at = NOW(),
            is_active = true;
            
        RAISE NOTICE 'Assigned system_admin role to user %', :'admin_email';
    END IF;
    
    -- Update the profile with admin information
    UPDATE profiles 
    SET 
        full_name = :'admin_name',
        is_active = true,
        updated_at = NOW()
    WHERE id = admin_id;
    
    RAISE NOTICE 'Updated profile for admin user';
    
    -- Verify the setup
    IF EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = admin_id 
        AND r.name = 'admin' 
        AND ur.is_active = true
    ) THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ Super admin setup completed successfully!';
        RAISE NOTICE '📧 Email: %', :'admin_email';
        RAISE NOTICE '🔑 Password: % (Change this after first login!)', :'admin_password';
        RAISE NOTICE '';
        RAISE NOTICE 'The user now has full admin privileges including:';
        RAISE NOTICE '- User management (create, read, update, delete users)';
        RAISE NOTICE '- Role assignment and management');
        RAISE NOTICE '- System monitoring and administration');
        RAISE NOTICE '- Full access to all inspection requests');
        RAISE NOTICE '';
    ELSE
        RAISE EXCEPTION '❌ Failed to assign admin role';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Error creating super admin: %', SQLERRM;
END;
$$;
