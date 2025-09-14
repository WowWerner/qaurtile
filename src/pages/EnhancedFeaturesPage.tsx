import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Filter, Search, TrendingUp, DollarSign, Users, Target, Clock, Activity, BarChart3, AlertCircle, CheckCircle, Phone, Mail, MessageSquare, FileText, Scale, Calculator } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { supabase } from '../lib/supabase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter,
  ComposedChart, ReferenceLine
} from 'recharts';

interface EnhancedFeature {
  account_id: number;
  initial_value: number;
  handover_year: number;
  handover_month: number;
  handover_day_of_week: number;
  client_division: string;
  account_type: string;
  client_name: string;
  client_id: number;
  client_commission_rate: number;
  client_settlement_rate: number;
  is_settled: number;
  days_since_handover: number;
  sms_count: number;
  payment_count: number;
  total_payments: number;
  comment_count: number;
  debt_size_category: number;
  has_early_payment: number;
  days_to_first_payment: number;
  client_historical_settlement_rate: number;
  ptp_count: number;
  phone_call_count: number;
  letter_count: number;
  email_count: number;
  consultation_count: number;
  legal_action_count: number;
  refusal_count: number;
  invoice_action_count: number;
  interest_adjustment_count: number;
  total_actions: number;
}

interface DashboardMetrics {
  totalAccounts: number;
  totalPortfolioValue: number;
  settledAccounts: number;
  settlementRate: number;
  avgDaysToSettle: number;
  totalRecovered: number;
  recoveryRate: number;
  activeClients: number;
  totalActions: number;
  avgActionsPerAccount: number;
}

