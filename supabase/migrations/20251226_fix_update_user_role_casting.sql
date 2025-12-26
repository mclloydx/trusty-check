-- Fix the update_user_role function to properly handle role parameter casting
CREATE OR REPLACE FUNCTION update_user_role(
    admin_user_id UUID,
    target_user_id UUID,
    new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_exists BOOLEAN;
    result BOOLEAN;
    casted_role user_role;
BEGIN
    -- Cast the text role to the user_role enum
    casted_role := new_role::user_role;
    
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
    VALUES (target_user_id, casted_role, admin_user_id)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        role = casted_role,
        assigned_at = NOW(),
        assigned_by = admin_user_id;
    
    RETURN TRUE;
END;
$$;
