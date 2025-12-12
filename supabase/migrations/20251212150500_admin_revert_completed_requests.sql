-- Create a function that allows admins to revert completed requests
-- This provides a controlled way to handle exceptional cases

CREATE OR REPLACE FUNCTION public.revert_completed_request(request_id UUID, new_status TEXT, admin_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = admin_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can revert completed requests';
  END IF;

  -- Check if request is actually completed
  IF NOT EXISTS (
    SELECT 1 FROM inspection_requests 
    WHERE id = request_id AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Request is not in completed status';
  END IF;

  -- Validate new status
  IF new_status NOT IN ('pending', 'assigned', 'in_progress', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status. Must be one of: pending, assigned, in_progress, cancelled';
  END IF;

  -- Update the request
  UPDATE inspection_requests 
  SET status = new_status::request_status
  WHERE id = request_id;

  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users (actual enforcement is in the function)
GRANT EXECUTE ON FUNCTION public.revert_completed_request(UUID, TEXT, UUID) TO authenticated;