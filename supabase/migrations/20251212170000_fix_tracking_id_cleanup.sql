-- Fix tracking ID cleanup issue
-- The previous implementation was incorrectly clearing tracking IDs when requests were completed or cancelled
-- This prevented users from referencing their tracking IDs after completion

-- Drop the incorrect trigger and function
DROP TRIGGER IF EXISTS cleanup_tracking_id_trigger ON public.inspection_requests;
DROP FUNCTION IF EXISTS public.cleanup_tracking_id();