import { useState, useEffect } from 'react';
import { Users, User, Calendar } from 'lucide-react';
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
      {/* Team Restructuring Based on Data */}
      <Card className="border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800">
            Team Restructuring Based on Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Master Negotiation Team */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-4">Master Negotiation Team (Highest ROI)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Leader:</span>
                  <span className="font-medium">Mo-nique Thobias</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-medium text-blue-600">10.91%</span>
                </div>
                <div className="flex justify-between">
                  <span>Members:</span>
                  <span className="font-medium">Paulina (10.80%), Leena (9.81%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Capacity:</span>
                  <span className="font-medium">120 accounts</span>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-xs text-blue-700 font-medium mb-1">Focus Areas:</div>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• High-value accounts</li>
                    <li>• Payment arrangements</li>
                    <li>• Settlements</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Elite Legal Team */}
            <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-200">
              <h4 className="font-semibold text-red-800 mb-4">Elite Legal Team (Highest Settlement Rate)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Leader:</span>
                  <span className="font-medium">Keanan Namuyamba</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-medium text-red-600">17.46%</span>
                </div>
                <div className="flex justify-between">
                  <span>Members:</span>
                  <span className="font-medium">Roselene Benjamin (15.50%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Capacity:</span>
                  <span className="font-medium">67 accounts</span>
                </div>
                <div className="mt-3 pt-3 border-t border-red-200">
                  <div className="text-xs text-red-700 font-medium mb-1">Focus Areas:</div>
                  <ul className="text-xs text-red-600 space-y-1">
                    <li>• Government debt</li>
                    <li>• Legal collections</li>
                    <li>• Complex cases</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Volume Processing Team */}
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <h4 className="font-semibold text-green-800 mb-4">Volume Processing Team (Highest Throughput)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Leader:</span>
                  <span className="font-medium">Michael Jantjies</span>
                </div>
                <div className="flex justify-between">
                  <span>Actions:</span>
                  <span className="font-medium text-green-600">111K actions</span>
                </div>
                <div className="flex justify-between">
                  <span>Members:</span>
                  <span className="font-medium">Tommy Shipanga (52K actions)</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Capacity:</span>
                  <span className="font-medium">105 accounts</span>
                </div>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="text-xs text-green-700 font-medium mb-1">Focus Areas:</div>
                  <ul className="text-xs text-green-600 space-y-1">
                    <li>• Initial contact</li>
                    <li>• Data management</li>
                    <li>• Account setup</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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