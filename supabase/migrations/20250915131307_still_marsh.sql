/*
  # Clean up test and invalid data from enhanced features

  1. Data Cleanup
    - Remove accounts with client_division starting with 'david'
    - Remove accounts with client_division starting with 'test' 
    - Remove accounts with client_division starting with 'debtor info'
  
  2. Security
    - Ensure data integrity is maintained
    - Use safe deletion with WHERE clauses
*/

-- Clean up test and invalid data from enhanced_features_with_actions table
DELETE FROM enhanced_features_with_actions 
WHERE 
  LOWER(client_division) LIKE 'david%' OR
  LOWER(client_division) LIKE 'test%' OR 
  LOWER(client_division) LIKE 'debtor info%';

-- Log the cleanup for audit purposes
INSERT INTO dc_analysis_metadata (
  analysis_date,
  total_real_agents,
  total_accounts_analyzed,
  model_version,
  analysis_summary
) VALUES (
  NOW(),
  0,
  0,
  '2.4',
  '{"cleanup_action": "removed_test_data", "removed_patterns": ["david%", "test%", "debtor info%"], "table": "enhanced_features_with_actions"}'
);