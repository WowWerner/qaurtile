import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, DollarSign, Target, Search, Loader2, Download, RefreshCw, Zap, BarChart3, PieChart, LineChart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { ChartRenderer } from '../components/ai/ChartRenderer';
import { supabase } from '../lib/supabase';
import { AIQueryProcessor } from '../services/aiQueryProcessor';
import { toast } from 'sonner';

interface AnalysisResult {
  id: string;
  query: string;
  answer: string;
  chartConfig?: any;
  timestamp: Date;
  metrics?: {
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
  }[];
}

interface QuickInsight {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

export function AIPredictiveAnalysisPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [quickInsights, setQuickInsights] = useState<QuickInsight[]>([]);
  const [activeTab, setActiveTab] = useState('analysis');

  useEffect(() => {
    loadQuickInsights();
    loadRecentAnalyses();
  }, []);

  const loadQuickInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('enhanced_features_with_actions')
        .select('settlement_probability, predicted_recovery, total_actions')
        .limit(1000);

      if (error) throw error;

      if (data && data.length > 0) {
        const avgProbability = (data.reduce((sum, row) => sum + (row.settlement_probability || 0), 0) / data.length * 100).toFixed(1);
        const totalRecovery = data.reduce((sum, row) => sum + (row.predicted_recovery || 0), 0).toFixed(0);
        const highProbAccounts = data.filter(row => row.settlement_probability > 0.7).length;
        const avgActions = (data.reduce((sum, row) => sum + (row.total_actions || 0), 0) / data.length).toFixed(1);

        setQuickInsights([
          {
            title: 'Avg Settlement Probability',
            value: `${avgProbability}%`,
            change: '+5.2%',
            trend: 'up',
            icon: Target,
            color: 'rgb(16, 185, 129)'
          },
          {
            title: 'Predicted Recovery',
            value: `$${Number(totalRecovery).toLocaleString()}`,
            change: '+12.8%',
            trend: 'up',
            icon: DollarSign,
            color: 'rgb(0, 171, 174)'
          },
          {
            title: 'High Priority Accounts',
            value: highProbAccounts.toString(),
            change: '+8',
            trend: 'up',
            icon: TrendingUp,
            color: 'rgb(139, 92, 246)'
          },
          {
            title: 'Avg Actions per Account',
            value: avgActions,
            change: '-2.3%',
            trend: 'down',
            icon: Users,
            color: 'rgb(245, 158, 11)'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const loadRecentAnalyses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_messages')
        .select('*, ai_conversations!inner(*)')
        .eq('ai_conversations.user_id', user.id)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data) {
        const analyses = data.map(msg => ({
          id: msg.id,
          query: 'Previous Analysis',
          answer: msg.content,
          chartConfig: msg.chart_data,
          timestamp: new Date(msg.created_at)
        }));
        setAnalysisHistory(analyses);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!searchQuery.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setActiveTab('analysis');

    try {
      const result = await AIQueryProcessor.processUserQuery(searchQuery, []);

      const newAnalysis: AnalysisResult = {
        id: Date.now().toString(),
        query: searchQuery,
        answer: result.answer,
        chartConfig: result.chartConfig,
        timestamp: new Date()
      };

      setCurrentAnalysis(newAnalysis);
      setAnalysisHistory(prev => [newAnalysis, ...prev.slice(0, 4)]);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let conversationId = null;

        const { data: existingConv } = await supabase
          .from('ai_conversations')
          .select('id')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingConv) {
          conversationId = existingConv.id;
        } else {
          const { data: newConv } = await supabase
            .from('ai_conversations')
            .insert({ user_id: user.id, title: 'Dashboard Analysis' })
            .select()
            .single();
          conversationId = newConv?.id;
        }

        if (conversationId) {
          await supabase.from('ai_messages').insert([
            { conversation_id: conversationId, role: 'user', content: searchQuery },
            { conversation_id: conversationId, role: 'assistant', content: result.answer, chart_data: result.chartConfig }
          ]);
        }
      }

      setSearchQuery('');
      toast.success('Analysis complete');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = () => {
    if (!currentAnalysis) return;

    const content = `Query: ${currentAnalysis.query}\n\nAnalysis:\n${currentAnalysis.answer}\n\nTimestamp: ${currentAnalysis.timestamp.toISOString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Analysis exported');
  };

  const predefinedQueries = [
    { icon: Target, label: 'High Priority Accounts', query: 'Show me accounts with settlement probability above 70%', color: 'rgb(139, 92, 246)' },
    { icon: TrendingUp, label: 'Top Performers', query: 'Which clients have the highest predicted recovery amounts?', color: 'rgb(16, 185, 129)' },
    { icon: Users, label: 'Action Analysis', query: 'Show accounts with low action intensity but high settlement probability', color: 'rgb(0, 171, 174)' },
    { icon: DollarSign, label: 'Recovery Potential', query: 'What is the total predicted recovery amount by client?', color: 'rgb(245, 158, 11)' },
    { icon: BarChart3, label: 'Portfolio Overview', query: 'Give me a breakdown of accounts by probability category', color: 'rgb(239, 68, 68)' },
    { icon: Zap, label: 'Urgent Actions', query: 'Which accounts need urgent action today?', color: 'rgb(249, 115, 22)' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">AI Predictive Analytics</h1>
                <p className="text-sm text-gray-500">Data-driven insights and portfolio analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadQuickInsights}>
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={!currentAnalysis}>
                <Download size={16} className="mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickInsights.map((insight, idx) => (
            <Card key={idx} className="border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{insight.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{insight.value}</p>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={insight.trend === 'up' ? 'default' : 'secondary'}
                        className={`text-xs ${insight.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {insight.change}
                      </Badge>
                      <span className="text-xs text-gray-500">vs last period</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${insight.color}20` }}>
                    <insight.icon size={24} style={{ color: insight.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Bar */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder="Ask anything about your accounts, predictions, or recovery strategies..."
                  className="pl-10 h-12 text-base border-gray-300 focus:border-[rgb(0,171,174)] focus:ring-[rgb(0,171,174)]/20"
                  disabled={isAnalyzing}
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={!searchQuery.trim() || isAnalyzing}
                className="h-12 px-8 bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)] text-white"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <Zap size={20} className="mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Analysis Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {predefinedQueries.map((item, idx) => (
              <Card
                key={idx}
                className="border-gray-200 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => {
                  setSearchQuery(item.query);
                  setTimeout(() => handleAnalyze(), 100);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <item.icon size={20} style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500 truncate">{item.query}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Results Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="analysis">Current Analysis</TabsTrigger>
            <TabsTrigger value="history">Recent Analyses</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            {currentAnalysis ? (
              <>
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-900">Analysis Results</CardTitle>
                        <CardDescription className="mt-1">
                          Query: "{currentAnalysis.query}"
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {currentAnalysis.timestamp.toLocaleTimeString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{currentAnalysis.answer}</p>
                    </div>
                  </CardContent>
                </Card>

                {currentAnalysis.chartConfig && (
                  <ChartRenderer config={currentAnalysis.chartConfig} />
                )}
              </>
            ) : (
              <Card className="border-gray-200 border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
                  <p className="text-gray-500 mb-4">
                    Use the search bar above or click a quick action to start analyzing your data
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {analysisHistory.length > 0 ? (
              analysisHistory.map((analysis) => (
                <Card
                  key={analysis.id}
                  className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setCurrentAnalysis(analysis);
                    setActiveTab('analysis');
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                          {analysis.query}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">{analysis.answer}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {analysis.chartConfig && (
                          <Badge variant="secondary" className="text-xs">
                            <PieChart size={12} className="mr-1" />
                            Chart
                          </Badge>
                        )}
                        <span className="text-xs text-gray-400">
                          {analysis.timestamp.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-gray-200 border-dashed">
                <CardContent className="p-8 text-center">
                  <LineChart size={32} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No analysis history yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
