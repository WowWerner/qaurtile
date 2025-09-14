import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Phone, Mail, MessageCircle, FileText, Users, TrendingUp, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface CampaignSummary {
  id: number;
  client_name: string;
  sms_count: number;
  phone_call_count: number;
  email_count: number;
  letter_count: number;
  ptp_count: number;
  legal_action_count: number;
  total_actions: number;
  settlements: number;
  sms_success_rate: number;
  phone_success_rate: number;
  email_success_rate: number;
}

interface ActionTiming {
  action_type: string;
  best_hours: string;
  success_rate: number;
}

export function CampaignsDashboardPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [actionTiming, setActionTiming] = useState<ActionTiming[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string>('all');

  useEffect(() => {
    loadCampaignData();
  }, []);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      
      const [campaignResult, timingResult] = await Promise.all([
        supabase.from('dc_campaign_summary').select('*').order('settlements', { ascending: false }),
        supabase.from('dc_action_timing').select('*')
      ]);

      if (campaignResult.data) setCampaigns(campaignResult.data);
      if (timingResult.data) setActionTiming(timingResult.data);

    } catch (error) {
      console.error('Error loading campaign data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(0,171,174)]"></div>
          <p className="mt-4 text-gray-600">Loading campaigns dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalActions = campaigns.reduce((sum, c) => sum + (c.total_actions || 0), 0);
  const totalSettlements = campaigns.reduce((sum, c) => sum + (c.settlements || 0), 0);
  const totalSMS = campaigns.reduce((sum, c) => sum + (c.sms_count || 0), 0);
  const totalCalls = campaigns.reduce((sum, c) => sum + (c.phone_call_count || 0), 0);
  const totalEmails = campaigns.reduce((sum, c) => sum + (c.email_count || 0), 0);
  const avgSuccessRate = campaigns.length > 0 
    ? campaigns.reduce((sum, c) => sum + ((c.sms_success_rate || 0) + (c.phone_success_rate || 0) + (c.email_success_rate || 0)) / 3, 0) / campaigns.length
    : 0;

  // Prepare chart data
  const actionTypeData = [
    { name: 'SMS', value: totalSMS, rate: campaigns.reduce((sum, c) => sum + (c.sms_success_rate || 0), 0) / campaigns.length },
    { name: 'Calls', value: totalCalls, rate: campaigns.reduce((sum, c) => sum + (c.phone_success_rate || 0), 0) / campaigns.length },
    { name: 'Emails', value: totalEmails, rate: campaigns.reduce((sum, c) => sum + (c.email_success_rate || 0), 0) / campaigns.length },
    { name: 'Letters', value: campaigns.reduce((sum, c) => sum + (c.letter_count || 0), 0), rate: 0 },
  ];

  const COLORS = ['#00abae', '#64c8cb', '#22c55e', '#f59e0b'];

  const filteredCampaigns = selectedClient === 'all' 
    ? campaigns 
    : campaigns.filter(c => c.client_name === selectedClient);

  const chartData = filteredCampaigns.map(campaign => ({
    client: campaign.client_name?.substring(0, 15) || 'Unknown',
    actions: campaign.total_actions || 0,
    settlements: campaign.settlements || 0,
    sms: campaign.sms_count || 0,
    calls: campaign.phone_call_count || 0,
    emails: campaign.email_count || 0
  }));

  const handleExportCampaigns = () => {
    const csvContent = [
      'Client,SMS Count,Phone Calls,Emails,Letters,PTPs,Legal Actions,Total Actions,Settlements,SMS Success Rate,Phone Success Rate,Email Success Rate',
      ...campaigns.map(c => 
        `"${c.client_name}",${c.sms_count},${c.phone_call_count},${c.email_count},${c.letter_count},${c.ptp_count},${c.legal_action_count},${c.total_actions},${c.settlements},${c.sms_success_rate}%,${c.phone_success_rate}%,${c.email_success_rate}%`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'campaign-analysis.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
              Campaigns Dashboard
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Campaign performance analysis and action effectiveness
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleExportCampaigns}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Download size={16} strokeWidth={1.5} />
          <span>Export Report</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Target size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Total Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {totalActions.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">All campaign actions</p>
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
              {totalSettlements.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">From campaigns</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Phone size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Success Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-[rgb(0,171,174)]">
              {avgSuccessRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Average across channels</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Users size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Active Clients</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {campaigns.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">With active campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Action Types Distribution */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Campaign Action Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={actionTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {actionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Client Campaign Performance */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Client Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="client" 
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
                <Bar dataKey="actions" fill="#00abae" radius={[2, 2, 0, 0]} />
                <Bar dataKey="settlements" fill="#22c55e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="summary">Campaign Summary</TabsTrigger>
          <TabsTrigger value="effectiveness">Channel Effectiveness</TabsTrigger>
          <TabsTrigger value="timing">Optimal Timing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Campaign Performance by Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Total Actions</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">SMS</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Calls</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Emails</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Letters</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Settlements</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {campaign.client_name || 'Unknown Client'}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {(campaign.total_actions || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-blue-600">
                          {(campaign.sms_count || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-green-600">
                          {(campaign.phone_call_count || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-purple-600">
                          {(campaign.email_count || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-orange-600">
                          {(campaign.letter_count || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-green-700 font-medium">
                          {(campaign.settlements || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            ((campaign.settlements || 0) / (campaign.total_actions || 1)) > 0.1 
                              ? 'bg-green-100 text-green-700' 
                              : ((campaign.settlements || 0) / (campaign.total_actions || 1)) > 0.05
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {(((campaign.settlements || 0) / (campaign.total_actions || 1)) * 100).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effectiveness">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Channel Success Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {actionTypeData.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {channel.name === 'SMS' && <MessageCircle size={20} className="text-blue-500" />}
                        {channel.name === 'Calls' && <Phone size={20} className="text-green-500" />}
                        {channel.name === 'Emails' && <Mail size={20} className="text-purple-500" />}
                        {channel.name === 'Letters' && <FileText size={20} className="text-orange-500" />}
                        <div>
                          <h4 className="font-medium text-gray-900">{channel.name}</h4>
                          <p className="text-sm text-gray-600">{channel.value.toLocaleString()} sent</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-medium text-gray-900">{channel.rate.toFixed(1)}%</div>
                        <p className="text-xs text-gray-500">Success rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Campaign Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Best Performing Channel</h4>
                    <p className="text-sm text-green-700">
                      {actionTypeData.sort((a, b) => b.rate - a.rate)[0]?.name} shows highest success rate at {actionTypeData.sort((a, b) => b.rate - a.rate)[0]?.rate.toFixed(1)}%
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Volume Leader</h4>
                    <p className="text-sm text-blue-700">
                      {actionTypeData.sort((a, b) => b.value - a.value)[0]?.name} has highest volume with {actionTypeData.sort((a, b) => b.value - a.value)[0]?.value.toLocaleString()} actions
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-800 mb-2">Optimization Tip</h4>
                    <p className="text-sm text-orange-700">
                      Consider increasing investment in {actionTypeData.sort((a, b) => b.rate - a.rate)[0]?.name} campaigns for better ROI
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timing">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Optimal Action Timing Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actionTiming.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Action Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Best Hours</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Success Rate</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actionTiming.map((timing, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900 capitalize">
                            {timing.action_type?.replace('_', ' ') || 'Unknown'}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {timing.best_hours || 'Not analyzed'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              (timing.success_rate || 0) > 0.2 
                                ? 'bg-green-100 text-green-700' 
                                : (timing.success_rate || 0) > 0.1
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {((timing.success_rate || 0) * 100).toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {timing.best_hours ? `Schedule during ${timing.best_hours}` : 'Gather more timing data'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No timing analysis data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}