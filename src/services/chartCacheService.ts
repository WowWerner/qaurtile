import { supabase } from '../lib/supabase';
import { AIChartConfiguration } from './aiChartService';

export class ChartCacheService {
  static generateQueryHash(query: string, dataSample: any[]): string {
    const normalized = query.toLowerCase().trim();
    const dataKeys = dataSample.length > 0 ? Object.keys(dataSample[0]).sort().join(',') : '';
    const combined = `${normalized}:${dataKeys}`;

    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  static async getCachedConfiguration(
    query: string,
    data: any[]
  ): Promise<AIChartConfiguration | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const queryHash = this.generateQueryHash(query, data.slice(0, 3));

      const { data: cached, error } = await supabase
        .from('ai_chart_cache')
        .select('*')
        .eq('query_hash', queryHash)
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !cached) return null;

      await supabase
        .from('ai_chart_cache')
        .update({
          usage_count: cached.usage_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', cached.id);

      return cached.chart_configuration as AIChartConfiguration;
    } catch (error) {
      console.error('Error retrieving cached configuration:', error);
      return null;
    }
  }

  static async cacheConfiguration(
    query: string,
    data: any[],
    configuration: AIChartConfiguration
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const queryHash = this.generateQueryHash(query, data.slice(0, 3));
      const dataSample = data.slice(0, 3);

      await supabase.from('ai_chart_cache').upsert({
        query_hash: queryHash,
        user_id: user.id,
        query_text: query,
        data_sample: dataSample,
        chart_configuration: configuration,
        confidence_score: configuration.confidence,
        usage_count: 1,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }, {
        onConflict: 'query_hash'
      });
    } catch (error) {
      console.error('Error caching configuration:', error);
    }
  }

  static async cleanupExpiredCache(): Promise<void> {
    try {
      await supabase
        .from('ai_chart_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  static async getUserCacheStats(): Promise<{
    totalEntries: number;
    totalUsage: number;
    avgConfidence: number;
  } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('ai_chart_cache')
        .select('usage_count, confidence_score')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString());

      if (error || !data) return null;

      return {
        totalEntries: data.length,
        totalUsage: data.reduce((sum, entry) => sum + entry.usage_count, 0),
        avgConfidence: data.length > 0
          ? data.reduce((sum, entry) => sum + parseFloat(entry.confidence_score), 0) / data.length
          : 0
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }
}
