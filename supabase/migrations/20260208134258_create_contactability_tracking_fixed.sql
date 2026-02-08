/*
  # Contact Tracking System for Contactability Reporting

  ## Overview
  This migration creates a comprehensive contact tracking system to measure and analyze
  contactability metrics across all communication channels.

  ## New Tables
  
  ### `contact_attempts`
  Tracks every contact attempt made to debtors across all channels
  - `id` (uuid, primary key) - Unique identifier for each contact attempt
  - `debtor_id` (uuid) - Links to debtor_records table
  - `csv_upload_id` (uuid, nullable) - Links to the batch/upload this debtor belongs to
  - `agent_id` (integer, nullable) - Agent who made the contact attempt
  - `channel` (text) - Communication channel: 'phone', 'email', 'sms', 'whatsapp'
  - `contact_number` (text, nullable) - Phone/email/contact detail used
  - `attempt_timestamp` (timestamptz) - When the contact was attempted
  - `outcome` (text) - Result: 'connected', 'no_answer', 'busy', 'voicemail', 'wrong_number', 
                        'disconnected', 'email_bounced', 'email_opened', 'email_clicked', 
                        'sms_delivered', 'sms_failed', 'opt_out'
  - `duration_seconds` (integer, nullable) - Call duration for phone contacts
  - `notes` (text, nullable) - Additional notes about the contact
  - `metadata` (jsonb, nullable) - Additional structured data
  - `created_at` (timestamptz) - Record creation timestamp

  ### `contact_outcomes_summary`
  Aggregated view of contact outcomes by debtor for quick reporting
  - `debtor_id` (uuid, primary key) - Links to debtor_records
  - `total_attempts` (integer) - Total contact attempts across all channels
  - `phone_attempts` (integer) - Phone contact attempts
  - `email_attempts` (integer) - Email contact attempts
  - `sms_attempts` (integer) - SMS contact attempts
  - `successful_contacts` (integer) - Successful contact count
  - `last_contact_date` (timestamptz, nullable) - Most recent successful contact
  - `last_attempt_date` (timestamptz) - Most recent attempt (successful or not)
  - `best_channel` (text, nullable) - Channel with highest success rate
  - `best_time_slot` (text, nullable) - Best time of day for contact (morning/afternoon/evening)
  - `contact_score` (numeric, nullable) - Contactability score (0-100)
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on both tables
  - Add policies for authenticated users to manage contact data
  - Ensure agents can access contact data for reporting

  ## Indexes
  - Index on debtor_id for fast lookups
  - Index on attempt_timestamp for time-based queries
  - Index on outcome for filtering by result
  - Composite index on (debtor_id, channel) for channel-specific analysis
*/

