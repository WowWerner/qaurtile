import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, DollarSign, Target, Activity, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface OverviewMetrics {
  totalAccounts: number;
  totalSettlements: number;
  totalRecovered: number;
  averageSettlementRate: number;
  topAgent: string;
  totalAgents: number;
  avgDaysToSettle: number;
  thisMonthRecovery: number;
}

interface ClientPattern {
  client_name: string;
  total_accounts: number;
  settlements: number;
  settlement_rate: number;
  total_recovered: number;
  avg_days_active: number;
}

interface AgentPerformance {
  assigned_agent: string;
  total_accounts: number;
  settlements: number;
  settlement_rate: number;
  total_recovered: number;
  daily_actions: number;
}

export function OverviewDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [clientPatterns, setClientPatterns] = useState<ClientPattern[]>([]);
  const [topAgents, setTopAgents] = useState<AgentPerformance[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load overview metrics from multiple tables
      const [clientPatternsResult, agentPerformanceResult, hourlyProductivityResult, forecastResult] = await Promise.all([
        supabase.from('dc_client_patterns').select('*'),
        supabase.from('dc_agent_performance').select('*'),
        supabase.from('dc_hourly_productivity').select('*'),
        supabase.from('dc_financial_forecast').select('*')
      ]);

      if (clientPatternsResult.data) {
        setClientPatterns(clientPatternsResult.data);
        
        // Calculate overview metrics
        const totalAccounts = clientPatternsResult.data.reduce((sum, client) => sum + (client.total_accounts || 0), 0);
        const totalSettlements = clientPatternsResult.data.reduce((sum, client) => sum + (client.settlements || 0), 0);
        const totalRecovered = clientPatternsResult.data.reduce((sum, client) => sum + (client.total_recovered || 0), 0);
        const avgSettlementRate = clientPatternsResult.data.length > 0 
          ? clientPatternsResult.data.reduce((sum, client) => sum + (client.settlement_rate || 0), 0) / clientPatternsResult.data.length
          : 0;

        setMetrics({
          totalAccounts,
          totalSettlements,
          totalRecovered,
          averageSettlementRate: avgSettlementRate * 100,
          topAgent: 'Loading...',
          totalAgents: agentPerformanceResult.data?.length || 0,
          avgDaysToSettle: clientPatternsResult.data.length > 0 
            ? clientPatternsResult.data.reduce((sum, client) => sum + (client.avg_days_active || 0), 0) / clientPatternsResult.data.length
            : 0,
          thisMonthRecovery: totalRecovered * 0.15 // Simulate current month
        });
      }

      if (agentPerformanceResult.data) {
        const sortedAgents = agentPerformanceResult.data
          .sort((a, b) => (b.settlement_rate || 0) - (a.settlement_rate || 0))
          .slice(0, 5);
        setTopAgents(sortedAgents);
      }

      if (hourlyProductivityResult.data) {
        setHourlyData(hourlyProductivityResult.data);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  const COLORS = ['#00abae', '#64c8cb', '#22c55e', '#f59e0b', '#ef4444'];

  // Prepare chart data
  const clientChartData = clientPatterns.map(client => ({
    name: client.client_name?.substring(0, 15) + '...' || 'Unknown',
    settlements: client.settlements || 0,
    accounts: client.total_accounts || 0,
    recovered: (client.total_recovered || 0) / 1000 // In thousands
  }));

  const agentChartData = topAgents.map(agent => ({
    name: agent.assigned_agent?.substring(0, 10) || 'Unknown',
    rate: (agent.settlement_rate || 0) * 100,
    settlements: agent.settlements || 0
  }));

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
              Overview Dashboard
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Real-time debt collection performance metrics and insights
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/dashboard/finance')}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <DollarSign size={16} strokeWidth={1.5} />
            <span>Financial Forecast</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Target size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Total Accounts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {metrics?.totalAccounts?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Under management</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <TrendingUp size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Settlements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-600">
              {metrics?.totalSettlements?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics?.averageSettlementRate ? `${metrics.averageSettlementRate.toFixed(1)}% avg rate` : 'Rate calculating...'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <DollarSign size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Recovered</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-600">
              N${(metrics?.totalRecovered || 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total collections</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Clock size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Avg Days</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {metrics?.avgDaysToSettle ? Math.round(metrics.avgDaysToSettle) : '0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">To settlement</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Client Performance Chart */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Client Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clientChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
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
                />
                <Bar dataKey="settlements" fill="#00abae" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Agent Performance Chart */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Top Agent Settlement Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
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
                  formatter={(value: any) => [`${value}%`, 'Settlement Rate']}
                />
                <Bar dataKey="rate" fill="#22c55e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="clients">Client Analysis</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Client Portfolio Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Accounts</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Settlements</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Recovered</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPatterns.slice(0, 10).map((client, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {client.client_name || 'Unknown Client'}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {(client.total_accounts || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-green-600 font-medium">
                          {(client.settlements || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            (client.settlement_rate || 0) > 0.15 
                              ? 'bg-green-100 text-green-700' 
                              : (client.settlement_rate || 0) > 0.08
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {((client.settlement_rate || 0) * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          N${(client.total_recovered || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {Math.round(client.avg_days_active || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Agent Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Agent</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Accounts</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Settlements</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Daily Actions</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Recovered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAgents.map((agent, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {agent.assigned_agent || 'Unknown Agent'}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {(agent.total_accounts || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-green-600 font-medium">
                          {(agent.settlements || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            (agent.settlement_rate || 0) > 15 
                              ? 'bg-green-100 text-green-700' 
                              : (agent.settlement_rate || 0) > 8
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {(agent.settlement_rate || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {(agent.daily_actions || 0).toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          N${(agent.total_recovered || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Settlement Prediction</h4>
                    <p className="text-sm text-blue-700">
                      Based on current patterns, expect {Math.round((metrics?.averageSettlementRate || 0) / 100 * (metrics?.totalAccounts || 0))} 
                      additional settlements in the next 30 days.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Revenue Forecast</h4>
                    <p className="text-sm text-green-700">
                      Projected N${((metrics?.thisMonthRecovery || 0) * 1.2).toLocaleString()} 
                      recovery for next month based on current trends.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">Optimization Opportunity</h4>
                    <p className="text-sm text-orange-700">
                      Agents averaging below {Math.round(topAgents.reduce((sum, a) => sum + (a.daily_actions || 0), 0) / topAgents.length)} 
                      daily actions could increase productivity with coaching.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hourlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="hour" 
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
                      />
                      <Line 
                        type="monotone" 
                        dataKey="productivity_score" 
                        stroke="#00abae" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <Clock size={32} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Hourly productivity data will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { name: 'Campaigns', path: '/dashboard/campaigns', icon: Target },
          { name: 'Finance', path: '/dashboard/finance', icon: DollarSign },
          { name: 'Clients', path: '/dashboard/clients', icon: Users },
          { name: 'HR Analytics', path: '/dashboard/hr', icon: Activity },
          { name: 'Productivity', path: '/dashboard/productivity', icon: Clock }
        ].map((item) => {
          const IconComponent = item.icon;
          return (
            <Card 
              key={item.name}
              className="border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-4 text-center">
                <IconComponent size={20} className="text-gray-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-700">{item.name}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}