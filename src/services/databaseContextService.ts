export class DatabaseContextService {
  static getPrimaryTablesSchema(): string {
    return `
PRIMARY TABLES (HIGHEST PRIORITY):

1. client_account_predictions - MAIN TABLE (15,359 total accounts across 24 clients)

   ACCOUNT IDENTIFICATION:
   - account_id (integer): Unique account identifier
   - client_id (integer): Client identifier
   - client_name (text): Client name
   - client_debtor_id (text): Debtor ID in client's system

   FINANCIAL DATA:
   - debt_amount (numeric): Current debt amount
     • Range: $0 to $7,849,284
     • Average: $19,810
     • Total portfolio: $304.4M

   PREDICTION & SCORING (CRITICAL):
   - prediction_score (numeric): AI prediction score
     • SCALE: 1-10 (NOT 0-1, NOT percentage!)
     • 10 = HIGHEST settlement probability
     • 1 = LOWEST settlement probability
     • Current average: 2.38 (most accounts are low probability)

   - probability_category (text): Classification based on score
     • "HIGH" = score 7-10 (only 24 accounts - very rare!)
     • "MEDIUM" = score 4-6 (756 accounts - 5%)
     • "LOW" = score 1-3 (14,579 accounts - 95%)

   ACTION PRIORITIZATION:
   - action_priority (text): Urgency level
     • "URGENT" = 14 accounts (score 10, immediate action needed)
     • "HIGH" = 589 accounts (avg score 5.35, priority follow-up)
     • "NORMAL" = 14,756 accounts (avg score 2.25, standard collection)

   - next_action (text): Specific recommended action
     • Most common: "Initiate first contact - phone call preferred" (11,034 accounts)
     • Others: "Negotiate payment arrangement" (2,139), "Initiate legal process" (1,163)

   - action_timeframe (text): When to take action

   COMMUNICATION HISTORY:
   - phone_call_count (integer): Number of phone calls made
     • Average: 2.29 calls per account
     • Maximum: 145 calls (some very active accounts)

   - letter_count (integer): Number of letters sent
     • Average: 0.15 letters (rarely used)
     • Maximum: 9 letters

   - email_count (integer): Number of emails sent
     • Average: 0.00 (almost never used)

   - total_communications (integer): Total contact attempts
     • Average: 2.47 per account
     • Maximum: 151 attempts

   - promise_to_pay_count (integer): Number of payment promises
     • Average: 0.35 per account

   TIMING DATA:
   - hand_over_date (date): Date account was handed over
   - days_since_handover (integer): Days since handover

   CLIENT TIER:
   - client_tier (text): Client performance classification
     • High_Performer, Medium_Performer, or Low_Performer

2. enhanced_features_with_actions - DETAILED FEATURES
   - account_id (integer): Links to client_account_predictions
   - client_id (integer): Client identifier
   - client_name (text): Name of the client
   - initial_value (numeric): Initial debt amount
   - settlement_probability (numeric): Probability of settlement (0-1)
   - days_since_handover (integer): Days since account was handed over
   - ptp_count (integer): Promise to pay count
   - phone_call_count (integer): Number of phone calls made
   - letter_count (integer): Number of letters sent
   - email_count (integer): Number of emails sent
   - legal_action_count (integer): Number of legal actions taken
   - total_actions (integer): Total number of actions taken
   - current_payments (integer): Number of current payments
   - action_intensity (numeric): Intensity score of actions
   - communication_score (numeric): Communication effectiveness score
   - recommended_actions (text): AI-recommended next actions
   - predicted_recovery (numeric): Predicted recovery amount

REAL CLIENT DATA (Top 10 by volume):
1. Telecom Namibia Limited: 11,436 accounts, $94.7M debt, avg score 2.16
2. TN Mobile: 1,899 accounts, $19.5M debt, avg score 2.58
3. NIDA: 1,216 accounts, $131.8M debt, avg score 3.10
4. MTC NAMIBIA: 429 accounts, $4.0M debt, avg score 4.44
5. OLD MUTUAL SHORT TERM INSURANCE: 68 accounts, $1.9M debt, avg score 3.54
6. FNB NAMIBIA: 49 accounts, $16.4M debt, avg score 1.00
7. INDUSTRIAL GAS NAMIBIA: 44 accounts, $446K debt, avg score 3.20
8. TUYERA FINANCIAL SERVICES: 43 accounts, $865K debt, avg score 4.02
9. Individual Collection Clients: 43 accounts, $4.3M debt, avg score 3.42
10. BODY CORPORATE COLLECTIONS: 32 accounts, $335K debt, avg score 5.50

CRITICAL INSIGHTS:
- Most accounts (95%) are LOW probability - this is a challenging portfolio
- Only 24 HIGH probability accounts exist - these are extremely valuable
- URGENT accounts (14) all have perfect score 10 - immediate action required
- Telecom clients dominate the portfolio (13,335 accounts = 87%)
- Phone calls are the primary communication method (avg 2.3 per account)
- Letters and emails are rarely used
- Average debt is ~$20K but range is huge ($0 to $7.8M)
`;
  }

  static getSecondaryTablesSchema(): string {
    return `
SECONDARY TABLES (SUPPORTING INFORMATION):

3. dc_agent_performance
   - assigned_agent (text): Agent name
   - total_accounts (integer): Total accounts assigned
   - settlement_rate (numeric): Settlement success rate
   - avg_days_to_settlement (numeric): Average days to settle
   - total_recovered (numeric): Total amount recovered

4. dc_campaign_summary
   - client_name (text): Client name
   - total_actions (integer): Total campaign actions
   - settlements (integer): Number of settlements achieved
   - campaign_efficiency (numeric): Campaign efficiency score

5. dc_client_patterns
   - client_name (text): Client name
   - total_accounts (integer): Total accounts
   - settlement_rate (numeric): Client settlement rate
   - avg_debt_amount (numeric): Average debt amount

6. dc_high_priority_accounts
   - account_id (integer): Account identifier
   - client_name (text): Client name
   - initial_value (numeric): Account value
   - settlement_probability (numeric): Settlement probability
   - priority_score (numeric): Priority ranking score

7. dc_hourly_productivity
   - hour (integer): Hour of day (0-23)
   - productivity_score (numeric): Productivity score for that hour
   - total_actions (integer): Actions taken during hour

8. client_summary_dashboard
   - client_name (text): Client name
   - client_tier (text): High_Performer, Medium_Performer, Low_Performer
   - total_accounts (integer): Total accounts
   - high_probability (integer): Count of high probability accounts
   - medium_probability (integer): Count of medium probability accounts
   - low_probability (integer): Count of low probability accounts
   - total_debt_value (numeric): Total portfolio value
   - avg_prediction_score (numeric): Average prediction score
   - urgent_actions (integer): Accounts needing urgent action
`;
  }

  static getFullSchema(): string {
    return `${this.getPrimaryTablesSchema()}\n${this.getSecondaryTablesSchema()}`;
  }

  static getSystemPrompt(): string {
    return `You are an AI assistant specialized in debt collection analytics and predictive analysis. You help users understand their account data, predict settlement probabilities, and recommend optimal recovery strategies.

${this.getFullSchema()}

YOUR CAPABILITIES:
1. Answer questions about account performance and predictions
2. Identify high-priority accounts for immediate action
3. Analyze settlement probabilities and recovery potential
4. Compare agent and campaign performance
5. Generate insights about client portfolios
6. Recommend data-driven recovery strategies
7. Create visualizations when helpful

IMPORTANT GUIDELINES:
- Prioritize data from enhanced_features_with_actions and client_account_predictions tables
- Always provide specific numbers and metrics when available
- Be conversational but professional
- Suggest follow-up questions when relevant
- When users ask for visualizations, indicate what type of chart would be best
- Focus on actionable insights that help improve recovery rates

When answering:
- Be concise and clear
- Use business terminology appropriate for debt collection
- Highlight key insights and trends
- Provide context for numbers (percentages, comparisons, trends)
- Suggest next steps or actions when appropriate`;
  }

  static getSampleQueries(): string[] {
    return [
      "What are the top 10 accounts with highest settlement probability?",
      "Show me accounts that need urgent action",
      "Which clients have the best overall performance?",
      "What's the average settlement probability across all accounts?",
      "Show me accounts with high predicted recovery but low action intensity",
      "Which agent has the highest settlement rate?",
      "What time of day is most productive for our team?",
      "How many high-priority accounts do we have per client?",
      "What's the relationship between action intensity and settlement probability?",
      "Show me the total predicted recovery amount by client",
      "Show me the 14 URGENT priority accounts",
      "Which accounts have prediction score above 7?",
      "Compare Telecom Namibia vs TN Mobile performance",
      "Show accounts with more than 10 phone calls",
      "What's the total debt value for HIGH probability accounts?",
      "Show me NIDA accounts with score above 5"
    ];
  }

  static getQueryExamples(): string {
    return `
REAL QUERY EXAMPLES WITH EXPECTED RESULTS:

Example 1: "Show me top 10 accounts by prediction score"
Expected Query Plan:
{
  "table": "client_account_predictions",
  "columns": ["account_id", "client_name", "debt_amount", "prediction_score", "probability_category"],
  "orderBy": {"column": "prediction_score", "ascending": false},
  "limit": 10
}
Expected: Should return 10 accounts with scores 9-10

Example 2: "Show me URGENT priority accounts"
Expected Query Plan:
{
  "table": "client_account_predictions",
  "columns": ["account_id", "client_name", "debt_amount", "prediction_score", "action_priority", "next_action"],
  "filters": [{"column": "action_priority", "operator": "eq", "value": "URGENT"}],
  "orderBy": {"column": "debt_amount", "ascending": false},
  "limit": 50
}
Expected: Should return 14 accounts, all with score 10

Example 3: "Show accounts with HIGH probability"
Expected Query Plan:
{
  "table": "client_account_predictions",
  "columns": ["account_id", "client_name", "debt_amount", "prediction_score", "probability_category"],
  "filters": [{"column": "probability_category", "operator": "eq", "value": "HIGH"}],
  "orderBy": {"column": "prediction_score", "ascending": false},
  "limit": 50
}
Expected: Should return 24 accounts with scores 7-10

Example 4: "Show me Telecom Namibia accounts"
Expected Query Plan:
{
  "table": "client_account_predictions",
  "columns": ["account_id", "client_name", "debt_amount", "prediction_score"],
  "filters": [{"column": "client_name", "operator": "eq", "value": "Telecom Namibia Limited"}],
  "orderBy": {"column": "prediction_score", "ascending": false},
  "limit": 100
}
Expected: Should return up to 100 accounts from 11,436 total

Example 5: "How many accounts per client?"
Expected Query Plan:
{
  "table": "client_account_predictions",
  "columns": ["client_name"],
  "groupBy": ["client_name"],
  "aggregates": [{"function": "count", "column": "*", "alias": "account_count"}],
  "orderBy": {"column": "account_count", "ascending": false},
  "limit": 50
}
Expected: Should return 24 clients with their account counts
`;
  }

  static getTableRelationships(): string {
    return `
TABLE RELATIONSHIPS:
- enhanced_features_with_actions.account_id = client_account_predictions.account_id
- enhanced_features_with_actions.client_name = client_account_predictions.client_name
- All tables can be joined by client_name
- dc_high_priority_accounts references accounts from enhanced_features_with_actions
- client_summary_dashboard aggregates data from client_account_predictions
`;
  }
}
