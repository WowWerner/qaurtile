import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthService } from '../utils/auth';
import { DigitalClock } from '../components/DigitalClock';
import { PredictionCard } from '../components/PredictionCard';
import { QuickLinksSection } from '../components/QuickLinksSection';
import { UserInteractionsService } from '../utils/userInteractions';
import { usePageTracking } from '../hooks/usePageTracking';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Brain, TrendingUp, Users, BarChart3, Target, DollarSign, Clock, Building, UserCheck } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const [clientPerformanceData, setClientPerformanceData] = useState<any[]>([]);
  
  // Track page views
  usePageTracking();

  useEffect(() => {
    loadClientPerformanceData();
  }, []);

  const loadClientPerformanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('client_account_predictions')
        .select('client_name, client_id, debt_amount, prediction_score, probability_category')
        .not('client_name', 'ilike', '%test%')
        .order('client_name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Group by client and calculate metrics
        const clientMap = new Map();
        
        data.forEach(account => {
          const clientName = account.client_name;
          if (!clientMap.has(clientName)) {
            clientMap.set(clientName, {
              clientName,
              totalAccounts: 0,
              highPriority: 0,
              mediumPriority: 0,
              lowPriority: 0,
              totalDebtValue: 0,
              avgScore: 0
            });
          }
          
          const client = clientMap.get(clientName);
          client.totalAccounts += 1;
          client.totalDebtValue += account.debt_amount || 0;
          client.avgScore += account.prediction_score || 0;
          
          if (account.probability_category === 'HIGH') {
            client.highPriority += 1;
          } else if (account.probability_category === 'MEDIUM') {
            client.mediumPriority += 1;
          } else if (account.probability_category === 'LOW') {
            client.lowPriority += 1;
          }
        });
        
        // Convert to array and calculate averages
        const formattedData = Array.from(clientMap.values())
          .map(client => ({
            client: client.clientName?.substring(0, 12) || 'Unknown',
            highPriority: client.highPriority,
            mediumPriority: client.mediumPriority,
            totalAccounts: client.totalAccounts,
            debtValue: client.totalDebtValue / 1000000, // Convert to millions
            avgScore: client.avgScore / client.totalAccounts,
            fullName: client.clientName
          }))
          .sort((a, b) => b.highPriority - a.highPriority)
          .slice(0, 15); // Top 15 clients by high priority
          
        setClientPerformanceData(formattedData);
      }
    } catch (error) {
      console.error('Error loading client performance data:', error);
      // Create sample data if real data is not available
      const sampleData = Array.from({ length: 12 }, (_, i) => ({
        client: `Client ${i + 1}`,
        highPriority: Math.floor(20 + Math.random() * 100),
        mediumPriority: Math.floor(50 + Math.random() * 150),
        debtValue: Math.floor(5 + Math.random() * 25), // In millions
        avgScore: 5 + Math.random() * 5,
        fullName: `Sample Client ${i + 1}`
      }));
      setClientPerformanceData(sampleData);
    }
  };
  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleCardClick = (path: string, title: string, icon: string, category: string) => {
    // Track interaction before navigation
    UserInteractionsService.trackInteraction({
      id: path,
      title,
      path,
      icon,
      type: 'page',
      category
    });
    
    navigate(path);
  };
  const cards = [
    {
      id: 'client-centric',
      title: ['Client', 'Centric', 'Predictive', 'Model'],
      boldWords: ['Client'],
      icon: Brain,
      color: 'rgb(0, 171, 174)',
      onClick: () => handleCardClick('/select-client', 'Client Selection', 'Brain', 'Client Management')
    },
    {
      id: 'action-based',
      title: ['Workforce', 'Planning', 'Advisor'],
      boldWords: ['Workforce'],
      icon: TrendingUp,
      color: 'rgb(100, 200, 150)',
      onClick: () => handleCardClick('/action-analysis', 'Workforce Planning', 'TrendingUp', 'Planning')
    },
    {
      id: 'intelligent-account',
      title: ['Intelligent', 'Account', 'Handover', 'Analysis'],
      boldWords: ['Intelligent'],
      icon: Users,
      color: 'rgb(150, 150, 255)',
      onClick: () => handleCardClick('/intelligence-center', 'Intelligence Center', 'Users', 'Analysis')
    },
    {
      id: 'account-predictive',
      title: ['Account', 'Predictive', 'Analysis'],
      boldWords: ['Account'],
      icon: BarChart3,
      color: 'rgb(139, 92, 246)',
      onClick: () => handleCardClick('/enhanced-features', 'Enhanced Features', 'BarChart3', 'Analysis')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-16">
        <div className="flex flex-col">
          <img 
            src="https://qaurtile.com/wp-content/uploads/2021/12/qaurtile-logo.png" 
            alt="Quartile Logo" 
            className="max-h-12 w-auto mb-4 object-contain self-start"
          />
          <h1 className="text-sm font-extralight text-gray-700 tracking-wide">
            Smart Prediction Model
          </h1>
        </div>
        <div className="flex items-center space-x-6">
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            Sign Out
          </button>
          <DigitalClock />
        </div>
      </div>
      {/* Cards Grid */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-light text-gray-700 tracking-wide">
          Which intelligence do you want to work with?
        </h2>
      </div>
      
      {/* High Priority Accounts by Client Graph */}
      {clientPerformanceData.length > 0 && (
        <div className="w-full h-20 mb-12 -mx-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={clientPerformanceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="highPriorityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(0,171,174)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="rgb(0,171,174)" stopOpacity={0.02}/>
                </linearGradient>
                <linearGradient id="mediumPriorityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(100,200,150)" stopOpacity={0.08}/>
                  <stop offset="95%" stopColor="rgb(100,200,150)" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="client" 
                axisLine={false}
                tickLine={false}
                tick={false}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid rgba(0,171,174,0.3)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: any, name: string) => [
                  `${value} accounts`, 
                  name === 'highPriority' ? 'High Priority' : 'Medium Priority'
                ]}
                labelFormatter={(label) => {
                  const client = clientPerformanceData.find(c => c.client === label);
                  return `${client?.fullName || label} (${client?.totalAccounts || 0} total accounts)`;
                }}
              />
              <Area
                type="monotone"
                dataKey="highPriority"
                stroke="rgba(0,171,174,0.3)"
                strokeWidth={2}
                fill="url(#highPriorityGradient)"
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: 'rgb(0,171,174)', 
                  stroke: 'white', 
                  strokeWidth: 2 
                }}
              />
              <Area
                type="monotone"
                dataKey="mediumPriority"
                stroke="rgba(100,200,150,0.4)"
                strokeWidth={1.5}
                fill="url(#mediumPriorityGradient)"
                dot={false}
                activeDot={{ 
                  r: 3, 
                  fill: 'rgb(100,200,150)', 
                  stroke: 'white', 
                  strokeWidth: 2 
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {cards.map((card) => (
          <PredictionCard 
            key={card.id}
            {...card}
          />
        ))}
      </div>

      {/* Quick Links and Recently Viewed Section */}
      <div className="mt-16">
        <QuickLinksSection />
      </div>
    </div>
  );
}