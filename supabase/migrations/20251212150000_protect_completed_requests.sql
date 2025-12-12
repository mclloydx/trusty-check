-- Add RLS policies to protect completed requests from unauthorized updates
-- Only admins should be able to update completed requests

-- First, drop existing policies on inspection_requests
DROP POLICY IF EXISTS "Users can update own requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Agents can update assigned requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.inspection_requests;

-- Create new policies with proper protections
-- Users can update their own requests only if not completed
CREATE POLICY "Users can update own requests"
ON public.inspection_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND status != 'completed'
);

-- Agents can update assigned requests only if not completed
CREATE POLICY "Agents can update assigned requests"
ON public.inspection_requests
FOR UPDATE
TO authenticated
USING (
  assigned_agent_id = auth.uid() 
  AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'agent')
)
WITH CHECK (
  assigned_agent_id = auth.uid() 
  AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'agent')
  AND status != 'completed'
);

-- Admins can update all requests including completed ones
CREATE POLICY "Admins can update all requests"
ON public.inspection_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);