-- Fix RLS performance issues by optimizing auth function calls
-- This addresses the auth_rls_initplan warnings from the database linter

-- Drop and recreate policies for inspection_requests with optimized auth calls
DROP POLICY IF EXISTS "Users can view own requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Agents can view assigned requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Agents can update assigned requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.inspection_requests;

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON public.inspection_requests
FOR SELECT
USING ((SELECT auth.uid()) = user_id);

-- Agents can view assigned requests
CREATE POLICY "Agents can view assigned requests"
ON public.inspection_requests
FOR SELECT
USING (
  (SELECT auth.uid()) = assigned_agent_id
  OR public.has_role((SELECT auth.uid()), 'agent')
);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.inspection_requests
FOR SELECT
USING (public.has_role((SELECT auth.uid()), 'admin'));

-- Users can update their own requests (not completed)
CREATE POLICY "Users can update own requests"
ON public.inspection_requests
FOR UPDATE
USING (
  (SELECT auth.uid()) = user_id
  AND status != 'completed'
)
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND status != 'completed'
);

-- Agents can update assigned requests (not completed)
CREATE POLICY "Agents can update assigned requests"
ON public.inspection_requests
FOR UPDATE
USING (
  (SELECT auth.uid()) = assigned_agent_id
  AND status != 'completed'
)
WITH CHECK (
  (SELECT auth.uid()) = assigned_agent_id
  AND status != 'completed'
);

-- Admins can update all requests
CREATE POLICY "Admins can update all requests"
ON public.inspection_requests
FOR UPDATE
USING (public.has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

-- Drop and recreate policies for profiles with optimized auth calls
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (public.has_role((SELECT auth.uid()), 'admin'));

-- Drop and recreate policies for user_roles with optimized auth calls
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (public.has_role((SELECT auth.uid()), 'admin'));

-- Add indexes for foreign keys to improve performance
CREATE INDEX IF NOT EXISTS idx_inspection_requests_user_id ON public.inspection_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_assigned_agent_id ON public.inspection_requests(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);