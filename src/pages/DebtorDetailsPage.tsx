import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, DollarSign, AlertCircle, TrendingUp, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';


export function DebtorDetailsPage() {
  const { debtorId } = useParams<{ debtorId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get debtor data from navigation state or find in results
  const { results } = location.state || {};
  
  // Find the debtor in the results
  let debtor = null;
  if (results) {
    const allDebtors = [
      ...results.highProbability.debtors,
      ...results.mediumProbability.debtors,
      ...results.lowProbability.debtors
    ];
    debtor = allDebtors.find(d => d.id.toString() === debtorId);
  }

  // Generate AI recommendations based on debtor data
  const generateRecommendations = (debtorData: any) => {
    const recommendations = [];
    const riskFactors = [];
    const nextActions = [];
    
    if (debtorData.score >= 70) {
      recommendations.push('High probability debtor - prioritize immediate contact');
      nextActions.push('Initiate contact within 24 hours');
    } else if (debtorData.score >= 40) {
      recommendations.push('Medium probability debtor - requires strategic approach');
      nextActions.push('Contact within 48-72 hours');
    } else {
      recommendations.push('Low probability debtor - may require tracing or legal action');
      nextActions.push('Consider tracing services or legal escalation');
      riskFactors.push('Limited recovery likelihood based on current data');
    }
    
    if (debtorData.phone !== 'No phone') {
      recommendations.push('Valid contact information available - use phone contact first');
    } else {
      riskFactors.push('No valid phone contact - may require alternative contact methods');
    }
    
    if (debtorData.lastPayment !== 'No payment') {
      recommendations.push('Payment history indicates willingness to pay');
      nextActions.push('Reference previous payment when contacting');
    } else {
      riskFactors.push('No payment history - debtor commitment uncertain');
    }
    
    nextActions.push('Document all communications');
    nextActions.push('Update debtor contact information if possible');
    
    if (riskFactors.length === 0) {
      riskFactors.push('None identified - proceed with confidence');
    }
    
    return { recommendations, riskFactors, nextActions };
  };

  if (!debtor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-thin text-gray-600 mb-4">Debtor not found</h2>
          <p className="text-gray-500 mb-4">The requested debtor details could not be found</p>
          <Button onClick={() => navigate('/intelligence-center')} variant="outline">
            Back to Intelligence Center
          </Button>
        </div>
      </div>
    );
  }

  const { recommendations, riskFactors, nextActions } = generateRecommendations(debtor);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/intelligence-center/analysis-results')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              {debtor.name}
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">Debtor ID: {debtor.id}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-3xl font-light ${getScoreColor(debtor.score)}`}>
            {debtor.score}/100
          </div>
          <div className="text-sm font-light text-gray-500">Intelligence Score</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Column */}
        <div>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                    <DollarSign size={20} strokeWidth={1.5} />
                    <span>Debt Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-light text-gray-600">Outstanding Amount:</span>
                    <span className="font-medium text-gray-900">{debtor.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-light text-gray-600">Last Payment:</span>
                    <span className="font-medium text-gray-900">{debtor.lastPayment || 'No payment'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                    <Phone size={20} strokeWidth={1.5} />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone size={16} strokeWidth={1.5} className="text-gray-400" />
                    <span className="font-light text-gray-900">{debtor.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail size={16} strokeWidth={1.5} className="text-gray-400" />
                    <span className="font-light text-gray-900">{debtor.email || 'No email'}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin size={16} strokeWidth={1.5} className="text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-light text-gray-900">{debtor.address || 'No address'}</div>
                      <div className="text-sm font-light text-gray-500">Postal Code: {debtor.postalCode || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-light text-gray-600">Occupation:</span>
                      <span className="font-medium text-gray-900">{debtor.occupation || 'Unknown'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                    <TrendingUp size={20} strokeWidth={1.5} />
                    <span>AI Recommendations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm font-light text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                    <AlertCircle size={20} strokeWidth={1.5} />
                    <span>Risk Factors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {riskFactors.map((risk, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${riskFactors.length === 1 && risk.includes('None') ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm font-light text-gray-700">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                    <FileText size={20} strokeWidth={1.5} />
                    <span>Next Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {nextActions.map((action, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-[rgb(0,171,174)] rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm font-light text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Scoring Breakdown */}
        <div>
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Scoring Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(debtor.scoring).map(([key, data]) => {
                const percentage = (data.score / data.max) * 100;
                const categoryNames = {
                  contactInfo: 'Contact Information',
                  paymentBehaviour: 'Payment Behaviour',
                  debtCharacteristics: 'Debt Characteristics',
                  socioEconomic: 'Socio-Economic',
                  legalStatus: 'Legal Status'
                };
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-light text-gray-700">
                        {categoryNames[key as keyof typeof categoryNames]}
                      </span>
                      <span className="text-sm font-medium text-gray-600">
                        {data.score}/{data.max}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(data.score, data.max)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">Total Score</span>
                  <span className={`text-lg font-medium ${getScoreColor(debtor.totalScore)}`}>
                    {debtor.score}/100
                  </span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${getScoreColor(debtor.score).replace('text-', 'bg-')}`}
                      style={{ width: `${debtor.score}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}