import { useState, useEffect } from 'react';
import { Target, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SkillMatrixAgent {
  agent_id: number;
  agent_name: string;
  primary_specialization: string;
  skills_summary: string;
  avg_skill_level: number;
  total_skills: number;
}

export function SkillMatrixTab() {
  const [skillsData, setSkillsData] = useState<SkillMatrixAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkillsMatrix();
  }, []);

  const loadSkillsMatrix = async () => {
    try {
      const { data, error } = await supabase
        .from('skills_matrix')
        .select('*')
        .order('avg_skill_level', { ascending: false });

      if (error) throw error;
      setSkillsData(data || []);
    } catch (error) {
      console.error('Error loading skills matrix:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillLevelColor = (level: number) => {
    if (level >= 4.5) return 'bg-green-100 text-green-700';
    if (level >= 3.5) return 'bg-blue-100 text-blue-700';
    if (level >= 2.5) return 'bg-orange-100 text-orange-700';
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


  // Capacity analysis data
  const capacityData = [
    {
      team: 'Legal Team',
      capacity: 67,
      needed: 1163,
      backlog: 17,
      efficiency: (67 / 1163) * 100
    },
    {
      team: 'Negotiation Team', 
      capacity: 120,
      needed: 2139,
      backlog: 18,
      efficiency: (120 / 2139) * 100
    },
    {
      team: 'Initial Contact Team',
      capacity: 105,
      needed: 11034,
      backlog: 105,
      efficiency: (105 / 11034) * 100
    }
  ];

  const getBacklogColor = (days: number) => {
    if (days <= 20) return 'text-green-600 bg-green-100';
    if (days <= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };
  return (
    <div className="space-y-6">
      {/* Current Capacity Analysis */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800">
            Current Capacity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Capacity vs Demand Chart */}
          <div className="mb-8">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={capacityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="team" 
                  fontSize={11}
                  stroke="#666"
                />
                <YAxis fontSize={11} stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, name: string) => [
                    name === 'capacity' ? `${value} accounts/day` : `${value} accounts`,
                    name === 'capacity' ? 'Daily Capacity' : 'Accounts Needed'
                  ]}
                />
                <Bar dataKey="capacity" fill="#00abae" radius={[2, 2, 0, 0]} />
                <Bar dataKey="needed" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {capacityData.map((team, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">{team.team}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Capacity:</span>
                    <span className="font-medium text-green-600">{team.capacity} accounts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accounts Needed:</span>
                    <span className="font-medium text-red-600">{team.needed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Backlog:</span>
                    <Badge className={getBacklogColor(team.backlog)}>
                      {team.backlog} days
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Efficiency:</span>
                    <span className="font-medium text-gray-800">{team.efficiency.toFixed(1)}%</span>
                  </div>
                </div>
                
                {/* Progress bar showing capacity utilization */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Capacity Utilization</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                        team.efficiency > 10 ? 'bg-green-500' :
                        team.efficiency > 5 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(team.efficiency * 2, 100)}%`,
                        animationDelay: `${index * 300}ms`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200">
          <CardContent className="p-6 text-center">
            <Target size={24} strokeWidth={1} className="text-gray-400 mx-auto mb-2" />
            <div className="text-2xl font-light text-gray-800">
              {skillsData.length}
            </div>
            <div className="text-sm text-gray-500 font-light">Skilled Agents</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6 text-center">
            <Award size={24} strokeWidth={1} className="text-gray-400 mx-auto mb-2" />
            <div className="text-2xl font-light text-[rgb(0,171,174)]">
              {skillsData.length > 0 ? 
                (skillsData.reduce((sum, agent) => sum + (agent.avg_skill_level || 0), 0) / skillsData.length).toFixed(1) : 
                '0.0'
              }
            </div>
            <div className="text-sm text-gray-500 font-light">Avg Skill Level</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6 text-center">
            <TrendingUp size={24} strokeWidth={1} className="text-gray-400 mx-auto mb-2" />
            <div className="text-2xl font-light text-gray-800">
              {skillsData.reduce((sum, agent) => sum + (agent.total_skills || 0), 0)}
            </div>
            <div className="text-sm text-gray-500 font-light">Total Skills</div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skillsData.map((agent) => (
          <Card key={agent.agent_id} className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="font-medium text-gray-900 text-sm">
                  {agent.agent_name}
                </span>
                <span className="text-lg">
                  {getSpecializationIcon(agent.primary_specialization)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Specialization:</span>
                <span className="text-sm font-medium text-gray-900">
                  {agent.primary_specialization?.replace('_', '/')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Level:</span>
                <Badge className={getSkillLevelColor(agent.avg_skill_level || 0)}>
                  {(agent.avg_skill_level || 0).toFixed(1)}/5.0
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Skills:</span>
                <span className="text-sm font-medium text-gray-900">
                  {agent.total_skills || 0}
                </span>
              </div>

              {agent.skills_summary && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-2">Skills Breakdown:</div>
                  <div className="space-y-2">
                    {agent.skills_summary.split(', ').map((skill, idx) => {
                      // Parse skill and level from format "skill_name (Level X)"
                      const match = skill.match(/(.+)\s*\(Level\s*(\d+)\)/);
                      if (!match) return null;
                      
                      const [, skillName, levelStr] = match;
                      const level = parseInt(levelStr);
                      const percentage = (level / 5) * 100;
                      
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-700 capitalize">
                              {skillName.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-medium text-gray-600">
                              {level}/5
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
                                level >= 4 ? 'bg-green-500' :
                                level >= 3 ? 'bg-blue-500' :
                                level >= 2 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ 
                                width: `${percentage}%`,
                                animationDelay: `${idx * 200}ms`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {skillsData.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="text-center py-12">
            <Target size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No Skills Data Available
            </h3>
            <p className="text-sm text-gray-500">
              Skills matrix data will appear here when available
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}