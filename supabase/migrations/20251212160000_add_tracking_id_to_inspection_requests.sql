-- Add tracking_id column to inspection_requests table
ALTER TABLE public.inspection_requests
ADD COLUMN IF NOT EXISTS tracking_id TEXT UNIQUE;