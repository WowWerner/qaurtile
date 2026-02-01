import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Target, BarChart3, Activity, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { supabase } from '../lib/supabase';

interface ClientAccount {
  account_id: number;
  client_id: number;
  client_name: string;
  client_debtor_id: string;
  debt_amount: number;
  hand_over_date: string;
  days_since_handover: number;
  client_tier: string;
  prediction_score: number;
  probability_category: 'HIGH' | 'MEDIUM' | 'LOW';
  next_action: string;
  action_priority: 'URGENT' | 'HIGH' | 'NORMAL';
  action_timeframe: string;
  last_activity_date: string;
}

interface ClientSummary {
  name: string;
  totalAccounts: number;
  totalDebt: number;
  avgScore: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  avgDaysSinceHandover: number;
  tier: string;
}

export function ClientDataPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [clientData, setClientData] = useState<ClientSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      
      // First, let's get all accounts for this client to debug
      console.log('Loading data for client ID:', clientId);
      
      // Get all accounts for this client
      const { data, error } = await supabase
        .from('client_account_predictions')
        .select('*')
        .eq('client_id', parseInt(clientId!))
        .order('account_id', { ascending: true });

      if (error) throw error;

      console.log('Raw client data for client', clientId, ':', data);
      console.log('Client ID being queried:', clientId);
      
      // Filter out test clients here instead of in the query
      const filteredData = data?.filter(account => 
        !account.client_name?.toLowerCase().includes('test')
      ) || [];
      
      console.log('Filtered data (excluding test):', filteredData);

      if (!filteredData || filteredData.length === 0) {
        console.log('No data found for client:', clientId);
        setClientData(null);
        return;
      }

      // Log priority distribution
      const priorityBreakdown = {
        high: filteredData.filter(acc => acc.probability_category === 'HIGH').length,
        medium: filteredData.filter(acc => acc.probability_category === 'MEDIUM').length,
        low: filteredData.filter(acc => acc.probability_category === 'LOW').length
      };
      console.log('Priority breakdown:', priorityBreakdown);
      
      // Log unique probability categories to see what's in the data
      const uniqueCategories = [...new Set(filteredData.map(acc => acc.probability_category))];
      console.log('Unique probability categories found:', uniqueCategories);
      
      // Log sample of medium priority accounts for NIDA specifically
      const mediumAccounts = filteredData.filter(acc => acc.probability_category === 'MEDIUM');
      console.log('Sample medium priority accounts:', mediumAccounts.slice(0, 3));

      // Calculate client summary
      const totalAccounts = filteredData.length;
      const totalDebt = filteredData.reduce((sum, acc) => sum + (acc.debt_amount || 0), 0);
      const avgScore = filteredData.reduce((sum, acc) => sum + (acc.prediction_score || 0), 0) / totalAccounts;
      const avgDaysSinceHandover = filteredData.reduce((sum, acc) => sum + (acc.days_since_handover || 0), 0) / totalAccounts;
      
      const highPriority = priorityBreakdown.high;
      const mediumPriority = priorityBreakdown.medium;
      const lowPriority = priorityBreakdown.low;

      console.log('Setting client data with counts:', { highPriority, mediumPriority, lowPriority });

      setClientData({
        name: filteredData[0].client_name,
        totalAccounts,
        totalDebt,
        avgScore: Math.round(avgScore),
        highPriority,
        mediumPriority,
        lowPriority,
        avgDaysSinceHandover: Math.round(avgDaysSinceHandover),
        tier: filteredData[0].client_tier || 'Unknown'
      });

    } catch (error) {
      console.error('Error loading client data:', error);
      setClientData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (cardType: string) => {
    navigate(`/client/${clientId}/accounts/${cardType}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(0,171,174)]"></div>
          <p className="mt-4 text-gray-600">Loading client data...</p>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-thin text-gray-600 mb-4">Client not found</h2>
          <p className="text-gray-500 mb-4">This client may not have any accounts or may not exist</p>
          <Button onClick={() => navigate('/select-client')} variant="outline">
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/select-client')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              {clientData.name}
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">Client Tier: {clientData.tier}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Users size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Total Accounts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {clientData.totalAccounts.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Under management</p>
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
              N${(clientData.totalDebt / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-gray-500 mt-1">Total debt amount</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <TrendingUp size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Avg Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-[rgb(0,171,174)]">
              {clientData.avgScore}/10
            </div>
            <p className="text-xs text-gray-500 mt-1">Prediction score</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Activity size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Avg Days</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {clientData.avgDaysSinceHandover}
            </div>
            <p className="text-xs text-gray-500 mt-1">Since handover</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div 
          className="group relative bg-white rounded-2xl p-8 h-80 cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 border border-gray-100"
          onClick={() => handleCardClick('HIGH')}
        >
          <div className="relative z-10 h-full flex flex-col">
            <div className="mb-6">
              <AlertCircle 
                size={32} 
                strokeWidth={1} 
                className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300"
              />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-left leading-tight">
                <div className="block">
                  <span className="text-2xl tracking-wide transition-colors duration-300 font-medium text-gray-800">
                    High Priority
                  </span>
                </div>
                <div className="block">
                  <span className="text-2xl tracking-wide transition-colors duration-300 font-thin text-gray-600">
                    {clientData.highPriority} Accounts
                  </span>
                </div>
              </h3>
            </div>

            <div 
              className="absolute bottom-6 right-6 w-4 h-4 rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backgroundColor: 'rgb(239, 68, 68)' }}
            />
          </div>

          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"
            style={{ backgroundColor: 'rgb(239, 68, 68)' }}
          />
        </div>

        <div 
          className="group relative bg-white rounded-2xl p-8 h-80 cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 border border-gray-100"
          onClick={() => handleCardClick('MEDIUM')}
        >
          <div className="relative z-10 h-full flex flex-col">
            <div className="mb-6">
              <Target 
                size={32} 
                strokeWidth={1} 
                className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300"
              />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-left leading-tight">
                <div className="block">
                  <span className="text-2xl tracking-wide transition-colors duration-300 font-medium text-gray-800">
                    Medium Priority
                  </span>
                </div>
                <div className="block">
                  <span className="text-2xl tracking-wide transition-colors duration-300 font-thin text-gray-600">
                    {clientData.mediumPriority} Accounts
                  </span>
                </div>
              </h3>
            </div>

            <div 
              className="absolute bottom-6 right-6 w-4 h-4 rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backgroundColor: 'rgb(251, 146, 60)' }}
            />
          </div>

          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"
            style={{ backgroundColor: 'rgb(251, 146, 60)' }}
          />
        </div>

        <div 
          className="group relative bg-white rounded-2xl p-8 h-80 cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 border border-gray-100"
          onClick={() => handleCardClick('LOW')}
        >
          <div className="relative z-10 h-full flex flex-col">
            <div className="mb-6">
              <BarChart3 
                size={32} 
                strokeWidth={1} 
                className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300"
              />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-left leading-tight">
                <div className="block">
                  <span className="text-2xl tracking-wide transition-colors duration-300 font-medium text-gray-800">
                    Low Priority
                  </span>
                </div>
                <div className="block">
                  <span className="text-2xl tracking-wide transition-colors duration-300 font-thin text-gray-600">
                    {clientData.lowPriority} Accounts
                  </span>
                </div>
              </h3>
            </div>

            <div 
              className="absolute bottom-6 right-6 w-4 h-4 rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backgroundColor: 'rgb(34, 197, 94)' }}
            />
          </div>

          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"
            style={{ backgroundColor: 'rgb(34, 197, 94)' }}
          />
        </div>
      </div>
    </div>
  );
}