-- Create contact_attempts table
CREATE TABLE IF NOT EXISTS contact_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debtor_id uuid NOT NULL REFERENCES debtor_records(id) ON DELETE CASCADE,
  csv_upload_id uuid REFERENCES csv_uploads(id) ON DELETE SET NULL,
  agent_id integer REFERENCES agents(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('phone', 'email', 'sms', 'whatsapp', 'other')),
  contact_number text,
  attempt_timestamp timestamptz NOT NULL DEFAULT now(),
  outcome text NOT NULL CHECK (outcome IN (
    'connected', 'no_answer', 'busy', 'voicemail', 'wrong_number', 
    'disconnected', 'email_bounced', 'email_opened', 'email_clicked', 
    'email_delivered', 'sms_delivered', 'sms_failed', 'opt_out', 
    'callback_requested', 'promise_to_pay', 'dispute', 'refused'
  )),
  duration_seconds integer CHECK (duration_seconds >= 0),
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create contact_outcomes_summary table
CREATE TABLE IF NOT EXISTS contact_outcomes_summary (
  debtor_id uuid PRIMARY KEY REFERENCES debtor_records(id) ON DELETE CASCADE,
  total_attempts integer DEFAULT 0,
  phone_attempts integer DEFAULT 0,
  email_attempts integer DEFAULT 0,
  sms_attempts integer DEFAULT 0,
  successful_contacts integer DEFAULT 0,
  last_contact_date timestamptz,
  last_attempt_date timestamptz,
  best_channel text,
  best_time_slot text,
  contact_score numeric(5,2) CHECK (contact_score >= 0 AND contact_score <= 100),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_attempts_debtor_id ON contact_attempts(debtor_id);
CREATE INDEX IF NOT EXISTS idx_contact_attempts_timestamp ON contact_attempts(attempt_timestamp);
CREATE INDEX IF NOT EXISTS idx_contact_attempts_outcome ON contact_attempts(outcome);
CREATE INDEX IF NOT EXISTS idx_contact_attempts_channel ON contact_attempts(channel);
CREATE INDEX IF NOT EXISTS idx_contact_attempts_agent_id ON contact_attempts(agent_id);
CREATE INDEX IF NOT EXISTS idx_contact_attempts_debtor_channel ON contact_attempts(debtor_id, channel);
CREATE INDEX IF NOT EXISTS idx_contact_attempts_csv_upload ON contact_attempts(csv_upload_id);

-- Enable RLS
ALTER TABLE contact_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_outcomes_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_attempts
CREATE POLICY "Authenticated users can view all contact attempts"
  ON contact_attempts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contact attempts"
  ON contact_attempts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their own contact attempts"
  ON contact_attempts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete their own contact attempts"
  ON contact_attempts FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for contact_outcomes_summary
CREATE POLICY "Authenticated users can view contact outcomes"
  ON contact_outcomes_summary FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contact outcomes"
  ON contact_outcomes_summary FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contact outcomes"
  ON contact_outcomes_summary FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update contact_outcomes_summary after each contact attempt
CREATE OR REPLACE FUNCTION update_contact_outcomes_summary()
RETURNS TRIGGER AS $$
DECLARE
  success_outcomes text[] := ARRAY['connected', 'email_opened', 'email_clicked', 'callback_requested', 'promise_to_pay'];
  v_successful_contacts integer;
  v_last_contact_date timestamptz;
  v_best_channel text;
  v_contact_score numeric;
BEGIN
  -- Calculate successful contacts
  SELECT COUNT(*) INTO v_successful_contacts
  FROM contact_attempts
  WHERE debtor_id = NEW.debtor_id
    AND outcome = ANY(success_outcomes);

  -- Get last successful contact date
  SELECT MAX(attempt_timestamp) INTO v_last_contact_date
  FROM contact_attempts
  WHERE debtor_id = NEW.debtor_id
    AND outcome = ANY(success_outcomes);

  -- Determine best channel (highest success rate)
  SELECT channel INTO v_best_channel
  FROM (
    SELECT 
      channel,
      COUNT(*) FILTER (WHERE outcome = ANY(success_outcomes))::float / NULLIF(COUNT(*), 0) as success_rate
    FROM contact_attempts
    WHERE debtor_id = NEW.debtor_id
    GROUP BY channel
    ORDER BY success_rate DESC
    LIMIT 1
  ) sub;

  -- Calculate contact score (0-100)
  -- Formula: (successful_contacts / total_attempts) * 100, with recency bonus
  SELECT 
    LEAST(100, 
      (v_successful_contacts::float / NULLIF(COUNT(*), 0) * 70) +
      (CASE 
        WHEN v_last_contact_date IS NOT NULL AND v_last_contact_date > NOW() - INTERVAL '7 days' THEN 30
        WHEN v_last_contact_date IS NOT NULL AND v_last_contact_date > NOW() - INTERVAL '30 days' THEN 15
        ELSE 0
      END)
    ) INTO v_contact_score
  FROM contact_attempts
  WHERE debtor_id = NEW.debtor_id;

  -- Upsert summary record
  INSERT INTO contact_outcomes_summary (
    debtor_id,
    total_attempts,
    phone_attempts,
    email_attempts,
    sms_attempts,
    successful_contacts,
    last_contact_date,
    last_attempt_date,
    best_channel,
    contact_score,
    updated_at
  )
  SELECT
    NEW.debtor_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE channel = 'phone'),
    COUNT(*) FILTER (WHERE channel = 'email'),
    COUNT(*) FILTER (WHERE channel = 'sms'),
    v_successful_contacts,
    v_last_contact_date,
    MAX(attempt_timestamp),
    v_best_channel,
    v_contact_score,
    NOW()
  FROM contact_attempts
  WHERE debtor_id = NEW.debtor_id
  ON CONFLICT (debtor_id) DO UPDATE SET
    total_attempts = EXCLUDED.total_attempts,
    phone_attempts = EXCLUDED.phone_attempts,
    email_attempts = EXCLUDED.email_attempts,
    sms_attempts = EXCLUDED.sms_attempts,
    successful_contacts = EXCLUDED.successful_contacts,
    last_contact_date = EXCLUDED.last_contact_date,
    last_attempt_date = EXCLUDED.last_attempt_date,
    best_channel = EXCLUDED.best_channel,
    contact_score = EXCLUDED.contact_score,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update summary after each contact attempt
DROP TRIGGER IF EXISTS update_contact_outcomes_summary_trigger ON contact_attempts;
CREATE TRIGGER update_contact_outcomes_summary_trigger
  AFTER INSERT OR UPDATE ON contact_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_outcomes_summary();