export function EnhancedFeaturesPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<EnhancedFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterDebtSize, setFilterDebtSize] = useState('all');
  const [filterSettlementStatus, setFilterSettlementStatus] = useState('all');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<EnhancedFeature | null>(null);

  useEffect(() => {
    loadEnhancedFeatures();
  }, []);

  const loadEnhancedFeatures = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('enhanced_features_with_actions')
        .select('*')
        .order('initial_value', { ascending: false });

      if (error) {
        console.error('Error loading enhanced features:', error);
        return;
      }

      setAccounts(data || []);
      calculateMetrics(data || []);
      
    } catch (error) {
      console.error('Error in loadEnhancedFeatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (accountData: EnhancedFeature[]) => {
    const totalAccounts = accountData.length;
    const totalPortfolioValue = accountData.reduce((sum, acc) => sum + (acc.initial_value || 0), 0);
    const settledAccounts = accountData.filter(acc => acc.is_settled === 1).length;
    const settlementRate = totalAccounts > 0 ? settledAccounts / totalAccounts : 0;
    
    const settledData = accountData.filter(acc => acc.is_settled === 1);
    const avgDaysToSettle = settledData.length > 0 
      ? settledData.reduce((sum, acc) => sum + (acc.days_since_handover || 0), 0) / settledData.length
      : 0;
    
    const totalRecovered = accountData.reduce((sum, acc) => sum + (acc.total_payments || 0), 0);
    const recoveryRate = totalPortfolioValue > 0 ? totalRecovered / totalPortfolioValue : 0;
    
    const uniqueClients = [...new Set(accountData.map(acc => acc.client_id))].length;
    const totalActions = accountData.reduce((sum, acc) => sum + (acc.total_actions || 0), 0);
    const avgActionsPerAccount = totalAccounts > 0 ? totalActions / totalAccounts : 0;

    setMetrics({
      totalAccounts,
      totalPortfolioValue,
      settledAccounts,
      settlementRate,
      avgDaysToSettle,
      totalRecovered,
      recoveryRate,
      activeClients: uniqueClients,
      totalActions,
      avgActionsPerAccount
    });
  };

  const getFilteredAccounts = () => {
    return accounts.filter(account => {
      const matchesSearch = !searchTerm || 
        account.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_id.toString().includes(searchTerm);
      
      const matchesClient = filterClient === 'all' || account.client_name === filterClient;
      
      const matchesDebtSize = filterDebtSize === 'all' || 
        (filterDebtSize === 'small' && account.debt_size_category === 1) ||
        (filterDebtSize === 'medium' && account.debt_size_category === 2) ||
        (filterDebtSize === 'large' && account.debt_size_category === 3);
      
      const matchesSettlement = filterSettlementStatus === 'all' ||
        (filterSettlementStatus === 'settled' && account.is_settled === 1) ||
        (filterSettlementStatus === 'active' && account.is_settled === 0);
      
      return matchesSearch && matchesClient && matchesDebtSize && matchesSettlement;
    });
  };

  const uniqueClients = [...new Set(accounts.map(acc => acc.client_name))].filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(0,171,174)]"></div>
          <p className="mt-4 text-gray-600">Loading Enhanced Features Dashboard...</p>
        </div>
      </div>
    );
  }

  const handleExportData = () => {
    const filteredData = getFilteredAccounts();
    const csvContent = [
      'Account ID,Client,Initial Value,Days Since Handover,Settled,Total Payments,Settlement Rate,Actions Taken,Phone Calls,SMS,Emails',
      ...filteredData.map(acc => 
        `${acc.account_id},"${acc.client_name}",${acc.initial_value},${acc.days_since_handover},${acc.is_settled ? 'Yes' : 'No'},${acc.total_payments || 0},${acc.client_settlement_rate || 0},${acc.total_actions},${acc.phone_call_count},${acc.sms_count},${acc.email_count}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'enhanced-features-analysis.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate prediction score for an account
  const calculatePredictionScore = (account: EnhancedFeature): number => {
    let score = 0;
    
    // Historical settlement rate weight (40%)
    score += (account.client_historical_settlement_rate || 0) * 40;
    
    // Recent activity weight (30%)
    if ((account.total_actions || 0) > 0) {
      const activityScore = Math.min(30, (account.total_actions || 0) / 10 * 30);
      score += activityScore;
    }
    
    // Payment behavior weight (20%)
    if (account.has_early_payment === 1) score += 15;
    if ((account.payment_count || 0) > 0) score += 5;
    
    // Time factor weight (10%) - newer accounts get slight bonus
    if ((account.days_since_handover || 0) < 90) score += 10;
    else if ((account.days_since_handover || 0) < 180) score += 5;
    
    return Math.min(100, Math.max(0, score));
  };

  const COLORS = ['#00abae', '#64c8cb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

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
              Enhanced Features Dashboard
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Advanced debt collection analytics and predictive insights
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleExportData}
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
            placeholder="Search accounts or clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-200 focus:border-[rgb(0,171,174)] focus:ring-[rgb(0,171,174)]/20"
          />
        </div>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {uniqueClients.map(client => (
              <SelectItem key={client} value={client}>{client}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDebtSize} onValueChange={setFilterDebtSize}>
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <SelectValue placeholder="All Debt Sizes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Debt Sizes</SelectItem>
            <SelectItem value="small">Small Debts</SelectItem>
            <SelectItem value="medium">Medium Debts</SelectItem>
            <SelectItem value="large">Large Debts</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSettlementStatus} onValueChange={setFilterSettlementStatus}>
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Users size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Total Accounts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {metrics?.totalAccounts?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getFilteredAccounts().length !== accounts.length ? 
                `${getFilteredAccounts().length.toLocaleString()} filtered` : 
                'Total portfolio'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <DollarSign size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Portfolio Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              N${metrics?.totalPortfolioValue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Initial debt value</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Target size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Settlement Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-600">
              {((metrics?.settlementRate || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics?.settledAccounts?.toLocaleString() || '0'} settled
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <TrendingUp size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Recovery Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-[rgb(0,171,174)]">
              {((metrics?.recoveryRate || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              N${metrics?.totalRecovered?.toLocaleString() || '0'} recovered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-8">
          <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
          <TabsTrigger value="segmentation">Account Segmentation</TabsTrigger>
          <TabsTrigger value="performance">Collection Performance</TabsTrigger>
          <TabsTrigger value="predictions">Predictive Insights</TabsTrigger>
          <TabsTrigger value="accounts">Account Deep-Dive</TabsTrigger>
          <TabsTrigger value="workload">Team Performance</TabsTrigger>
        </TabsList>

        {/* Portfolio Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Settlement Trends */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Settlement Performance by Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={
                    Array.from({ length: 12 }, (_, month) => {
                      const monthAccounts = accounts.filter(acc => acc.handover_month === month + 1);
                      const settledInMonth = monthAccounts.filter(acc => acc.is_settled === 1).length;
                      const monthRate = monthAccounts.length > 0 ? (settledInMonth / monthAccounts.length) * 100 : 0;
                      
                      return {
                        month: new Date(2024, month, 1).toLocaleDateString('en', { month: 'short' }),
                        rate: monthRate,
                        accounts: monthAccounts.length,
                        settled: settledInMonth
                      };
                    })
                  }>
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
                        name === 'rate' ? `${value}%` : value,
                        name === 'rate' ? 'Settlement Rate' : name
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#00abae" 
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Client Performance Distribution */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Client Performance Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={uniqueClients.map(client => {
                        const clientAccounts = accounts.filter(acc => acc.client_name === client);
                        const clientSettled = clientAccounts.filter(acc => acc.is_settled === 1).length;
                        const clientValue = clientAccounts.reduce((sum, acc) => sum + (acc.initial_value || 0), 0);
                        
                        return {
                          name: client?.substring(0, 15) || 'Unknown',
                          value: clientValue,
                          accounts: clientAccounts.length,
                          settled: clientSettled,
                          rate: clientAccounts.length > 0 ? (clientSettled / clientAccounts.length) * 100 : 0
                        };
                      })}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${((entry.value / (metrics?.totalPortfolioValue || 1)) * 100).toFixed(1)}%`}
                    >
                      {uniqueClients.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`N$${value.toLocaleString()}`, 'Portfolio Value']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Portfolio Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">🎯 Top Performing Client</h4>
                    <p className="text-sm text-green-700">
                      {uniqueClients.map(client => {
                        const clientAccounts = accounts.filter(acc => acc.client_name === client);
                        const rate = clientAccounts.length > 0 ? 
                          (clientAccounts.filter(acc => acc.is_settled === 1).length / clientAccounts.length) * 100 : 0;
                        return { name: client, rate };
                      }).sort((a, b) => b.rate - a.rate)[0]?.name || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">⚡ Avg Days to Settle</h4>
                    <p className="text-sm text-blue-700">
                      {Math.round(metrics?.avgDaysToSettle || 0)} days
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-2">📞 Total Collection Actions</h4>
                    <p className="text-sm text-purple-700">
                      {metrics?.totalActions?.toLocaleString() || '0'} actions taken
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-800 mb-2">🎲 Avg Actions per Account</h4>
                    <p className="text-sm text-orange-700">
                      {(metrics?.avgActionsPerAccount || 0).toFixed(1)} actions
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-800 mb-2">📈 Recovery Efficiency</h4>
                    <p className="text-sm text-red-700">
                      N${((metrics?.totalRecovered || 0) / (metrics?.totalActions || 1)).toLocaleString()} per action
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">🏢 Active Clients</h4>
                    <p className="text-sm text-gray-700">
                      {metrics?.activeClients || 0} client portfolios
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Segmentation Tab */}
        <TabsContent value="segmentation">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Risk Segmentation */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Risk-Based Account Segmentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    {
                      segment: 'High Risk',
                      count: accounts.filter(acc => calculatePredictionScore(acc) < 30).length,
                      value: accounts.filter(acc => calculatePredictionScore(acc) < 30)
                        .reduce((sum, acc) => sum + (acc.initial_value || 0), 0)
                    },
                    {
                      segment: 'Medium Risk', 
                      count: accounts.filter(acc => {
                        const score = calculatePredictionScore(acc);
                        return score >= 30 && score < 60;
                      }).length,
                      value: accounts.filter(acc => {
                        const score = calculatePredictionScore(acc);
                        return score >= 30 && score < 60;
                      }).reduce((sum, acc) => sum + (acc.initial_value || 0), 0)
                    },
                    {
                      segment: 'Low Risk',
                      count: accounts.filter(acc => calculatePredictionScore(acc) >= 60).length,
                      value: accounts.filter(acc => calculatePredictionScore(acc) >= 60)
                        .reduce((sum, acc) => sum + (acc.initial_value || 0), 0)
                    }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="segment" fontSize={11} stroke="#666" />
                    <YAxis fontSize={11} stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="#00abae" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Action Effectiveness */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Action Type Effectiveness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={[
                    {
                      action: 'Phone Calls',
                      total: accounts.reduce((sum, acc) => sum + (acc.phone_call_count || 0), 0),
                      settled: accounts.filter(acc => acc.is_settled === 1)
                        .reduce((sum, acc) => sum + (acc.phone_call_count || 0), 0),
                      rate: accounts.filter(acc => (acc.phone_call_count || 0) > 0 && acc.is_settled === 1).length /
                            Math.max(1, accounts.filter(acc => (acc.phone_call_count || 0) > 0).length) * 100
                    },
                    {
                      action: 'SMS',
                      total: accounts.reduce((sum, acc) => sum + (acc.sms_count || 0), 0),
                      settled: accounts.filter(acc => acc.is_settled === 1)
                        .reduce((sum, acc) => sum + (acc.sms_count || 0), 0),
                      rate: accounts.filter(acc => (acc.sms_count || 0) > 0 && acc.is_settled === 1).length /
                            Math.max(1, accounts.filter(acc => (acc.sms_count || 0) > 0).length) * 100
                    },
                    {
                      action: 'Email',
                      total: accounts.reduce((sum, acc) => sum + (acc.email_count || 0), 0),
                      settled: accounts.filter(acc => acc.is_settled === 1)
                        .reduce((sum, acc) => sum + (acc.email_count || 0), 0),
                      rate: accounts.filter(acc => (acc.email_count || 0) > 0 && acc.is_settled === 1).length /
                            Math.max(1, accounts.filter(acc => (acc.email_count || 0) > 0).length) * 100
                    },
                    {
                      action: 'Letters',
                      total: accounts.reduce((sum, acc) => sum + (acc.letter_count || 0), 0),
                      settled: accounts.filter(acc => acc.is_settled === 1)
                        .reduce((sum, acc) => sum + (acc.letter_count || 0), 0),
                      rate: accounts.filter(acc => (acc.letter_count || 0) > 0 && acc.is_settled === 1).length /
                            Math.max(1, accounts.filter(acc => (acc.letter_count || 0) > 0).length) * 100
                    }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="action" fontSize={11} stroke="#666" />
                    <YAxis yAxisId="count" fontSize={11} stroke="#666" />
                    <YAxis yAxisId="rate" orientation="right" fontSize={11} stroke="#666" />
                    <Tooltip />
                    <Bar yAxisId="count" dataKey="total" fill="#64c8cb" />
                    <Line yAxisId="rate" type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Portfolio Insights & Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="text-lg font-medium text-green-800 mb-1">
                    {accounts.filter(acc => acc.has_early_payment === 1).length}
                  </div>
                  <div className="text-sm text-green-700 mb-2">Early Payers</div>
                  <div className="text-xs text-green-600">High conversion probability</div>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <div className="text-lg font-medium text-orange-800 mb-1">
                    {accounts.filter(acc => (acc.days_since_handover || 0) > 180).length}
                  </div>
                  <div className="text-sm text-orange-700 mb-2">Aged Accounts</div>
                  <div className="text-xs text-orange-600">Require urgent action</div>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="text-lg font-medium text-blue-800 mb-1">
                    {accounts.filter(acc => (acc.total_actions || 0) === 0).length}
                  </div>
                  <div className="text-sm text-blue-700 mb-2">No Actions Taken</div>
                  <div className="text-xs text-blue-600">Fresh inventory</div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="text-lg font-medium text-purple-800 mb-1">
                    {accounts.filter(acc => (acc.legal_action_count || 0) > 0).length}
                  </div>
                  <div className="text-sm text-purple-700 mb-2">Legal Actions</div>
                  <div className="text-xs text-purple-600">Escalated cases</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Segmentation Tab */}
        <TabsContent value="segmentation">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* High Priority Accounts */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg font-light text-green-800">
                  High Priority Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-light text-green-700 mb-4">
                  {accounts.filter(acc => calculatePredictionScore(acc) >= 70).length}
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {accounts
                    .filter(acc => calculatePredictionScore(acc) >= 70)
                    .sort((a, b) => (b.initial_value || 0) - (a.initial_value || 0))
                    .slice(0, 8)
                    .map((account, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-green-900">#{account.account_id}</div>
                            <div className="text-sm text-green-700">{account.client_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-800">N${(account.initial_value || 0).toLocaleString()}</div>
                            <div className="text-xs text-green-600">{calculatePredictionScore(account).toFixed(0)}% score</div>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            {/* Medium Priority Accounts */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-lg font-light text-orange-800">
                  Medium Priority Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-light text-orange-700 mb-4">
                  {accounts.filter(acc => {
                    const score = calculatePredictionScore(acc);
                    return score >= 40 && score < 70;
                  }).length}
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {accounts
                    .filter(acc => {
                      const score = calculatePredictionScore(acc);
                      return score >= 40 && score < 70;
                    })
                    .sort((a, b) => (b.initial_value || 0) - (a.initial_value || 0))
                    .slice(0, 8)
                    .map((account, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border border-orange-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-orange-900">#{account.account_id}</div>
                            <div className="text-sm text-orange-700">{account.client_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-orange-800">N${(account.initial_value || 0).toLocaleString()}</div>
                            <div className="text-xs text-orange-600">{calculatePredictionScore(account).toFixed(0)}% score</div>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            {/* Low Priority Accounts */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-lg font-light text-red-800">
                  Low Priority Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-light text-red-700 mb-4">
                  {accounts.filter(acc => calculatePredictionScore(acc) < 40).length}
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {accounts
                    .filter(acc => calculatePredictionScore(acc) < 40)
                    .sort((a, b) => (b.initial_value || 0) - (a.initial_value || 0))
                    .slice(0, 8)
                    .map((account, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border border-red-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-red-900">#{account.account_id}</div>
                            <div className="text-sm text-red-700">{account.client_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-red-800">N${(account.initial_value || 0).toLocaleString()}</div>
                            <div className="text-xs text-red-600">{calculatePredictionScore(account).toFixed(0)}% score</div>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Collection Performance Tab */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Actions vs Settlement Correlation */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Actions vs Settlement Success
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={accounts.map(acc => ({
                    actions: acc.total_actions || 0,
                    settled: acc.is_settled,
                    value: acc.initial_value || 0,
                    days: acc.days_since_handover || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="actions" name="Total Actions" fontSize={11} stroke="#666" />
                    <YAxis dataKey="settled" name="Settled" fontSize={11} stroke="#666" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Scatter dataKey="settled" fill="#22c55e" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Time to Settlement Analysis */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Settlement Timeline Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[
                    {
                      period: '0-30 days',
                      settled: accounts.filter(acc => acc.is_settled === 1 && (acc.days_since_handover || 0) <= 30).length,
                      total: accounts.filter(acc => (acc.days_since_handover || 0) <= 30).length
                    },
                    {
                      period: '31-60 days',
                      settled: accounts.filter(acc => acc.is_settled === 1 && (acc.days_since_handover || 0) > 30 && (acc.days_since_handover || 0) <= 60).length,
                      total: accounts.filter(acc => (acc.days_since_handover || 0) > 30 && (acc.days_since_handover || 0) <= 60).length
                    },
                    {
                      period: '61-90 days',
                      settled: accounts.filter(acc => acc.is_settled === 1 && (acc.days_since_handover || 0) > 60 && (acc.days_since_handover || 0) <= 90).length,
                      total: accounts.filter(acc => (acc.days_since_handover || 0) > 60 && (acc.days_since_handover || 0) <= 90).length
                    },
                    {
                      period: '90+ days',
                      settled: accounts.filter(acc => acc.is_settled === 1 && (acc.days_since_handover || 0) > 90).length,
                      total: accounts.filter(acc => (acc.days_since_handover || 0) > 90).length
                    }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="period" fontSize={11} stroke="#666" />
                    <YAxis fontSize={11} stroke="#666" />
                    <Tooltip />
                    <Area type="monotone" dataKey="settled" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="total" stackId="2" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics Table */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Client Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Accounts</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Settled</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Portfolio Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Recovered</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueClients.map((client, index) => {
                      const clientAccounts = accounts.filter(acc => acc.client_name === client);
                      const settledCount = clientAccounts.filter(acc => acc.is_settled === 1).length;
                      const settlementRate = clientAccounts.length > 0 ? (settledCount / clientAccounts.length) * 100 : 0;
                      const portfolioValue = clientAccounts.reduce((sum, acc) => sum + (acc.initial_value || 0), 0);
                      const recovered = clientAccounts.reduce((sum, acc) => sum + (acc.total_payments || 0), 0);
                      const avgDays = clientAccounts.length > 0 ? 
                        clientAccounts.reduce((sum, acc) => sum + (acc.days_since_handover || 0), 0) / clientAccounts.length : 0;

                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {client?.substring(0, 20) || 'Unknown'}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {clientAccounts.length}
                          </td>
                          <td className="py-3 px-4 text-green-600 font-medium">
                            {settledCount}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              settlementRate > 15 ? 'bg-green-100 text-green-700' :
                              settlementRate > 8 ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {settlementRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            N${portfolioValue.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            N${recovered.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {Math.round(avgDays)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Insights Tab */}
        <TabsContent value="predictions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Prediction Model */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  AI Settlement Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <h3 className="font-semibold text-green-800 text-lg mb-3">Next 30 Days Forecast</h3>
                    <div className="text-3xl font-light text-green-700 mb-2">
                      {accounts.filter(acc => acc.is_settled === 0 && calculatePredictionScore(acc) >= 70).length}
                    </div>
                    <p className="text-sm text-green-600">
                      High probability settlements expected
                    </p>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-blue-800 text-lg mb-3">Predicted Recovery</h3>
                    <div className="text-3xl font-light text-blue-700 mb-2">
                      N${(accounts
                        .filter(acc => acc.is_settled === 0)
                        .reduce((sum, acc) => sum + (acc.initial_value || 0) * (calculatePredictionScore(acc) / 100), 0)
                      ).toLocaleString()}
                    </div>
                    <p className="text-sm text-blue-600">
                      Weighted by prediction scores
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Best Actions */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  AI Recommended Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accounts
                    .filter(acc => acc.is_settled === 0)
                    .sort((a, b) => calculatePredictionScore(b) - calculatePredictionScore(a))
                    .slice(0, 6)
                    .map((account, index) => {
                      const score = calculatePredictionScore(account);
                      let recommendation = '';
                      let actionIcon = Phone;
                      
                      if (score >= 70) {
                        recommendation = 'Immediate phone contact - high conversion probability';
                        actionIcon = Phone;
                      } else if (score >= 40) {
                        recommendation = 'Email follow-up with payment plan options';
                        actionIcon = Mail;
                      } else {
                        recommendation = 'Consider legal action or write-off evaluation';
                        actionIcon = Scale;
                      }
                      
                      const ActionIcon = actionIcon;
                      
                      return (
                        <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <ActionIcon size={18} className="text-[rgb(0,171,174)]" />
                              <div>
                                <div className="font-medium text-gray-900">Account #{account.account_id}</div>
                                <div className="text-sm text-gray-600">{account.client_name}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">N${(account.initial_value || 0).toLocaleString()}</div>
                              <div className={`text-sm ${
                                score >= 70 ? 'text-green-600' :
                                score >= 40 ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {score.toFixed(0)}% probability
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {recommendation}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Account Deep-Dive Tab */}
        <TabsContent value="accounts">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Individual Account Analysis</span>
                <div className="text-sm text-gray-600">
                  {getFilteredAccounts().length} accounts
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredAccounts().slice(0, 20).map((account, index) => (
                  <div 
                    key={index} 
                    className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedAccount(account)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">Account #{account.account_id}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            account.is_settled === 1 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {account.is_settled === 1 ? 'Settled' : 'Active'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{account.client_name}</div>
                        <div className="text-xs text-gray-500">
                          {account.days_since_handover || 0} days since handover
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-light text-gray-800">
                          N${(account.initial_value || 0).toLocaleString()}
                        </div>
                        <div className={`text-sm font-medium ${
                          calculatePredictionScore(account) >= 70 ? 'text-green-600' :
                          calculatePredictionScore(account) >= 40 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {calculatePredictionScore(account).toFixed(0)}% prediction score
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-medium text-blue-700">{account.phone_call_count || 0}</div>
                        <div className="text-xs text-blue-600">Calls</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-medium text-green-700">{account.sms_count || 0}</div>
                        <div className="text-xs text-green-600">SMS</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-medium text-purple-700">{account.email_count || 0}</div>
                        <div className="text-xs text-purple-600">Emails</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-medium text-orange-700">{account.payment_count || 0}</div>
                        <div className="text-xs text-orange-600">Payments</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <div>Total Actions: {account.total_actions || 0}</div>
                      <div>Payments: N${(account.total_payments || 0).toLocaleString()}</div>
                      <div className={account.has_early_payment === 1 ? 'text-green-600' : 'text-gray-400'}>
                        {account.has_early_payment === 1 ? '✓ Early Payer' : 'No Early Payment'}
                      </div>
                    </div>
                  </div>
                ))}
                
                {getFilteredAccounts().length > 20 && (
                  <div className="text-center py-4 text-gray-500">
                    ... and {getFilteredAccounts().length - 20} more accounts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="workload">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Workload Distribution */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Action Distribution Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    {
                      action: 'Phone Calls',
                      total: accounts.reduce((sum, acc) => sum + (acc.phone_call_count || 0), 0),
                      avg: accounts.reduce((sum, acc) => sum + (acc.phone_call_count || 0), 0) / accounts.length
                    },
                    {
                      action: 'SMS',
                      total: accounts.reduce((sum, acc) => sum + (acc.sms_count || 0), 0),
                      avg: accounts.reduce((sum, acc) => sum + (acc.sms_count || 0), 0) / accounts.length
                    },
                    {
                      action: 'Emails',
                      total: accounts.reduce((sum, acc) => sum + (acc.email_count || 0), 0),
                      avg: accounts.reduce((sum, acc) => sum + (acc.email_count || 0), 0) / accounts.length
                    },
                    {
                      action: 'Letters',
                      total: accounts.reduce((sum, acc) => sum + (acc.letter_count || 0), 0),
                      avg: accounts.reduce((sum, acc) => sum + (acc.letter_count || 0), 0) / accounts.length
                    },
                    {
                      action: 'Legal',
                      total: accounts.reduce((sum, acc) => sum + (acc.legal_action_count || 0), 0),
                      avg: accounts.reduce((sum, acc) => sum + (acc.legal_action_count || 0), 0) / accounts.length
                    }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="action" fontSize={11} stroke="#666" />
                    <YAxis fontSize={11} stroke="#666" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#00abae" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Settlement Success by Action Type */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Settlement Success by Action Intensity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'High Touch (>15 actions)', min: 15, max: 999 },
                    { label: 'Medium Touch (5-15 actions)', min: 5, max: 15 },
                    { label: 'Low Touch (<5 actions)', min: 0, max: 5 },
                    { label: 'No Touch (0 actions)', min: 0, max: 0 }
                  ].map((category, index) => {
                    const categoryAccounts = accounts.filter(acc => {
                      const actions = acc.total_actions || 0;
                      return category.min === category.max ? actions === category.min :
                             actions >= category.min && actions < category.max;
                    });
                    const settled = categoryAccounts.filter(acc => acc.is_settled === 1).length;
                    const rate = categoryAccounts.length > 0 ? (settled / categoryAccounts.length) * 100 : 0;

                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{category.label}</h4>
                          <p className="text-sm text-gray-600">
                            {categoryAccounts.length} accounts, {settled} settled
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-medium ${
                            rate > 20 ? 'text-green-600' :
                            rate > 10 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {rate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">Success Rate</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Predictive Recommendations */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">🎯 Focus Accounts</h4>
                  <div className="text-2xl font-light text-green-700 mb-2">
                    {accounts.filter(acc => acc.is_settled === 0 && calculatePredictionScore(acc) >= 70).length}
                  </div>
                  <p className="text-sm text-green-700">
                    High-probability accounts requiring immediate attention
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-800 mb-2">📞 Action Gap</h4>
                  <div className="text-2xl font-light text-orange-700 mb-2">
                    {accounts.filter(acc => acc.is_settled === 0 && (acc.total_actions || 0) === 0).length}
                  </div>
                  <p className="text-sm text-orange-700">
                    Accounts with no collection actions taken yet
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">💰 Value Opportunity</h4>
                  <div className="text-2xl font-light text-blue-700 mb-2">
                    N${(accounts
                      .filter(acc => acc.is_settled === 0 && (acc.initial_value || 0) > 50000)
                      .reduce((sum, acc) => sum + (acc.initial_value || 0), 0) / 1000000
                    ).toFixed(1)}M
                  </div>
                  <p className="text-sm text-blue-700">
                    High-value active accounts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Account Detail Modal/Sidebar would go here */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-medium text-gray-900">Account #{selectedAccount.account_id}</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedAccount(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Client</div>
                <div className="font-medium text-gray-900">{selectedAccount.client_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Initial Value</div>
                <div className="font-medium text-gray-900">N${(selectedAccount.initial_value || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Days Active</div>
                <div className="font-medium text-gray-900">{selectedAccount.days_since_handover || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Actions</div>
                <div className="font-medium text-gray-900">{selectedAccount.total_actions || 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-medium text-blue-700">{selectedAccount.phone_call_count || 0}</div>
                <div className="text-xs text-blue-600">Calls</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-medium text-green-700">{selectedAccount.sms_count || 0}</div>
                <div className="text-xs text-green-600">SMS</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="font-medium text-purple-700">{selectedAccount.email_count || 0}</div>
                <div className="text-xs text-purple-600">Email</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <div className="font-medium text-orange-700">{selectedAccount.letter_count || 0}</div>
                <div className="text-xs text-orange-600">Letters</div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">AI Recommendation</h4>
              <p className="text-sm text-gray-700">
                {calculatePredictionScore(selectedAccount) >= 70 
                  ? 'High priority account - immediate phone contact recommended'
                  : calculatePredictionScore(selectedAccount) >= 40
                  ? 'Medium priority - email follow-up with payment plan'
                  : 'Low priority - consider legal action or specialized collection'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}