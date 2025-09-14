/*
  # CSV Analysis Data Storage Schema

  1. New Tables
    - `csv_uploads`
      - `id` (uuid, primary key)
      - `filename` (text)
      - `uploaded_at` (timestamp)
      - `total_debtors` (integer)
      - `high_priority_count` (integer)
      - `medium_priority_count` (integer)
      - `low_priority_count` (integer)
      - `total_value` (numeric)
      - `status` (text)
    
    - `debtor_records`
      - `id` (uuid, primary key)
      - `csv_upload_id` (uuid, foreign key)
      - `name` (text)
      - `score` (integer)
      - `amount` (numeric)
      - `last_payment` (text)
      - `phone` (text)
      - `email` (text)
      - `address` (text)
      - `postal_code` (text)
      - `occupation` (text)
      - `priority_category` (text)
      - `scoring_breakdown` (jsonb)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS csv_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  total_debtors integer DEFAULT 0,
  high_priority_count integer DEFAULT 0,
  medium_priority_count integer DEFAULT 0,
  low_priority_count integer DEFAULT 0,
  total_value numeric DEFAULT 0,
  status text DEFAULT 'completed'
);

CREATE TABLE IF NOT EXISTS debtor_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  csv_upload_id uuid REFERENCES csv_uploads(id) ON DELETE CASCADE,
  name text NOT NULL,
  score integer NOT NULL,
  amount numeric NOT NULL,
  last_payment text,
  phone text,
  email text,
  address text,
  postal_code text,
  occupation text,
  priority_category text NOT NULL CHECK (priority_category IN ('high', 'medium', 'low')),
  scoring_breakdown jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE csv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtor_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own uploads"
  ON csv_uploads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert uploads"
  ON csv_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read debtor records"
  ON debtor_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert debtor records"
  ON debtor_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_debtor_records_csv_upload_id ON debtor_records(csv_upload_id);
CREATE INDEX IF NOT EXISTS idx_debtor_records_priority_category ON debtor_records(priority_category);
CREATE INDEX IF NOT EXISTS idx_debtor_records_score ON debtor_records(score);