-- Create the inspection_requests table
CREATE TABLE inspection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    whatsapp TEXT,
    customer_address TEXT,
    store_name TEXT NOT NULL,
    store_location TEXT NOT NULL,
    product_details TEXT NOT NULL,
    service_tier TEXT NOT NULL,
    service_fee TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    assigned_agent_id UUID REFERENCES auth.users(id),
    payment_received BOOLEAN DEFAULT FALSE,
    payment_method TEXT,
    receipt_number TEXT,
    delivery_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    tracking_id TEXT UNIQUE
);

-- Enable Row Level Security on inspection_requests
ALTER TABLE inspection_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for inspection_requests table
-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON inspection_requests
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own requests" ON inspection_requests
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests
CREATE POLICY "Users can update own pending requests" ON inspection_requests
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests" ON inspection_requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can manage all requests
CREATE POLICY "Admins can manage all requests" ON inspection_requests
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Agents can view assigned requests
CREATE POLICY "Agents can view assigned requests" ON inspection_requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'agent'
        )
        AND assigned_agent_id = auth.uid()
    );

-- Agents can update assigned requests
CREATE POLICY "Agents can update assigned requests" ON inspection_requests
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'agent'
        )
        AND assigned_agent_id = auth.uid()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'agent'
        )
        AND assigned_agent_id = auth.uid()
    );

-- Service role can manage all requests
CREATE POLICY "Service role can manage all requests" ON inspection_requests
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_inspection_requests_user_id ON inspection_requests(user_id);
CREATE INDEX idx_inspection_requests_assigned_agent_id ON inspection_requests(assigned_agent_id);
CREATE INDEX idx_inspection_requests_status ON inspection_requests(status);
CREATE INDEX idx_inspection_requests_created_at ON inspection_requests(created_at);
CREATE INDEX idx_inspection_requests_tracking_id ON inspection_requests(tracking_id);

-- Create a trigger function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create the trigger for inspection_requests table
CREATE TRIGGER update_inspection_requests_updated_at
    BEFORE UPDATE ON inspection_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE inspection_requests TO service_role;
GRANT SELECT, INSERT ON TABLE inspection_requests TO authenticated;
GRANT UPDATE ON TABLE inspection_requests TO authenticated;