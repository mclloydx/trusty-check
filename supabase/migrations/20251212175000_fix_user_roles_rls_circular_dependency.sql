-- Fix circular dependency in user_roles RLS policies
-- The has_role function queries user_roles, but user_roles policies use has_role
-- This creates infinite recursion for authenticated users

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can access user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- Create new policies that don't use has_role to avoid circular dependency
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
    AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
    AND ur.role = 'admin'
  )
);

-- Update other policies to use the same pattern instead of has_role
DROP POLICY IF EXISTS "Users can access inspection requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Users can update inspection requests" ON public.inspection_requests;

CREATE POLICY "Users can access inspection requests"
ON public.inspection_requests
FOR SELECT
USING (
  -- Users can view their own requests
  (SELECT auth.uid()) = user_id
  -- Agents can view assigned requests or all if they have agent role
  OR (SELECT auth.uid()) = assigned_agent_id
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'agent')
  -- Admins can view all requests
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "Users can update inspection requests"
ON public.inspection_requests
FOR UPDATE
USING (
  -- Users can update their own requests (not completed)
  ((SELECT auth.uid()) = user_id AND status != 'completed'::request_status)
  -- Agents can update assigned requests (not completed)
  OR ((SELECT auth.uid()) = assigned_agent_id AND status != 'completed'::request_status)
  -- Admins can update all requests
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin')
)
WITH CHECK (
  -- Users can update their own requests (not completed)
  ((SELECT auth.uid()) = user_id AND status != 'completed'::request_status)
  -- Agents can update assigned requests (not completed)
  OR ((SELECT auth.uid()) = assigned_agent_id AND status != 'completed'::request_status)
  -- Admins can update all requests
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin')
);

-- Update profiles policies
DROP POLICY IF EXISTS "Users can access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can modify profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.profiles;

CREATE POLICY "Users can access profiles"
ON public.profiles
FOR SELECT
USING (
  (SELECT auth.uid()) = id
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "Users can modify profiles"
ON public.profiles
FOR UPDATE
USING (
  (SELECT auth.uid()) = id
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "Users can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = id
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin')
);