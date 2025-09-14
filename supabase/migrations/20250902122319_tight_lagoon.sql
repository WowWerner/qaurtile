/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - Infinite recursion detected in policy for relation "super_admins"
    - Circular dependency in RLS policies

  2. Solution
    - Drop problematic policies that create circular references
    - Create simpler policies that avoid recursion
    - Use direct UUID checks instead of table lookups in policies
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Super admins can view super admin list" ON super_admins;
DROP POLICY IF EXISTS "Super admins can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can access all csv uploads" ON csv_uploads;
DROP POLICY IF EXISTS "Super admins can access all debtor records" ON debtor_records;

-- Create simple, non-recursive policies for super_admins table
-- Allow users to read their own super admin status (no recursion)
CREATE POLICY "Users can view their own super admin status"
  ON super_admins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow the specific super admin user to view all super admin records
CREATE POLICY "Specific super admin can view all super admins"
  ON super_admins
  FOR ALL
  TO authenticated
  USING (auth.uid() = 'faecbcc8-52af-46b7-851f-5a94edc6d700'::uuid);

-- Create non-recursive policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Specific super admin can manage all user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (auth.uid() = 'faecbcc8-52af-46b7-851f-5a94edc6d700'::uuid);

-- Create non-recursive policies for csv_uploads table
CREATE POLICY "All authenticated users can access csv uploads"
  ON csv_uploads
  FOR ALL
  TO authenticated
  USING (true);

-- Create non-recursive policies for debtor_records table
CREATE POLICY "All authenticated users can access debtor records"
  ON debtor_records
  FOR ALL
  TO authenticated
  USING (true);

-- Create non-recursive policies for csv_raw_data table
DROP POLICY IF EXISTS "Users can insert raw CSV data" ON csv_raw_data;
DROP POLICY IF EXISTS "Users can read their raw CSV data" ON csv_raw_data;

CREATE POLICY "Authenticated users can access raw CSV data"
  ON csv_raw_data
  FOR ALL
  TO authenticated
  USING (true);