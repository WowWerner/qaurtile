import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Target, AlertCircle, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';

interface FinancialForecast {
  metric: string;
  amount: number;
  forecast_date: string;
}

interface HighValueAccount {
  account_id: string;
  client_name: string;
  initial_value: number;
  settlement_probability: number;
  days_since_handover: number;
  total_actions: number;
  model_confidence_level: string;
  recommended_timeline: string;
}

interface ClientPattern {
  client_name: string;
  total_accounts: number;
  settlements: number;
  total_recovered: number;
  avg_debt_size: number;
  recovery_rate: number;
}

export function FinanceDashboardPage() {
  const navigate = useNavigate();
  const [forecasts, setForecasts] = useState<FinancialForecast[]>([]);
  const [highValueAccounts, setHighValueAccounts] = useState<HighValueAccount[]>([]);
  const [clientPatterns, setClientPatterns] = useState<ClientPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      const [forecastResult, highValueResult, clientPatternsResult] = await Promise.all([
        supabase.from('dc_financial_forecast').select('*').order('forecast_date', { ascending: false }),
        supabase.from('dc_high_priority_accounts').select('*').order('settlement_probability', { ascending: false }).limit(20),
        supabase.from('dc_client_patterns').select('*').order('total_recovered', { ascending: false })
      ]);

      if (forecastResult.data) setForecasts(forecastResult.data);
      if (highValueResult.data) setHighValueAccounts(highValueResult.data);
      if (clientPatternsResult.data) setClientPatterns(clientPatternsResult.data);

    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(0,171,174)]"></div>
          <p className="mt-4 text-gray-600">Loading financial dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate predictions based on existing data
  const totalPortfolioValue = highValueAccounts.reduce((sum, acc) => sum + (acc.initial_value || 0), 0);
  const weightedProbability = highValueAccounts.length > 0 
    ? highValueAccounts.reduce((sum, acc) => sum + (acc.settlement_probability || 0), 0) / highValueAccounts.length
    : 0;
  
  const predictedSettlements = totalPortfolioValue * weightedProbability;
  const nextThreeMonthsPrediction = predictedSettlements * 0.4; // 40% expected in next 3 months
  
  // High probability high value accounts (>0.6 probability, >N$25k)
  const highProbabilityHighValue = highValueAccounts.filter(acc => 
    (acc.settlement_probability || 0) > 0.6 && (acc.initial_value || 0) > 25000
  );

  const topRecoveryClients = clientPatterns
    .sort((a, b) => (b.recovery_rate || 0) - (a.recovery_rate || 0))
    .slice(0, 10);

  const handleExportFinancials = () => {
    const csvContent = [
      'Account ID,Client,Value,Settlement Probability,Days Since Handover,Actions Taken,Confidence Level',
      ...highValueAccounts.map(acc => 
        `"${acc.account_id}","${acc.client_name}","N$${(acc.initial_value || 0).toLocaleString()}","${((acc.settlement_probability || 0) * 100).toFixed(1)}%","${acc.days_since_handover || 0}","${acc.total_actions || 0}","${acc.model_confidence_level || 'Unknown'}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'financial-predictions.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Chart data
  const recoveryTrendData = clientPatterns.map((client, index) => ({
    month: `Month ${index + 1}`,
    recovered: client.total_recovered || 0,
    target: (client.total_recovered || 0) * 1.1,
    rate: (client.recovery_rate || 0) * 100
  }));

  const probabilityDistribution = [
    { name: 'High (>60%)', value: highValueAccounts.filter(acc => (acc.settlement_probability || 0) > 0.6).length },
    { name: 'Medium (30-60%)', value: highValueAccounts.filter(acc => (acc.settlement_probability || 0) >= 0.3 && (acc.settlement_probability || 0) <= 0.6).length },
    { name: 'Low (<30%)', value: highValueAccounts.filter(acc => (acc.settlement_probability || 0) < 0.3).length }
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
              Financial Forecasting Dashboard
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              AI-powered predictions and recovery analytics
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleExportFinancials}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Download size={16} strokeWidth={1.5} />
          <span>Export Predictions</span>
        </Button>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <DollarSign size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Predicted Settlements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-700">
              N${predictedSettlements.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1">Total portfolio prediction</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Calendar size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Next 3 Months</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-blue-700">
              N${nextThreeMonthsPrediction.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600 mt-1">Expected recovery</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <Target size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">High Value/High Prob</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-purple-700">
              {highProbabilityHighValue.length}
            </div>
            <p className="text-xs text-purple-600 mt-1">Premium targets</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <TrendingUp size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Portfolio Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-orange-700">
              N${totalPortfolioValue.toLocaleString()}
            </div>
            <p className="text-xs text-orange-600 mt-1">Under management</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recovery Trend */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Recovery Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={recoveryTrendData.slice(0, 12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={11} stroke="#666" />
                <YAxis fontSize={11} stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, name: string) => [
                    name === 'recovered' ? `N$${value.toLocaleString()}` : `N$${value.toLocaleString()}`,
                    name === 'recovered' ? 'Actual' : 'Target'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="recovered" 
                  stackId="1"
                  stroke="#00abae" 
                  fill="#00abae" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="target" 
                  stackId="2"
                  stroke="#64c8cb" 
                  fill="#64c8cb" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Settlement Probability Distribution */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Settlement Probability Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={probabilityDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={11} stroke="#666" />
                <YAxis fontSize={11} stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#00abae" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="predictions">Settlement Predictions</TabsTrigger>
          <TabsTrigger value="high-value">High Value Targets</TabsTrigger>
          <TabsTrigger value="recovery">Recovery Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="predictions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  AI Settlement Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <h3 className="font-semibold text-green-800 text-lg mb-3">Next 30 Days</h3>
                    <div className="text-3xl font-light text-green-700 mb-2">
                      N${(nextThreeMonthsPrediction / 3).toLocaleString()}
                    </div>
                    <p className="text-sm text-green-600">
                      Based on {highValueAccounts.length} high-priority accounts with average {(weightedProbability * 100).toFixed(1)}% probability
                    </p>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-blue-800 text-lg mb-3">Next 3 Months</h3>
                    <div className="text-3xl font-light text-blue-700 mb-2">
                      N${nextThreeMonthsPrediction.toLocaleString()}
                    </div>
                    <p className="text-sm text-blue-600">
                      Conservative estimate including seasonal factors and action intensity
                    </p>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                    <h3 className="font-semibold text-purple-800 text-lg mb-3">Portfolio Potential</h3>
                    <div className="text-3xl font-light text-purple-700 mb-2">
                      N${(totalPortfolioValue * 0.8).toLocaleString()}
                    </div>
                    <p className="text-sm text-purple-600">
                      Maximum recoverable with optimal strategy execution
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Model Confidence Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">High Confidence</h4>
                    <div className="text-2xl font-light text-green-700 mb-1">
                      {highValueAccounts.filter(acc => acc.model_confidence_level === 'High').length}
                    </div>
                    <p className="text-sm text-green-700">
                      Accounts with high prediction accuracy
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">Medium Confidence</h4>
                    <div className="text-2xl font-light text-orange-700 mb-1">
                      {highValueAccounts.filter(acc => acc.model_confidence_level === 'Medium').length}
                    </div>
                    <p className="text-sm text-orange-700">
                      Accounts requiring closer monitoring
                    </p>
                  </div>
                  
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">Low Confidence</h4>
                    <div className="text-2xl font-light text-red-700 mb-1">
                      {highValueAccounts.filter(acc => acc.model_confidence_level === 'Low').length}
                    </div>
                    <p className="text-sm text-red-700">
                      Accounts with uncertain outcomes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="high-value">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>High Value / High Probability Accounts</span>
                <div className="text-sm text-gray-600">
                  {highProbabilityHighValue.length} accounts worth N${highProbabilityHighValue.reduce((sum, acc) => sum + (acc.initial_value || 0), 0).toLocaleString()}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Account ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Probability</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Days Active</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highProbabilityHighValue.map((account, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm text-gray-700">
                          {account.account_id || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {account.client_name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-green-600 font-medium">
                          N${(account.initial_value || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            {((account.settlement_probability || 0) * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {account.days_since_handover || 0}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {account.total_actions || 0}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {account.recommended_timeline || 'Not specified'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovery">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Client Recovery Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Total Accounts</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Settlements</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Total Recovered</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Debt Size</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Recovery Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRecoveryClients.map((client, index) => (
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
                        <td className="py-3 px-4 text-gray-700">
                          N${(client.total_recovered || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          N${(client.avg_debt_size || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            (client.recovery_rate || 0) > 0.3 
                              ? 'bg-green-100 text-green-700' 
                              : (client.recovery_rate || 0) > 0.15
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {((client.recovery_rate || 0) * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {(client.recovery_rate || 0) > 0.25 ? (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-xs text-green-600">Excellent</span>
                              </>
                            ) : (client.recovery_rate || 0) > 0.15 ? (
                              <>
                                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                <span className="text-xs text-orange-600">Good</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <span className="text-xs text-red-600">Needs Improvement</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}