import { useState, useEffect } from 'react';
import { Users, Target, Award, Activity, User, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface Team {
  id: number;
  name: string;
  description: string;
  supervisor_id: number;
  specialization: string;
  target_capacity: number;
  created_at: string;
  supervisor_name?: string;
  member_count?: number;
  members?: TeamMember[];
}

interface TeamMember {
  id: number;
  team_id: number;
  agent_id: number;
  joined_date: string;
  role_in_team: string;
  agent_name?: string;
}

export function TeamsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamsData();
  }, []);

  const loadTeamsData = async () => {
    try {
      // Get teams with supervisor information
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          supervisor:agents!teams_supervisor_id_fkey(first_name, last_name)
        `)
        .order('name', { ascending: true });

      if (teamsError) throw teamsError;

      // Get team members for each team
      const teamsWithMembers = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { data: membersData, error: membersError } = await supabase
            .from('team_members')
            .select(`
              *,
              agent:agents!team_members_agent_id_fkey(first_name, last_name, specialization)
            `)
            .eq('team_id', team.id);

          if (membersError) {
            console.error('Error loading team members:', membersError);
            return {
              ...team,
              supervisor_name: team.supervisor 
                ? `${team.supervisor.first_name} ${team.supervisor.last_name}` 
                : null,
              member_count: 0,
              members: []
            };
          }

          return {
            ...team,
            supervisor_name: team.supervisor 
              ? `${team.supervisor.first_name} ${team.supervisor.last_name}` 
              : null,
            member_count: membersData?.length || 0,
            members: (membersData || []).map(member => ({
              ...member,
              agent_name: member.agent 
                ? `${member.agent.first_name} ${member.agent.last_name}`
                : 'Unknown Agent'
            }))
          };
        })
      );

      setTeams(teamsWithMembers);
    } catch (error) {
      console.error('Error loading teams data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSpecializationColor = (specialization: string) => {
    switch (specialization?.toLowerCase()) {
      case 'legal_government':
      case 'legal': return 'bg-red-100 text-red-700';
      case 'negotiation': return 'bg-blue-100 text-blue-700';
      case 'commercial': return 'bg-orange-100 text-orange-700';
      case 'telecommunications': return 'bg-purple-100 text-purple-700';
      case 'initial_contact': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
      case 'general':
        return '🎯';
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
        {teams.map((team) => (
          <Card key={team.id} className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {getSpecializationIcon(team.specialization)}
                  </span>
                  <span className="font-medium text-gray-900">
                    {team.name}
                  </span>
                </div>
                <Badge className={getSpecializationColor(team.specialization)}>
                  {team.member_count || 0} members
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Specialization:</span>
                  <div className="font-medium text-gray-900">
                    {team.specialization?.replace('_', '/')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Target Capacity:</span>
                  <div className="font-medium text-gray-900">
                    {team.target_capacity || 0}
                  </div>
                </div>
              </div>

              {team.supervisor_name && (
                <div className="flex items-center space-x-2 text-sm">
                  <User size={14} className="text-gray-400" />
                  <span className="text-gray-600">Supervisor:</span>
                  <span className="font-medium text-gray-900">{team.supervisor_name}</span>
                </div>
              )}

              {team.description && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {team.description}
                </div>
              )}

              {/* Team Members */}
              {team.members && team.members.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Team Members:</div>
                  <div className="space-y-1">
                    {team.members.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{member.agent_name}</span>
                        <span className="text-gray-500 capitalize">{member.role_in_team}</span>
                      </div>
                    ))}
                    {team.members.length > 5 && (
                      <div className="text-xs text-gray-500 italic">
                        ... and {team.members.length - 5} more members
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar size={12} className="text-gray-400" />
                  <span>Created: {new Date(team.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teams.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="text-center py-12">
            <Users size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No Teams Available
            </h3>
            <p className="text-sm text-gray-500">
              Team data will appear here when teams are configured
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
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