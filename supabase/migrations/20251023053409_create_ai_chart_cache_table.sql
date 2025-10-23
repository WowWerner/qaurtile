/*
  # Create AI Chart Cache Table

  1. New Tables
    - `ai_chart_cache`
      - `id` (uuid, primary key) - Unique identifier
      - `query_hash` (text, unique) - Hash of user query + data characteristics for cache lookup
      - `user_id` (uuid) - Reference to auth.users
      - `query_text` (text) - Original user query
      - `data_sample` (jsonb) - Sample of data used for chart generation
      - `chart_configuration` (jsonb) - AI-generated chart configuration
      - `confidence_score` (numeric) - Confidence score from AI (0-1)
      - `usage_count` (integer) - Number of times this config was used
      - `created_at` (timestamptz) - When cache entry was created
      - `updated_at` (timestamptz) - Last time cache was accessed
      - `expires_at` (timestamptz) - When cache entry should be considered stale

  2. Security
    - Enable RLS on `ai_chart_cache` table
    - Add policies for authenticated users to:
      - Read their own cache entries
      - Create new cache entries
      - Update usage count on their entries
    - Add index on query_hash for fast lookups
    - Add index on user_id for user-specific queries
    - Add index on expires_at for cleanup queries
*/

CREATE TABLE IF NOT EXISTS ai_chart_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text text NOT NULL,
  data_sample jsonb NOT NULL,
  chart_configuration jsonb NOT NULL,
  confidence_score numeric(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  usage_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

ALTER TABLE ai_chart_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chart cache"
  ON ai_chart_cache
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create chart cache"
  ON ai_chart_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chart cache"
  ON ai_chart_cache
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_chart_cache_query_hash ON ai_chart_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_ai_chart_cache_user_id ON ai_chart_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chart_cache_expires_at ON ai_chart_cache(expires_at);

CREATE OR REPLACE FUNCTION update_chart_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_chart_cache_timestamp
BEFORE UPDATE ON ai_chart_cache
FOR EACH ROW
EXECUTE FUNCTION update_chart_cache_timestamp();
