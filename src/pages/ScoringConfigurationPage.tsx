import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, Phone, CreditCard, Scale, MapPin, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Slider } from '../components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface ScoringConfig {
  categories: {
    contactInfo: { weight: number; maxPoints: number };
    paymentBehaviour: { weight: number; maxPoints: number };
    debtCharacteristics: { weight: number; maxPoints: number };
    socioEconomic: { weight: number; maxPoints: number };
    legalStatus: { weight: number; maxPoints: number };
  };
  criteria: {
    contactInfo: {
      validCellphone: number;
      validEmail: number;
      validWorkplace: number;
      validAddress: number;
      noContactInfo: number;
    };
    paymentBehaviour: {
      paymentUnder30Days: number;
      payment30to90Days: number;
      paymentOver90Days: number;
      paymentOver25Percent: number;
      payment5to24Percent: number;
      paymentUnder5Percent: number;
    };
    debtCharacteristics: {
      debtUnder5k: number;
      debt5kto50k: number;
      debtOver50k: number;
      highInterestFees: number;
    };
    socioEconomic: {
      upmarketAddress: number;
      midIncomeAddress: number;
      lowIncomeAddress: number;
      stableOccupation: number;
    };
    legalStatus: {
      noLegalAction: number;
      inLegalProcess: number;
      insolvencyCase: number;
    };
  };
}

const defaultConfig: ScoringConfig = {
  categories: {
    contactInfo: { weight: 30, maxPoints: 30 },
    paymentBehaviour: { weight: 30, maxPoints: 30 },
    debtCharacteristics: { weight: 20, maxPoints: 20 },
    socioEconomic: { weight: 10, maxPoints: 10 },
    legalStatus: { weight: 10, maxPoints: 10 }
  },
  criteria: {
    contactInfo: {
      validCellphone: 15,
      validEmail: 5,
      validWorkplace: 5,
      validAddress: 5,
      noContactInfo: -10
    },
    paymentBehaviour: {
      paymentUnder30Days: 20,
      payment30to90Days: 10,
      paymentOver90Days: 0,
      paymentOver25Percent: 10,
      payment5to24Percent: 5,
      paymentUnder5Percent: 0
    },
    debtCharacteristics: {
      debtUnder5k: 10,
      debt5kto50k: 5,
      debtOver50k: 0,
      highInterestFees: -5
    },
    socioEconomic: {
      upmarketAddress: 10,
      midIncomeAddress: 5,
      lowIncomeAddress: 0,
      stableOccupation: 5
    },
    legalStatus: {
      noLegalAction: 10,
      inLegalProcess: 5,
      insolvencyCase: 0
    }
  }
};

// Sample debtor for preview
const sampleDebtor = {
  name: 'John Smith',
  hasValidCellphone: true,
  hasValidEmail: true,
  hasValidWorkplace: true,
  hasValidAddress: true,
  lastPaymentDays: 15,
  paymentPercentage: 30,
  debtAmount: 12000,
  interestPercentage: 25,
  addressType: 'upmarket',
  hasStableOccupation: true,
  legalStatus: 'none'
};

