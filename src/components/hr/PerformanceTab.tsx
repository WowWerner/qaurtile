import { useState, useEffect } from 'react';
import { Target, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

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

  return (
    <div className="space-y-6">
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