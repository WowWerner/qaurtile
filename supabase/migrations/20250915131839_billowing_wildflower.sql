/*
  # Scan for David Client Accounts

  This migration scans all relevant tables to find accounts/records 
  belonging to clients whose names start with "david" (case insensitive).

  ## Tables Scanned:
  1. client_account_predictions
  2. dc_client_patterns  
  3. dc_detailed_model_predictions
  4. enhanced_features_with_actions
  5. dc_campaign_summary
  6. dc_comprehensive_agent_performance
  7. All CSV data tables

  ## Purpose:
  Identify all records that need to be cleaned up before deletion
*/

-- Scan client_account_predictions table
SELECT 'client_account_predictions' as table_name, 
       COUNT(*) as record_count,
       ARRAY_AGG(DISTINCT client_name) as client_names
FROM client_account_predictions 
WHERE client_name ILIKE 'david%';

-- Scan dc_client_patterns table  
SELECT 'dc_client_patterns' as table_name,
       COUNT(*) as record_count,
       ARRAY_AGG(DISTINCT client_name) as client_names
FROM dc_client_patterns 
WHERE client_name ILIKE 'david%';

-- Scan dc_detailed_model_predictions table
SELECT 'dc_detailed_model_predictions' as table_name,
       COUNT(*) as record_count, 
       ARRAY_AGG(DISTINCT client_name) as client_names
FROM dc_detailed_model_predictions 
WHERE client_name ILIKE 'david%';

-- Scan enhanced_features_with_actions table
SELECT 'enhanced_features_with_actions' as table_name,
       COUNT(*) as record_count,
       ARRAY_AGG(DISTINCT client_name) as client_names  
FROM enhanced_features_with_actions 
WHERE client_name ILIKE 'david%';

-- Scan dc_campaign_summary table
SELECT 'dc_campaign_summary' as table_name,
       COUNT(*) as record_count,
       ARRAY_AGG(DISTINCT client_name) as client_names
FROM dc_campaign_summary 
WHERE client_name ILIKE 'david%';

-- Scan dc_high_priority_accounts table
SELECT 'dc_high_priority_accounts' as table_name,
       COUNT(*) as record_count,
       ARRAY_AGG(DISTINCT client_name) as client_names
FROM dc_high_priority_accounts 
WHERE client_name ILIKE 'david%';

-- Get detailed account information from client_account_predictions
SELECT 
  account_id,
  client_id, 
  client_name,
  debt_amount,
  hand_over_date,
  probability_category,
  action_priority
FROM client_account_predictions 
WHERE client_name ILIKE 'david%'
ORDER BY client_name, account_id
LIMIT 50;

-- Get account IDs that will be affected
SELECT 
  'Account IDs to be deleted:' as summary,
  COUNT(*) as total_accounts,
  SUM(debt_amount) as total_debt_value,
  ARRAY_AGG(account_id ORDER BY account_id) as account_ids
FROM client_account_predictions 
WHERE client_name ILIKE 'david%';

-- Check if any CSV tables also have david clients
DO $$
DECLARE
    table_record RECORD;
    sql_query TEXT;
    result_count INTEGER;
BEGIN
    -- Loop through all CSV data tables
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'csv_data_%'
    LOOP
        -- Check if this CSV table has client_name column
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_record.table_name 
            AND column_name = 'client_name'
        ) THEN
            -- Count david clients in this table
            sql_query := format(
                'SELECT COUNT(*) FROM %I WHERE client_name ILIKE ''david%%''',
                table_record.table_name
            );
            
            EXECUTE sql_query INTO result_count;
            
            IF result_count > 0 THEN
                RAISE NOTICE 'Found % records with david clients in table: %', 
                    result_count, table_record.table_name;
            END IF;
        END IF;
    END LOOP;
END $$;