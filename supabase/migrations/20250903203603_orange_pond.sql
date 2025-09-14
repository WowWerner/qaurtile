/*
  # Enable access to enhanced_features_with_actions table

  1. Security
    - Enable RLS on enhanced_features_with_actions table
    - Add policy for authenticated users to read data
  
  2. Notes
    - This table contains account analytics data that authenticated users need to access
    - Read-only access is appropriate for dashboard viewing
*/

-- Enable Row Level Security on the enhanced_features_with_actions table
ALTER TABLE enhanced_features_with_actions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read enhanced features data
CREATE POLICY "Authenticated users can read enhanced features data"
  ON enhanced_features_with_actions
  FOR SELECT
  TO authenticated
  USING (true);