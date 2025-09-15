import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, Target, Clock, User, MapPin, Phone, AlertTriangle, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface AccountData {
  account_id: number;
  client_name: string;
  initial_value: number;
  settlement_probability: number;
  days_since_handover: number;
  ptp_count: number;
  phone_call_count?: number;
  letter_count?: number;
  email_count?: number;
  legal_action_count?: number;
  total_actions: number;
  current_payments: number;
  action_intensity: number;
  communication_score: number;
  recommended_actions: string;
  predicted_recovery?: number;
  roi_score?: number;
}

export function AccountDetailsPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const account = location.state?.account as AccountData;

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-thin text-gray-600 mb-4">Account not found</h2>
          <p className="text-gray-500 mb-4">The requested account details could not be found</p>
          <Button onClick={() => navigate('/dashboard/finance')} variant="outline">
            Back to Finance Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getProbabilityColor = (probability: number) => {
    if (probability > 0.7) return 'bg-green-100 text-green-700';
    if (probability > 0.5) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const formatCurrency = (amount: number) => {
    return `N$${amount.toLocaleString()}`;
  };

  const calculateROI = () => {
    if (!account.action_intensity || account.action_intensity === 0) {
      return (account.predicted_recovery || 0);
    }
    return (account.predicted_recovery || 0) / account.action_intensity;
  };

  const getFinancialRecommendations = () => {
    const recommendations = [];
    
    if ((account.settlement_probability || 0) > 0.7) {
      recommendations.push('🎯 High probability account - prioritize immediate action');
      if ((account.initial_value || 0) > 25000) {
        recommendations.push('💰 High-value target - consider dedicating senior agent');
      }
    }
    
    if ((account.days_since_handover || 0) > 180) {
      recommendations.push('⏰ Aging account - escalate urgency to prevent write-off');
    }
    
    if ((account.total_actions || 0) < 3) {
      recommendations.push('📞 Low action count - increase contact frequency');
    }
    
    if ((account.current_payments || 0) > 0) {
      recommendations.push('✅ Active payments - maintain momentum with follow-up');
    }
    
    const roi = calculateROI();
    if (roi > 1000) {
      recommendations.push('📈 Excellent ROI potential - allocate maximum resources');
    } else if (roi < 100) {
      recommendations.push('⚠️ Low ROI - consider cost-effective actions only');
    }
    
    return recommendations;
  };

  const recommendations = getFinancialRecommendations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/finance')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              Account #{account.account_id || 'Unknown'}
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              {account.client_name || 'Unknown Client'} - Financial Analysis
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-light text-green-600">
            N${(account.predicted_recovery || 0).toLocaleString()}
          </div>
          <div className="text-sm font-light text-gray-500">Predicted Recovery</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Financial Details */}
        <div className="space-y-6">
          {/* Financial Metrics */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                <DollarSign size={20} strokeWidth={1.5} />
                <span>Financial Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-light text-gray-600 text-sm">Account Value:</span>
                  <div className="font-medium text-gray-900 text-lg">
                    {formatCurrency(account.initial_value || 0)}
                  </div>
                </div>
                <div>
                  <span className="font-light text-gray-600 text-sm">Settlement Probability:</span>
                  <div className="font-medium text-green-600">
                    {((account.settlement_probability || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="font-light text-gray-600 text-sm">Predicted Recovery:</span>
                  <div className="font-medium text-green-600 text-lg">
                    {formatCurrency(account.predicted_recovery || 0)}
                  </div>
                </div>
                <div>
                  <span className="font-light text-gray-600 text-sm">ROI Score:</span>
                  <div className="font-medium text-gray-900">
                    {calculateROI().toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                <Clock size={20} strokeWidth={1.5} />
                <span>Account Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-light text-gray-600 text-sm">Settlement Probability:</span>
                  <Badge className={getProbabilityColor(account.settlement_probability || 0)}>
                    {((account.settlement_probability || 0) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-light text-gray-600 text-sm">Days Since Handover:</span>
                  <span className="font-medium text-gray-900">{account.days_since_handover || 0} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-light text-gray-600 text-sm">Current Payments:</span>
                  <span className="font-medium text-green-600">{account.current_payments || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-light text-gray-600 text-sm">Communication Score:</span>
                  <span className="font-medium text-gray-900">{account.communication_score || 0}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-light text-gray-600 text-sm">PTPs Received:</span>
                  <span className="font-medium text-blue-600">{account.ptp_count || 0}</span>
                </div>
                {account.recommended_actions && (
                  <div className="pt-3 border-t border-gray-200">
                    <span className="font-light text-gray-600 text-sm">Recommended Actions:</span>
                    <div className="font-medium text-gray-900 mt-1 bg-blue-50 p-3 rounded">
                      {account.recommended_actions}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action History */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                <Activity size={20} strokeWidth={1.5} />
                <span>Action Summary</span>
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
                  <BarChart3 size={20} className="text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-medium text-green-700">
                    {account.letter_count || 0}
                  </div>
                  <div className="text-sm text-green-600">Letters</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <MapPin size={20} className="text-purple-600 mx-auto mb-2" />
                  <div className="text-lg font-medium text-purple-700">
                    {account.email_count || 0}
                  </div>
                  <div className="text-sm text-purple-600">Emails</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <AlertTriangle size={20} className="text-orange-600 mx-auto mb-2" />
                  <div className="text-lg font-medium text-orange-700">
                    {account.legal_action_count || 0}
                  </div>
                  <div className="text-sm text-orange-600">Legal Actions</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Actions:</span>
                  <span className="font-medium text-gray-900">{account.total_actions || 0}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Action Intensity:</span>
                  <span className="font-medium text-gray-900">{(account.action_intensity || 0).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Financial Analysis */}
        <div>
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                <TrendingUp size={20} strokeWidth={1.5} />
                <span>Financial Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Financial Metrics */}
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600 font-medium">Expected Recovery</span>
                    <span className="text-xl font-bold text-green-700">
                      {formatCurrency(account.predicted_recovery || 0)}
                    </span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Based on {((account.settlement_probability || 0) * 100).toFixed(1)}% probability
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-600 font-medium">ROI Efficiency</span>
                    <span className="text-xl font-bold text-blue-700">
                      {calculateROI().toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Recovery per action intensity unit
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-600 font-medium">Risk Assessment</span>
                    <span className="text-xl font-bold text-purple-700">
                      {account.days_since_handover > 180 ? 'HIGH' : 
                       account.days_since_handover > 90 ? 'MEDIUM' : 'LOW'}
                    </span>
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    {account.days_since_handover || 0} days since handover
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Financial Recommendations</h4>
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
                <h4 className="font-medium text-gray-800 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
                    size="sm"
                  >
                    <Phone size={16} className="mr-2" />
                    Priority Contact
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    size="sm"
                  >
                    <DollarSign size={16} className="mr-2" />
                    Payment Arrangement
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Target size={16} className="mr-2" />
                    Settlement Offer
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