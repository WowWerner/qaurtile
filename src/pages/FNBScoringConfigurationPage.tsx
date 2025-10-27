import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { DEFAULT_WEIGHTS, Weights } from '../lib/fnb/scoring';

export function FNBScoringConfigurationPage() {
  const navigate = useNavigate();

  const loadWeights = (): Weights => {
    try {
      const stored = localStorage.getItem('fnb_weights');
      return stored ? JSON.parse(stored) : DEFAULT_WEIGHTS;
    } catch {
      return DEFAULT_WEIGHTS;
    }
  };

  const [weights, setWeights] = useState<Weights>(loadWeights());
  const [saved, setSaved] = useState(false);

  const handleWeightChange = (key: keyof Weights, value: number) => {
    setWeights({ ...weights, [key]: value });
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('fnb_weights', JSON.stringify(weights));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
    localStorage.setItem('fnb_weights', JSON.stringify(DEFAULT_WEIGHTS));
    setSaved(false);
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const isValidTotal = totalWeight === 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/intelligence-center/fnb-specialised')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              FNB Scoring Configuration
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Customize the 100-point scoring framework for FNB debtors
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
          >
            <RotateCcw size={16} className="mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValidTotal}
            className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
            size="sm"
          >
            <Save size={16} className="mr-2" />
            {saved ? 'Saved!' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className={`mb-8 ${isValidTotal ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Total Weight</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isValidTotal
                    ? 'All weights sum to 100 - configuration is valid'
                    : `Weights sum to ${totalWeight} - must equal 100`}
                </p>
              </div>
              <div className={`text-4xl font-light ${isValidTotal ? 'text-green-700' : 'text-red-700'}`}>
                {totalWeight}/100
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Contact Information (Current: {weights.contact_cell + weights.contact_email + weights.contact_work + weights.contact_address + weights.contact_absent_penalty})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Cell Phone Available ({weights.contact_cell} points)
                </label>
                <input
                  type="range"
                  min="-10"
                  max="30"
                  value={weights.contact_cell}
                  onChange={(e) => handleWeightChange('contact_cell', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Email Available ({weights.contact_email} points)
                </label>
                <input
                  type="range"
                  min="-10"
                  max="30"
                  value={weights.contact_email}
                  onChange={(e) => handleWeightChange('contact_email', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Work Phone Available ({weights.contact_work} points)
                </label>
                <input
                  type="range"
                  min="-10"
                  max="30"
                  value={weights.contact_work}
                  onChange={(e) => handleWeightChange('contact_work', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Address Available ({weights.contact_address} points)
                </label>
                <input
                  type="range"
                  min="-10"
                  max="30"
                  value={weights.contact_address}
                  onChange={(e) => handleWeightChange('contact_address', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  No Contact Penalty ({weights.contact_absent_penalty} points)
                </label>
                <input
                  type="range"
                  min="-30"
                  max="0"
                  value={weights.contact_absent_penalty}
                  onChange={(e) => handleWeightChange('contact_absent_penalty', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Payment History (Current: {weights.pay_last_lt30 + weights.pay_last_30_90 + weights.pay_amount_gte_25pct + weights.pay_amount_5_24pct})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Payment within 30 days ({weights.pay_last_lt30} points)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={weights.pay_last_lt30}
                  onChange={(e) => handleWeightChange('pay_last_lt30', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Payment 30-90 days ago ({weights.pay_last_30_90} points)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={weights.pay_last_30_90}
                  onChange={(e) => handleWeightChange('pay_last_30_90', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Payment 25%+ of debt ({weights.pay_amount_gte_25pct} points)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={weights.pay_amount_gte_25pct}
                  onChange={(e) => handleWeightChange('pay_amount_gte_25pct', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Payment 5-24% of debt ({weights.pay_amount_5_24pct} points)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={weights.pay_amount_5_24pct}
                  onChange={(e) => handleWeightChange('pay_amount_5_24pct', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Debt Characteristics (Current: {weights.debt_cap_le_5k + weights.debt_cap_5k_50k + weights.debt_high_interest_fee_penalty})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Debt ≤ N$5,000 ({weights.debt_cap_le_5k} points)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={weights.debt_cap_le_5k}
                  onChange={(e) => handleWeightChange('debt_cap_le_5k', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Debt N$5k-50k ({weights.debt_cap_5k_50k} points)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={weights.debt_cap_5k_50k}
                  onChange={(e) => handleWeightChange('debt_cap_5k_50k', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  High Interest/Fees Penalty ({weights.debt_high_interest_fee_penalty} points)
                </label>
                <input
                  type="range"
                  min="-30"
                  max="0"
                  value={weights.debt_high_interest_fee_penalty}
                  onChange={(e) => handleWeightChange('debt_high_interest_fee_penalty', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Socio-Economic Status (Current: {weights.ses_upmarket + weights.ses_mid})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Upmarket SES ({weights.ses_upmarket} points)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={weights.ses_upmarket}
                  onChange={(e) => handleWeightChange('ses_upmarket', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Mid-Income SES ({weights.ses_mid} points)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={weights.ses_mid}
                  onChange={(e) => handleWeightChange('ses_mid', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Employment & Legal Status (Current: {weights.stable_occupation + weights.legal_none + weights.legal_inflight + weights.legal_insolvency})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Stable Occupation ({weights.stable_occupation} points)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={weights.stable_occupation}
                  onChange={(e) => handleWeightChange('stable_occupation', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  No Legal Action ({weights.legal_none} points)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={weights.legal_none}
                  onChange={(e) => handleWeightChange('legal_none', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Legal In Progress ({weights.legal_inflight} points)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={weights.legal_inflight}
                  onChange={(e) => handleWeightChange('legal_inflight', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Insolvency ({weights.legal_insolvency} points)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={weights.legal_insolvency}
                  onChange={(e) => handleWeightChange('legal_insolvency', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gray-200 mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Configuration Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• All weights must sum to exactly 100 points</p>
              <p>• Higher weights indicate greater importance in the final score</p>
              <p>• Configuration is saved locally and applied to all new FNB analyses</p>
              <p>• Use Reset to Defaults to return to the recommended scoring framework</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
