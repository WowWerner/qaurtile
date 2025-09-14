/*
  # Setup Super Admin System
  
  1. New Tables
    - `user_roles` - Stores user roles (admin, super_admin, etc.)
    - `super_admins` - Specific super admin users
  
  2. Security
    - Enable RLS on new tables
    - Create policies for super admin access
    - Update existing policies to allow super admin access
  
  3. Super Admin User
    - Set data@qaurtile.com.na (UUID: faecbcc8-52af-46b7-851f-5a94edc6d700) as super admin
*/

-- Create user roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create super admins table
CREATE TABLE IF NOT EXISTS super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
CREATE POLICY "Super admins can view all user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Super admins can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policies for super_admins
CREATE POLICY "Super admins can view super admin list"
  ON super_admins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Insert the specified super admin user
INSERT INTO super_admins (user_id, email, is_active)
VALUES ('faecbcc8-52af-46b7-851f-5a94edc6d700', 'data@qaurtile.com.na', true)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('faecbcc8-52af-46b7-851f-5a94edc6d700', 'super_admin')
ON CONFLICT (user_id) DO NOTHING;

-- Update existing table policies to allow super admin access

-- CSV Uploads - Super admin access
DROP POLICY IF EXISTS "Users can read their own uploads" ON csv_uploads;
DROP POLICY IF EXISTS "Users can insert uploads" ON csv_uploads;

CREATE POLICY "Super admins can access all csv uploads"
  ON csv_uploads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Authenticated users can access their uploads"
  ON csv_uploads
  FOR ALL
  TO authenticated
  USING (true);

-- Debtor Records - Super admin access
DROP POLICY IF EXISTS "Users can read debtor records" ON debtor_records;
DROP POLICY IF EXISTS "Users can insert debtor records" ON debtor_records;

CREATE POLICY "Super admins can access all debtor records"
  ON debtor_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Authenticated users can access debtor records"
  ON debtor_records
  FOR ALL
  TO authenticated
  USING (true);

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM super_admins 
    WHERE user_id = user_uuid AND is_active = true
  );
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM user_roles WHERE user_id = user_uuid),
    'user'
  );
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON super_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
CREATE INDEX IF NOT EXISTS idx_super_admins_active ON super_admins(is_active);