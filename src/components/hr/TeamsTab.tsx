import { useState, useEffect } from 'react';
import { Users, Target, Award, Activity, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface TeamSummary {
  team_id: number;
  team_name: string;
  specialization: string;
  target_capacity: number;
  team_size: number;
  avg_team_completions: number;
  avg_team_collections: number;
  avg_team_settlement_rate: number;
  avg_team_satisfaction: number;
  total_team_capacity: number;
}

export function TeamsTab() {
  const [teamsData, setTeamsData] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamsData();
  }, []);

  const loadTeamsData = async () => {
    try {
      const { data, error } = await supabase
        .from('team_performance_summary')
        .select('*')
        .order('avg_team_settlement_rate', { ascending: false });

      if (error) throw error;
      setTeamsData(data || []);
    } catch (error) {
      console.error('Error loading teams data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamPerformanceColor = (rate: number) => {
    if (rate >= 0.12) return 'bg-green-100 text-green-700';
    if (rate >= 0.08) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const getSpecializationIcon = (specialization: string) => {
    switch (specialization?.toLowerCase()) {
      case 'legal_government':
      case 'legal':
        return '⚖️';
      case 'negotiation':
        return '🤝';
      case 'commercial':
        return '🏢';
      case 'telecommunications':
        return '📞';
      case 'initial_contact':
        return '📋';
      default:
        return '🎯';
    }
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
      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teamsData.map((team) => (
          <Card key={team.team_id} className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {getSpecializationIcon(team.specialization)}
                  </span>
                  <span className="font-medium text-gray-900">
                    {team.team_name}
                  </span>
                </div>
                <Badge className={getTeamPerformanceColor(team.avg_team_settlement_rate || 0)}>
                  {((team.avg_team_settlement_rate || 0) * 100).toFixed(1)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Team Size:</span>
                  <div className="font-medium text-gray-900">
                    {team.team_size || 0} agents
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Daily Capacity:</span>
                  <div className="font-medium text-gray-900">
                    {team.total_team_capacity || 0}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Completions:</span>
                  <div className="font-medium text-gray-900">
                    {(team.avg_team_completions || 0).toFixed(1)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Collections:</span>
                  <div className="font-medium text-gray-900">
                    N${(team.avg_team_collections || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Specialization:</span>
                  <span className="font-medium text-gray-900">
                    {team.specialization?.replace('_', '/')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Target Capacity:</span>
                  <span className="font-medium text-gray-900">
                    {team.target_capacity || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Satisfaction:</span>
                  <span className="font-medium text-gray-900">
                    {(team.avg_team_satisfaction || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teamsData.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="text-center py-12">
            <Users size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No Teams Data Available
            </h3>
            <p className="text-sm text-gray-500">
              Team performance data will appear here when available
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}