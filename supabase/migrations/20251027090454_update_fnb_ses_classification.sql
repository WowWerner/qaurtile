/*
  # Update FNB SES Classification for Existing Data

  1. Purpose
    - Recalculate SES (Socio-Economic Status) for all existing fnb_debtors records
    - Apply improved SES inference logic that handles Namibian address patterns
    - Update "Unknown" SES values to proper classifications: High, Medium, or Low

  2. Changes
    - Creates a PL/pgSQL function to infer SES based on address and postal code patterns
    - Updates all existing fnb_debtors records with recalculated SES values
    - Handles various address patterns: neighborhood names, street patterns, ERF numbers, informal settlements

  3. SES Classification Logic
    - High SES: Upmarket neighborhoods (Ludwigsdorf, Eros, Olympia, etc.)
    - Medium SES: Mid-income areas (Pioneers Park, Khomasdal, etc.) and addresses with proper street names
    - Low SES: Townships (Katutura, Havana, etc.), informal settlements, high ERF numbers
    - Unknown: Addresses that don't match any patterns

  4. Notes
    - Safe to run multiple times (idempotent)
    - Does not affect other columns or scoring
    - Improves analysis accuracy for Contact, Address, Demographics, and Payment pages
*/

-- Create function to infer SES from address and postal code
CREATE OR REPLACE FUNCTION infer_ses_from_address(
  street_addr TEXT,
  postal_addr TEXT,
  street_code TEXT,
  postal_code TEXT
) RETURNS TEXT AS $$
DECLARE
  address TEXT;
  postal_num INTEGER;
BEGIN
  -- Use street address, fallback to postal address
  address := COALESCE(street_addr, postal_addr, '');
  address := LOWER(address);
  
  -- Check for direct neighborhood matches (High SES)
  IF address ~ '(ludwigsdorf|auasblick|klein windhoek|eros|olympia|luxuryhill|avis|finkenstein|cimbebasia|suiderhof|kleine kuppe|elisenheim)' THEN
    RETURN 'High';
  END IF;
  
  -- Check for mid-income neighborhoods
  IF address ~ '(pioneers park|pionierspark|hochland park|rocky crest|khomasdal|otjomuise|windhoek west|windhoek north|academia|dorado park|prosperita|lafrenz)' THEN
    RETURN 'Medium';
  END IF;
  
  -- Check for low-income areas
  IF address ~ '(katutura|havana|okuryangava|greenwell matongo|hakahana|wanaheda|goreangab|okahandja park|one nation|ombili)' THEN
    RETURN 'Low';
  END IF;
  
  -- Check for explicit low-income indicators
  IF address ~ '(informal|settlement|village|location)' THEN
    RETURN 'Low';
  END IF;
  
  -- Check for high ERF numbers (4+ digits often indicate newer townships)
  IF address ~ 'erf\s+\d{4,}' THEN
    RETURN 'Low';
  END IF;
  
  -- Check for upmarket street patterns
  IF address ~ '(olive|cedar|pine|oak|maple|elm)\s+(st|street|ave|avenue|rd|road)' THEN
    RETURN 'High';
  END IF;
  
  IF address ~ '(park|garden|grove|valley|hill|ridge|crest)\s+(st|street|ave|avenue|rd|road)' THEN
    RETURN 'High';
  END IF;
  
  -- Check postal code if available
  IF street_code IS NOT NULL OR postal_code IS NOT NULL THEN
    postal_num := (regexp_replace(COALESCE(street_code, postal_code, '0'), '\D', '', 'g'))::INTEGER;
    IF postal_num >= 9000 AND postal_num <= 9999 THEN
      RETURN 'High';
    ELSIF postal_num >= 1000 AND postal_num <= 8999 THEN
      RETURN 'Medium';
    ELSIF postal_num > 0 AND postal_num < 1000 THEN
      RETURN 'Low';
    END IF;
  END IF;
  
  -- Default: if has proper street name pattern, assume Medium
  IF address ~ '(st|street|ave|avenue|rd|road|drive|lane)' THEN
    RETURN 'Medium';
  END IF;
  
  -- Otherwise Unknown
  RETURN 'Unknown';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all existing fnb_debtors records with new SES classification
UPDATE fnb_debtors
SET ses = infer_ses_from_address(
  street_line1,
  postal_line1,
  street_postal_code,
  postal_postal_code
)
WHERE ses = 'Unknown' OR ses IS NULL;

-- Log the results
DO $$
DECLARE
  total_count INTEGER;
  high_count INTEGER;
  medium_count INTEGER;
  low_count INTEGER;
  unknown_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM fnb_debtors;
  SELECT COUNT(*) INTO high_count FROM fnb_debtors WHERE ses = 'High';
  SELECT COUNT(*) INTO medium_count FROM fnb_debtors WHERE ses = 'Medium';
  SELECT COUNT(*) INTO low_count FROM fnb_debtors WHERE ses = 'Low';
  SELECT COUNT(*) INTO unknown_count FROM fnb_debtors WHERE ses = 'Unknown';
  
  RAISE NOTICE 'FNB SES Update Complete:';
  RAISE NOTICE '  Total records: %', total_count;
  RAISE NOTICE '  High SES: %', high_count;
  RAISE NOTICE '  Medium SES: %', medium_count;
  RAISE NOTICE '  Low SES: %', low_count;
  RAISE NOTICE '  Unknown SES: %', unknown_count;
END $$;
