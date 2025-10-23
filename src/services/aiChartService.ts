import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { ChartCacheService } from './chartCacheService';
import { DatabaseContextService } from './databaseContextService';

const openai = createOpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

const ChartAxisSchema = z.object({
  label: z.string().describe('Human-readable label for the axis'),
  format: z.enum(['number', 'currency', 'percentage', 'date', 'string']).describe('Data format type'),
  unit: z.string().optional().describe('Unit of measurement (e.g., "$", "%", "days")'),
});

const ChartColorSchemeSchema = z.object({
  primary: z.string().describe('Primary color in hex format'),
  secondary: z.string().optional().describe('Secondary color in hex format'),
  palette: z.array(z.string()).describe('Array of colors for multi-series data'),
});

const ChartMetadataSchema = z.object({
  title: z.string().describe('Descriptive chart title'),
  description: z.string().describe('Brief explanation of what the chart shows'),
  insights: z.array(z.string()).describe('Key insights or patterns visible in the data'),
  recommendation: z.string().optional().describe('Recommended action based on data analysis'),
});

const ChartConfigurationSchema = z.object({
  type: z.enum(['bar', 'line', 'pie', 'area', 'scatter', 'combo']).describe('Optimal chart type for the data'),
  confidence: z.number().min(0).max(1).describe('Confidence score for chart type selection (0-1)'),
  metadata: ChartMetadataSchema,
  xAxis: ChartAxisSchema.optional(),
  yAxis: ChartAxisSchema.optional(),
  colorScheme: ChartColorSchemeSchema,
  labelKey: z.string().describe('Field to use as labels/categories'),
  valueKeys: z.array(z.string()).describe('Fields containing numeric values to plot'),
  showLegend: z.boolean().describe('Whether to display legend'),
  showGrid: z.boolean().describe('Whether to show grid lines'),
  dataLimit: z.number().optional().describe('Maximum number of data points to display'),
});

export interface AIChartConfiguration {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'combo';
  confidence: number;
  metadata: {
    title: string;
    description: string;
    insights: string[];
    recommendation?: string;
  };
  xAxis?: {
    label: string;
    format: 'number' | 'currency' | 'percentage' | 'date' | 'string';
    unit?: string;
  };
  yAxis?: {
    label: string;
    format: 'number' | 'currency' | 'percentage' | 'date' | 'string';
    unit?: string;
  };
  colorScheme: {
    primary: string;
    secondary?: string;
    palette: string[];
  };
  labelKey: string;
  valueKeys: string[];
  showLegend: boolean;
  showGrid: boolean;
  dataLimit?: number;
}

export interface ProgressCallback {
  (stage: string, message: string, progress: number): void;
}

export class AIChartService {
  static async generateChartConfiguration(
    data: any[],
    userQuery: string,
    onProgress?: ProgressCallback
  ): Promise<AIChartConfiguration | null> {
    if (!data || data.length === 0) {
      return null;
    }

    try {
      onProgress?.('analyzing', 'Checking cache...', 0.1);

      const cached = await ChartCacheService.getCachedConfiguration(userQuery, data);
      if (cached) {
        onProgress?.('finalizing', 'Using cached configuration...', 0.95);
        return cached;
      }

      onProgress?.('analyzing', 'Analyzing data patterns...', 0.2);

      const dataSample = data.slice(0, 5);
      const dataKeys = Object.keys(data[0]);
      const numericKeys = dataKeys.filter(key => {
        const value = data[0][key];
        return typeof value === 'number' || !isNaN(parseFloat(value));
      });
      const stringKeys = dataKeys.filter(key => typeof data[0][key] === 'string');

      const dataStatistics = this.calculateDataStatistics(data, numericKeys);
      const databaseSchema = DatabaseContextService.getFullSchema();
      const dataCharacteristics = await this.analyzeDataCharacteristics(data);

      onProgress?.('generating', 'Creating optimal visualization...', 0.5);

      const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: ChartConfigurationSchema,
        prompt: `You are a data visualization expert specializing in debt collection analytics.

DATABASE CONTEXT (understand what each field means):
${databaseSchema}

User Query: "${userQuery}"

Data Sample (first 5 rows):
${JSON.stringify(dataSample, null, 2)}

Available Fields:
- Numeric fields: ${numericKeys.join(', ')}
- String/Category fields: ${stringKeys.join(', ')}

Total rows: ${data.length}

Data Statistics:
${dataStatistics}

Data Characteristics:
- Has time series: ${dataCharacteristics.hasTimeSeries}
- Has categorical data: ${dataCharacteristics.hasCategorical}
- Multiple numeric series: ${dataCharacteristics.hasMultipleSeries}
- Complexity: ${dataCharacteristics.dataComplexity}

INSTRUCTIONS:
1. Use the database context above to understand what each field means
2. Create business-meaningful axis labels:
   - "Settlement Probability" not "settlement_probability"
   - "Predicted Recovery Amount" not "predicted_recovery"
   - "Prediction Score (1-10)" not just "prediction_score"
3. Format values correctly based on field type:
   - Currency ($): debt_amount, initial_value, predicted_recovery, total_recovered
   - Plain Number: prediction_score (1-10 scale, NOT percentage!)
   - Percentage (%): settlement_probability (0-1), settlement_rate
4. Use appropriate colors:
   - Quartile brand: #00ABAE (primary)
   - HIGH/High_Performer: #10B981 (green)
   - MEDIUM/Medium_Performer: #F59E0B (orange)
   - LOW/Low_Performer: #EF4444 (red)
5. Generate actionable insights about:
   - Settlement opportunities
   - Recovery potential
   - Account priorities
   - Performance patterns
6. Provide clear, business-focused titles like:
   - Good: "High-Priority Accounts by Prediction Score"
   - Bad: "prediction_score chart"

CRITICAL: prediction_score is 1-10 (NOT 0-1, NOT percentage)
- 10 = Highest priority
- 7-10 = HIGH category
- 4-6 = MEDIUM
- 1-3 = LOW

Limit data to 50 points max for readability.`,
      });

