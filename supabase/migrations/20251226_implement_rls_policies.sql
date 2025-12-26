-- Row-Level Security Policies for Enhanced Security
-- This migration enables RLS on all tables and creates proper policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Inspection Requests table policies
CREATE POLICY "Users can view own inspection requests" ON inspection_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create inspection requests" ON inspection_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inspection requests" ON inspection_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Agents can view assigned inspection requests" ON inspection_requests
  FOR SELECT USING (
    auth.uid() = ANY(assigned_agents)
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can update assigned inspection requests" ON inspection_requests
  FOR UPDATE USING (
    auth.uid() = ANY(assigned_agents)
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all inspection requests" ON inspection_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all inspection requests" ON inspection_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- User Profiles table policies (role management)
CREATE POLICY "Users can view own role profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all role profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up2
      WHERE up2.user_id = auth.uid() 
      AND up2.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all role profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up2
      WHERE up2.user_id = auth.uid() 
      AND up2.role = 'admin'
    )
  );

-- Create function to check user role for easier policy management
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM user_profiles WHERE user_id = auth.uid();
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Create function to check if user is agent
CREATE OR REPLACE FUNCTION is_agent()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'agent'
  );
$$;

-- Add indexes for RLS performance
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_inspection_requests_user_id ON inspection_requests(user_id);
CREATE INDEX idx_inspection_requests_assigned_agents ON inspection_requests USING GIN(assigned_agents);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON inspection_requests TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON inspection_requests TO anon;
