import { useNavigate } from 'react-router-dom';
import { AuthService } from '../utils/auth';
import { DigitalClock } from '../components/DigitalClock';
import { PredictionCard } from '../components/PredictionCard';
import { Brain, TrendingUp, Users, BarChart3, Target, DollarSign, Clock, Building, UserCheck } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const cards = [
    {
      id: 'client-centric',
      title: ['Client', 'Centric', 'Predictive', 'Model'],
      boldWords: ['Client'],
      icon: Brain,
      color: 'rgb(0, 171, 174)',
      onClick: () => navigate('/select-client')
    },
    {
      id: 'action-based',
      title: ['Workforce', 'Planning', 'Advisor'],
      boldWords: ['Workforce'],
      icon: TrendingUp,
      color: 'rgb(100, 200, 150)',
      onClick: () => navigate('/action-analysis')
    },
    {
      id: 'intelligent-account',
      title: ['Intelligent', 'Account', 'Handover', 'Analysis'],
      boldWords: ['Intelligent'],
      icon: Users,
      color: 'rgb(150, 150, 255)',
      onClick: () => navigate('/intelligence-center')
    },
    {
      id: 'account-predictive',
      title: ['Account', 'Predictive', 'Analysis'],
      boldWords: ['Account'],
      icon: BarChart3,
      color: 'rgb(139, 92, 246)',
      onClick: () => navigate('/enhanced-features')
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {cards.map((card) => (
          <PredictionCard 
            key={card.id}
            {...card}
          />
        ))}
      </div>

    </div>
  );
}