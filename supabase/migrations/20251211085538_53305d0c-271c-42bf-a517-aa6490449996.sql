-- Create inspection request status enum
CREATE TYPE public.request_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');

-- Create inspection_requests table
CREATE TABLE public.inspection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  customer_address TEXT,
  store_name TEXT NOT NULL,
  store_location TEXT NOT NULL,
  product_details TEXT NOT NULL,
  service_tier TEXT NOT NULL DEFAULT 'inspection',
  service_fee DECIMAL(10,2) NOT NULL,
  delivery_notes TEXT,
  status request_status NOT NULL DEFAULT 'pending',
  assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inspection_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create requests (guest or logged in)
CREATE POLICY "Anyone can create inspection requests"
ON public.inspection_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON public.inspection_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.inspection_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Agents can view assigned requests
CREATE POLICY "Agents can view assigned requests"
ON public.inspection_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'agent') AND assigned_agent_id = auth.uid());

-- Admins can update all requests
CREATE POLICY "Admins can update all requests"
ON public.inspection_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Agents can update assigned requests
CREATE POLICY "Agents can update assigned requests"
ON public.inspection_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'agent') AND assigned_agent_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_inspection_requests_updated_at
  BEFORE UPDATE ON public.inspection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();