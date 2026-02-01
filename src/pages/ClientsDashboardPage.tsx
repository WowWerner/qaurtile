import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Clock, Target, Download, Search, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

interface ClientPattern {
  id: number;
  client_name: string;
  total_accounts: number;
  settlements: number;
  settlement_rate: number;
  avg_debt_size: number;
  total_debt_value: number;
  avg_days_active: number;
  median_days_active: number;
  avg_payments_per_account: number;
  total_recovered: number;
  avg_actions_per_account: number;
  recovery_rate: number;
  created_at: string;
}

interface DetailedPrediction {
  account_id: string;
  assigned_agent: string;
  client_name: string;
  initial_value: number;
  settlement_probability: number;
  model_confidence_level: string;
  priority_level: string;
  days_since_handover: number;
  payment_summary: string;
  action_summary: string;
  recommended_timeline: string;
  next_best_action: string;
}

export function ClientsDashboardPage() {
  const navigate = useNavigate();
  const [clientPatterns, setClientPatterns] = useState<ClientPattern[]>([]);
  const [predictions, setPredictions] = useState<DetailedPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('settlement_rate');

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      setLoading(true);
      
      const [patternsResult, predictionsResult] = await Promise.all([
        supabase.from('dc_client_patterns').select('*').order('settlement_rate', { ascending: false }),
        supabase.from('dc_detailed_model_predictions').select('*').order('settlement_probability', { ascending: false }).limit(50)
      ]);

      if (patternsResult.data) setClientPatterns(patternsResult.data);
      if (predictionsResult.data) setPredictions(predictionsResult.data);

    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(0,171,174)]"></div>
          <p className="mt-4 text-gray-600">Loading clients dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredClients = clientPatterns.filter(client =>
    client.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    switch (sortBy) {
      case 'settlement_rate':
        return (b.settlement_rate || 0) - (a.settlement_rate || 0);
      case 'total_recovered':
        return (b.total_recovered || 0) - (a.total_recovered || 0);
      case 'total_accounts':
        return (b.total_accounts || 0) - (a.total_accounts || 0);
      default:
        return 0;
    }
  });

  // Generate client insights and patterns
  const generateClientInsights = (client: ClientPattern) => {
    const insights = [];
    
    if ((client.settlement_rate || 0) > 0.15) {
      insights.push(`🎯 High performer - ${((client.settlement_rate || 0) * 100).toFixed(1)}% settlement rate`);
    } else if ((client.settlement_rate || 0) < 0.05) {
      insights.push(`⚠️ Underperforming - only ${((client.settlement_rate || 0) * 100).toFixed(1)}% settlement rate`);
    }
    
    if ((client.avg_days_active || 0) < 60) {
      insights.push('⚡ Quick settlements - avg ' + Math.round(client.avg_days_active || 0) + ' days');
    } else if ((client.avg_days_active || 0) > 120) {
      insights.push('🐌 Slow settlements - avg ' + Math.round(client.avg_days_active || 0) + ' days');
    }
    
    if ((client.avg_actions_per_account || 0) > 20) {
      insights.push('📞 High touch - ' + (client.avg_actions_per_account || 0).toFixed(1) + ' actions/account');
    } else if ((client.avg_actions_per_account || 0) < 10) {
      insights.push('📱 Low touch - ' + (client.avg_actions_per_account || 0).toFixed(1) + ' actions/account');
    }
    
    return insights;
  };

  const handleExportClients = () => {
    const csvContent = [
      'Client Name,Total Accounts,Settlements,Settlement Rate,Avg Debt Size,Total Recovered,Recovery Rate,Avg Days Active,Actions Per Account',
      ...clientPatterns.map(client => 
        `"${client.client_name}","${client.total_accounts}","${client.settlements}","${((client.settlement_rate || 0) * 100).toFixed(2)}%","N$${(client.avg_debt_size || 0).toLocaleString()}","N$${(client.total_recovered || 0).toLocaleString()}","${((client.recovery_rate || 0) * 100).toFixed(2)}%","${Math.round(client.avg_days_active || 0)}","${(client.avg_actions_per_account || 0).toFixed(1)}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'client-analysis.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Chart data
  const performanceChartData = filteredClients.slice(0, 10).map(client => ({
    name: client.client_name?.substring(0, 12) || 'Unknown',
    settlementRate: (client.settlement_rate || 0) * 100,
    recoveryRate: (client.recovery_rate || 0) * 100,
    avgDays: client.avg_days_active || 0,
    actionsPerAccount: client.avg_actions_per_account || 0
  }));

  // Settlement probability by client
  const clientProbabilityData = clientPatterns.map(client => {
    const clientPredictions = predictions.filter(p => p.client_name === client.client_name);
    const avgProbability = clientPredictions.length > 0 
      ? clientPredictions.reduce((sum, p) => sum + (p.settlement_probability || 0), 0) / clientPredictions.length
      : 0;
    
    return {
      client: client.client_name?.substring(0, 12) || 'Unknown',
      probability: avgProbability * 100,
      accounts: clientPredictions.length,
      value: clientPredictions.reduce((sum, p) => sum + (p.initial_value || 0), 0)
    };
  }).filter(item => item.accounts > 0);

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
              Clients Dashboard
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Client patterns, performance analysis, and settlement predictions
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleExportClients}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Download size={16} strokeWidth={1.5} />
          <span>Export Analysis</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-200 focus:border-[rgb(0,171,174)] focus:ring-[rgb(0,171,174)]/20"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="settlement_rate">Sort by Settlement Rate</SelectItem>
            <SelectItem value="total_recovered">Sort by Recovery</SelectItem>
            <SelectItem value="total_accounts">Sort by Account Volume</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Building size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Total Clients</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {clientPatterns.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active portfolios</p>
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
              {clientPatterns.length > 0 ? 
                (clientPatterns.reduce((sum, c) => sum + (c.settlement_rate || 0), 0) / clientPatterns.length * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Across all clients</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <DollarSign size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Total Portfolio</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              N${clientPatterns.reduce((sum, c) => sum + (c.total_debt_value || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Under management</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Clock size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Avg Days to Settle</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {clientPatterns.length > 0 ? 
                Math.round(clientPatterns.reduce((sum, c) => sum + (c.avg_days_active || 0), 0) / clientPatterns.length) : 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Average timeframe</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Settlement Rate Performance */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Client Settlement Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  fontSize={11}
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
                  formatter={(value: any, name: string) => [`${value}%`, name === 'settlementRate' ? 'Settlement Rate' : 'Recovery Rate']}
                />
                <Bar dataKey="settlementRate" fill="#00abae" radius={[2, 2, 0, 0]} />
                <Bar dataKey="recoveryRate" fill="#64c8cb" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Settlement Probability Prediction */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              AI Settlement Probability by Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={clientProbabilityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="accounts" 
                  name="Accounts"
                  fontSize={11}
                  stroke="#666"
                />
                <YAxis 
                  dataKey="probability" 
                  name="Probability"
                  fontSize={11}
                  stroke="#666"
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, name: string) => [
                    name === 'probability' ? `${value}%` : value,
                    name === 'probability' ? 'Settlement Probability' : 'Account Count'
                  ]}
                />
                <Scatter dataKey="probability" fill="#22c55e" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="patterns">Client Patterns</TabsTrigger>
          <TabsTrigger value="predictions">Settlement Predictions</TabsTrigger>
          <TabsTrigger value="insights">Performance Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="patterns">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Detailed Client Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredClients.map((client, index) => (
                  <div key={index} className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{client.client_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{client.total_accounts} accounts</span>
                          <span>{client.settlements} settlements</span>
                          <span>N${(client.total_recovered || 0).toLocaleString()} recovered</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-light ${
                          (client.settlement_rate || 0) > 0.15 ? 'text-green-600' :
                          (client.settlement_rate || 0) > 0.08 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {((client.settlement_rate || 0) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Settlement Rate</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Avg Debt Size</div>
                        <div className="font-medium">N${(client.avg_debt_size || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Recovery Rate</div>
                        <div className="font-medium">{((client.recovery_rate || 0) * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Avg Days Active</div>
                        <div className="font-medium">{Math.round(client.avg_days_active || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Actions/Account</div>
                        <div className="font-medium">{(client.avg_actions_per_account || 0).toFixed(1)}</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {generateClientInsights(client).map((insight, idx) => (
                        <div key={idx} className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">
                          {insight}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                AI Settlement Predictions by Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Predicted Accounts</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Probability</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Portfolio Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Predicted Recovery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientProbabilityData.map((client, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {client.client}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {client.accounts}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            client.probability > 60 ? 'bg-green-100 text-green-700' :
                            client.probability > 40 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {client.probability.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          N${client.value.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-green-600 font-medium">
                          N${(client.value * (client.probability / 100)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Performance Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientPatterns
                    .sort((a, b) => (b.settlement_rate || 0) - (a.settlement_rate || 0))
                    .slice(0, 5)
                    .map((client, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <h4 className="font-medium text-green-900">{client.client_name}</h4>
                          <p className="text-sm text-green-700">
                            {client.settlements} settlements from {client.total_accounts} accounts
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-medium text-green-700">
                            {((client.settlement_rate || 0) * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-green-600">Success Rate</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Recovery Champions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientPatterns
                    .sort((a, b) => (b.total_recovered || 0) - (a.total_recovered || 0))
                    .slice(0, 5)
                    .map((client, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <h4 className="font-medium text-blue-900">{client.client_name}</h4>
                          <p className="text-sm text-blue-700">
                            {((client.recovery_rate || 0) * 100).toFixed(1)}% recovery rate
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-medium text-blue-700">
                            N${(client.total_recovered || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-blue-600">Total Recovered</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Client Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">🏆 Best Practices</h4>
                    <p className="text-sm text-green-700">
                      Top performing client: <strong>{clientPatterns.sort((a, b) => (b.settlement_rate || 0) - (a.settlement_rate || 0))[0]?.client_name}</strong> with {((clientPatterns.sort((a, b) => (b.settlement_rate || 0) - (a.settlement_rate || 0))[0]?.settlement_rate || 0) * 100).toFixed(1)}% settlement rate
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-800 mb-2">⚡ Optimization</h4>
                    <p className="text-sm text-orange-700">
                      Clients with high action counts but low settlements may benefit from strategy refinement
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">📈 Growth Potential</h4>
                    <p className="text-sm text-blue-700">
                      Focus on clients with large portfolios but average performance for maximum impact
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}