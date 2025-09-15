import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Target, AlertCircle, Download, Eye, Clock, Activity } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

interface HighPriorityAccount {
  id: number;
  account_id: string;
  client_name: string;
  initial_value: number;
  settlement_probability: number;
  days_since_handover: number;
  ptp_count: number;
  phone_call_count: number;
  letter_count: number;
  email_count: number;
  legal_action_count: number;
  total_actions: number;
  current_payments: number;
  action_intensity: number;
  communication_score: number;
  recommended_actions: string;
  created_at: string;
  predicted_recovery?: number;
  roi_score?: number;
  urgency_score?: number;
}

interface FinancialMetrics {
  totalPortfolioValue: number;
  predictedRecovery: number;
  averageProbability: number;
  highValueHighProb: number;
  timeSensitiveCount: number;
  totalAccounts: number;
}

export function FinanceDashboardPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<HighPriorityAccount[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('roi_score');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('dc_high_priority_accounts')
        .select('*')
        .order('settlement_probability', { ascending: false });

      if (error) throw error;

      if (data) {
        // Calculate financial predictions for each account
        const enrichedAccounts = data.map(account => {
          const predicted_recovery = (account.initial_value || 0) * (account.settlement_probability || 0);
          
          // ROI Score: predicted recovery vs action intensity
          const roi_score = account.action_intensity > 0 
            ? predicted_recovery / account.action_intensity 
            : predicted_recovery;
          
          // Urgency Score: combination of probability, value, and time sensitivity
          const timeFactor = Math.max(0, 1 - (account.days_since_handover || 0) / 365); // Decreases over time
          const urgency_score = (account.settlement_probability || 0) * (account.initial_value || 0) * timeFactor;
          
          return {
            ...account,
            predicted_recovery,
            roi_score,
            urgency_score
          };
        });

        setAccounts(enrichedAccounts);

        // Calculate overall metrics
        const totalPortfolioValue = enrichedAccounts.reduce((sum, acc) => sum + (acc.initial_value || 0), 0);
        const predictedRecovery = enrichedAccounts.reduce((sum, acc) => sum + (acc.predicted_recovery || 0), 0);
        const averageProbability = enrichedAccounts.length > 0 
          ? enrichedAccounts.reduce((sum, acc) => sum + (acc.settlement_probability || 0), 0) / enrichedAccounts.length
          : 0;
        
        // High value (>N$25k) + High probability (>60%)
        const highValueHighProb = enrichedAccounts.filter(acc => 
          (acc.initial_value || 0) > 25000 && (acc.settlement_probability || 0) > 0.6
        ).length;
        
        // Time sensitive: >50% probability and >90 days old
        const timeSensitiveCount = enrichedAccounts.filter(acc => 
          (acc.settlement_probability || 0) > 0.5 && (acc.days_since_handover || 0) > 90
        ).length;

        setMetrics({
          totalPortfolioValue,
          predictedRecovery,
          averageProbability,
          highValueHighProb,
          timeSensitiveCount,
          totalAccounts: enrichedAccounts.length
        });
      }

    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedAccounts = () => {
    let filtered = accounts;

    // Apply filters
    if (filterBy === 'high-value') {
      filtered = filtered.filter(acc => (acc.initial_value || 0) > 25000);
    } else if (filterBy === 'high-probability') {
      filtered = filtered.filter(acc => (acc.settlement_probability || 0) > 0.6);
    } else if (filterBy === 'time-sensitive') {
      filtered = filtered.filter(acc => 
        (acc.settlement_probability || 0) > 0.5 && (acc.days_since_handover || 0) > 90
      );
    } else if (filterBy === 'premium-targets') {
      filtered = filtered.filter(acc => 
        (acc.initial_value || 0) > 25000 && (acc.settlement_probability || 0) > 0.6
      );
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(acc =>
        acc.account_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.recommended_actions?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'roi_score':
          return (b.roi_score || 0) - (a.roi_score || 0);
        case 'predicted_recovery':
          return (b.predicted_recovery || 0) - (a.predicted_recovery || 0);
        case 'urgency_score':
          return (b.urgency_score || 0) - (a.urgency_score || 0);
        case 'initial_value':
          return (b.initial_value || 0) - (a.initial_value || 0);
        case 'settlement_probability':
          return (b.settlement_probability || 0) - (a.settlement_probability || 0);
        default:
          return (b.roi_score || 0) - (a.roi_score || 0);
      }
    });

    return filtered;
  };

  const handleExportAccounts = () => {
    const filteredAccounts = getFilteredAndSortedAccounts();
    
    const csvContent = [
      'Account ID,Client,Value,Settlement Probability,Predicted Recovery,Days Since Handover,Total Actions,Communication Score,ROI Score,Urgency Score,Recommended Actions',
      ...filteredAccounts.map(acc => 
        `"${acc.account_id}","${acc.client_name}","N$${(acc.initial_value || 0).toLocaleString()}","${((acc.settlement_probability || 0) * 100).toFixed(1)}%","N$${(acc.predicted_recovery || 0).toLocaleString()}","${acc.days_since_handover || 0}","${acc.total_actions || 0}","${acc.communication_score || 0}","${(acc.roi_score || 0).toFixed(2)}","${(acc.urgency_score || 0).toFixed(2)}","${acc.recommended_actions || 'None'}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `financial-priority-accounts-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewAccount = (account: HighPriorityAccount) => {
    navigate(`/finance/account/${account.account_id}`, { 
      state: { account }
    });
  };

  const getProbabilityColor = (probability: number) => {
    if (probability > 0.7) return 'bg-green-100 text-green-700';
    if (probability > 0.5) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const getUrgencyColor = (urgencyScore: number, maxUrgency: number) => {
    const normalizedScore = urgencyScore / maxUrgency;
    if (normalizedScore > 0.7) return 'border-red-500 bg-red-50';
    if (normalizedScore > 0.4) return 'border-orange-500 bg-orange-50';
    return 'border-green-500 bg-green-50';
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

  const filteredAccounts = getFilteredAndSortedAccounts();
  const maxUrgencyScore = Math.max(...accounts.map(acc => acc.urgency_score || 0));

  // Chart data
  const chartData = filteredAccounts.slice(0, 20).map(acc => ({
    account: acc.account_id?.substring(0, 8) || 'Unknown',
    value: acc.initial_value || 0,
    probability: (acc.settlement_probability || 0) * 100,
    predicted: acc.predicted_recovery || 0,
    days: acc.days_since_handover || 0
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
              Financial Recovery Dashboard
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              High-priority accounts with recovery predictions and ROI analysis
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleExportAccounts}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
          disabled={filteredAccounts.length === 0}
        >
          <Download size={16} strokeWidth={1.5} />
          <span>Export Priority List ({filteredAccounts.length})</span>
        </Button>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <DollarSign size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Portfolio Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-700">
              N${(metrics?.totalPortfolioValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1">High priority accounts</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <TrendingUp size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Predicted Recovery</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-blue-700">
              N${(metrics?.predictedRecovery || 0).toLocaleString()}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {((metrics?.predictedRecovery || 0) / (metrics?.totalPortfolioValue || 1) * 100).toFixed(1)}% of portfolio
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <Target size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Premium Targets</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-purple-700">
              {metrics?.highValueHighProb || 0}
            </div>
            <p className="text-xs text-purple-600 mt-1">High value + High probability</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertCircle size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Time Sensitive</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-orange-700">
              {metrics?.timeSensitiveCount || 0}
            </div>
            <p className="text-xs text-orange-600 mt-1">Aging high-probability accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Input
            placeholder="Search by account ID, client, or recommended actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border-gray-200 focus:border-[rgb(0,171,174)] focus:ring-[rgb(0,171,174)]/20"
          />
        </div>
        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            <SelectItem value="premium-targets">Premium Targets</SelectItem>
            <SelectItem value="high-value">High Value (&gt;N$25k)</SelectItem>
            <SelectItem value="high-probability">High Probability (&gt;60%)</SelectItem>
            <SelectItem value="time-sensitive">Time Sensitive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="roi_score">Sort by ROI Score</SelectItem>
            <SelectItem value="predicted_recovery">Sort by Predicted Recovery</SelectItem>
            <SelectItem value="urgency_score">Sort by Urgency</SelectItem>
            <SelectItem value="initial_value">Sort by Value</SelectItem>
            <SelectItem value="settlement_probability">Sort by Probability</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Value vs Probability Scatter */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Recovery Potential Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="probability" 
                  name="Settlement Probability (%)"
                  fontSize={11}
                  stroke="#666"
                />
                <YAxis 
                  dataKey="value" 
                  name="Account Value"
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
                    name === 'probability' ? `${value}%` : `N$${value.toLocaleString()}`,
                    name === 'probability' ? 'Settlement Probability' : 'Account Value'
                  ]}
                />
                <Scatter dataKey="value" fill="#00abae" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Recovery Targets */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Top 10 Recovery Targets by ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="account" 
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
                  formatter={(value: any) => [`N$${value.toLocaleString()}`, 'Predicted Recovery']}
                />
                <Bar dataKey="predicted" fill="#22c55e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Account Lists */}
      <Tabs defaultValue="premium" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="premium">Premium Targets</TabsTrigger>
          <TabsTrigger value="roi">Best ROI</TabsTrigger>
          <TabsTrigger value="urgent">Time Sensitive</TabsTrigger>
          <TabsTrigger value="all">All Accounts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="premium">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Premium Targets - High Value & High Probability</span>
                <div className="text-sm text-gray-600">
                  Focus on these {accounts.filter(acc => (acc.initial_value || 0) > 25000 && (acc.settlement_probability || 0) > 0.6).length} accounts first
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts
                  .filter(acc => (acc.initial_value || 0) > 25000 && (acc.settlement_probability || 0) > 0.6)
                  .sort((a, b) => (b.predicted_recovery || 0) - (a.predicted_recovery || 0))
                  .slice(0, 20)
                  .map((account) => (
                    <div 
                      key={account.id} 
                      className="group p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => handleViewAccount(account)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">Account #{account.account_id}</h4>
                            <Badge className="bg-green-100 text-green-700">
                              {((account.settlement_probability || 0) * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">{account.client_name}</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Predicted Recovery:</span>
                              <div className="font-medium text-green-700">
                                N${(account.predicted_recovery || 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">ROI Score:</span>
                              <div className="font-medium text-gray-900">
                                {(account.roi_score || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-medium text-gray-900">
                            N${(account.initial_value || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {account.days_since_handover || 0} days old
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewAccount(account);
                            }}
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                      {account.recommended_actions && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <div className="text-sm text-green-700 bg-green-100 px-3 py-2 rounded">
                            💡 {account.recommended_actions}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Best ROI Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Account</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Probability</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Predicted Recovery</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">ROI Score</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.slice(0, 25).map((account) => (
                      <tr 
                        key={account.id} 
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewAccount(account)}
                      >
                        <td className="py-3 px-4 font-mono text-sm text-gray-700">
                          {account.account_id}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {account.client_name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          N${(account.initial_value || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getProbabilityColor(account.settlement_probability || 0)}>
                            {((account.settlement_probability || 0) * 100).toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium text-green-600">
                          N${(account.predicted_recovery || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-[rgb(0,171,174)]">
                          {(account.roi_score || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewAccount(account);
                            }}
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="urgent">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Time-Sensitive High Probability Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts
                  .filter(acc => (acc.settlement_probability || 0) > 0.5 && (acc.days_since_handover || 0) > 90)
                  .sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0))
                  .slice(0, 15)
                  .map((account) => (
                    <div 
                      key={account.id}
                      className={`group p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${getUrgencyColor(account.urgency_score || 0, maxUrgencyScore)}`}
                      onClick={() => handleViewAccount(account)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">Account #{account.account_id}</h4>
                            <Badge className="bg-orange-100 text-orange-700">
                              {account.days_since_handover || 0} days old
                            </Badge>
                            <Badge className={getProbabilityColor(account.settlement_probability || 0)}>
                              {((account.settlement_probability || 0) * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">{account.client_name}</div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Value:</span>
                              <div className="font-medium">N${(account.initial_value || 0).toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Predicted:</span>
                              <div className="font-medium text-green-600">N${(account.predicted_recovery || 0).toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Actions:</span>
                              <div className="font-medium">{account.total_actions || 0}</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-medium text-orange-600">
                            ⚠️ URGENT
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewAccount(account);
                            }}
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>All High Priority Accounts</span>
                <div className="text-sm text-gray-600">
                  {filteredAccounts.length} accounts | N${filteredAccounts.reduce((sum, acc) => sum + (acc.predicted_recovery || 0), 0).toLocaleString()} predicted recovery
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Account</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Probability</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Predicted Recovery</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Days Active</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.slice(0, 50).map((account) => (
                      <tr key={account.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm text-gray-700">
                          {account.account_id}
                        </td>
                        <td className="py-3 px-4 text-gray-700 max-w-32 truncate">
                          {account.client_name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          N${(account.initial_value || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getProbabilityColor(account.settlement_probability || 0)}>
                            {((account.settlement_probability || 0) * 100).toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium text-green-600">
                          N${(account.predicted_recovery || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {account.days_since_handover || 0}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {account.total_actions || 0}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewAccount(account)}
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
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

      {/* Financial Insights */}
      <Card className="border-gray-200 mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800">
            Financial Decision Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">💰 Immediate Recovery Potential</h4>
              <div className="text-2xl font-light text-green-700 mb-2">
                N${accounts
                  .filter(acc => (acc.settlement_probability || 0) > 0.7 && (acc.days_since_handover || 0) < 60)
                  .reduce((sum, acc) => sum + (acc.predicted_recovery || 0), 0)
                  .toLocaleString()}
              </div>
              <p className="text-sm text-green-700">
                From {accounts.filter(acc => (acc.settlement_probability || 0) > 0.7 && (acc.days_since_handover || 0) < 60).length} fresh high-probability accounts
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">⚡ Quick Wins Strategy</h4>
              <div className="text-2xl font-light text-blue-700 mb-2">
                {accounts.filter(acc => 
                  (acc.initial_value || 0) < 15000 && 
                  (acc.settlement_probability || 0) > 0.6 &&
                  (acc.total_actions || 0) < 5
                ).length}
              </div>
              <p className="text-sm text-blue-700">
                Small debts with high probability and minimal action required
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-2">🎯 Strategic Focus</h4>
              <div className="text-2xl font-light text-purple-700 mb-2">
                N${accounts
                  .filter(acc => (acc.initial_value || 0) > 50000 && (acc.settlement_probability || 0) > 0.4)
                  .reduce((sum, acc) => sum + (acc.predicted_recovery || 0), 0)
                  .toLocaleString()}
              </div>
              <p className="text-sm text-purple-700">
                From {accounts.filter(acc => (acc.initial_value || 0) > 50000 && (acc.settlement_probability || 0) > 0.4).length} high-value accounts worth focused effort
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}