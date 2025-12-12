-- Add receipt fields to inspection_requests table
ALTER TABLE public.inspection_requests 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT FALSE;

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for receipts bucket
CREATE POLICY "Users can upload receipts for their own requests"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.inspection_requests WHERE user_id = auth.uid()
));

CREATE POLICY "Users can view receipts for their own requests"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.inspection_requests WHERE user_id = auth.uid()
));

CREATE POLICY "Agents can view receipts for assigned requests"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.inspection_requests WHERE assigned_agent_id = auth.uid()
));

CREATE POLICY "Admins can view all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'));