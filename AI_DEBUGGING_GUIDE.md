# AI Debugging Guide - Query Failure Investigation

## Issue
Getting error: "I encountered an issue while querying the database: Failed to generate query plan. Could you rephrase your question?"

## What I've Enhanced

### 1. Increased OpenAI Timeout
**File:** `src/services/openaiService.ts`
```typescript
timeout: 60000, // 60 seconds (was unlimited, could hang)
maxRetries: 2    // Will retry failed calls
```

### 2. Comprehensive Error Logging
**Added detailed console logging at every step:**

**OpenAI Service:**
- API call initiation
- Model and message details
- Response length
- Detailed error info (type, message, code, status)

**Query Processor:**
- Query plan generation start
- User query and schema length
- OpenAI response content
- Parsed query plan (full JSON)
- Step-by-step error details

## How to Debug

### Step 1: Open Browser Console
Press **F12** or **Ctrl+Shift+I** (Windows/Linux) or **Cmd+Option+I** (Mac)

### Step 2: Try a Query
Type something simple like:
```
Show me top 10 accounts
```

### Step 3: Check Console Logs
Look for these specific log messages:

#### ✅ Success Path:
```
=== GENERATING QUERY PLAN ===
User Query: Show me top 10 accounts
Schema length: [some number]
=== CALLING OPENAI API ===
Model: gpt-4-turbo-preview
Message count: 2
OpenAI API call successful
Response content length: [number]
OpenAI Response received
Response content: [JSON content]
Cleaned response: [JSON content]
Parsed Query Plan: {
  "success": true,
  "table": "client_account_predictions",
  ...
}
```

#### ❌ Failure Path - What to Look For:

**1. OpenAI API Error:**
```
=== OPENAI API ERROR ===
Error type: [error type]
Error message: [what went wrong]
Error code: [API error code]
Error status: [HTTP status]
```

**Common OpenAI Errors:**
- `401 Unauthorized` → API key invalid or expired
- `429 Rate Limit` → Too many requests, wait or upgrade
- `500 Internal Server Error` → OpenAI service issue
- `timeout` → Request took longer than 60 seconds
- `invalid_api_key` → API key format wrong

**2. Query Plan Error:**
```
=== QUERY PLAN GENERATION ERROR ===
Error type: [error type]
Error message: [what went wrong]
```

**Common Query Plan Errors:**
- `JSON parse error` → AI returned invalid JSON
- `Network error` → Can't reach OpenAI API
- `undefined` errors → Missing response data

## Specific Debugging Steps

### Issue: API Key Invalid
**Console shows:** `Error: 401 Unauthorized` or `invalid_api_key`

**Solution:**
1. Check `.env` file has `VITE_OPENAI_API_KEY`
2. Verify key starts with `sk-proj-` or `sk-`
3. Get new key from https://platform.openai.com/api-keys
4. Update `.env` file
5. Restart dev server

### Issue: Rate Limit
**Console shows:** `Error: 429 Too Many Requests`

**Solution:**
1. Wait 1 minute and try again
2. Check your OpenAI usage at https://platform.openai.com/usage
3. Upgrade plan if needed
4. Consider implementing request throttling

### Issue: Timeout
**Console shows:** `Error: timeout` or request hangs

**Solution:**
1. Schema might be too large
2. OpenAI API might be slow
3. I've already increased timeout to 60s
4. Try simpler queries first

### Issue: Invalid JSON Response
**Console shows:** `JSON parse error` after "Response content:"

**Solution:**
1. Check what the AI actually returned (in console)
2. AI might be returning text instead of JSON
3. Prompt might need adjustment
4. Model might be confused

### Issue: Network Error
**Console shows:** `Network error` or `Failed to fetch`

**Solution:**
1. Check internet connection
2. Check if OpenAI API is down: https://status.openai.com/
3. Check browser console for CORS errors
4. Verify `dangerouslyAllowBrowser: true` is set

## Testing Commands

### Test 1: Simple Query
```
Show me top 10 accounts
```
Expected: Should generate query plan for client_account_predictions table

### Test 2: Specific Filter
```
Show accounts with high probability
```
Expected: Should filter for probability_category = "HIGH"

### Test 3: Aggregation
```
How many accounts do we have?
```
Expected: Should count records

## Environment Check

Run these checks:

### 1. Verify OpenAI Key Exists
```bash
# In terminal
grep "VITE_OPENAI_API_KEY" .env
```
Should show: `VITE_OPENAI_API_KEY=sk-proj-...`

### 2. Verify Key Format
Key should start with:
- `sk-proj-` (project key) OR
- `sk-` (standard key)

### 3. Check Supabase Connection
```javascript
// In browser console
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```
Both should show values

## What the Logs Tell You

### Good Signs:
✅ "=== CALLING OPENAI API ===" appears
✅ "OpenAI API call successful" appears
✅ "Parsed Query Plan:" shows valid JSON
✅ "success": true in query plan
✅ No error messages in red

### Bad Signs:
❌ "=== OPENAI API ERROR ===" appears
❌ "=== QUERY PLAN GENERATION ERROR ===" appears
❌ Error messages in red
❌ Logs stop at certain point
❌ No response content shown

## Advanced Debugging

### Enable Verbose Logging
Already enabled! Every step logs to console.

### Test OpenAI API Directly
```javascript
// In browser console (F12)
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [{role: 'user', content: 'Hello'}]
}).then(r => console.log('SUCCESS:', r))
  .catch(e => console.error('FAILED:', e));
```

### Check Network Tab
1. Open DevTools → Network tab
2. Try a query
3. Look for requests to `api.openai.com`
4. Check status code and response

## Summary

**The system now has:**
- ✅ 60-second timeout (prevents hanging)
- ✅ 2 automatic retries (handles transient failures)
- ✅ Comprehensive error logging (see exactly what fails)
- ✅ Step-by-step console output (track progress)

**Next steps:**
1. Open browser console (F12)
2. Try a simple query
3. Check console logs
4. Find the specific error
5. Follow the solution above

**The detailed console logs will show EXACTLY where and why it's failing!**
