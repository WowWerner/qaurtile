export class DatabaseContextService {
  static getPrimaryTablesSchema(): string {
    return `
PRIMARY TABLES (HIGHEST PRIORITY):

1. enhanced_features_with_actions
   - account_id (integer): Unique account identifier
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

2. client_account_predictions (15,359 accounts across 24 clients)
   - account_id (integer): Account identifier
   - client_id (integer): Client identifier
   - client_name (text): Client name (e.g., "BODY CORPORATE COLLECTIONS", "FNB NAMIBIA", "DEVELOPMENT BANK OF NAMIBIA")
   - client_debtor_id (text): Debtor ID in client's system
   - debt_amount (numeric): Current debt amount (range: $0 - $7.8M, avg: $19,810)
   - hand_over_date (date): Date account was handed over
   - days_since_handover (integer): Days since handover
   - prediction_score (numeric): AI prediction score (IMPORTANT: Scale 1-10, where 10=highest, 1=lowest. NOT 0-1!)
   - probability_category (text): HIGH, MEDIUM, or LOW (categories based on prediction_score)
   - next_action (text): Recommended next action
   - action_priority (text): URGENT, HIGH, or NORMAL
   - action_timeframe (text): Timeframe for action
   - phone_call_count (integer): Number of phone calls made
   - letter_count (integer): Number of letters sent
   - email_count (integer): Number of emails sent
   - total_communications (integer): Total contact attempts
   - promise_to_pay_count (integer): Number of payment promises
   - client_tier (text): High_Performer, Medium_Performer, or Low_Performer

CRITICAL DATA RANGES TO UNDERSTAND:
- prediction_score: 1-10 scale (NOT percentage, NOT 0-1. 10 is best, 1 is worst)
- debt_amount: $0 to $7.8M (average around $20K)
- Probability categories: HIGH (score 7-10), MEDIUM (score 4-6), LOW (score 1-3)
- 24 different clients in the system
- Average days since handover: varies widely
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
      "Show me the total predicted recovery amount by client"
    ];
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
