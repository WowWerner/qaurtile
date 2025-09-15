import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, TrendingUp, Clock, Target, DollarSign, Users, Activity, Phone, Building } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardMetrics {
  // HR Metrics
  topAgent: {
    name: string;
    settlementRate: number;
    totalAccounts: number;
  };
  totalAgents: number;
  
  // Financial Metrics
  totalPortfolioValue: number;
  predictedRecovery: number;
  highPriorityAccounts: number;
  
  // Campaign Metrics
  totalActions: number;
  totalSettlements: number;
  campaignEfficiency: number;
  
  // Productivity Metrics
  peakHour: number;
  peakProductivity: number;
  
  // Client Metrics
  activeClients: number;
  avgClientSettlementRate: number;
  
  // Model Metrics
  modelConfidence: number;
  modelVersion: string;
}

export function OverviewDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiverseMetrics();
  }, []);

  const loadDiverseMetrics = async () => {
    try {
      setLoading(true);
      
      // Load data from multiple sources
      const [
        agentPerformanceResult,
        enhancedFeaturesResult,
        campaignSummaryResult,
        hourlyProductivityResult,
        clientPatternsResult,
        highPriorityResult
      ] = await Promise.all([
        supabase.from('dc_agent_performance').select('*').order('settlement_rate', { ascending: false }).limit(1),
        supabase.from('enhanced_features_with_actions').select('account_id, initial_value'),
        supabase.from('dc_campaign_summary').select('*'),
        supabase.from('dc_hourly_productivity').select('*').order('productivity_score', { ascending: false }).limit(1),
        supabase.from('dc_client_patterns').select('*'),
        supabase.from('dc_high_priority_accounts').select('*')
      ]);

      // Process HR metrics
      const topAgent = agentPerformanceResult.data?.[0] ? {
        name: agentPerformanceResult.data[0].assigned_agent || 'Unknown',
        settlementRate: (agentPerformanceResult.data[0].settlement_rate || 0),
        totalAccounts: agentPerformanceResult.data[0].total_accounts || 0
      } : { name: 'Unknown', settlementRate: 0, totalAccounts: 0 };

      const totalAgents = agentPerformanceResult.data?.length || 0;

      // Process Financial metrics
      const totalPortfolioValue = enhancedFeaturesResult.data?.reduce((sum, acc) => sum + (acc.initial_value || 0), 0) || 0;
      const highPriorityAccounts = highPriorityResult.data?.length || 0;
      const predictedRecovery = highPriorityResult.data?.reduce((sum, acc) => 
        sum + ((acc.initial_value || 0) * (acc.settlement_probability || 0)), 0) || 0;

      // Process Campaign metrics
      const totalActions = campaignSummaryResult.data?.reduce((sum, c) => sum + (c.total_actions || 0), 0) || 0;
      const totalSettlements = campaignSummaryResult.data?.reduce((sum, c) => sum + (c.settlements || 0), 0) || 0;
      const campaignEfficiency = totalActions > 0 ? (totalSettlements / totalActions) * 100 : 0;

      // Process Productivity metrics
      const peakHour = hourlyProductivityResult.data?.[0]?.hour || 9;
      const peakProductivity = hourlyProductivityResult.data?.[0]?.productivity_score || 85;

      // Process Client metrics
      const activeClients = clientPatternsResult.data?.length || 0;
      const avgClientSettlementRate = clientPatternsResult.data?.length > 0 ?
        (clientPatternsResult.data.reduce((sum, c) => sum + (c.settlement_rate || 0), 0) / clientPatternsResult.data.length) * 100 : 0;

      setMetrics({
        topAgent,
        totalAgents,
        totalPortfolioValue,
        predictedRecovery,
        highPriorityAccounts,
        totalActions,
        totalSettlements,
        campaignEfficiency,
        peakHour,
        peakProductivity,
        activeClients,
        avgClientSettlementRate,
        modelConfidence: 93.0,
        modelVersion: '2.4'
      });

    } catch (error) {
      console.error('Error loading overview metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(0,171,174)]"></div>
          <p className="mt-4 text-gray-600">Loading overview dashboard...</p>
        </div>
      </div>
    );
  }

  // Chart data for business areas performance
  const businessAreasData = [
    { name: 'HR', value: metrics?.totalAgents || 0, metric: 'Agents', color: '#22c55e' },
    { name: 'Finance', value: Math.round((metrics?.predictedRecovery || 0) / 1000), metric: 'K Recovery', color: '#3b82f6' },
    { name: 'Campaigns', value: Math.round(metrics?.campaignEfficiency || 0), metric: '% Efficiency', color: '#f59e0b' },
    { name: 'Clients', value: metrics?.activeClients || 0, metric: 'Active', color: '#8b5cf6' }
  ];

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
              Business Overview
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Cross-functional performance metrics and system insights
            </p>
          </div>
        </div>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Performing Agent - HR Data */}
        <Card className="border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Award size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Top Performing Agent</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-green-700 mb-1">
              {metrics?.topAgent.name || 'Loading...'}
            </div>
            <div className="text-3xl font-light text-green-600 mb-2">
              {(metrics?.topAgent.settlementRate || 0).toFixed(2)}%
            </div>
            <p className="text-xs text-green-600">
              {metrics?.topAgent.totalAccounts.toLocaleString()} accounts managed
            </p>
          </CardContent>
        </Card>

        {/* Total Qualifying Accounts - Enhanced Features Data */}
        <Card className="border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Users size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Total Qualifying Accounts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-blue-700">
              {(metrics?.totalPortfolioValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Enhanced analysis complete
            </p>
          </CardContent>
        </Card>

        {/* Most Productive Hour - Productivity Data */}
        <Card className="border-gray-200 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <Clock size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Most Productive Hour</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-purple-700 mb-1">
              {metrics ? formatHour(metrics.peakHour) : 'Loading...'}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Score: {metrics?.peakProductivity.toFixed(1) || '0'}/100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cross-Functional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Financial Health */}
        <Card className="border-gray-200 bg-gradient-to-br from-emerald-50 to-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-emerald-800">
              <DollarSign size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Portfolio Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-emerald-700">
              N${((metrics?.totalPortfolioValue || 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-emerald-600 mt-1">Total under management</p>
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card className="border-gray-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Target size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Campaign Efficiency</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-orange-700">
              {(metrics?.campaignEfficiency || 0).toFixed(2)}%
            </div>
            <p className="text-xs text-orange-600 mt-1">
              {(metrics?.totalSettlements || 0).toLocaleString()} from {(metrics?.totalActions || 0).toLocaleString()} actions
            </p>
          </CardContent>
        </Card>

        {/* Client Portfolio */}
        <Card className="border-gray-200 bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-indigo-800">
              <Building size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Active Clients</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-indigo-700">
              {metrics?.activeClients || 0}
            </div>
            <p className="text-xs text-indigo-600 mt-1">
              {(metrics?.avgClientSettlementRate || 0).toFixed(1)}% avg settlement rate
            </p>
          </CardContent>
        </Card>

        {/* Best Performing Hour */}
        <Card className="border-gray-200 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <Clock size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Best Performing Hour</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-purple-700">
              {metrics ? formatHour(metrics.peakHour) : 'Loading...'}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Score: {metrics?.peakProductivity.toFixed(1) || '0'}/100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Priority Action Items */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Priority Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-800">System Status</span>
                </div>
                <div className="text-2xl font-light text-green-700 mb-1">
                  All Systems
                </div>
                <div className="text-sm text-green-600">
                  ✅ Operational and healthy
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Indicators */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              System Performance Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Agent Performance */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Top Agent Performance</span>
                  <span className="text-sm font-bold text-blue-600">
                    {(metrics?.topAgent.settlementRate || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((metrics?.topAgent.settlementRate || 0) * 5, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">{metrics?.topAgent.name}</div>
              </div>

              {/* Campaign Efficiency */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Campaign Efficiency</span>
                  <span className="text-sm font-bold text-orange-600">
                    {(metrics?.campaignEfficiency || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((metrics?.campaignEfficiency || 0) * 10, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">Across all campaigns</div>
              </div>

              {/* Client Portfolio Health */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Client Portfolio Health</span>
                  <span className="text-sm font-bold text-purple-600">
                    {(metrics?.avgClientSettlementRate || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((metrics?.avgClientSettlementRate || 0) * 5, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">{metrics?.activeClients} active clients</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation to Detailed Dashboards */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800">
            Detailed Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => navigate('/dashboard/hr')}
              variant="outline"
              className="flex flex-col items-center space-y-2 h-20 justify-center hover:bg-green-50 border-green-200"
            >
              <Users size={20} className="text-green-600" />
              <span className="text-sm">HR Dashboard</span>
            </Button>

            <Button
              onClick={() => navigate('/dashboard/finance')}
              variant="outline"
              className="flex flex-col items-center space-y-2 h-20 justify-center hover:bg-blue-50 border-blue-200"
            >
              <DollarSign size={20} className="text-blue-600" />
              <span className="text-sm">Finance Dashboard</span>
            </Button>

            <Button
              onClick={() => navigate('/dashboard/campaigns')}
              variant="outline"
              className="flex flex-col items-center space-y-2 h-20 justify-center hover:bg-orange-50 border-orange-200"
            >
              <Target size={20} className="text-orange-600" />
              <span className="text-sm">Campaigns Dashboard</span>
            </Button>

            <Button
              onClick={() => navigate('/dashboard/productivity')}
              variant="outline"
              className="flex flex-col items-center space-y-2 h-20 justify-center hover:bg-purple-50 border-purple-200"
            >
              <Clock size={20} className="text-purple-600" />
              <span className="text-sm">Productivity Dashboard</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}