/*
  # Remove specific clients from enhanced features table

  1. Data Cleanup
    - Remove "Test" client records
    - Remove "DAVID TRADING COLLEC" client records  
    - Remove "DEBTOR INFO" client records
    - Remove "QAURTILE TRACING" client records

  2. Purpose
    - Clean up test/invalid client data from the enhanced features table
    - Improve data quality in client performance analysis
*/

-- Remove the specified clients from enhanced_features_with_actions table
DELETE FROM enhanced_features_with_actions 
WHERE client_name IN (
  'Test',
  'test', 
  'TEST',
  'DAVID TRADING COLLEC',
  'David Trading Collec',
  'david trading collec',
  'DEBTOR INFO',
  'Debtor Info',
  'debtor info',
  'QAURTILE TRACING',
  'Qaurtile Tracing',
  'quartile tracing'
);