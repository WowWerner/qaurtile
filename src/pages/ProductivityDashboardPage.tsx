import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, TrendingUp, Phone, MessageCircle, Mail, FileText, Target, Download, Activity } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';

interface HourlyProductivity {
  id: number;
  hour: number;
  settlement_rate: number;
  recommended_action: string;
  productivity_score: number;
  created_at: string;
}

interface ActionTiming {
  id: number;
  action_type: string;
  best_hours: string;
  success_rate: number;
  created_at: string;
}

export function ProductivityDashboardPage() {
  const navigate = useNavigate();
  const [hourlyData, setHourlyData] = useState<HourlyProductivity[]>([]);
  const [actionTiming, setActionTiming] = useState<ActionTiming[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductivityData();
  }, []);

  const loadProductivityData = async () => {
    try {
      setLoading(true);
      
      const [hourlyResult, timingResult] = await Promise.all([
        supabase.from('dc_hourly_productivity').select('*').order('hour', { ascending: true }),
        supabase.from('dc_action_timing').select('*')
      ]);

      if (hourlyResult.data) setHourlyData(hourlyResult.data);
      if (timingResult.data) setActionTiming(timingResult.data);

    } catch (error) {
      console.error('Error loading productivity data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(0,171,174)]"></div>
          <p className="mt-4 text-gray-600">Loading productivity dashboard...</p>
        </div>
      </div>
    );
  }

  // Find peak hours
  const peakHours = hourlyData
    .sort((a, b) => (b.productivity_score || 0) - (a.productivity_score || 0))
    .slice(0, 3);

  const bestSettlementHours = hourlyData
    .sort((a, b) => (b.settlement_rate || 0) - (a.settlement_rate || 0))
    .slice(0, 3);

  // Calculate daily productivity metrics
  const avgProductivityScore = hourlyData.reduce((sum, h) => sum + (h.productivity_score || 0), 0) / (hourlyData.length || 1);
  const avgSettlementRate = hourlyData.reduce((sum, h) => sum + (h.settlement_rate || 0), 0) / (hourlyData.length || 1);
  const peakProductivityHour = hourlyData.sort((a, b) => (b.productivity_score || 0) - (a.productivity_score || 0))[0];
  const bestSettlementHour = hourlyData.sort((a, b) => (b.settlement_rate || 0) - (a.settlement_rate || 0))[0];

  const formatHour = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'phone_call': 
      case 'call': 
        return Phone;
      case 'sms': 
        return MessageCircle;
      case 'email': 
        return Mail;
      case 'letter': 
        return FileText;
      default: 
        return Target;
    }
  };

  const handleExportProductivity = () => {
    const csvContent = [
      'Hour,Settlement Rate,Productivity Score,Recommended Action',
      ...hourlyData.map(h => 
        `"${formatHour(h.hour)}","${((h.settlement_rate || 0) * 100).toFixed(2)}%","${(h.productivity_score || 0).toFixed(2)}","${h.recommended_action || 'Not specified'}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'productivity-analysis.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Chart data
  const hourlyChartData = hourlyData.map(h => ({
    hour: formatHour(h.hour),
    hourNum: h.hour,
    productivity: (h.productivity_score || 0) * 100,
    settlements: (h.settlement_rate || 0) * 100
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
              Daily Productivity Dashboard
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Hourly productivity analysis and optimal action timing
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleExportProductivity}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Download size={16} strokeWidth={1.5} />
          <span>Export Timing Data</span>
        </Button>
      </div>

      {/* Key Productivity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <TrendingUp size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Peak Productivity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-700">
              {formatHour(peakProductivityHour?.hour || 0)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              Score: {(peakProductivityHour?.productivity_score || 0).toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Target size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Best Settlement Hour</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-blue-700">
              {formatHour(bestSettlementHour?.hour || 0)}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Rate: {((bestSettlementHour?.settlement_rate || 0) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Activity size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Avg Productivity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {avgProductivityScore.toFixed(1)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Daily average score</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Clock size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Settlement Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-[rgb(0,171,174)]">
              {(avgSettlementRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Daily average</p>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Analysis Chart */}
      <Card className="border-gray-200 mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800">
            Hourly Productivity & Settlement Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={hourlyChartData}>
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
                formatter={(value: any, name: string) => [`${value}%`, name === 'productivity' ? 'Productivity Score' : 'Settlement Rate']}
              />
              <Area 
                type="monotone" 
                dataKey="productivity" 
                stackId="1"
                stroke="#00abae" 
                fill="#00abae" 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="settlements" 
                stackId="2"
                stroke="#22c55e" 
                fill="#22c55e" 
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Optimal Action Timing */}
      <Tabs defaultValue="timing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="timing">Optimal Action Timing</TabsTrigger>
          <TabsTrigger value="recommendations">Productivity Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timing">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Best Times for Different Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {actionTiming.map((timing, index) => {
                    const ActionIcon = getActionIcon(timing.action_type);
                    return (
                      <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <ActionIcon size={20} className="text-[rgb(0,171,174)]" />
                            <h4 className="font-medium text-gray-900 capitalize">
                              {timing.action_type.replace('_', ' ')}
                            </h4>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            (timing.success_rate || 0) > 0.2 ? 'bg-green-100 text-green-700' :
                            (timing.success_rate || 0) > 0.1 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {((timing.success_rate || 0) * 100).toFixed(1)}% Success
                          </span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Best Hours:</div>
                          <div className="font-medium text-lg text-gray-900">
                            {timing.best_hours || 'Analysis pending'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800 mb-4">Peak Performance Hours</h4>
                  {peakHours.map((hour, index) => (
                    <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-green-900">
                            {formatHour(hour.hour)}
                          </div>
                          <div className="text-sm text-green-700">
                            Productivity: {(hour.productivity_score || 0).toFixed(1)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-medium text-green-700">
                            #{index + 1}
                          </div>
                          <div className="text-xs text-green-600">Peak Hour</div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-green-600">
                        Action: {hour.recommended_action || 'General activities'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Productivity Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">🌅 Morning Strategy</h4>
                    <p className="text-sm text-blue-700">
                      8:00-10:00 AM shows high productivity. Schedule complex negotiations and important calls during this window.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">⚡ Peak Hours</h4>
                    <p className="text-sm text-green-700">
                      {peakProductivityHour ? formatHour(peakProductivityHour.hour) : 'Analysis pending'} is your peak productivity hour with score of {(peakProductivityHour?.productivity_score || 0).toFixed(1)}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-2">🎯 Settlement Window</h4>
                    <p className="text-sm text-purple-700">
                      {bestSettlementHour ? formatHour(bestSettlementHour.hour) : 'Analysis pending'} shows highest settlement success at {((bestSettlementHour?.settlement_rate || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Action Timing Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">📞 Phone Calls</h4>
                    <div className="text-lg font-light text-gray-700 mb-1">
                      {actionTiming.find(a => a.action_type?.includes('phone') || a.action_type?.includes('call'))?.best_hours || '9:00 AM - 11:00 AM'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Success Rate: {((actionTiming.find(a => a.action_type?.includes('phone') || a.action_type?.includes('call'))?.success_rate || 0) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">📧 Emails</h4>
                    <div className="text-lg font-light text-gray-700 mb-1">
                      {actionTiming.find(a => a.action_type?.includes('email'))?.best_hours || '8:00 AM - 10:00 AM'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Success Rate: {((actionTiming.find(a => a.action_type?.includes('email'))?.success_rate || 0) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">💬 SMS Messages</h4>
                    <div className="text-lg font-light text-gray-700 mb-1">
                      {actionTiming.find(a => a.action_type?.includes('sms'))?.best_hours || '10:00 AM - 2:00 PM'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Success Rate: {((actionTiming.find(a => a.action_type?.includes('sms'))?.success_rate || 0) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2">⏰ Time Management Tip</h4>
                    <p className="text-sm text-yellow-700">
                      Schedule your most important collection activities during peak productivity hours for maximum effectiveness.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detailed Hourly Breakdown */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800">
            Hourly Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Hour</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Productivity Score</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Settlement Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Recommended Action</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Performance Level</th>
                </tr>
              </thead>
              <tbody>
                {hourlyData.map((hour, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {formatHour(hour.hour)}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {(hour.productivity_score || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        (hour.settlement_rate || 0) > avgSettlementRate 
                          ? 'bg-green-100 text-green-700' 
                          : (hour.settlement_rate || 0) > avgSettlementRate * 0.7
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {((hour.settlement_rate || 0) * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {hour.recommended_action || 'General activities'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {(hour.productivity_score || 0) > avgProductivityScore * 1.2 ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-xs text-green-600">Peak</span>
                          </>
                        ) : (hour.productivity_score || 0) > avgProductivityScore * 0.8 ? (
                          <>
                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                            <span className="text-xs text-orange-600">Good</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-xs text-red-600">Low</span>
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
    </div>
  );
}