      onProgress?.('finalizing', 'Finalizing visualization...', 0.9);

      const configuration = object as AIChartConfiguration;

      await ChartCacheService.cacheConfiguration(userQuery, data, configuration);

      return configuration;
    } catch (error) {
      console.error('AI chart generation error:', error);
      return null;
    }
  }

  static getFallbackConfiguration(data: any[]): AIChartConfiguration {
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    const numericKeys = keys.filter(key => typeof firstRow[key] === 'number' && key !== 'id');
    const labelKeys = keys.filter(key => typeof firstRow[key] === 'string');

    return {
      type: 'bar',
      confidence: 0.5,
      metadata: {
        title: 'Data Overview',
        description: 'Visualization of your data',
        insights: ['Data displayed using default configuration'],
      },
      xAxis: {
        label: labelKeys[0] || keys[0],
        format: 'string',
      },
      yAxis: {
        label: numericKeys[0] || 'Value',
        format: 'number',
      },
      colorScheme: {
        primary: '#00ABAE',
        palette: ['#00ABAE', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'],
      },
      labelKey: labelKeys[0] || keys[0],
      valueKeys: numericKeys.slice(0, 3),
      showLegend: true,
      showGrid: true,
      dataLimit: 50,
    };
  }

  static calculateDataStatistics(data: any[], numericKeys: string[]): string {
    const stats: string[] = [];

    for (const key of numericKeys.slice(0, 5)) {
      const values = data.map(row => {
        const val = row[key];
        return typeof val === 'number' ? val : parseFloat(val);
      }).filter(v => !isNaN(v));

      if (values.length === 0) continue;

      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      stats.push(`  - ${key}: min=${min.toFixed(2)}, max=${max.toFixed(2)}, avg=${avg.toFixed(2)}`);
    }

    return stats.length > 0 ? stats.join('\n') : '  No numeric statistics available';
  }

  static async analyzeDataCharacteristics(data: any[]): Promise<{
    hasTimeSeries: boolean;
    hasCategorical: boolean;
    hasMultipleSeries: boolean;
    dataComplexity: 'simple' | 'moderate' | 'complex';
  }> {
    if (!data || data.length === 0) {
      return {
        hasTimeSeries: false,
        hasCategorical: false,
        hasMultipleSeries: false,
        dataComplexity: 'simple',
      };
    }

    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    const numericKeys = keys.filter(key => typeof firstRow[key] === 'number');

    const hasTimeSeries = keys.some(key =>
      key.toLowerCase().includes('date') ||
      key.toLowerCase().includes('time') ||
      key.toLowerCase().includes('created')
    );

    const hasCategorical = keys.some(key =>
      typeof firstRow[key] === 'string' &&
      new Set(data.map(row => row[key])).size < data.length * 0.5
    );

    const hasMultipleSeries = numericKeys.length > 1;

    const dataComplexity =
      numericKeys.length > 3 || data.length > 100 ? 'complex' :
      numericKeys.length > 1 || data.length > 20 ? 'moderate' : 'simple';

    return {
      hasTimeSeries,
      hasCategorical,
      hasMultipleSeries,
      dataComplexity,
    };
  }
}