export function ScoringConfigurationPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ScoringConfig>(defaultConfig);
  const [selectedPreset, setSelectedPreset] = useState('custom');

  const calculateSampleScore = () => {
    let score = 0;
    
    // Contact Information
    if (sampleDebtor.hasValidCellphone) score += config.criteria.contactInfo.validCellphone;
    if (sampleDebtor.hasValidEmail) score += config.criteria.contactInfo.validEmail;
    if (sampleDebtor.hasValidWorkplace) score += config.criteria.contactInfo.validWorkplace;
    if (sampleDebtor.hasValidAddress) score += config.criteria.contactInfo.validAddress;
    
    // Payment Behaviour
    if (sampleDebtor.lastPaymentDays < 30) score += config.criteria.paymentBehaviour.paymentUnder30Days;
    else if (sampleDebtor.lastPaymentDays <= 90) score += config.criteria.paymentBehaviour.payment30to90Days;
    else score += config.criteria.paymentBehaviour.paymentOver90Days;
    
    if (sampleDebtor.paymentPercentage >= 25) score += config.criteria.paymentBehaviour.paymentOver25Percent;
    else if (sampleDebtor.paymentPercentage >= 5) score += config.criteria.paymentBehaviour.payment5to24Percent;
    else score += config.criteria.paymentBehaviour.paymentUnder5Percent;
    
    // Debt Characteristics
    if (sampleDebtor.debtAmount <= 5000) score += config.criteria.debtCharacteristics.debtUnder5k;
    else if (sampleDebtor.debtAmount <= 50000) score += config.criteria.debtCharacteristics.debt5kto50k;
    else score += config.criteria.debtCharacteristics.debtOver50k;
    
    if (sampleDebtor.interestPercentage > 50) score += config.criteria.debtCharacteristics.highInterestFees;
    
    // Socio-Economic
    if (sampleDebtor.addressType === 'upmarket') score += config.criteria.socioEconomic.upmarketAddress;
    else if (sampleDebtor.addressType === 'mid-income') score += config.criteria.socioEconomic.midIncomeAddress;
    else score += config.criteria.socioEconomic.lowIncomeAddress;
    
    if (sampleDebtor.hasStableOccupation) score += config.criteria.socioEconomic.stableOccupation;
    
    // Legal Status
    if (sampleDebtor.legalStatus === 'none') score += config.criteria.legalStatus.noLegalAction;
    else if (sampleDebtor.legalStatus === 'legal') score += config.criteria.legalStatus.inLegalProcess;
    else score += config.criteria.legalStatus.insolvencyCase;
    
    return Math.max(0, Math.min(100, score));
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    
    if (preset === 'conservative') {
      // Conservative: Favor payment history and contact info heavily
      setConfig({
        ...defaultConfig,
        categories: {
          ...defaultConfig.categories,
          contactInfo: { weight: 35, maxPoints: 35 },
          paymentBehaviour: { weight: 35, maxPoints: 35 },
          debtCharacteristics: { weight: 15, maxPoints: 15 },
          socioEconomic: { weight: 10, maxPoints: 10 },
          legalStatus: { weight: 5, maxPoints: 5 }
        }
      });
    } else if (preset === 'aggressive') {
      // Aggressive: Balance all factors more evenly
      setConfig({
        ...defaultConfig,
        categories: {
          ...defaultConfig.categories,
          contactInfo: { weight: 25, maxPoints: 25 },
          paymentBehaviour: { weight: 25, maxPoints: 25 },
          debtCharacteristics: { weight: 25, maxPoints: 25 },
          socioEconomic: { weight: 15, maxPoints: 15 },
          legalStatus: { weight: 10, maxPoints: 10 }
        }
      });
    } else if (preset === 'balanced') {
      setConfig(defaultConfig);
    }
  };

  const updateCategoryWeight = (category: keyof typeof config.categories, weight: number) => {
    setConfig(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: { ...prev.categories[category], weight, maxPoints: weight }
      }
    }));
    setSelectedPreset('custom');
  };

  const updateCriteriaValue = (category: keyof typeof config.criteria, criterion: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [category]: {
          ...prev.criteria[category],
          [criterion]: value
        }
      }
    }));
    setSelectedPreset('custom');
  };

  const resetToDefaults = () => {
    setConfig(defaultConfig);
    setSelectedPreset('balanced');
  };

  const handleSaveConfiguration = () => {
    // Save configuration logic would go here
    console.log('Saving configuration:', config);
    // Show success toast or navigate back
  };

  const sampleScore = calculateSampleScore();

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
            Scoring Configuration
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={resetToDefaults}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RotateCcw size={16} strokeWidth={1.5} />
            <span>Reset</span>
          </Button>
          <Button
            onClick={handleSaveConfiguration}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Save size={16} strokeWidth={1.5} />
            <span>Save Configuration</span>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Presets and Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Presets */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Configuration Presets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">Balanced (Default)</SelectItem>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-light text-gray-600">Contact Info:</span>
                  <span className="font-medium">{config.categories.contactInfo.weight}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-light text-gray-600">Payment History:</span>
                  <span className="font-medium">{config.categories.paymentBehaviour.weight}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-light text-gray-600">Debt Profile:</span>
                  <span className="font-medium">{config.categories.debtCharacteristics.weight}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-light text-gray-600">Socio-Economic:</span>
                  <span className="font-medium">{config.categories.socioEconomic.weight}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-light text-gray-600">Legal Status:</span>
                  <span className="font-medium">{config.categories.legalStatus.weight}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="border-gray-200 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Live Preview - Sample Debtor Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-medium text-gray-800">{sampleDebtor.name}</h3>
                  <p className="text-sm text-gray-500">Sample debtor profile</p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-light ${getScoreColor(sampleScore)}`}>
                    {sampleScore}/100
                  </div>
                  <div className="text-sm font-light text-gray-500">
                    {sampleScore >= 70 ? 'High Priority' : sampleScore >= 40 ? 'Medium Priority' : 'Low Priority'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valid Cellphone:</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valid Email:</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Payment:</span>
                    <span className="text-gray-800">15 days ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment %:</span>
                    <span className="text-gray-800">30% of debt</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Debt Amount:</span>
                    <span className="text-gray-800">N$ 12,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address Type:</span>
                    <span className="text-gray-800">Upmarket</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Occupation:</span>
                    <span className="text-gray-800">Government</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Legal Status:</span>
                    <span className="text-gray-800">None</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Tabs */}
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="categories" className="font-light">Category Weights</TabsTrigger>
            <TabsTrigger value="criteria" className="font-light">Individual Criteria</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-lg font-light text-gray-800">
                    <Phone size={20} strokeWidth={1.5} className="text-blue-500" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-light text-gray-600">Weight</span>
                        <span className="text-sm font-medium text-gray-800">
                          {config.categories.contactInfo.weight} points
                        </span>
                      </div>
                      <Slider
                        value={[config.categories.contactInfo.weight]}
                        onValueChange={([value]) => updateCategoryWeight('contactInfo', value)}
                        max={50}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Behaviour */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-lg font-light text-gray-800">
                    <CreditCard size={20} strokeWidth={1.5} className="text-green-500" />
                    <span>Payment Behaviour</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-light text-gray-600">Weight</span>
                        <span className="text-sm font-medium text-gray-800">
                          {config.categories.paymentBehaviour.weight} points
                        </span>
                      </div>
                      <Slider
                        value={[config.categories.paymentBehaviour.weight]}
                        onValueChange={([value]) => updateCategoryWeight('paymentBehaviour', value)}
                        max={50}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Debt Characteristics */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-lg font-light text-gray-800">
                    <Scale size={20} strokeWidth={1.5} className="text-orange-500" />
                    <span>Debt Characteristics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-light text-gray-600">Weight</span>
                        <span className="text-sm font-medium text-gray-800">
                          {config.categories.debtCharacteristics.weight} points
                        </span>
                      </div>
                      <Slider
                        value={[config.categories.debtCharacteristics.weight]}
                        onValueChange={([value]) => updateCategoryWeight('debtCharacteristics', value)}
                        max={40}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Socio-Economic */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-lg font-light text-gray-800">
                    <MapPin size={20} strokeWidth={1.5} className="text-purple-500" />
                    <span>Socio-Economic</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-light text-gray-600">Weight</span>
                        <span className="text-sm font-medium text-gray-800">
                          {config.categories.socioEconomic.weight} points
                        </span>
                      </div>
                      <Slider
                        value={[config.categories.socioEconomic.weight]}
                        onValueChange={([value]) => updateCategoryWeight('socioEconomic', value)}
                        max={30}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Legal Status */}
              <Card className="border-gray-200 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-lg font-light text-gray-800">
                    <User size={20} strokeWidth={1.5} className="text-pink-500" />
                    <span>Legal Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-light text-gray-600">Weight</span>
                        <span className="text-sm font-medium text-gray-800">
                          {config.categories.legalStatus.weight} points
                        </span>
                      </div>
                      <Slider
                        value={[config.categories.legalStatus.weight]}
                        onValueChange={([value]) => updateCategoryWeight('legalStatus', value)}
                        max={30}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="criteria">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information Criteria */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-lg font-light text-gray-800">
                    <Phone size={20} strokeWidth={1.5} className="text-blue-500" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">Valid Cellphone</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.contactInfo.validCellphone}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.contactInfo.validCellphone]}
                      onValueChange={([value]) => updateCriteriaValue('contactInfo', 'validCellphone', value)}
                      max={25}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">Valid Email</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.contactInfo.validEmail}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.contactInfo.validEmail]}
                      onValueChange={([value]) => updateCriteriaValue('contactInfo', 'validEmail', value)}
                      max={15}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">Valid Workplace</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.contactInfo.validWorkplace}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.contactInfo.validWorkplace]}
                      onValueChange={([value]) => updateCriteriaValue('contactInfo', 'validWorkplace', value)}
                      max={15}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">Valid Address</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.contactInfo.validAddress}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.contactInfo.validAddress]}
                      onValueChange={([value]) => updateCriteriaValue('contactInfo', 'validAddress', value)}
                      max={15}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-red-600">No Contact Info</span>
                      <span className="text-sm font-medium text-red-600">
                        {config.criteria.contactInfo.noContactInfo}
                      </span>
                    </div>
                    <Slider
                      value={[Math.abs(config.criteria.contactInfo.noContactInfo)]}
                      onValueChange={([value]) => updateCriteriaValue('contactInfo', 'noContactInfo', -value)}
                      max={20}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Behaviour Criteria */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-lg font-light text-gray-800">
                    <CreditCard size={20} strokeWidth={1.5} className="text-green-500" />
                    <span>Payment Behaviour</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">Payment &lt; 30 days</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.paymentBehaviour.paymentUnder30Days}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.paymentBehaviour.paymentUnder30Days]}
                      onValueChange={([value]) => updateCriteriaValue('paymentBehaviour', 'paymentUnder30Days', value)}
                      max={30}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">Payment 30-90 days</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.paymentBehaviour.payment30to90Days}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.paymentBehaviour.payment30to90Days]}
                      onValueChange={([value]) => updateCriteriaValue('paymentBehaviour', 'payment30to90Days', value)}
                      max={25}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">Payment ≥ 25% of debt</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.paymentBehaviour.paymentOver25Percent}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.paymentBehaviour.paymentOver25Percent]}
                      onValueChange={([value]) => updateCriteriaValue('paymentBehaviour', 'paymentOver25Percent', value)}
                      max={20}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">Payment 5-24% of debt</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.paymentBehaviour.payment5to24Percent}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.paymentBehaviour.payment5to24Percent]}
                      onValueChange={([value]) => updateCriteriaValue('paymentBehaviour', 'payment5to24Percent', value)}
                      max={15}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Debt Characteristics Criteria */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-lg font-light text-gray-800">
                    <Scale size={20} strokeWidth={1.5} className="text-orange-500" />
                    <span>Debt Characteristics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">Debt ≤ N$5,000</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.debtCharacteristics.debtUnder5k}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.debtCharacteristics.debtUnder5k]}
                      onValueChange={([value]) => updateCriteriaValue('debtCharacteristics', 'debtUnder5k', value)}
                      max={20}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">Debt N$5k-50k</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.debtCharacteristics.debt5kto50k}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.debtCharacteristics.debt5kto50k]}
                      onValueChange={([value]) => updateCriteriaValue('debtCharacteristics', 'debt5kto50k', value)}
                      max={15}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-red-600">High Interest/Fees (&gt;50%)</span>
                      <span className="text-sm font-medium text-red-600">
                        {config.criteria.debtCharacteristics.highInterestFees}
                      </span>
                    </div>
                    <Slider
                      value={[Math.abs(config.criteria.debtCharacteristics.highInterestFees)]}
                      onValueChange={([value]) => updateCriteriaValue('debtCharacteristics', 'highInterestFees', -value)}
                      max={15}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Socio-Economic Criteria */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-lg font-light text-gray-800">
                    <MapPin size={20} strokeWidth={1.5} className="text-purple-500" />
                    <span>Socio-Economic Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">Upmarket Address</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.socioEconomic.upmarketAddress}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.socioEconomic.upmarketAddress]}
                      onValueChange={([value]) => updateCriteriaValue('socioEconomic', 'upmarketAddress', value)}
                      max={15}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">Mid-Income Address</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.socioEconomic.midIncomeAddress}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.socioEconomic.midIncomeAddress]}
                      onValueChange={([value]) => updateCriteriaValue('socioEconomic', 'midIncomeAddress', value)}
                      max={10}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">Stable Occupation</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.socioEconomic.stableOccupation}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.socioEconomic.stableOccupation]}
                      onValueChange={([value]) => updateCriteriaValue('socioEconomic', 'stableOccupation', value)}
                      max={10}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Legal Status Criteria */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-lg font-light text-gray-800">
                    <User size={20} strokeWidth={1.5} className="text-pink-500" />
                    <span>Legal Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">No Legal Action</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.legalStatus.noLegalAction}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.legalStatus.noLegalAction]}
                      onValueChange={([value]) => updateCriteriaValue('legalStatus', 'noLegalAction', value)}
                      max={15}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-light text-gray-600">In Legal Process</span>
                      <span className="text-sm font-medium text-gray-800">
                        +{config.criteria.legalStatus.inLegalProcess}
                      </span>
                    </div>
                    <Slider
                      value={[config.criteria.legalStatus.inLegalProcess]}
                      onValueChange={([value]) => updateCriteriaValue('legalStatus', 'inLegalProcess', value)}
                      max={10}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Configuration Summary */}
        <Card className="border-gray-200 mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Configuration Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-light text-green-700 mb-2">
                  {70}+
                </div>
                <div className="text-sm font-medium text-green-800">High Priority</div>
                <div className="text-xs text-green-600 mt-1">Immediate action required</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <div className="text-2xl font-light text-orange-700 mb-2">
                  40-69
                </div>
                <div className="text-sm font-medium text-orange-800">Medium Priority</div>
                <div className="text-xs text-orange-600 mt-1">Workable with effort</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <div className="text-2xl font-light text-red-700 mb-2">
                  &lt;40
                </div>
                <div className="text-sm font-medium text-red-800">Low Priority</div>
                <div className="text-xs text-red-600 mt-1">Legal/trace required</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}