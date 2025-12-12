-- Consolidate RLS policies to reduce multiple permissive policy evaluations
-- This addresses the multiple_permissive_policies warnings

-- Drop existing policies for inspection_requests
DROP POLICY IF EXISTS "Users can view own requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Agents can view assigned requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Agents can update assigned requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.inspection_requests;

-- Consolidated SELECT policy for inspection_requests
CREATE POLICY "Users can access inspection requests"
ON public.inspection_requests
FOR SELECT
USING (
  -- Users can view their own requests
  (SELECT auth.uid()) = user_id
  -- Agents can view assigned requests or all if they have agent role
  OR (SELECT auth.uid()) = assigned_agent_id
  OR public.has_role((SELECT auth.uid()), 'agent')
  -- Admins can view all requests
  OR public.has_role((SELECT auth.uid()), 'admin')
);

-- Consolidated UPDATE policy for inspection_requests
CREATE POLICY "Users can update inspection requests"
ON public.inspection_requests
FOR UPDATE
USING (
  -- Users can update their own requests (not completed)
  ((SELECT auth.uid()) = user_id AND status != 'completed'::request_status)
  -- Agents can update assigned requests (not completed)
  OR ((SELECT auth.uid()) = assigned_agent_id AND status != 'completed'::request_status)
  -- Admins can update all requests
  OR public.has_role((SELECT auth.uid()), 'admin')
)
WITH CHECK (
  -- Users can update their own requests (not completed)
  ((SELECT auth.uid()) = user_id AND status != 'completed'::request_status)
  -- Agents can update assigned requests (not completed)
  OR ((SELECT auth.uid()) = assigned_agent_id AND status != 'completed'::request_status)
  -- Admins can update all requests
  OR public.has_role((SELECT auth.uid()), 'admin')
);

-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Consolidated policies for profiles
CREATE POLICY "Users can access profiles"
ON public.profiles
FOR SELECT
USING (
  (SELECT auth.uid()) = id
  OR public.has_role((SELECT auth.uid()), 'admin')
);

CREATE POLICY "Users can modify profiles"
ON public.profiles
FOR UPDATE
USING (
  (SELECT auth.uid()) = id
  OR public.has_role((SELECT auth.uid()), 'admin')
);

CREATE POLICY "Users can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = id
  OR public.has_role((SELECT auth.uid()), 'admin')
);

-- Drop existing policies for user_roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Consolidated policies for user_roles
CREATE POLICY "Users can access user roles"
ON public.user_roles
FOR SELECT
USING (
  (SELECT auth.uid()) = user_id
  OR public.has_role((SELECT auth.uid()), 'admin')
);

CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
USING (public.has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));