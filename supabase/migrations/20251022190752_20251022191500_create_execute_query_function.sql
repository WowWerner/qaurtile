/*
  # Create Execute Query Function for AI Analysis

  1. New Function
    - `execute_dynamic_query` - Safely executes SELECT queries for AI analysis
    - Returns query results as JSONB
    - Only allows SELECT statements
    - Validates queries before execution

  2. Security
    - Function restricted to authenticated users
    - Query validation to prevent dangerous operations
    - Returns error messages for invalid queries
*/

-- Create function to execute dynamic SELECT queries safely
CREATE OR REPLACE FUNCTION execute_dynamic_query(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  query_upper TEXT;
BEGIN
  -- Convert query to uppercase for validation
  query_upper := UPPER(TRIM(query_text));

  -- Validate that query starts with SELECT
  IF query_upper NOT LIKE 'SELECT%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Check for dangerous keywords
  IF query_upper LIKE '%INSERT%'
     OR query_upper LIKE '%UPDATE%'
     OR query_upper LIKE '%DELETE%'
     OR query_upper LIKE '%DROP%'
     OR query_upper LIKE '%ALTER%'
     OR query_upper LIKE '%CREATE%'
     OR query_upper LIKE '%TRUNCATE%'
     OR query_upper LIKE '%GRANT%'
     OR query_upper LIKE '%REVOKE%' THEN
    RAISE EXCEPTION 'Query contains forbidden operations';
  END IF;

  -- Execute query and return results as JSONB
  EXECUTE format('SELECT jsonb_agg(row_to_json(t.*)) FROM (%s) t', query_text) INTO result;

  -- Return empty array if no results
  IF result IS NULL THEN
    result := '[]'::jsonb;
  END IF;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error as JSONB
    RETURN jsonb_build_object(
      'error', TRUE,
      'message', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_dynamic_query(TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION execute_dynamic_query IS 'Executes SELECT queries safely for AI analysis, returning results as JSONB';
