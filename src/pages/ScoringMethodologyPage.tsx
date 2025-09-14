import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, CreditCard, MapPin, User, Scale } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';

export function ScoringMethodologyPage() {
  const navigate = useNavigate();

  const scoringCategories = [
    {
      title: 'Contact Information',
      maxPoints: 30,
      icon: Phone,
      color: 'rgb(59, 130, 246)',
      criteria: [
        { item: 'At least one valid cellphone number', points: 15 },
        { item: 'At least one valid email address', points: 5 },
        { item: 'Valid workplace phone/address', points: 5 },
        { item: 'Valid residential address (street + postal)', points: 5 },
        { item: 'No contact information at all', points: -10, negative: true }
      ]
    },
    {
      title: 'Payment Behaviour',
      maxPoints: 30,
      icon: CreditCard,
      color: 'rgb(16, 185, 129)',
      criteria: [
        { item: 'Last payment < 30 days ago', points: 20 },
        { item: 'Last payment 30-90 days ago', points: 10 },
        { item: 'Last payment > 90 days or none', points: 0 },
        { item: 'Payment ≥ 25% of outstanding amount', points: 10 },
        { item: 'Payment 5-24% of outstanding', points: 5 },
        { item: 'Payment < 5% or none', points: 0 }
      ]
    },
    {
      title: 'Debt Characteristics',
      maxPoints: 20,
      icon: Scale,
      color: 'rgb(245, 158, 11)',
      criteria: [
        { item: 'Outstanding ≤ N$5,000', points: 10 },
        { item: 'Outstanding N$5,001 - N$50,000', points: 5 },
        { item: 'Outstanding > N$50,000', points: 0 },
        { item: 'Interest/Fees > 50% of total debt', points: -5, negative: true }
      ]
    },
    {
      title: 'Socio-Economic Status',
      maxPoints: 10,
      icon: MapPin,
      color: 'rgb(139, 92, 246)',
      criteria: [
        { item: 'Address in upmarket area', points: 10 },
        { item: 'Address in mid-income area', points: 5 },
        { item: 'Address in low-income area', points: 0 },
        { item: 'Stable occupation (government/corporate)', points: 5 }
      ]
    },
    {
      title: 'Legal Status',
      maxPoints: 10,
      icon: User,
      color: 'rgb(236, 72, 153)',
      criteria: [
        { item: 'No legal action initiated', points: 10 },
        { item: 'In legal process (not insolvency)', points: 5 },
        { item: 'Administrator/insolvency case', points: 0 }
      ]
    }
  ];

  const priorityLevels = [
    {
      level: 'High Priority',
      range: '70-100 points',
      color: 'rgb(34, 197, 94)',
      description: 'Strong contacts, recent payments, stable debtor profile'
    },
    {
      level: 'Medium Priority', 
      range: '40-69 points',
      color: 'rgb(251, 146, 60)',
      description: 'Some data gaps, but workable cases'
    },
    {
      level: 'Low Priority',
      range: '< 40 points',
      color: 'rgb(239, 68, 68)',
      description: 'Limited info, no recent payments, weak traceability'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/intelligence-center')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
            100-Point Scoring Framework
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Scoring Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {scoringCategories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Card key={index} className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-lg font-light text-gray-800">
                    <IconComponent size={24} strokeWidth={1.5} style={{ color: category.color }} />
                    <div>
                      <span>{category.title}</span>
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        (Max {category.maxPoints} points)
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.criteria.map((criterion, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className={`text-sm font-light ${criterion.negative ? 'text-red-600' : 'text-gray-700'}`}>
                        {criterion.item}
                      </span>
                      <span className={`text-sm font-medium px-2 py-1 rounded ${
                        criterion.negative 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {criterion.negative ? '' : '+'}{criterion.points}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Priority Levels */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Priority Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {priorityLevels.map((level, index) => (
                <div key={index} className="text-center p-6 bg-gray-50 rounded-xl">
                  <div 
                    className="w-6 h-6 rounded-full mx-auto mb-3"
                    style={{ backgroundColor: level.color }}
                  />
                  <h3 className="font-medium text-gray-800 mb-2">{level.level}</h3>
                  <p className="text-sm font-medium text-gray-600 mb-3">{level.range}</p>
                  <p className="text-xs text-gray-500 font-light">{level.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Implementation Notes */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Implementation Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Geo-Mapping</h4>
                <p className="text-sm text-gray-600 font-light mb-4">
                  Postal codes and street addresses are automatically classified using AI to determine socio-economic status of the area.
                </p>
                
                <h4 className="font-medium text-gray-800 mb-3">Contact Validation</h4>
                <p className="text-sm text-gray-600 font-light">
                  Phone numbers and email addresses undergo format validation to ensure they are workable contact points.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Weighted Calculation</h4>
                <p className="text-sm text-gray-600 font-light mb-4">
                  Each factor contributes to a final weighted score, with contact information and payment behavior carrying the highest weight.
                </p>
                
                <h4 className="font-medium text-gray-800 mb-3">Dynamic Updates</h4>
                <p className="text-sm text-gray-600 font-light">
                  Scores can be recalculated as new information becomes available or payment patterns change.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}