import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, Target, Clock, User, MapPin, Phone, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

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
  phone_call_count?: number;
  letter_count?: number;
  email_count?: number;
  total_communications?: number;
  promise_to_pay_count?: number;
  legal_actions?: number;
}

export function AccountDetailsPage() {
  const { clientId, accountId } = useParams<{ clientId: string; accountId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const account = location.state?.account as ClientAccount;

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-thin text-gray-600 mb-4">Account not found</h2>
          <p className="text-gray-500 mb-4">The requested account details could not be found</p>
          <Button onClick={() => navigate(`/client/${clientId}`)} variant="outline">
            Back to Client
          </Button>
        </div>
      </div>
    );
  }

  const getPriorityColor = (category: string) => {
    switch (category) {
      case 'HIGH': return 'border-red-200 bg-red-50 text-red-700';
      case 'MEDIUM': return 'border-orange-200 bg-orange-50 text-orange-700';
      case 'LOW': return 'border-green-200 bg-green-50 text-green-700';
      default: return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  const getActionPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'border-red-200 bg-red-50 text-red-700';
      case 'HIGH': return 'border-orange-200 bg-orange-50 text-orange-700';
      case 'NORMAL': return 'border-green-200 bg-green-50 text-green-700';
      default: return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Generate recommendations based on account data
  const generateRecommendations = () => {
    const recommendations = [];
    
    if (account.probability_category === 'HIGH') {
      recommendations.push('High settlement probability - prioritize immediate contact');
      recommendations.push('Consider offering settlement discount for quick resolution');
    } else if (account.probability_category === 'MEDIUM') {
      recommendations.push('Medium probability - establish payment arrangement');
      recommendations.push('Monitor closely and escalate if no response');
    } else {
      recommendations.push('Low probability - consider legal action or tracing');
      recommendations.push('Investigate assets before proceeding');
    }
    
    if (account.days_since_handover > 90) {
      recommendations.push('Account aging - consider escalation strategies');
    }
    
    if (account.action_priority === 'URGENT') {
      recommendations.push('Urgent action required - immediate attention needed');
    }
    
    return recommendations;
  };

  const recommendations = generateRecommendations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/client/${clientId}/accounts/${account.probability_category}`)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              Account #{account.account_id}
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              {account.client_name} - {account.client_debtor_id || 'No Debtor ID'}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-3xl font-light ${
            account.probability_category === 'HIGH' ? 'text-red-600' :
            account.probability_category === 'MEDIUM' ? 'text-orange-600' : 'text-green-600'
          }`}>
            {account.prediction_score || 0}/10
          </div>
          <div className="text-sm font-light text-gray-500">Prediction Score</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Account Details */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                <DollarSign size={20} strokeWidth={1.5} />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-light text-gray-600 text-sm">Debt Amount:</span>
                  <div className="font-medium text-gray-900 text-lg">
                    N${account.debt_amount?.toLocaleString() || '0'}
                  </div>
                </div>
                <div>
                  <span className="font-light text-gray-600 text-sm">Client Tier:</span>
                  <div className="font-medium text-gray-900">
                    {account.client_tier || 'Unknown'}
                  </div>
                </div>
                <div>
                  <span className="font-light text-gray-600 text-sm">Handover Date:</span>
                  <div className="font-medium text-gray-900">
                    {formatDate(account.hand_over_date)}
                  </div>
                </div>
                <div>
                  <span className="font-light text-gray-600 text-sm">Days Since Handover:</span>
                  <div className="font-medium text-gray-900">
                    {account.days_since_handover || 0} days
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Priority and Actions */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                <Target size={20} strokeWidth={1.5} />
                <span>Priority & Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-3">
                  <span className="font-light text-gray-600 text-sm">Priority Category:</span>
                  <Badge className={`${getPriorityColor(account.probability_category)}`}>
                    {account.probability_category}
                  </Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-light text-gray-600 text-sm">Action Priority:</span>
                  <Badge className={`${getActionPriorityColor(account.action_priority)}`}>
                    {account.action_priority || 'NORMAL'}
                  </Badge>
                </div>
                <div>
                  <span className="font-light text-gray-600 text-sm">Action Timeframe:</span>
                  <div className="font-medium text-gray-900 mt-1">
                    {account.action_timeframe || 'Not specified'}
                  </div>
                </div>
                <div>
                  <span className="font-light text-gray-600 text-sm">Next Action:</span>
                  <div className="font-medium text-gray-900 mt-1">
                    {account.next_action || 'No action specified'}
                  </div>
                </div>
                <div>
                  <span className="font-light text-gray-600 text-sm">Last Activity:</span>
                  <div className="font-medium text-gray-900 mt-1">
                    {account.last_activity_date ? formatDate(account.last_activity_date) : 'No activity recorded'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Communication History */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                <Activity size={20} strokeWidth={1.5} />
                <span>Communication Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Phone size={20} className="text-blue-600 mx-auto mb-2" />
                  <div className="text-lg font-medium text-blue-700">
                    {account.phone_call_count || 0}
                  </div>
                  <div className="text-sm text-blue-600">Phone Calls</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <MapPin size={20} className="text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-medium text-green-700">
                    {account.letter_count || 0}
                  </div>
                  <div className="text-sm text-green-600">Letters</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Activity size={20} className="text-purple-600 mx-auto mb-2" />
                  <div className="text-lg font-medium text-purple-700">
                    {account.email_count || 0}
                  </div>
                  <div className="text-sm text-purple-600">Emails</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <TrendingUp size={20} className="text-orange-600 mx-auto mb-2" />
                  <div className="text-lg font-medium text-orange-700">
                    {account.promise_to_pay_count || 0}
                  </div>
                  <div className="text-sm text-orange-600">PTPs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recommendations */}
        <div>
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                <AlertTriangle size={20} strokeWidth={1.5} />
                <span>AI Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Collection Strategy</h4>
                <ul className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-[rgb(0,171,174)] rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm font-light text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3">Account Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-light text-gray-600">Settlement Probability:</span>
                    <span className={`font-medium ${
                      account.probability_category === 'HIGH' ? 'text-red-600' :
                      account.probability_category === 'MEDIUM' ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {account.probability_category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-light text-gray-600">Total Communications:</span>
                    <span className="font-medium text-gray-900">
                      {account.total_communications || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-light text-gray-600">Legal Actions:</span>
                    <span className="font-medium text-gray-900">
                      {account.legal_actions || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
                    size="sm"
                  >
                    <Phone size={16} className="mr-2" />
                    Initiate Contact
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Calendar size={16} className="mr-2" />
                    Schedule Follow-up
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    size="sm"
                  >
                    <AlertTriangle size={16} className="mr-2" />
                    Escalate Case
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}