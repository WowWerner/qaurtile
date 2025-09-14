import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Award, Target, TrendingUp, Phone, Activity, 
  Clock, Download, Search, Filter, Eye, BarChart3, UserCheck,
  Star, AlertTriangle, CheckCircle, Settings, Briefcase,
  Calendar, Mail, MessageCircle, Shield, Building
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts';

interface Agent {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  specialization: string;
  hire_date: string;
  status: string;
  experience_level: string;
  max_daily_capacity: number;
  created_at: string;
  updated_at: string;
}

interface AgentSkill {
  id: number;
  agent_id: number;
  skill_type: string;
  proficiency_level: number;
  certified_date: string;
  expiry_date: string;
  created_at: string;
}

interface AgentPerformance {
  id: number;
  agent_id: number;
  date: string;
  accounts_assigned: number;
  accounts_completed: number;
  successful_contacts: number;
  payments_secured: number;
  total_amount_collected: number;
  call_volume: number;
  first_call_resolution: number;
  customer_satisfaction_score: number;
  compliance_score: number;
  settlement_rate_percent: number;
  created_at: string;
}

interface AgentStatus {
  id: string;
  agent_id: number;
  status: string;
  current_account_id: string;
  status_start_time: string;
  location: string;
  updated_at: string;
}

interface Team {
  id: number;
  name: string;
  description: string;
  supervisor_id: number;
  specialization: string;
  target_capacity: number;
  created_at: string;
}

interface TeamMember {
  id: number;
  team_id: number;
  agent_id: number;
  joined_date: string;
  role_in_team: string;
  created_at: string;
}

interface AgentWithDetails extends Agent {
  currentStatus?: AgentStatus;
  skills: AgentSkill[];
  recentPerformance: AgentPerformance[];
  team?: Team;
  teamRole?: string;
  avgPerformance: {
    settlementRate: number;
    customerSatisfaction: number;
    callVolume: number;
    accountsCompleted: number;
    totalCollected: number;
  };
}

