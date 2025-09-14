import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Target, TrendingUp, Clock, Award, AlertCircle, Download, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubTabBar } from '@/components/hr/SubTabBar';
import { AgentsTab } from '@/components/hr/AgentsTab';
import { WorkloadTab } from '@/components/hr/WorkloadTab';
import { SkillMatrixTab } from '@/components/hr/SkillMatrixTab';
import { PerformanceTab } from '@/components/hr/PerformanceTab';
import { TeamsTab } from '@/components/hr/TeamsTab';
import { supabase } from '@/lib/supabase';

interface HRMetrics {
  totalAgents: number;
  activeAgents: number;
  avgPerformance: number;
  topPerformer: string;
  totalCapacity: number;
  utilizationRate: number;
}

export default function HRDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<HRMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('agents');

  useEffect(() => {
    loadHRMetrics();
  }, []);

  const loadHRMetrics = async () => {
    try {
      setLoading(true);
      
      // Load basic agent metrics
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*');

      if (agentsError) throw agentsError;

      // Load performance summary
      const { data: performanceData, error: performanceError } = await supabase
        .from('agent_performance_summary')
        .select('*')
        .order('avg_settlement_rate', { ascending: false })
        .limit(1);

      if (performanceError) throw performanceError;

      const totalAgents = agentsData?.length || 0;
      const activeAgents = agentsData?.filter(agent => agent.status === 'active').length || 0;
      const totalCapacity = agentsData?.reduce((sum, agent) => sum + (agent.max_daily_capacity || 0), 0) || 0;
      const avgPerformance = performanceData?.[0]?.avg_settlement_rate || 0;
      const topPerformer = performanceData?.[0]?.full_name || 'Unknown';

      setMetrics({
        totalAgents,
        activeAgents,
        avgPerformance: avgPerformance * 100,
        topPerformer,
        totalCapacity,
        utilizationRate: activeAgents > 0 ? (activeAgents / totalAgents) * 100 : 0
      });

    } catch (error) {
      console.error('Error loading HR metrics:', error);
    } finally {
      setLoading(false);
    }
  };

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
              HR Dashboard
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Human resources analytics and workforce management
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
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
              {metrics?.totalAgents || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics?.activeAgents || 0} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Award size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Top Performer</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-light text-green-600">
              {metrics?.topPerformer || 'Unknown'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics?.avgPerformance.toFixed(1)}% avg rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Target size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Daily Capacity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {metrics?.totalCapacity || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Accounts per day</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Activity size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Utilization</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-[rgb(0,171,174)]">
              {metrics?.utilizationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Active agents</p>
          </CardContent>
        </Card>
      </div>

      {/* Sub Tab Bar */}
      <div className="mb-8">
        <SubTabBar 
          activeTab={activeSubTab} 
          onTabChange={setActiveSubTab} 
        />
      </div>

      {/* Sub Tab Content */}
      <div className="min-h-[400px]">
        {activeSubTab === 'agents' && <AgentsTab />}
        {activeSubTab === 'workload' && <WorkloadTab />}
        {activeSubTab === 'skill-matrix' && <SkillMatrixTab />}
        {activeSubTab === 'performance' && <PerformanceTab />}
        {activeSubTab === 'teams' && <TeamsTab />}
      </div>
    </div>
  );
}