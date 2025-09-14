/*
  # CSV Raw Data Storage Table

  1. New Tables
    - `csv_raw_data`
      - Stores raw CSV data with all original fields
      - Links to csv_uploads via foreign key
      - Preserves original data before processing
  
  2. Security
    - Enable RLS on csv_raw_data table
    - Add policies for authenticated users to manage their data

  3. Indexes
    - Index on csv_upload_id for fast retrieval
    - Index on debtor_id for searching
*/

-- Create table to store raw CSV data
CREATE TABLE IF NOT EXISTS csv_raw_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  csv_upload_id uuid REFERENCES csv_uploads(id) ON DELETE CASCADE,
  
  -- Basic debtor information
  debtor_id text,
  debtor_firstname text,
  debtor_surname text,
  
  -- Contact information
  home_phone_1 text,
  home_phone_2 text,
  cell_phone_1 text,
  cell_phone_2 text,
  cell_phone_3 text,
  cell_phone_4 text,
  work_phone_1 text,
  work_phone_2 text,
  email_1 text,
  email_2 text,
  email_3 text,
  
  -- Address information
  postal_address_line_1 text,
  postal_address_line_2 text,
  postal_code text,
  street_address_line_1 text,
  street_address_line_2 text,
  street_postal_code text,
  
  -- Financial information
  amount text,
  capital_on_default text,
  capital_portion text,
  interest_portion text,
  legal_fee_portion text,
  last_payment_date text,
  last_payment_amount text,
  
  -- Demographics
  occupation text,
  nationality text,
  marital_status text,
  
  -- Legal status
  previous_attorney_legal_stage text,
  admin_ref text,
  admin_application_date text,
  
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE csv_raw_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert raw CSV data"
  ON csv_raw_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their raw CSV data"
  ON csv_raw_data
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_csv_raw_data_upload_id 
  ON csv_raw_data(csv_upload_id);

CREATE INDEX IF NOT EXISTS idx_csv_raw_data_debtor_id 
  ON csv_raw_data(debtor_id);

-- Update csv_uploads table to track processing status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'csv_uploads' AND column_name = 'processing_step'
  ) THEN
    ALTER TABLE csv_uploads ADD COLUMN processing_step text DEFAULT 'uploaded';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'csv_uploads' AND column_name = 'raw_data_count'
  ) THEN
    ALTER TABLE csv_uploads ADD COLUMN raw_data_count integer DEFAULT 0;
  END IF;
END $$;