import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, TrendingUp, Target, Users, DollarSign, Activity, Download, Search, Filter, Eye, AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';

interface ClientSummary {
  client_name: string;
  client_tier: string;
  total_accounts: number;
  high_probability: number;
  medium_probability: number;
  low_probability: number;
  total_debt_value: number;
  avg_prediction_score: number;
  urgent_actions: number;
}

interface ClientAccount {
  account_id: number;
  client_id: number;
  client_name: string;
  client_debtor_id: string;
  debt_amount: number;
  hand_over_date: string;
  days_since_handover: number;
  client_tier: string;
  phone_call_count: number;
  letter_count: number;
  email_count: number;
  total_communications: number;
  promise_to_pay_count: number;
  balance_adjustments: number;
  file_uploads: number;
  status_changes: number;
  reference_numbers: number;
  legal_actions: number;
  prediction_score: number;
  probability_category: string;
  next_action: string;
  action_priority: string;
  action_timeframe: string;
  last_activity_date: string;
  export_timestamp: string;
}

export function EnhancedFeaturesPage() {
  const navigate = useNavigate();
  const [clientSummaries, setClientSummaries] = useState<ClientSummary[]>([]);
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('total_debt_value');
  const [selectedClient, setSelectedClient] = useState<string>('all');

  useEffect(() => {
    loadEnhancedData();
  }, []);

  const loadEnhancedData = async () => {
    try {
      setLoading(true);
      
      const [summaryResult, accountsResult] = await Promise.all([
        supabase.from('client_summary_dashboard').select('*').order('total_debt_value', { ascending: false }),
        supabase.from('client_account_predictions').select('*').order('prediction_score', { ascending: false })
      ]);

      if (summaryResult.data) setClientSummaries(summaryResult.data);
      if (accountsResult.data) setClientAccounts(accountsResult.data);

    } catch (error) {
      console.error('Error loading enhanced features data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredClients = () => {
    let filtered = clientSummaries;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.client_tier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filterBy === 'high-value') {
      filtered = filtered.filter(client => (client.total_debt_value || 0) > 10000000);
    } else if (filterBy === 'high-performance') {
      filtered = filtered.filter(client => (client.avg_prediction_score || 0) > 7);
    } else if (filterBy === 'urgent') {
      filtered = filtered.filter(client => (client.urgent_actions || 0) > 0);
    } else if (filterBy === 'tier-high') {
      filtered = filtered.filter(client => client.client_tier === 'High_Performer');
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'total_debt_value':
          return (b.total_debt_value || 0) - (a.total_debt_value || 0);
        case 'avg_prediction_score':
          return (b.avg_prediction_score || 0) - (a.avg_prediction_score || 0);
        case 'total_accounts':
          return (b.total_accounts || 0) - (a.total_accounts || 0);
        case 'urgent_actions':
          return (b.urgent_actions || 0) - (a.urgent_actions || 0);
        default:
          return (b.total_debt_value || 0) - (a.total_debt_value || 0);
      }
    });
  };

  const getFilteredAccounts = () => {
    let filtered = clientAccounts;

    if (selectedClient !== 'all') {
      filtered = filtered.filter(account => account.client_name === selectedClient);
    }

    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.client_debtor_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.next_action?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => (b.prediction_score || 0) - (a.prediction_score || 0));
  };

  const handleExportClientSummary = () => {
    const filteredClients = getFilteredClients();
    
    const csvContent = [
      'Client Name,Client Tier,Total Accounts,High Priority,Medium Priority,Low Priority,Total Debt Value,Avg Prediction Score,Urgent Actions',
      ...filteredClients.map(client => 
        `"${client.client_name}","${client.client_tier}","${client.total_accounts}","${client.high_probability}","${client.medium_probability}","${client.low_probability}","N$${(client.total_debt_value || 0).toLocaleString()}","${(client.avg_prediction_score || 0).toFixed(2)}","${client.urgent_actions}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'enhanced-client-summary.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAccounts = () => {
    const filteredAccounts = getFilteredAccounts();
    
    const csvContent = [
      'Account ID,Client,Debtor ID,Debt Amount,Prediction Score,Priority Category,Days Since Handover,Total Communications,PTPs,Next Action,Action Priority,Action Timeframe',
      ...filteredAccounts.map(account => 
        `"${account.account_id}","${account.client_name}","${account.client_debtor_id || 'N/A'}","N$${(account.debt_amount || 0).toLocaleString()}","${account.prediction_score || 0}","${account.probability_category}","${account.days_since_handover || 0}","${account.total_communications || 0}","${account.promise_to_pay_count || 0}","${account.next_action || 'N/A'}","${account.action_priority || 'N/A'}","${account.action_timeframe || 'N/A'}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'enhanced-account-predictions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewClient = (clientName: string) => {
    // Find client in accounts to get client_id
    const clientAccount = clientAccounts.find(acc => acc.client_name === clientName);
    if (clientAccount) {
      navigate(`/client/${clientAccount.client_id}`);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'High_Performer': return 'bg-green-100 text-green-700';
      case 'Medium_Performer': return 'bg-orange-100 text-orange-700';
      case 'Low_Performer': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (category: string) => {
    switch (category) {
      case 'HIGH': return 'bg-green-100 text-green-700';
      case 'MEDIUM': return 'bg-orange-100 text-orange-700';
      case 'LOW': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'NORMAL': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(0,171,174)]"></div>
          <p className="mt-4 text-gray-600">Loading enhanced features...</p>
        </div>
      </div>
    );
  }

  const filteredClients = getFilteredClients();
  const filteredAccounts = getFilteredAccounts();

  // Calculate summary metrics
  const totalPortfolioValue = clientSummaries.reduce((sum, client) => sum + (client.total_debt_value || 0), 0);
  const totalAccounts = clientSummaries.reduce((sum, client) => sum + (client.total_accounts || 0), 0);
  const avgPredictionScore = clientSummaries.length > 0 
    ? clientSummaries.reduce((sum, client) => sum + (client.avg_prediction_score || 0), 0) / clientSummaries.length
    : 0;
  const totalUrgentActions = clientSummaries.reduce((sum, client) => sum + (client.urgent_actions || 0), 0);

  // Chart data preparations
  const clientPerformanceData = filteredClients.slice(0, 10).map(client => ({
    name: client.client_name?.substring(0, 12) || 'Unknown',
    accounts: client.total_accounts || 0,
    value: (client.total_debt_value || 0) / 1000000,
    score: client.avg_prediction_score || 0,
    highPriority: client.high_probability || 0
  }));

  const tierDistribution = [
    { 
      name: 'High Performers', 
      value: clientSummaries.filter(c => c.client_tier === 'High_Performer').length,
      color: '#22c55e'
    },
    { 
      name: 'Medium Performers', 
      value: clientSummaries.filter(c => c.client_tier === 'Medium_Performer').length,
      color: '#f59e0b'
    },
    { 
      name: 'Low Performers', 
      value: clientSummaries.filter(c => c.client_tier === 'Low_Performer').length,
      color: '#ef4444'
    }
  ];

  const priorityDistributionData = [
    {
      name: 'High Priority',
      value: clientSummaries.reduce((sum, c) => sum + (c.high_probability || 0), 0),
      color: '#22c55e'
    },
    {
      name: 'Medium Priority', 
      value: clientSummaries.reduce((sum, c) => sum + (c.medium_probability || 0), 0),
      color: '#f59e0b'
    },
    {
      name: 'Low Priority',
      value: clientSummaries.reduce((sum, c) => sum + (c.low_probability || 0), 0),
      color: '#ef4444'
    }
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
              Enhanced Features Dashboard
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Advanced client analytics and account predictions
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleExportClientSummary}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Download size={16} strokeWidth={1.5} />
          <span>Export Analysis</span>
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <DollarSign size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Total Portfolio Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-blue-700">
              N${(totalPortfolioValue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-blue-600 mt-1">Across all clients</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Users size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Total Accounts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-700">
              {totalAccounts.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1">Enhanced analysis complete</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <TrendingUp size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Avg Prediction Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-purple-700">
              {avgPredictionScore.toFixed(1)}/10
            </div>
            <p className="text-xs text-purple-600 mt-1">AI model confidence</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-red-50 to-rose-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertTriangle size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Urgent Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-red-700">
              {totalUrgentActions}
            </div>
            <p className="text-xs text-red-600 mt-1">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Client Performance Overview */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Client Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clientPerformanceData}>
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
                  formatter={(value: any, name: string) => [
                    name === 'value' ? `N$${value}M` : value,
                    name === 'value' ? 'Portfolio Value' :
                    name === 'accounts' ? 'Total Accounts' :
                    name === 'score' ? 'Avg Score' : 'High Priority'
                  ]}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="score" fill="#22c55e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Client Tier Distribution */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Client Tier Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search clients or accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-200 focus:border-[rgb(0,171,174)] focus:ring-[rgb(0,171,174)]/20"
          />
        </div>
        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem value="high-value">High Value (>N$10M)</SelectItem>
            <SelectItem value="high-performance">High Performance (>7 score)</SelectItem>
            <SelectItem value="urgent">Urgent Actions</SelectItem>
            <SelectItem value="tier-high">High Performers Only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total_debt_value">Sort by Portfolio Value</SelectItem>
            <SelectItem value="avg_prediction_score">Sort by Prediction Score</SelectItem>
            <SelectItem value="total_accounts">Sort by Account Count</SelectItem>
            <SelectItem value="urgent_actions">Sort by Urgent Actions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="client-summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="client-summary">Client Summary</TabsTrigger>
          <TabsTrigger value="account-predictions">Account Predictions</TabsTrigger>
          <TabsTrigger value="priority-analysis">Priority Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="client-summary">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Enhanced Client Analysis</span>
                <div className="text-sm text-gray-600">
                  {filteredClients.length} clients • N${(filteredClients.reduce((sum, c) => sum + (c.total_debt_value || 0), 0) / 1000000).toFixed(1)}M total
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredClients.map((client, index) => (
                  <div 
                    key={index}
                    className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => handleViewClient(client.client_name)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{client.client_name}</h3>
                          <Badge className={getTierColor(client.client_tier)}>
                            {client.client_tier?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Total Accounts:</span>
                            <div className="font-medium text-gray-900">{client.total_accounts}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Portfolio Value:</span>
                            <div className="font-medium text-gray-900">N${(client.total_debt_value || 0).toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Avg Score:</span>
                            <div className="font-medium text-[rgb(0,171,174)]">{(client.avg_prediction_score || 0).toFixed(1)}/10</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Urgent Actions:</span>
                            <div className={`font-medium ${client.urgent_actions > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              {client.urgent_actions || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewClient(client.client_name);
                        }}
                      >
                        <Eye size={14} className="mr-1" />
                        View
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-medium text-green-700">{client.high_probability || 0}</div>
                        <div className="text-xs text-green-600">High Priority</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-medium text-orange-700">{client.medium_probability || 0}</div>
                        <div className="text-xs text-orange-600">Medium Priority</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-lg font-medium text-red-700">{client.low_probability || 0}</div>
                        <div className="text-xs text-red-600">Low Priority</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account-predictions">
          <div className="mb-6">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-64 bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clientSummaries.map((client) => (
                  <SelectItem key={client.client_name} value={client.client_name}>
                    {client.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Account-Level Predictions</span>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {filteredAccounts.length} accounts
                  </span>
                  <Button
                    onClick={handleExportAccounts}
                    size="sm"
                    variant="outline"
                  >
                    <Download size={16} className="mr-2" />
                    Export
                  </Button>
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
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Debt Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Score</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Priority</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Days Active</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Communications</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Next Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.slice(0, 50).map((account) => (
                      <tr key={account.account_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm text-gray-700">
                          {account.account_id}
                        </td>
                        <td className="py-3 px-4 text-gray-700 max-w-32 truncate">
                          {account.client_name}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          N${(account.debt_amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            account.prediction_score >= 8 ? 'bg-green-100 text-green-700' :
                            account.prediction_score >= 6 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {account.prediction_score || 0}/10
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(account.probability_category)}`}>
                            {account.probability_category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {account.days_since_handover || 0}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {account.total_communications || 0}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-48 truncate">
                          {account.next_action || 'No action specified'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority-analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Priority Distribution Chart */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Priority Distribution Across All Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={priorityDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {priorityDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* High Priority Actions */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Clients Requiring Urgent Action
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientSummaries
                    .filter(client => (client.urgent_actions || 0) > 0)
                    .sort((a, b) => (b.urgent_actions || 0) - (a.urgent_actions || 0))
                    .slice(0, 8)
                    .map((client, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                        onClick={() => handleViewClient(client.client_name)}
                      >
                        <div>
                          <h4 className="font-medium text-red-900">{client.client_name}</h4>
                          <div className="text-sm text-red-700">
                            {client.total_accounts} accounts • N${(client.total_debt_value || 0).toLocaleString()} portfolio
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-medium text-red-700">
                            {client.urgent_actions}
                          </div>
                          <div className="text-sm text-red-600">Urgent</div>
                        </div>
                      </div>
                    ))}

                  {clientSummaries.filter(client => (client.urgent_actions || 0) > 0).length === 0 && (
                    <div className="text-center py-8">
                      <Target size={48} className="text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">
                        No Urgent Actions Required
                      </h3>
                      <p className="text-sm text-gray-500">
                        All clients are operating within normal parameters
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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