-- Clear AI Chart Cache
-- Run this after updating AI context to remove old cached charts

-- Option 1: Clear ALL cached charts for all users
DELETE FROM ai_chart_cache;

-- Option 2: Clear only your cached charts (if you know your user_id)
-- DELETE FROM ai_chart_cache WHERE user_id = 'your-user-id-here';

-- Option 3: Clear only old/expired caches
-- DELETE FROM ai_chart_cache WHERE expires_at < NOW();

-- Verify cache is cleared
SELECT COUNT(*) as remaining_cache_entries FROM ai_chart_cache;
