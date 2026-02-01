import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AgentPerformance {
  id: number;
  full_name: string;
  employee_id: string;
  role: string;
  specialization: string;
  status: string;
  experience_level: string;
  avg_daily_completions: number;
  avg_successful_contacts: number;
  avg_payments_secured: number;
  avg_daily_collections: number;
  avg_settlement_rate: number;
  avg_satisfaction: number;
  avg_compliance: number;
  days_tracked: number;
  last_performance_date: string;
}

export function PerformanceTab() {
  const [performanceData, setPerformanceData] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_performance_summary')
        .select('*')
        .order('avg_settlement_rate', { ascending: false });

      if (error) throw error;
      setPerformanceData(data || []);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 0.15) return 'bg-green-100 text-green-700';
    if (rate >= 0.08) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const chartData = performanceData.slice(0, 10).map(agent => ({
    name: agent.full_name?.split(' ')[0] || 'Unknown',
    settlementRate: (agent.avg_settlement_rate || 0),
    completions: agent.avg_daily_completions || 0
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(0,171,174)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Chart */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800">
            Top 10 Agent Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                fontSize={11}
                stroke="#666"
                angle={-45}
                textAnchor="end"
              />
              <YAxis fontSize={11} stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => [
                  name === 'settlementRate' ? `${value}%` : value,
                  name === 'settlementRate' ? 'Settlement Rate' : 'Daily Completions'
                ]}
              />
              <Bar dataKey="settlementRate" fill="#00abae" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {performanceData.map((agent) => (
          <Card key={agent.id} className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  {agent.full_name}
                </span>
                <Badge className={getPerformanceColor(agent.avg_settlement_rate || 0)}>
                  {(agent.avg_settlement_rate || 0).toFixed(1)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Daily Completions:</span>
                  <div className="font-medium text-gray-900">
                    {(agent.avg_daily_completions || 0).toFixed(1)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Contacts:</span>
                  <div className="font-medium text-gray-900">
                    {(agent.avg_successful_contacts || 0).toFixed(1)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Collections:</span>
                  <div className="font-medium text-gray-900">
                    N${(agent.avg_daily_collections || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Satisfaction:</span>
                  <div className="font-medium text-gray-900">
                    {(agent.avg_satisfaction || 0).toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-medium text-gray-900">
                    {agent.experience_level}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Specialization:</span>
                  <span className="font-medium text-gray-900">
                    {agent.specialization}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {performanceData.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="text-center py-12">
            <Activity size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No Performance Data Available
            </h3>
            <p className="text-sm text-gray-500">
              Performance metrics will appear here when available
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}