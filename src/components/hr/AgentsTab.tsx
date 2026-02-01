import { useState, useEffect } from 'react';
import { User, Badge as BadgeIcon, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface Agent {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  role: string;
  specialization: string;
  status: string;
  experience_level: string;
  max_daily_capacity: number;
  settlement_rate?: number;
}

export function AgentsTab() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      // Get agents with their performance data
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .order('first_name', { ascending: true });

      if (agentsError) throw agentsError;

      // Get performance data for settlement rates
      const { data: performanceData, error: performanceError } = await supabase
        .from('agent_performance_summary')
        .select('id, avg_settlement_rate');

      if (performanceError) throw performanceError;

      // Merge agents with performance data
      const agentsWithPerformance = (agentsData || []).map(agent => {
        const performance = performanceData?.find(p => p.id === agent.id);
        return {
          ...agent,
          settlement_rate: performance?.avg_settlement_rate || 0
        };
      });

      setAgents(agentsWithPerformance);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-red-100 text-red-700';
      case 'training': return 'bg-orange-100 text-orange-700';
      case 'leave': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-700';
      case 'senior': return 'bg-blue-100 text-blue-700';
      case 'mid': return 'bg-green-100 text-green-700';
      case 'junior': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSettlementColor = (rate: number) => {
    if (rate >= 0.15) return 'bg-green-500';
    if (rate >= 0.08) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(0,171,174)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <User size={18} strokeWidth={1.5} className="text-gray-600" />
                <span className="font-medium text-gray-900">
                  {agent.first_name} {agent.last_name}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge className={getStatusColor(agent.status)}>
                  {agent.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Experience:</span>
                <Badge className={getExperienceColor(agent.experience_level)}>
                  {agent.experience_level}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <BadgeIcon size={14} className="text-gray-400" />
                  <span className="text-gray-600">ID: {agent.employee_id}</span>
                </div>
              </div>

              {/* Settlement Rate Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center space-x-1">
                    <TrendingUp size={14} className="text-gray-400" />
                    <span>Settlement Rate:</span>
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {(agent.settlement_rate || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getSettlementColor(agent.settlement_rate || 0)}`}
                    style={{ width: `${Math.min((agent.settlement_rate || 0), 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Specialization:</div>
                <div className="font-medium text-gray-900">{agent.specialization || 'General'}</div>
                
                <div className="text-sm text-gray-600 mt-2 mb-1">Daily Capacity:</div>
                <div className="font-medium text-gray-900">{agent.max_daily_capacity} accounts</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}