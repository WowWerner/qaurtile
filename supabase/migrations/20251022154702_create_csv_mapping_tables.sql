/*
  # CSV Mapping Configuration Tables

  ## New Tables Created
  
  1. `csv_field_mappings`
     - Stores custom field mapping configurations
     - Tracks which CSV headers map to which internal fields
     - Includes confidence scores and usage statistics
  
  2. `csv_templates`
     - Stores predefined CSV templates
     - Allows template naming and versioning
     - Contains complete header definitions
     - Supports template sharing
  
  3. `csv_upload_validations`
     - Tracks validation issues during CSV processing
     - Records header mapping problems
     - Stores data quality warnings
     - Links to specific CSV uploads for audit trail
  
  ## Security
  
  - Enable RLS on all new tables
  - Add policies for authenticated users to manage their mappings
  - Allow reading validation logs for uploaded files
*/

-- Create csv_field_mappings table
CREATE TABLE IF NOT EXISTS csv_field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  csv_header text NOT NULL,
  internal_field text NOT NULL,
  confidence_score numeric(3, 2) DEFAULT 1.0,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create csv_templates table
CREATE TABLE IF NOT EXISTS csv_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  version text DEFAULT '1.0',
  template_data jsonb NOT NULL,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create csv_upload_validations table
CREATE TABLE IF NOT EXISTS csv_upload_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  csv_upload_id uuid REFERENCES csv_uploads(id) ON DELETE CASCADE,
  validation_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('error', 'warning', 'info')),
  field_name text,
  row_number integer,
  message text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_csv_field_mappings_csv_header ON csv_field_mappings(csv_header);
CREATE INDEX IF NOT EXISTS idx_csv_field_mappings_internal_field ON csv_field_mappings(internal_field);
CREATE INDEX IF NOT EXISTS idx_csv_templates_name ON csv_templates(name);
CREATE INDEX IF NOT EXISTS idx_csv_upload_validations_upload_id ON csv_upload_validations(csv_upload_id);

-- Enable RLS
ALTER TABLE csv_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_upload_validations ENABLE ROW LEVEL SECURITY;

-- Policies for csv_field_mappings
CREATE POLICY "Users can view all field mappings"
  ON csv_field_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create field mappings"
  ON csv_field_mappings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own field mappings"
  ON csv_field_mappings FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own field mappings"
  ON csv_field_mappings FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policies for csv_templates
CREATE POLICY "Users can view all templates"
  ON csv_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create templates"
  ON csv_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
  ON csv_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates"
  ON csv_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policies for csv_upload_validations
CREATE POLICY "Users can view all validations"
  ON csv_upload_validations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create validations"
  ON csv_upload_validations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_csv_field_mappings_updated_at
  BEFORE UPDATE ON csv_field_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_csv_templates_updated_at
  BEFORE UPDATE ON csv_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
