# Query Processor Context Fix

## Problem
You were getting: "Failed to generate query plan. Could you rephrase your question?"

This happened because the AI query planner didn't understand your database context and couldn't create valid queries.

## Root Cause
The query processor (which runs BEFORE chart generation) lacked:
- ❌ Understanding of prediction_score being 1-10 scale
- ❌ Knowledge of your actual table structure
- ❌ Examples of valid query patterns
- ❌ Proper error logging

## Solution Implemented

### Enhanced Query Planner Prompt
**File:** `src/services/aiQueryProcessor.ts`

**Added:**
1. **Full Database Context** - Same schema info the chart service gets
2. **Data Facts** - prediction_score 1-10, categories, client count
3. **Query Guidelines** - Which tables to use, common patterns
4. **Example Queries** - 3 concrete examples showing proper format
5. **Better Error Logging** - Console logs to debug issues

**Key Additions:**
```typescript
IMPORTANT DATA FACTS:
- prediction_score: Scale 1-10 (10=best, 1=worst). NOT 0-1!
- HIGH category: prediction_score >= 7
- MEDIUM category: prediction_score between 4-6
- LOW category: prediction_score <= 3
- 15,359 accounts across 24 clients
- probability_category values: "HIGH", "MEDIUM", "LOW"

QUERY GUIDELINES:
- Use "client_account_predictions" as main table
- For "high priority" → filter probability_category = "HIGH"
- For "top accounts" → order by prediction_score DESC
- Default limit: 10 (or 50 for visualizations)

EXAMPLE QUERIES:
[3 concrete examples showing proper query format]
```

### Added Error Logging
Now logs the AI's response so you can see what went wrong:
```typescript
console.log('AI Query Plan Response:', cleaned);
console.log('Parsed Query Plan:', parsed);
console.error('Raw response:', response?.content); // on error
```

## How It Works Now

**User asks:** "Show me top 10 accounts by prediction score"

**Query Planner receives:**
1. Full database schema with field descriptions
2. Data facts (15,359 accounts, score is 1-10, etc.)
3. Query guidelines and examples
4. User's question

**Query Planner generates:**
```json
{
  "success": true,
  "table": "client_account_predictions",
  "columns": ["account_id", "client_name", "debt_amount", "prediction_score"],
  "orderBy": {"column": "prediction_score", "ascending": false},
  "limit": 10,
  "description": "Top 10 accounts by prediction score"
}
```

**Then:**
- Query executes against Supabase
- Data returned to user
- Chart service (already enhanced) creates visualization

## Testing

Try these queries that previously failed:

**Test 1:**
```
Show me top 10 accounts by prediction score
```
Should work now - returns accounts ordered by score

**Test 2:**
```
Show accounts with high settlement probability
```
Should filter for probability_category = "HIGH"

**Test 3:**
```
Show debt amounts by client
```
Should return debt amounts properly

**Test 4:**
```
What are the high priority accounts?
```
Should understand "high priority" means HIGH category

## Debugging

If queries still fail, check browser console for:
1. `AI Query Plan Response:` - Shows what AI generated
2. `Parsed Query Plan:` - Shows the parsed JSON
3. Error messages - Shows what went wrong

Common issues:
- OpenAI API key not set → Check `.env` file
- AI returns invalid JSON → Check console logs
- Table doesn't exist → Check table name in query plan

## Files Modified
- ✅ `src/services/aiQueryProcessor.ts` - Enhanced query planner

## Build Status
✅ Build successful - No compilation errors

## What's Different

**Before:**
```
AI: "I don't understand this database structure"
→ Returns: {"success": false, "error": "Failed to generate query plan"}
→ User sees: "Could you rephrase your question?"
```

**After:**
```
AI: "I know this is a debt collection database with prediction_score 1-10"
→ Returns: Valid query plan with correct table and columns
→ Data executes successfully
→ Chart service creates proper visualization
```

## Next Steps

1. **Test the queries** - Try the examples above
2. **Check console logs** - See what the AI generates
3. **Clear cache** if needed - Old cached responses may exist
4. **Report any errors** - Console will show detailed debugging info

---

**The query processor now has full database context just like the chart service!**
