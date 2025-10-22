import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  sqlQuery?: string;
  chartConfig?: any;
  needsVisualization: boolean;
}

export class OpenAIService {
  static async chat(messages: ChatMessage[]): Promise<AIResponse> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        content,
        needsVisualization: false,
      };
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      throw new Error(error.message || 'Failed to get AI response');
    }
  }

  static async chatStream(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }
    } catch (error: any) {
      console.error('OpenAI Streaming Error:', error);
      throw new Error(error.message || 'Failed to stream AI response');
    }
  }

  static async analyzeQueryIntent(userQuery: string, context: string): Promise<{
    needsDatabase: boolean;
    needsVisualization: boolean;
    visualizationType?: string;
    suggestedTables: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a query analyzer. Analyze if the user's question requires database queries and/or visualizations.

Context about available tables:
${context}

Respond ONLY with a JSON object in this exact format:
{
  "needsDatabase": boolean,
  "needsVisualization": boolean,
  "visualizationType": "bar" | "line" | "pie" | "scatter" | "area" | null,
  "suggestedTables": ["table1", "table2"]
}`
          },
          {
            role: 'user',
            content: userQuery
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Query intent analysis error:', error);
      return {
        needsDatabase: true,
        needsVisualization: false,
        suggestedTables: ['enhanced_features_with_actions']
      };
    }
  }

  static async generateSQL(userQuery: string, schema: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a PostgreSQL expert. Generate SAFE, READ-ONLY SQL queries based on user questions.

CRITICAL RULES:
- ONLY SELECT queries are allowed
- NO INSERT, UPDATE, DELETE, DROP, ALTER, or any DDL/DML operations
- Always use proper JOINs when accessing multiple tables
- Limit results to 1000 rows maximum
- Use proper WHERE clauses for filtering

Database Schema:
${schema}

Respond with ONLY the SQL query, no explanations or markdown.`
          },
          {
            role: 'user',
            content: userQuery
          }
        ],
        temperature: 0.2,
        max_tokens: 500,
      });

      let sql = response.choices[0]?.message?.content || '';
      sql = sql.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();

      if (!sql.toUpperCase().startsWith('SELECT')) {
        throw new Error('Only SELECT queries are allowed');
      }

      return sql;
    } catch (error: any) {
      console.error('SQL generation error:', error);
      throw new Error(error.message || 'Failed to generate SQL query');
    }
  }
}
