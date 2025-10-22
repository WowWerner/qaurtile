import { supabase } from '../lib/supabase';
import { OpenAIService } from './openaiService';
import { DatabaseContextService } from './databaseContextService';

export interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  sqlQuery?: string;
  rowCount?: number;
}

export interface AIAnalysisResult {
  answer: string;
  queryResult?: QueryResult;
  chartConfig?: any;
  suggestions?: string[];
}

export class AIQueryProcessor {
  static async processUserQuery(userMessage: string, conversationHistory: any[]): Promise<AIAnalysisResult> {
    try {
      const schema = DatabaseContextService.getFullSchema();
      const intent = await OpenAIService.analyzeQueryIntent(userMessage, schema);

      if (intent.needsDatabase) {
        const queryResult = await this.executeQuery(userMessage, schema);

        if (queryResult.success && queryResult.data) {
          const answer = await this.generateAnswerFromData(
            userMessage,
            queryResult.data
          );

          let chartConfig = null;
          if (intent.needsVisualization && queryResult.data.length > 0) {
            chartConfig = this.generateChartConfig(
              queryResult.data,
              intent.visualizationType || 'bar'
            );
          }

          return {
            answer,
            queryResult,
            chartConfig,
            suggestions: this.generateSuggestions(queryResult.data)
          };
        } else {
          return {
            answer: `I encountered an issue while querying the database: ${queryResult.error}. Could you rephrase your question?`,
            queryResult
          };
        }
      } else {
        const messages = [
          { role: 'system' as const, content: DatabaseContextService.getSystemPrompt() },
          ...conversationHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })),
          { role: 'user' as const, content: userMessage }
        ];

        const response = await OpenAIService.chat(messages);

        return {
          answer: response.content,
          suggestions: DatabaseContextService.getSampleQueries().slice(0, 3)
        };
      }
    } catch (error: any) {
      console.error('Query processing error:', error);
      return {
        answer: `I apologize, but I encountered an error: ${error.message}. Please try rephrasing your question or ask something else.`,
      };
    }
  }

  private static async executeQuery(userQuery: string, schema: string): Promise<QueryResult> {
    try {
      const queryPlan = await this.generateQueryPlan(userQuery, schema);

      if (!queryPlan.success) {
        return {
          success: false,
          error: queryPlan.error || 'Failed to understand query',
          sqlQuery: ''
        };
      }

      const { data, error } = await this.executeSupabaseQuery(queryPlan);

      if (error) {
        console.error('Database query error:', error);
        return {
          success: false,
          error: error.message || 'Failed to execute query',
          sqlQuery: queryPlan.description || ''
        };
      }

      return {
        success: true,
        data: data || [],
        sqlQuery: queryPlan.description || 'Query executed successfully',
        rowCount: data?.length || 0
      };
    } catch (error: any) {
      console.error('Query execution error:', error);
      return {
        success: false,
        error: error.message,
        sqlQuery: ''
      };
    }
  }

  private static async generateQueryPlan(userQuery: string, schema: string): Promise<any> {
    try {
      const response = await OpenAIService.chat([
        {
          role: 'system',
          content: `You are a query planner for a Supabase database. Analyze the user's question and return a JSON query plan.

Available tables:
${schema}

Return ONLY a JSON object with this structure:
{
  "success": true,
  "table": "table_name",
  "columns": ["col1", "col2"],
  "filters": [{"column": "name", "operator": "eq", "value": "something"}],
  "orderBy": {"column": "name", "ascending": false},
  "limit": 10,
  "description": "Human readable description of the query"
}

Operators: eq, gt, lt, gte, lte, like, ilike
If query is too complex, return {"success": false, "error": "reason"}`
        },
        {
          role: 'user',
          content: userQuery
        }
      ]);

      const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Query plan generation error:', error);
      return { success: false, error: 'Failed to generate query plan' };
    }
  }

  private static async executeSupabaseQuery(plan: any): Promise<{ data: any[] | null, error: any }> {
    try {
      let query: any = supabase.from(plan.table).select(plan.columns?.join(',') || '*');

      if (plan.filters && Array.isArray(plan.filters)) {
        for (const filter of plan.filters) {
          const op = filter.operator;
          const col = filter.column;
          const val = filter.value;

          if (op === 'eq') {
            query = query.eq(col, val);
          } else if (op === 'gt') {
            query = query.gt(col, val);
          } else if (op === 'lt') {
            query = query.lt(col, val);
          } else if (op === 'gte') {
            query = query.gte(col, val);
          } else if (op === 'lte') {
            query = query.lte(col, val);
          } else if (op === 'like') {
            query = query.like(col, val);
          } else if (op === 'ilike') {
            query = query.ilike(col, val);
          }
        }
      }

      if (plan.orderBy) {
        query = query.order(plan.orderBy.column, { ascending: plan.orderBy.ascending !== false });
      }

      const limitValue = plan.limit || 100;
      query = query.limit(limitValue);

      const { data, error } = await query;
      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    }
  }


  private static async generateAnswerFromData(
    userQuery: string,
    data: any[]
  ): Promise<string> {
    const dataPreview = data.slice(0, 10).map((row) => {
      const simplified: any = {};
      Object.keys(row).slice(0, 6).forEach(key => {
        simplified[key] = row[key];
      });
      return simplified;
    });

    const messages = [
      {
        role: 'system' as const,
        content: `You are a data analyst. The user asked a question and we retrieved data from the database.

Provide a clear, conversational answer that:
1. Directly answers the user's question
2. Highlights key insights and patterns
3. Uses specific numbers and metrics
4. Suggests implications or next steps

Keep your response concise (2-4 paragraphs).`
      },
      {
        role: 'user' as const,
        content: `User question: "${userQuery}"

Retrieved ${data.length} rows. Here's a preview:
${JSON.stringify(dataPreview, null, 2)}

Please provide an insightful answer.`
      }
    ];

    const response = await OpenAIService.chat(messages);
    return response.content;
  }

  private static generateChartConfig(data: any[], chartType: string): any {
    if (data.length === 0) return null;

    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    const numericKeys = keys.filter(key =>
      typeof firstRow[key] === 'number' && key !== 'id'
    );
    const labelKeys = keys.filter(key =>
      typeof firstRow[key] === 'string' && data.length <= 50
    );

    const labelKey = labelKeys[0] || keys[0];
    const valueKeys = numericKeys.slice(0, 3);

    return {
      type: chartType,
      data: data.slice(0, 50),
      labelKey,
      valueKeys,
      colors: ['#00ABAE', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
    };
  }

  private static generateSuggestions(data: any[]): string[] {
    const suggestions = [
      "Show me a chart of this data",
      "What insights can you draw from this?",
      "How does this compare to the overall average?",
    ];

    if (data.length > 10) {
      suggestions.push("Show me the top 5 only");
    }

    return suggestions;
  }

  static async streamResponse(
    userMessage: string,
    conversationHistory: any[],
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const messages = [
      { role: 'system' as const, content: DatabaseContextService.getSystemPrompt() },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: userMessage }
    ];

    await OpenAIService.chatStream(messages, onChunk);
  }
}
