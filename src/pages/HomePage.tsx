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
  const [companyTrendData, setCompanyTrendData] = useState<any[]>([]);
  
  // Track page views
  usePageTracking();

  useEffect(() => {
    loadCompanyTrendData();
  }, []);

  const loadCompanyTrendData = async () => {
    try {
      const { data, error } = await supabase
        .from('client_summary_dashboard')
        .select('*')
        .order('total_debt_value', { ascending: false })
        .limit(12);

      if (error) throw error;

      if (data && data.length > 0) {
        // Format data for multi-line chart
        const formattedData = data.map((client, index) => ({
          client: client.client_name?.substring(0, 10) || `Client ${index + 1}`,
          highPriority: client.high_probability || 0,
          mediumPriority: client.medium_probability || 0,
          totalDebtValue: (client.total_debt_value || 0) / 1000000, // Convert to millions
          totalAccounts: client.total_accounts || 0,
          fullName: client.client_name
        }));
        
        // Normalize data to prevent flat lines from outliers (like NIDA)
        const maxHighPriority = Math.max(...formattedData.map(d => d.highPriority));
        const maxMediumPriority = Math.max(...formattedData.map(d => d.mediumPriority));
        const maxDebtValue = Math.max(...formattedData.map(d => d.totalDebtValue));
        const maxAccounts = Math.max(...formattedData.map(d => d.totalAccounts));
        
        const normalizedData = formattedData.map(client => ({
          ...client,
          // Normalize to 0-100 scale for better visualization
          highPriorityNormalized: maxHighPriority > 0 ? (client.highPriority / maxHighPriority) * 100 : 0,
          mediumPriorityNormalized: maxMediumPriority > 0 ? (client.mediumPriority / maxMediumPriority) * 100 : 0,
          totalDebtValueNormalized: maxDebtValue > 0 ? (client.totalDebtValue / maxDebtValue) * 100 : 0,
          totalAccountsNormalized: maxAccounts > 0 ? (client.totalAccounts / maxAccounts) * 100 : 0
        }));
        
        setCompanyTrendData(normalizedData);
      }
    } catch (error) {
      console.error('Error loading company trend data:', error);
      // Create sample data for demonstration
      const sampleData = Array.from({ length: 10 }, (_, i) => {
        const highPriority = Math.floor(25 + Math.random() * 120);
        const mediumPriority = Math.floor(80 + Math.random() * 200);
        const totalDebtValue = Math.floor(8 + Math.random() * 40);
        const totalAccounts = Math.floor(50 + Math.random() * 300);
        
        return {
          client: `Client ${String.fromCharCode(65 + i)}`,
          highPriority,
          mediumPriority,
          totalDebtValue,
          totalAccounts,
          fullName: `Sample Client ${String.fromCharCode(65 + i)}`,
          // Normalized versions for consistent scaling
          highPriorityNormalized: (highPriority / 145) * 100,
          mediumPriorityNormalized: (mediumPriority / 280) * 100,
          totalDebtValueNormalized: (totalDebtValue / 48) * 100,
          totalAccountsNormalized: (totalAccounts / 350) * 100
        };
      });
      setCompanyTrendData(sampleData);
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
      
      {/* Company Performance Trend Graph */}
      {companyTrendData.length > 0 && (
        <div className="w-full h-20 mb-12 -mx-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={companyTrendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="highPriorityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(0,171,174)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="rgb(0,171,174)" stopOpacity={0.02}/>
                </linearGradient>
                <linearGradient id="mediumPriorityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(0,171,174)" stopOpacity={0.06}/>
                  <stop offset="95%" stopColor="rgb(0,171,174)" stopOpacity={0.008}/>
                </linearGradient>
                <linearGradient id="debtValueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(139,92,246)" stopOpacity={0.06}/>
                  <stop offset="95%" stopColor="rgb(139,92,246)" stopOpacity={0.01}/>
                </linearGradient>
                <linearGradient id="totalAccountsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(59,130,246)" stopOpacity={0.05}/>
                  <stop offset="95%" stopColor="rgb(59,130,246)" stopOpacity={0.008}/>
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
                  backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(40px) saturate(200%) contrast(120%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(200%) contrast(120%)',
                  fontSize: '11px',
                  padding: '10px 14px',
                  color: '#111827',
                  fontWeight: '600'
                }}
                formatter={(value: any, name: string) => [
                  name === 'highPriorityNormalized' ? `${companyTrendData.find(c => c.client === arguments[2])?.highPriority || 0} accounts` :
                  name === 'mediumPriorityNormalized' ? `${companyTrendData.find(c => c.client === arguments[2])?.mediumPriority || 0} accounts` :
                  name === 'totalDebtValueNormalized' ? `N$${companyTrendData.find(c => c.client === arguments[2])?.totalDebtValue || 0}M` :
                  `${companyTrendData.find(c => c.client === arguments[2])?.totalAccounts || 0} accounts`,
                  name === 'highPriorityNormalized' ? 'High Priority' : 
                  name === 'mediumPriorityNormalized' ? 'Medium Priority' : 
                  name === 'totalDebtValueNormalized' ? 'Portfolio Value' :
                  'Total Accounts'
                ]}
                labelFormatter={(label) => {
                  const client = companyTrendData.find(c => c.client === label);
                  return `${client?.fullName || label}`;
                }}
                labelStyle={{ 
                  fontSize: '11px', 
                  fontWeight: '700',
                  color: '#000000',
                  marginBottom: '4px'
                }}
                itemStyle={{ 
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}
              />
              <Area
                type="monotone"
                dataKey="highPriorityNormalized"
                stroke="rgba(0,171,174,0.6)"
                strokeWidth={2.5}
                fill="url(#highPriorityGradient)"
                dot={false}
                isAnimationActive={true}
                animationBegin={400}
                animationDuration={2500}
                activeDot={{ 
                  r: 4, 
                  fill: 'rgb(0,171,174)', 
                  stroke: 'white', 
                  strokeWidth: 2,
                  filter: 'drop-shadow(0 2px 4px rgba(0,171,174,0.3))'
                }}
              />
              <Area
                type="monotone"
                dataKey="mediumPriorityNormalized"
                stroke="rgba(0,171,174,0.4)"
                strokeWidth={2}
                fill="url(#mediumPriorityGradient)"
                dot={false}
                isAnimationActive={true}
                animationBegin={900}
                animationDuration={2700}
                activeDot={{ 
                  r: 3.5, 
                  fill: 'rgb(0,171,174)', 
                  stroke: 'white', 
                  strokeWidth: 2,
                  filter: 'drop-shadow(0 2px 4px rgba(0,171,174,0.2))'
                }}
              />
              <Area
                type="monotone"
                dataKey="totalDebtValueNormalized"
                stroke="rgba(139,92,246,0.5)"
                strokeWidth={1.5}
                fill="url(#debtValueGradient)"
                dot={false}
                isAnimationActive={true}
                animationBegin={1400}
                animationDuration={3000}
                activeDot={{ 
                  r: 2, 
                  fill: 'rgb(139,92,246)', 
                  stroke: 'white', 
                  strokeWidth: 2,
                  filter: 'drop-shadow(0 2px 4px rgba(139,92,246,0.3))'
                }}
              />
              <Area
                type="monotone"
                dataKey="totalAccountsNormalized"
                stroke="rgba(59,130,246,0.4)"
                strokeWidth={1.5}
                fill="url(#totalAccountsGradient)"
                dot={false}
                isAnimationActive={true}
                animationBegin={1800}
                animationDuration={2500}
                activeDot={{ 
                  r: 3, 
                  fill: 'rgb(59,130,246)', 
                  stroke: 'white', 
                  strokeWidth: 2,
                  filter: 'drop-shadow(0 2px 4px rgba(59,130,246,0.3))'
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