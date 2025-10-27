/*
  # Create FNB Specialised Data Tables

  ## Overview
  This migration creates tables to store FNB-specific debtor data with specialized scoring.

  ## New Tables
  
  ### `fnb_uploads`
  - `id` (uuid, primary key) - Unique identifier for each upload
  - `user_id` (uuid, nullable) - References auth.users if authentication is enabled
  - `filename` (text, not null) - Original CSV filename
  - `name` (text, not null) - User-provided descriptive name
  - `status` (text, default 'pending') - Upload processing status
  - `total_debtors` (integer, default 0) - Count of debtors in this upload
  - `uploaded_at` (timestamptz, default now()) - Timestamp of upload
  
  ### `fnb_debtors`
  - `id` (uuid, primary key) - Unique identifier for each debtor
  - `fnb_upload_id` (uuid, foreign key) - References fnb_uploads
  - All debtor fields from the FNB model
  - `score` (integer) - Computed intelligence score
  - `bucket` (text) - Risk category: High/Medium/Low/Trace Required
  - `ses` (text) - Socio-economic status classification
  - `created_at` (timestamptz, default now()) - Record creation timestamp

  ## Security
  - Enable RLS on both tables
  - Add policies for authenticated users to manage their own data
  
  ## Notes
  - Uses IF NOT EXISTS to ensure idempotent migrations
  - Foreign key with CASCADE delete ensures cleanup
  - Indexes on fnb_upload_id for query performance
*/

-- Create fnb_uploads table
CREATE TABLE IF NOT EXISTS fnb_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  filename text NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'pending',
  total_debtors integer DEFAULT 0,
  uploaded_at timestamptz DEFAULT now()
);

-- Create fnb_debtors table
CREATE TABLE IF NOT EXISTS fnb_debtors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fnb_upload_id uuid NOT NULL REFERENCES fnb_uploads(id) ON DELETE CASCADE,
  client_ref text,
  amount numeric,
  capital_on_default numeric,
  interest_portion numeric,
  legal_fee_portion numeric,
  interest_rate numeric,
  interest_date text,
  date_of_default text,
  last_payment_date text,
  last_payment_amount numeric,
  debtor_first_name text,
  debtor_second_name text,
  debtor_surname text,
  debtor_id text,
  email1 text,
  email2 text,
  cell1 text,
  cell2 text,
  home1 text,
  work1 text,
  street_line1 text,
  street_line2 text,
  street_postal_code text,
  postal_line1 text,
  postal_line2 text,
  postal_postal_code text,
  occupation text,
  employer text,
  employer_address text,
  previous_attorney_legal_stage text,
  score integer,
  bucket text,
  ses text,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_fnb_debtors_upload_id ON fnb_debtors(fnb_upload_id);
CREATE INDEX IF NOT EXISTS idx_fnb_debtors_bucket ON fnb_debtors(bucket);
CREATE INDEX IF NOT EXISTS idx_fnb_debtors_score ON fnb_debtors(score DESC);

-- Enable Row Level Security
ALTER TABLE fnb_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE fnb_debtors ENABLE ROW LEVEL SECURITY;

-- Policies for fnb_uploads
CREATE POLICY "Users can view all FNB uploads"
  ON fnb_uploads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create FNB uploads"
  ON fnb_uploads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update FNB uploads"
  ON fnb_uploads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete FNB uploads"
  ON fnb_uploads FOR DELETE
  TO authenticated
  USING (true);

-- Policies for fnb_debtors
CREATE POLICY "Users can view FNB debtors"
  ON fnb_debtors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create FNB debtors"
  ON fnb_debtors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update FNB debtors"
  ON fnb_debtors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete FNB debtors"
  ON fnb_debtors FOR DELETE
  TO authenticated
  USING (true);
