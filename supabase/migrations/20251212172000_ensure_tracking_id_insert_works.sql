-- Ensure tracking_id can be inserted properly
-- This fixes any issues with the tracking_id field during form submission

-- Make sure the tracking_id column allows inserts
ALTER TABLE public.inspection_requests 
ALTER COLUMN tracking_id DROP NOT NULL;

-- Ensure the column has the right constraints
ALTER TABLE public.inspection_requests 
ADD CONSTRAINT IF NOT EXISTS tracking_id_unique UNIQUE (tracking_id);