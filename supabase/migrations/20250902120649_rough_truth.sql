/*
# Add Custom Name Field to CSV Uploads

1. Schema Changes
   - Add `name` field to `csv_uploads` table for custom user-defined names
   - Keep `filename` field for original file reference
   - Add validation constraint for name length

2. Updates
   - Allow custom naming while preserving original filename
   - Ensure both name and filename are properly indexed
*/

-- Add custom name field to csv_uploads table
ALTER TABLE csv_uploads 
ADD COLUMN IF NOT EXISTS name text;

-- Add constraint to ensure name is not empty and reasonable length
ALTER TABLE csv_uploads 
ADD CONSTRAINT csv_uploads_name_length_check 
CHECK (length(name) > 0 AND length(name) <= 255);

-- Create index for faster name-based queries
CREATE INDEX IF NOT EXISTS idx_csv_uploads_name 
ON csv_uploads (name);

-- Update existing records to use filename as default name if name is null
UPDATE csv_uploads 
SET name = filename 
WHERE name IS NULL OR name = '';