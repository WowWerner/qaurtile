import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Briefcase, Shield, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AnalysisResults } from '../utils/csvProcessor';
import { SupabaseService } from '../utils/supabaseService';

export function DemographicsAnalysisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { csvUploadId } = location.state || {};
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      if (!csvUploadId) {
        setLoading(false);
        return;
      }

      try {
        const analysisResults = await SupabaseService.getAnalysisResults(csvUploadId);
        setResults(analysisResults);
      } catch (error) {
        console.error('Error loading analysis results:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [csvUploadId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(0,171,174)]"></div>
          <p className="mt-4 text-gray-600">Loading demographics analysis...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-thin text-gray-600 mb-4">No analysis data found</h2>
          <p className="text-gray-500 mb-4">Please upload and process a CSV file first</p>
          <Button onClick={() => navigate('/intelligence-center')} variant="outline">
            Back to Intelligence Center
          </Button>
        </div>
      </div>
    );
  }

  const allDebtors = [
    ...results.highProbability.debtors,
    ...results.mediumProbability.debtors,
    ...results.lowProbability.debtors
  ];

  // Classify by employment stability
  const classifyByEmployment = (occupation: string) => {
    const occ = occupation.toLowerCase();
    const stableKeywords = ['government', 'corporate', 'manager', 'professional', 'teacher', 'nurse', 'police', 'army', 'bank', 'civil service'];
    const unstableKeywords = ['self employed', 'freelance', 'temporary', 'casual', 'contract', 'unemployed'];
    
    if (stableKeywords.some(keyword => occ.includes(keyword))) return 'stable';
    if (unstableKeywords.some(keyword => occ.includes(keyword))) return 'unstable';
    return 'unknown';
  };

  const stableEmployment = allDebtors.filter(debtor => 
    debtor.occupation !== 'Unknown' && classifyByEmployment(debtor.occupation) === 'stable'
  );
  
  const unstableEmployment = allDebtors.filter(debtor => 
    debtor.occupation !== 'Unknown' && classifyByEmployment(debtor.occupation) === 'unstable'
  );
  
  const unknownEmployment = allDebtors.filter(debtor => 
    debtor.occupation === 'Unknown' || classifyByEmployment(debtor.occupation) === 'unknown'
  );

  const handleDownloadCategory = (category: 'stable' | 'unstable' | 'unknown') => {
    let categoryData, filename, categoryName;
    
    switch (category) {
      case 'stable':
        categoryData = stableEmployment;
        filename = 'stable-employment-debtors.csv';
        categoryName = 'Stable Employment';
        break;
      case 'unstable':
        categoryData = unstableEmployment;
        filename = 'unstable-employment-debtors.csv';
        categoryName = 'Unstable Employment';
        break;
      case 'unknown':
        categoryData = unknownEmployment;
        filename = 'unknown-employment-debtors.csv';
        categoryName = 'Unknown Employment';
        break;
    }
    
    const csvContent = [
      'Name,Score,Amount,Occupation,Employment Category,Last Payment,Phone',
      ...categoryData.map(debtor => 
        `"${debtor.name}",${debtor.score},"${debtor.amount}","${debtor.occupation}","${categoryName}","${debtor.lastPayment}","${debtor.phone}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Get average amounts for each category
  const getAvgAmount = (debtors: any[]) => {
    if (debtors.length === 0) return 0;
    const total = debtors.reduce((sum, d) => sum + parseFloat(d.amount.replace(/[N$,\s]/g, '') || '0'), 0);
    return Math.round(total / debtors.length);
  };

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
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              Demographics & Stability Analysis
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Employment stability and demographic indicators for collection prioritization
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-gray-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Shield size={20} strokeWidth={1.5} />
              <span className="font-light">Stable Employment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-700 mb-1">
              {stableEmployment.length}
            </div>
            <p className="text-sm text-green-600 mb-2">
              Government, corporate, professional roles
            </p>
            <div className="text-xs text-gray-600 mb-4">
              Avg Amount: N${getAvgAmount(stableEmployment).toLocaleString()}
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-green-200 hover:bg-green-100"
              onClick={() => handleDownloadCategory('stable')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Briefcase size={20} strokeWidth={1.5} />
              <span className="font-light">Unstable Employment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-orange-700 mb-1">
              {unstableEmployment.length}
            </div>
            <p className="text-sm text-orange-600 mb-2">
              Self-employed, freelance, temporary work
            </p>
            <div className="text-xs text-gray-600 mb-4">
              Avg Amount: N${getAvgAmount(unstableEmployment).toLocaleString()}
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-orange-200 hover:bg-orange-100"
              onClick={() => handleDownloadCategory('unstable')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <AlertCircle size={20} strokeWidth={1.5} />
              <span className="font-light">Unknown Employment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-700 mb-1">
              {unknownEmployment.length}
            </div>
            <p className="text-sm text-gray-600 mb-2">
              No occupation data or unclear status
            </p>
            <div className="text-xs text-gray-600 mb-4">
              Avg Amount: N${getAvgAmount(unknownEmployment).toLocaleString()}
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-gray-200 hover:bg-gray-100"
              onClick={() => handleDownloadCategory('unknown')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="stable" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="stable">Stable ({stableEmployment.length})</TabsTrigger>
          <TabsTrigger value="unstable">Unstable ({unstableEmployment.length})</TabsTrigger>
          <TabsTrigger value="unknown">Unknown ({unknownEmployment.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stable">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Stable Employment - Higher Collection Likelihood</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('stable')}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Collection Strategy</h4>
                <p className="text-sm text-green-700">
                  Stable employment indicates reliable income. Use workplace garnishment as leverage. 
                  These debtors typically respond well to professional communication and payment plans.
                </p>
              </div>
              <div className="space-y-4">
                {stableEmployment.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="text-green-700 font-medium">{debtor.occupation}</span>
                        <span className="text-gray-500">Last Payment: {debtor.lastPayment}</span>
                      </div>
                      {debtor.phone !== 'No phone' && (
                        <div className="text-xs text-green-600 mt-1">✓ Contact available</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-green-600">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                ))}
                {stableEmployment.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {stableEmployment.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unstable">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Unstable Employment - Requires Careful Approach</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('unstable')}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Collection Strategy</h4>
                <p className="text-sm text-orange-700">
                  Unstable income requires flexible payment arrangements. Focus on smaller, more frequent payments. 
                  Build rapport and understanding of their business cycle or seasonal work patterns.
                </p>
              </div>
              <div className="space-y-4">
                {unstableEmployment.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="text-orange-700 font-medium">{debtor.occupation}</span>
                        <span className="text-gray-500">Last Payment: {debtor.lastPayment}</span>
                      </div>
                      <div className="text-xs text-orange-600 mt-1">⚠ Variable income - flexible approach needed</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-orange-600">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                ))}
                {unstableEmployment.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {unstableEmployment.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unknown">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Unknown Employment - Requires Investigation</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('unknown')}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Collection Strategy</h4>
                <p className="text-sm text-gray-700">
                  No employment data makes assessment difficult. Prioritize tracing services to identify 
                  current employment. Use skip tracing and social media investigation before direct contact.
                </p>
              </div>
              <div className="space-y-4">
                {unknownEmployment.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Occupation: {debtor.occupation}</span>
                        <span>Last Payment: {debtor.lastPayment}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">ℹ Employment investigation needed</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-gray-600">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                ))}
                {unknownEmployment.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {unknownEmployment.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}