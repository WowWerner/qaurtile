/*
  # Dynamic CSV Tables Architecture

  1. Table Management
    - Each CSV upload creates its own dedicated table
    - Table naming: csv_data_[upload_id]
    - Metadata tracked in csv_uploads table

  2. Performance Benefits
    - Faster queries (thousands vs hundreds of thousands of rows)
    - Efficient indexing per table
    - Easy cleanup when CSV no longer needed

  3. Functions
    - create_csv_table(): Creates new table for CSV upload
    - get_csv_table_name(): Gets table name for upload ID
*/

-- Function to create a new table for CSV data
CREATE OR REPLACE FUNCTION create_csv_table(upload_id uuid)
RETURNS text AS $$
DECLARE
    table_name text;
BEGIN
    -- Generate table name based on upload ID
    table_name := 'csv_data_' || replace(upload_id::text, '-', '_');
    
    -- Create the table with all CSV columns
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            csv_upload_id uuid NOT NULL REFERENCES csv_uploads(id) ON DELETE CASCADE,
            debtor_id text,
            debtor_firstname text,
            debtor_surname text,
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
            postal_address_line_1 text,
            postal_address_line_2 text,
            postal_code text,
            street_address_line_1 text,
            street_address_line_2 text,
            street_postal_code text,
            amount text,
            capital_on_default text,
            capital_portion text,
            interest_portion text,
            legal_fee_portion text,
            last_payment_date text,
            last_payment_amount text,
            occupation text,
            nationality text,
            marital_status text,
            previous_attorney_legal_stage text,
            admin_ref text,
            admin_application_date text,
            created_at timestamptz DEFAULT now()
        )', table_name);
    
    -- Create indexes for performance
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (csv_upload_id)', 
                  'idx_' || table_name || '_upload_id', table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (debtor_id)', 
                  'idx_' || table_name || '_debtor_id', table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (debtor_firstname, debtor_surname)', 
                  'idx_' || table_name || '_name', table_name);
    
    -- Enable RLS on the new table
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    
    -- Create RLS policy for the new table
    EXECUTE format('
        CREATE POLICY %I ON %I
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true)
    ', 'csv_data_policy_' || replace(upload_id::text, '-', '_'), table_name);
    
    RETURN table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table name for upload ID
CREATE OR REPLACE FUNCTION get_csv_table_name(upload_id uuid)
RETURNS text AS $$
BEGIN
    RETURN 'csv_data_' || replace(upload_id::text, '-', '_');
END;
$$ LANGUAGE plpgsql;

-- Function to drop CSV table when upload is deleted
CREATE OR REPLACE FUNCTION drop_csv_table(upload_id uuid)
RETURNS boolean AS $$
DECLARE
    table_name text;
BEGIN
    table_name := get_csv_table_name(upload_id);
    
    -- Check if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = table_name 
        AND table_schema = 'public'
    ) THEN
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_name);
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update csv_uploads table to track table names
ALTER TABLE csv_uploads ADD COLUMN IF NOT EXISTS table_name text;

-- Create index for table name lookups
CREATE INDEX IF NOT EXISTS idx_csv_uploads_table_name ON csv_uploads (table_name);

-- Function to clean up old CSV tables (optional - for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_csv_tables(days_old integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
    old_upload record;
    deleted_count integer := 0;
BEGIN
    FOR old_upload IN 
        SELECT id, table_name FROM csv_uploads 
        WHERE uploaded_at < NOW() - INTERVAL '1 day' * days_old
    LOOP
        IF drop_csv_table(old_upload.id) THEN
            DELETE FROM csv_uploads WHERE id = old_upload.id;
            deleted_count := deleted_count + 1;
        END IF;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;