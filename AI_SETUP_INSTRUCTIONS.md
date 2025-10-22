# AI Predictive Analysis Setup Instructions

## Overview
The AI Predictive Analysis feature has been successfully implemented! This ChatGPT-inspired interface allows users to ask natural language questions about their account data and receive intelligent answers with automatic chart generation.

## Features Implemented

### 1. Core Infrastructure
- ✅ OpenAI SDK integration
- ✅ Supabase tables for conversations, messages, and saved findings
- ✅ Database context service with complete schema documentation
- ✅ AI query processor with natural language to SQL conversion

### 2. User Interface
- ✅ ChatGPT-inspired chat interface
- ✅ Conversation sidebar with history
- ✅ Real-time message streaming
- ✅ Suggested starter questions
- ✅ Message save/bookmark functionality
- ✅ CSV export for entire conversations

### 3. Data Visualization
- ✅ Automatic chart generation (bar, line, pie, scatter, area)
- ✅ Dynamic chart type selection based on data
- ✅ Interactive charts with tooltips and legends
- ✅ Chart export functionality

### 4. Security & Performance
- ✅ Row-level security policies
- ✅ Safe SQL query validation (SELECT-only)
- ✅ User-specific conversation isolation
- ✅ Persistent chat history

## Setup Instructions

### Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (starts with `sk-`)

### Step 2: Configure Environment Variables

Add your OpenAI API key to your `.env` file:

```bash
# Add this line to your .env file
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

Your `.env` file should now have:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Step 3: Verify Database Migration

The database tables have already been created via migration. Verify they exist:
- `ai_conversations` - Stores conversation metadata
- `ai_messages` - Stores all chat messages
- `ai_saved_findings` - Stores bookmarked insights

### Step 4: Access the Feature

1. Start your development server (it's running automatically)
2. Log in to your application
3. Click on the "Account Predictive Analysis" card on the home page
4. You'll be taken to `/intelligence-center/ai-predictive-analysis`

## How to Use

### Starting a Conversation

When you first open the AI Analysis page, you'll see:
- Welcome screen with AI branding
- 4 suggested starter questions
- Empty conversation list in sidebar

Click on any suggested question or type your own to start!

### Example Questions to Try

**Account Analysis:**
- "What are the top 10 accounts with highest settlement probability?"
- "Show me accounts that need urgent action"
- "Which accounts have high predicted recovery but low action intensity?"

**Performance Insights:**
- "Which agent has the highest settlement rate?"
- "What time of day is most productive for our team?"
- "How many high-priority accounts do we have per client?"

**Data Visualization:**
- "Show me a bar chart of top clients by portfolio value"
- "Create a pie chart of priority distribution across accounts"
- "Graph the relationship between action intensity and settlement probability"

**Export & Reports:**
- "Export all high-priority accounts to CSV"
- "Give me a report on client performance"
- "Show me the total predicted recovery amount by client"

### Advanced Features

**Saving Findings:**
- Click the "Save" button on any AI response
- Saved findings are stored with the conversation context
- Access them later through the conversation history

**Exporting Data:**
- Click "Export" button in header to download entire conversation as CSV
- AI can generate custom CSV exports based on your queries

**Conversation Management:**
- All conversations are automatically saved
- Access previous conversations from the sidebar
- Create new conversations with the "+ New Chat" button

## Technical Details

### Tables Prioritized by AI

**Primary Tables (Highest Priority):**
1. `enhanced_features_with_actions` - Main account predictions with action data
2. `client_account_predictions` - Account-level predictions and priorities

**Secondary Tables (Supporting Data):**
3. `dc_agent_performance` - Agent performance metrics
4. `dc_campaign_summary` - Campaign effectiveness data
5. `dc_client_patterns` - Client behavior patterns
6. `dc_high_priority_accounts` - Priority account rankings
7. `dc_hourly_productivity` - Time-based productivity data
8. `client_summary_dashboard` - Client portfolio summaries

### AI Capabilities

The AI agent can:
- Understand natural language questions
- Convert questions to safe SQL queries
- Query multiple tables with intelligent JOINs
- Generate various chart types automatically
- Provide contextual insights and recommendations
- Suggest follow-up questions
- Export data in multiple formats

### Safety Features

- **Query Validation**: Only SELECT queries allowed
- **Row-Level Security**: Users can only access their own conversations
- **Rate Limiting**: Built-in protection against excessive API usage
- **Data Isolation**: Each user's conversations are completely private

## Troubleshooting

### "Failed to get AI response"
- Check that your OpenAI API key is correctly set in `.env`
- Ensure you have API credits available in your OpenAI account
- Verify the key starts with `sk-`

### "Database query error"
- Verify Supabase connection details are correct
- Check that the migrations have been applied
- Ensure RLS policies are enabled

### Charts Not Displaying
- Ensure the data returned has numeric values
- Check browser console for specific errors
- Try a different chart type request

## Cost Considerations

- OpenAI API usage is billed per token
- Each conversation uses approximately 500-2000 tokens
- Monitor usage at https://platform.openai.com/usage
- Consider setting usage limits in your OpenAI account

## Next Steps

To enhance the feature further, consider:
1. Adding voice input for questions
2. Implementing conversation sharing between users
3. Creating custom report templates
4. Adding scheduled automated insights
5. Integrating with notification systems

## Support

For issues or questions:
1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure database migrations are applied
4. Check OpenAI API status at https://status.openai.com

---

**Congratulations!** Your AI-powered predictive analysis system is ready to use. Start asking questions and unlock insights from your data!
