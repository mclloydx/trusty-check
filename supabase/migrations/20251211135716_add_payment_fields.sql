-- Add payment fields to inspection_requests table
ALTER TABLE public.inspection_requests 
ADD COLUMN IF NOT EXISTS payment_received BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- Update RLS policies to allow users to view payment information for their own requests
DROP POLICY IF EXISTS "Users can view own requests" ON public.inspection_requests;
CREATE POLICY "Users can view own requests"
ON public.inspection_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Update RLS policies to allow agents to view payment information for assigned requests
DROP POLICY IF EXISTS "Agents can view assigned requests" ON public.inspection_requests;
CREATE POLICY "Agents can view assigned requests"
ON public.inspection_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'agent') AND assigned_agent_id = auth.uid());

-- Update RLS policies to allow admins to view all requests with payment information
DROP POLICY IF EXISTS "Admins can view all requests" ON public.inspection_requests;
CREATE POLICY "Admins can view all requests"
ON public.inspection_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));