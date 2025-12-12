-- Fix RLS policies to properly handle completed requests
-- Users should be able to view and update their own requests

-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can update own requests" ON public.inspection_requests;

-- Create a new policy that allows users to update their own requests
-- For completed requests, we still allow updates to contact information
CREATE POLICY "Users can update own requests"
ON public.inspection_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (
    -- Allow full updates for non-completed requests
    status != 'completed'
    OR 
    -- For completed requests, still allow updates (but application logic should restrict what fields can be changed)
    status = 'completed'
  )
);