export function HRDashboardPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentWithDetails[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<AgentWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'agents' | 'teams' | 'agent-detail'>('overview');

  useEffect(() => {
    loadHRData();
  }, []);

  const loadHRData = async () => {
    try {
      setLoading(true);
      
      // Load all HR data concurrently
      const [
        agentsResult,
        skillsResult,
        performanceResult,
        statusResult,
        teamsResult,
        teamMembersResult
      ] = await Promise.all([
        supabase.from('agents').select('*').eq('status', 'active'),
        supabase.from('agent_skills').select('*'),
        supabase.from('agent_performance').select('*').order('date', { ascending: false }).limit(1000),
        supabase.from('agent_status').select('*'),
        supabase.from('teams').select('*'),
        supabase.from('team_members').select('*')
      ]);

      if (agentsResult.error) throw agentsResult.error;
      if (skillsResult.error) throw skillsResult.error;
      if (performanceResult.error) throw performanceResult.error;
      if (statusResult.error) throw statusResult.error;
      if (teamsResult.error) throw teamsResult.error;
      if (teamMembersResult.error) throw teamMembersResult.error;

      const agentsData = agentsResult.data || [];
      const skillsData = skillsResult.data || [];
      const performanceData = performanceResult.data || [];
      const statusData = statusResult.data || [];
      const teamsData = teamsResult.data || [];
      const teamMembersData = teamMembersResult.data || [];

      // Process agents with detailed information
      const processedAgents: AgentWithDetails[] = agentsData.map(agent => {
        // Get agent skills
        const agentSkills = skillsData.filter(skill => skill.agent_id === agent.id);
        
        // Get recent performance (last 30 days)
        const recentPerformance = performanceData.filter(perf => perf.agent_id === agent.id);
        
        // Calculate average performance metrics
        const avgPerformance = calculateAveragePerformance(recentPerformance);
        
        // Get current status
        const currentStatus = statusData.find(status => status.agent_id === agent.id);
        
        // Get team information
        const teamMembership = teamMembersData.find(tm => tm.agent_id === agent.id);
        const team = teamMembership ? teamsData.find(t => t.id === teamMembership.team_id) : undefined;

        return {
          ...agent,
          skills: agentSkills,
          recentPerformance,
          currentStatus,
          team,
          teamRole: teamMembership?.role_in_team,
          avgPerformance
        };
      });

      setAgents(processedAgents);
      setTeams(teamsData);

    } catch (error) {
      console.error('Error loading HR data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAveragePerformance = (performances: AgentPerformance[]) => {
    if (performances.length === 0) {
      return {
        settlementRate: 0,
        customerSatisfaction: 0,
        callVolume: 0,
        accountsCompleted: 0,
        totalCollected: 0
      };
    }

    const totals = performances.reduce((acc, perf) => ({
      settlementRate: acc.settlementRate + (perf.settlement_rate_percent || 0),
      customerSatisfaction: acc.customerSatisfaction + (perf.customer_satisfaction_score || 0),
      callVolume: acc.callVolume + (perf.call_volume || 0),
      accountsCompleted: acc.accountsCompleted + (perf.accounts_completed || 0),
      totalCollected: acc.totalCollected + (perf.total_amount_collected || 0)
    }), {
      settlementRate: 0,
      customerSatisfaction: 0,
      callVolume: 0,
      accountsCompleted: 0,
      totalCollected: 0
    });

    const count = performances.length;
    return {
      settlementRate: totals.settlementRate / count,
      customerSatisfaction: totals.customerSatisfaction / count,
      callVolume: totals.callVolume / count,
      accountsCompleted: totals.accountsCompleted / count,
      totalCollected: totals.totalCollected
    };
  };

  const handleExportHR = () => {
    const csvContent = [
      'Employee ID,Name,Role,Specialization,Experience,Status,Team,Settlement Rate,Customer Satisfaction,Call Volume,Accounts Completed,Total Collected',
      ...filteredAgents.map(agent => 
        `"${agent.employee_id}","${agent.first_name} ${agent.last_name}","${agent.role}","${agent.specialization}","${agent.experience_level}","${agent.status}","${agent.team?.name || 'Unassigned'}","${agent.avgPerformance.settlementRate.toFixed(2)}%","${agent.avgPerformance.customerSatisfaction.toFixed(2)}","${agent.avgPerformance.callVolume.toFixed(0)}","${agent.avgPerformance.accountsCompleted.toFixed(0)}","N$${agent.avgPerformance.totalCollected.toLocaleString()}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'hr-dashboard-analysis.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'busy': return 'bg-blue-100 text-blue-700';
      case 'break': return 'bg-orange-100 text-orange-700';
      case 'lunch': return 'bg-yellow-100 text-yellow-700';
      case 'meeting': return 'bg-purple-100 text-purple-700';
      case 'training': return 'bg-indigo-100 text-indigo-700';
      case 'offline': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTeam = selectedTeam === 'all' || agent.team?.id.toString() === selectedTeam;
    const matchesSpecialization = selectedSpecialization === 'all' || agent.specialization === selectedSpecialization;
    
    return matchesSearch && matchesTeam && matchesSpecialization;
  });

  // Calculate team statistics
  const teamStats = teams.map(team => {
    const teamAgents = agents.filter(agent => agent.team?.id === team.id);
    const teamPerformance = teamAgents.reduce((acc, agent) => ({
      totalSettlementRate: acc.totalSettlementRate + agent.avgPerformance.settlementRate,
      totalSatisfaction: acc.totalSatisfaction + agent.avgPerformance.customerSatisfaction,
      totalAccounts: acc.totalAccounts + agent.avgPerformance.accountsCompleted,
      totalCollected: acc.totalCollected + agent.avgPerformance.totalCollected
    }), { totalSettlementRate: 0, totalSatisfaction: 0, totalAccounts: 0, totalCollected: 0 });

    return {
      ...team,
      memberCount: teamAgents.length,
      avgSettlementRate: teamAgents.length > 0 ? teamPerformance.totalSettlementRate / teamAgents.length : 0,
      avgSatisfaction: teamAgents.length > 0 ? teamPerformance.totalSatisfaction / teamAgents.length : 0,
      totalAccounts: teamPerformance.totalAccounts,
      totalCollected: teamPerformance.totalCollected,
      utilization: teamAgents.length > 0 ? (teamPerformance.totalAccounts / (team.target_capacity || 1)) * 100 : 0
    };
  });

  const topPerformers = [...filteredAgents]
    .sort((a, b) => b.avgPerformance.settlementRate - a.avgPerformance.settlementRate)
    .slice(0, 10);

  // Chart data
  const performanceChartData = topPerformers.map(agent => ({
    name: `${agent.first_name} ${agent.last_name.charAt(0)}.`,
    settlement: agent.avgPerformance.settlementRate,
    satisfaction: agent.avgPerformance.customerSatisfaction,
    accounts: agent.avgPerformance.accountsCompleted
  }));

  const specializationData = agents.reduce((acc: Record<string, number>, agent) => {
    acc[agent.specialization] = (acc[agent.specialization] || 0) + 1;
    return acc;
  }, {});

  const specializationChartData = Object.entries(specializationData).map(([spec, count]) => ({
    name: spec.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count
  }));

  const COLORS = ['#00abae', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(0,171,174)]"></div>
          <p className="mt-4 text-gray-600">Loading HR dashboard...</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'agent-detail' && selectedAgent) {
    return <AgentDetailView agent={selectedAgent} onBack={() => setViewMode('overview')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              HR Analytics Dashboard
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Comprehensive workforce analytics and agent performance insights
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('overview')}
              className="px-4"
            >
              Overview
            </Button>
            <Button
              variant={viewMode === 'agents' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('agents')}
              className="px-4"
            >
              Agents
            </Button>
            <Button
              variant={viewMode === 'teams' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('teams')}
              className="px-4"
            >
              Teams
            </Button>
          </div>
          <Button
            onClick={handleExportHR}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download size={16} strokeWidth={1.5} />
            <span>Export Data</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Users size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Total Agents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {agents.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active workforce</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Target size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Avg Settlement Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-600">
              {agents.length > 0 ? 
                (agents.reduce((sum, a) => sum + a.avgPerformance.settlementRate, 0) / agents.length).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Team average</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Activity size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Daily Capacity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-[rgb(0,171,174)]">
              {agents.reduce((sum, a) => sum + (a.max_daily_capacity || 0), 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total capacity</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Building size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Active Teams</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {teams.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Specialization teams</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'overview' && (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Performers Chart */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Top Agent Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={10}
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
                    />
                    <Bar dataKey="settlement" fill="#00abae" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="satisfaction" fill="#22c55e" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Specialization Distribution */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Team Specialization Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={specializationChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {specializationChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="border-gray-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg font-light text-green-800">
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.slice(0, 5).map((agent, index) => (
                    <div key={agent.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-700">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium text-green-900">
                            {agent.first_name} {agent.last_name}
                          </div>
                          <div className="text-xs text-green-600">{agent.specialization}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-700">
                          {agent.avgPerformance.settlementRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg font-light text-blue-800">
                  Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamStats
                    .sort((a, b) => b.avgSettlementRate - a.avgSettlementRate)
                    .slice(0, 5)
                    .map((team, index) => (
                      <div key={team.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-blue-900">{team.name}</div>
                          <div className="text-xs text-blue-600">
                            {team.memberCount} members • {team.specialization}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-blue-700">
                            {team.avgSettlementRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-lg font-light text-purple-800">
                  Current Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    agents.reduce((acc: Record<string, number>, agent) => {
                      const status = agent.currentStatus?.status || 'offline';
                      acc[status] = (acc[status] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'available' ? 'bg-green-500' :
                          status === 'busy' ? 'bg-blue-500' :
                          status === 'break' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="text-sm text-purple-700 capitalize">
                          {status.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="font-medium text-purple-900">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {viewMode === 'agents' && (
        <>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200 focus:border-[rgb(0,171,174)] focus:ring-[rgb(0,171,174)]/20"
              />
            </div>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-48 bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
              <SelectTrigger className="w-48 bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {Array.from(new Set(agents.map(a => a.specialization))).map(spec => (
                  <SelectItem key={spec} value={spec}>{spec.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="border-gray-200 hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-medium text-gray-800">
                        {agent.first_name} {agent.last_name}
                      </CardTitle>
                      <p className="text-sm text-gray-500">{agent.employee_id}</p>
                    </div>
                    <Badge className={getStatusColor(agent.currentStatus?.status || 'offline')}>
                      {agent.currentStatus?.status || 'offline'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Role:</span>
                        <div className="font-medium text-gray-900">{agent.role}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Experience:</span>
                        <div className="font-medium text-gray-900">{agent.experience_level}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Specialization:</span>
                        <div className="font-medium text-gray-900">{agent.specialization}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Team:</span>
                        <div className="font-medium text-gray-900">{agent.team?.name || 'Unassigned'}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Settlement Rate:</span>
                        <span className={`font-medium ${getPerformanceColor(agent.avgPerformance.settlementRate)}`}>
                          {agent.avgPerformance.settlementRate.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={agent.avgPerformance.settlementRate} 
                        className="h-2" 
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Customer Satisfaction:</span>
                        <span className={`font-medium ${getPerformanceColor(agent.avgPerformance.customerSatisfaction)}`}>
                          {agent.avgPerformance.customerSatisfaction.toFixed(1)}
                        </span>
                      </div>
                      <Progress 
                        value={agent.avgPerformance.customerSatisfaction} 
                        className="h-2" 
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="text-xs text-gray-500">
                        {agent.avgPerformance.accountsCompleted.toFixed(0)} accounts completed
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setViewMode('agent-detail');
                        }}
                        className="flex items-center space-x-1"
                      >
                        <Eye size={14} strokeWidth={1.5} />
                        <span>Details</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {viewMode === 'teams' && (
        <div className="space-y-6">
          {teams.map(team => {
            const teamData = teamStats.find(ts => ts.id === team.id);
            const teamAgents = agents.filter(agent => agent.team?.id === team.id);
            
            return (
              <Card key={team.id} className="border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-medium text-gray-800">
                        {team.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{team.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-light text-[rgb(0,171,174)]">
                        {teamData?.avgSettlementRate.toFixed(1) || 0}%
                      </div>
                      <div className="text-sm text-gray-500">Team avg settlement rate</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-900">{teamData?.memberCount || 0}</div>
                      <div className="text-sm text-gray-600">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-900">{teamData?.totalAccounts.toFixed(0) || 0}</div>
                      <div className="text-sm text-gray-600">Accounts Handled</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-900">N${teamData?.totalCollected.toLocaleString() || 0}</div>
                      <div className="text-sm text-gray-600">Total Collected</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-medium ${
                        (teamData?.utilization || 0) > 80 ? 'text-red-600' :
                        (teamData?.utilization || 0) > 60 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {teamData?.utilization.toFixed(1) || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Capacity Utilization</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamAgents.map(agent => (
                      <div key={agent.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {agent.first_name} {agent.last_name}
                          </h4>
                          <Badge className={getStatusColor(agent.currentStatus?.status || 'offline')}>
                            {agent.currentStatus?.status || 'offline'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Role: {agent.teamRole || 'Member'}</div>
                          <div>Settlement: {agent.avgPerformance.settlementRate.toFixed(1)}%</div>
                          <div>Satisfaction: {agent.avgPerformance.customerSatisfaction.toFixed(1)}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-3"
                          onClick={() => {
                            setSelectedAgent(agent);
                            setViewMode('agent-detail');
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Agent Detail View Component
function AgentDetailView({ agent, onBack }: { agent: AgentWithDetails; onBack: () => void }) {
  // Calculate skill average
  const avgSkillLevel = agent.skills.length > 0 
    ? agent.skills.reduce((sum, skill) => sum + skill.proficiency_level, 0) / agent.skills.length
    : 0;

  // Recent performance trend (last 7 days)
  const recentTrend = agent.recentPerformance.slice(0, 7).map((perf, index) => ({
    day: `Day ${7 - index}`,
    settlement: perf.settlement_rate_percent || 0,
    satisfaction: perf.customer_satisfaction_score || 0,
    accounts: perf.accounts_completed || 0
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              {agent.first_name} {agent.last_name}
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              {agent.employee_id} • {agent.role} • {agent.specialization}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-light text-[rgb(0,171,174)]">
            {agent.avgPerformance.settlementRate.toFixed(1)}%
          </div>
          <div className="text-sm font-light text-gray-500">Settlement Rate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Performance Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Performance Indicators */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-light text-green-600">
                    {agent.avgPerformance.settlementRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Settlement Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-blue-600">
                    {agent.avgPerformance.customerSatisfaction.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Customer Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-purple-600">
                    {agent.avgPerformance.accountsCompleted.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600">Accounts Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-orange-600">
                    N${agent.avgPerformance.totalCollected.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Collected</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Trend */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Recent Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={recentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" fontSize={11} stroke="#666" />
                  <YAxis fontSize={11} stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="settlement" 
                    stroke="#00abae" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="satisfaction" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Skills Assessment */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Skills & Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-800">Overall Skill Level</h4>
                  <div className="text-2xl font-light text-[rgb(0,171,174)]">
                    {avgSkillLevel.toFixed(1)}/5
                  </div>
                </div>
                
                {agent.skills.length > 0 ? (
                  <div className="space-y-3">
                    {agent.skills.map(skill => (
                      <div key={skill.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{skill.skill_type.replace('_', ' ')}</div>
                          {skill.certified_date && (
                            <div className="text-xs text-gray-500">
                              Certified: {new Date(skill.certified_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map(level => (
                              <div
                                key={level}
                                className={`w-3 h-3 rounded-full ${
                                  level <= skill.proficiency_level ? 'bg-[rgb(0,171,174)]' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {skill.proficiency_level}/5
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No skills recorded yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Agent Details */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Agent Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Employee ID:</span>
                <div className="font-medium text-gray-900">{agent.employee_id}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <div className="font-medium text-gray-900">{agent.email}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Phone:</span>
                <div className="font-medium text-gray-900">{agent.phone || 'Not provided'}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Hire Date:</span>
                <div className="font-medium text-gray-900">
                  {new Date(agent.hire_date).toLocaleDateString()}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Experience Level:</span>
                <div className="font-medium text-gray-900">{agent.experience_level}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Daily Capacity:</span>
                <div className="font-medium text-gray-900">{agent.max_daily_capacity} accounts</div>
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agent.currentStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(agent.currentStatus.status)}>
                      {agent.currentStatus.status}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Since {new Date(agent.currentStatus.status_start_time).toLocaleTimeString()}
                    </span>
                  </div>
                  {agent.currentStatus.location && (
                    <div>
                      <span className="text-sm text-gray-600">Location:</span>
                      <div className="font-medium text-gray-900">{agent.currentStatus.location}</div>
                    </div>
                  )}
                  {agent.currentStatus.current_account_id && (
                    <div>
                      <span className="text-sm text-gray-600">Working on Account:</span>
                      <div className="font-medium text-gray-900">{agent.currentStatus.current_account_id}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Clock size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No status information available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Information */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Team Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agent.team ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Team:</span>
                    <div className="font-medium text-gray-900">{agent.team.name}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Role in Team:</span>
                    <div className="font-medium text-gray-900">{agent.teamRole || 'Member'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Team Specialization:</span>
                    <div className="font-medium text-gray-900">{agent.team.specialization}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Team Target Capacity:</span>
                    <div className="font-medium text-gray-900">{agent.team.target_capacity} accounts/day</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Not assigned to a team</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Recommendations */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                HR Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agent.avgPerformance.settlementRate >= 15 ? (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-800">High Performer</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Consider for mentoring role or promotion
                    </p>
                  </div>
                ) : agent.avgPerformance.settlementRate >= 8 ? (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-2">
                      <Target size={16} className="text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Average Performer</span>
                    </div>
                    <p className="text-xs text-orange-700 mt-1">
                      Consider additional training or skill development
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={16} className="text-red-600" />
                      <span className="text-sm font-medium text-red-800">Needs Improvement</span>
                    </div>
                    <p className="text-xs text-red-700 mt-1">
                      Requires coaching and performance improvement plan
                    </p>
                  </div>
                )}

                {avgSkillLevel >= 4 && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Star size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Skill Expert</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      High skill proficiency - suitable for complex cases
                    </p>
                  </div>
                )}

                {agent.currentStatus?.status === 'training' && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-2">
                      <Briefcase size={16} className="text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">In Training</span>
                    </div>
                    <p className="text-xs text-purple-700 mt-1">
                      Currently developing new skills
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recent Activity */}
        <div className="space-y-6">
          {/* Recent Performance Chart */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                7-Day Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={recentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" fontSize={10} stroke="#666" />
                  <YAxis fontSize={10} stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="settlement" 
                    stroke="#00abae" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Skills Breakdown */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Skills Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overall Level:</span>
                  <span className="font-medium text-[rgb(0,171,174)]">
                    {avgSkillLevel.toFixed(1)}/5
                  </span>
                </div>
                <Progress value={avgSkillLevel * 20} className="h-2" />
                
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  {agent.skills.map(skill => (
                    <div key={skill.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{skill.skill_type.replace('_', ' ')}:</span>
                      <span className="font-medium">{skill.proficiency_level}/5</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full justify-start" size="sm" variant="outline">
                  <Mail size={16} className="mr-2" />
                  Send Message
                </Button>
                <Button className="w-full justify-start" size="sm" variant="outline">
                  <Calendar size={16} className="mr-2" />
                  Schedule Meeting
                </Button>
                <Button className="w-full justify-start" size="sm" variant="outline">
                  <Settings size={16} className="mr-2" />
                  Update Profile
                </Button>
                <Button className="w-full justify-start" size="sm" variant="outline">
                  <BarChart3 size={16} className="mr-2" />
                  Performance Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}