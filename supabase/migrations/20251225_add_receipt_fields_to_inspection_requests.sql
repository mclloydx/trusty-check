-- Add receipt-related fields to inspection_requests table
ALTER TABLE inspection_requests 
ADD COLUMN receipt_verification_code TEXT,
ADD COLUMN receipt_issued_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN receipt_data JSONB,
ADD COLUMN receipt_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Users can view own requests" ON inspection_requests;
DROP POLICY IF EXISTS "Agents can view assigned requests" ON inspection_requests;

-- Recreate policies with updated logic to include receipt information
CREATE POLICY "Users can view own requests" ON inspection_requests
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Agents can view assigned requests" ON inspection_requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'agent'
        )
        AND assigned_agent_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create a function to generate a unique verification code for receipts
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    code TEXT;
BEGIN
    LOOP
        -- Generate a random 8-character alphanumeric code
        code := upper(substring(gen_random_uuid()::text, 1, 8));
        -- Check if this code already exists in the table
        IF NOT EXISTS (
            SELECT 1 FROM inspection_requests 
            WHERE receipt_verification_code = code
        ) THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN code;
END;
$$;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION generate_verification_code() TO authenticated;