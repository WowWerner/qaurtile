/*
  # Create Collection Activity Tracking Tables

  1. New Tables
    - `performed_action_types`
      - `id` (integer, primary key)
      - `name` (text) - Action type name (e.g., "Phone Call", "Email Sent", "Payment Received")
      - `description` (text) - Detailed description of action type
      - `is_active` (boolean) - Whether this action type is still in use
      - `created_at` (timestamptz) - When action type was created

    - `performed_actions`
      - `p_action_id` (uuid, primary key)
      - `account_id` (uuid, FK) - Links to accounts/debtor_records
      - `user_id` (integer, FK) - Links to agents table
      - `type_id` (integer, FK) - Links to performed_action_types
      - `date_done` (timestamptz) - When action was performed
      - `description` (text) - Detailed description of what was done
      - `notes` (text) - Additional notes
      - `outcome` (text) - Result of the action
      - `metadata` (jsonb) - Additional flexible data storage
      - `created_at` (timestamptz) - Record creation timestamp

    - `account_status_history`
      - `id` (uuid, primary key)
      - `account_id` (uuid, FK) - Links to accounts/debtor_records
      - `old_status` (text) - Previous account status
      - `new_status` (text) - New account status after change
      - `changed_by` (integer, FK) - Agent who made the change
      - `changed_at` (timestamptz) - When status was changed
      - `reason` (text) - Reason for status change
      - `p_action_id` (uuid, FK) - Optional link to performed action
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read and write data

  3. Indexes
    - Index on account_id for fast lookups
    - Index on user_id for agent performance queries
    - Index on date_done for time-based analysis
    - Index on type_id for action type filtering
*/

-- Create performed_action_types lookup table
CREATE TABLE IF NOT EXISTS performed_action_types (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create performed_actions table
CREATE TABLE IF NOT EXISTS performed_actions (
  p_action_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES debtor_records(id) ON DELETE CASCADE,
  user_id integer REFERENCES agents(id) ON DELETE SET NULL,
  type_id integer NOT NULL REFERENCES performed_action_types(id) ON DELETE RESTRICT,
  date_done timestamptz NOT NULL DEFAULT now(),
  description text NOT NULL,
  notes text,
  outcome text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create account_status_history table
CREATE TABLE IF NOT EXISTS account_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES debtor_records(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by integer REFERENCES agents(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  p_action_id uuid REFERENCES performed_actions(p_action_id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_performed_actions_account_id ON performed_actions(account_id);
CREATE INDEX IF NOT EXISTS idx_performed_actions_user_id ON performed_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_performed_actions_date_done ON performed_actions(date_done);
CREATE INDEX IF NOT EXISTS idx_performed_actions_type_id ON performed_actions(type_id);

CREATE INDEX IF NOT EXISTS idx_account_status_history_account_id ON account_status_history(account_id);
CREATE INDEX IF NOT EXISTS idx_account_status_history_changed_at ON account_status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_account_status_history_changed_by ON account_status_history(changed_by);

-- Enable Row Level Security
ALTER TABLE performed_action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE performed_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_status_history ENABLE ROW LEVEL SECURITY;

-- Policies for performed_action_types (readable by all authenticated users)
CREATE POLICY "Authenticated users can view action types"
  ON performed_action_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert action types"
  ON performed_action_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for performed_actions (all authenticated users can view and insert)
CREATE POLICY "Authenticated users can view performed actions"
  ON performed_actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert performed actions"
  ON performed_actions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update performed actions"
  ON performed_actions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for account_status_history (all authenticated users can view)
CREATE POLICY "Authenticated users can view status history"
  ON account_status_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert status history"
  ON account_status_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default action types
INSERT INTO performed_action_types (name, description) VALUES
  ('Phone Call', 'Outbound phone call to debtor'),
  ('Email Sent', 'Email communication sent to debtor'),
  ('SMS Sent', 'Text message sent to debtor'),
  ('Letter Sent', 'Physical letter mailed to debtor'),
  ('Payment Received', 'Payment collected from debtor'),
  ('Promise to Pay', 'Debtor committed to payment arrangement'),
  ('Field Visit', 'In-person visit to debtor location'),
  ('Legal Action', 'Legal proceedings initiated'),
  ('Account Review', 'Internal review of account status'),
  ('Status Change', 'Account status updated'),
  ('Note Added', 'Internal note added to account'),
  ('Settlement Offer', 'Settlement proposal sent to debtor'),
  ('Dispute Filed', 'Debtor disputed the debt'),
  ('Callback Scheduled', 'Follow-up call scheduled'),
  ('Voicemail Left', 'Voicemail message left for debtor')
ON CONFLICT (name) DO NOTHING;

-- Insert sample performed actions (50 records across different action types)
DO $$
DECLARE
  v_debtor_id uuid;
  v_agent_id integer;
  v_action_type_id integer;
  v_counter integer := 0;
  v_date_offset integer;
BEGIN
  -- Get a sample agent
  SELECT id INTO v_agent_id FROM agents LIMIT 1;
  
  -- Create 50 sample actions
  FOR v_debtor_id IN (SELECT id FROM debtor_records LIMIT 10) LOOP
    FOR v_counter IN 1..5 LOOP
      -- Random action type (1-15)
      v_action_type_id := (floor(random() * 15) + 1)::integer;
      
      -- Random date within last 60 days
      v_date_offset := floor(random() * 60)::integer;
      
      INSERT INTO performed_actions (
        account_id,
        user_id,
        type_id,
        date_done,
        description,
        outcome
      ) VALUES (
        v_debtor_id,
        v_agent_id,
        v_action_type_id,
        now() - (v_date_offset || ' days')::interval,
        CASE v_action_type_id
          WHEN 1 THEN 'Called debtor to discuss payment options'
          WHEN 2 THEN 'Sent payment reminder email'
          WHEN 3 THEN 'Sent SMS payment reminder'
          WHEN 5 THEN 'Received partial payment on account'
          WHEN 6 THEN 'Debtor agreed to payment plan'
          WHEN 10 THEN 'Updated account status based on recent activity'
          ELSE 'Action performed on account'
        END,
        CASE
          WHEN random() < 0.6 THEN 'Successful'
          WHEN random() < 0.8 THEN 'No Response'
          ELSE 'Follow-up Required'
        END
      );
    END LOOP;
  END LOOP;
END $$;

-- Insert sample status history records
DO $$
DECLARE
  v_action record;
  v_old_status text;
  v_new_status text;
  v_statuses text[] := ARRAY['New', 'In Progress', 'Payment Plan', 'Settled', 'Legal', 'Closed'];
BEGIN
  FOR v_action IN (
    SELECT p_action_id, account_id, user_id, date_done
    FROM performed_actions
    WHERE type_id = 10 -- Status Change actions
    LIMIT 20
  ) LOOP
    -- Random old and new status
    v_old_status := v_statuses[floor(random() * array_length(v_statuses, 1)) + 1];
    v_new_status := v_statuses[floor(random() * array_length(v_statuses, 1)) + 1];
    
    -- Ensure old and new are different
    WHILE v_old_status = v_new_status LOOP
      v_new_status := v_statuses[floor(random() * array_length(v_statuses, 1)) + 1];
    END LOOP;
    
    INSERT INTO account_status_history (
      account_id,
      old_status,
      new_status,
      changed_by,
      changed_at,
      reason,
      p_action_id
    ) VALUES (
      v_action.account_id,
      v_old_status,
      v_new_status,
      v_action.user_id,
      v_action.date_done,
      'Status updated based on collection activity',
      v_action.p_action_id
    );
  END LOOP;
END $$;
