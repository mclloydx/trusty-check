-- Fix RLS infinite recursion by using SECURITY DEFINER functions
-- The policies on user_roles cannot query user_roles itself

-- Create SECURITY DEFINER functions to check roles without RLS
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_agent(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'agent'
  );
$$;

-- Update user_roles policies to use the security definer functions
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Update inspection_requests policies
DROP POLICY IF EXISTS "Users can access inspection requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Users can update inspection requests" ON public.inspection_requests;

CREATE POLICY "Users can access inspection requests"
ON public.inspection_requests
FOR SELECT
USING (
  -- Users can view their own requests
  auth.uid() = user_id
  -- Agents can view assigned requests or all if they have agent role
  OR auth.uid() = assigned_agent_id
  OR public.is_agent()
  -- Admins can view all requests
  OR public.is_admin()
);

CREATE POLICY "Users can update inspection requests"
ON public.inspection_requests
FOR UPDATE
USING (
  -- Users can update their own requests (not completed)
  (auth.uid() = user_id AND status != 'completed'::request_status)
  -- Agents can update assigned requests (not completed)
  OR (auth.uid() = assigned_agent_id AND status != 'completed'::request_status)
  -- Admins can update all requests
  OR public.is_admin()
)
WITH CHECK (
  -- Users can update their own requests (not completed)
  (auth.uid() = user_id AND status != 'completed'::request_status)
  -- Agents can update assigned requests (not completed)
  OR (auth.uid() = assigned_agent_id AND status != 'completed'::request_status)
  -- Admins can update all requests
  OR public.is_admin()
);

-- Update profiles policies
DROP POLICY IF EXISTS "Users can access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can modify profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.profiles;

CREATE POLICY "Users can access profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR public.is_admin()
);

CREATE POLICY "Users can modify profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id
  OR public.is_admin()
);

CREATE POLICY "Users can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id
  OR public.is_admin()
);

-- Update storage policies
DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;

CREATE POLICY "Admins can view all receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'receipts'
  AND public.is_admin()
);