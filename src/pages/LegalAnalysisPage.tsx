import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Scale, FileX, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AnalysisResults } from '../utils/csvProcessor';
import { SupabaseService } from '../utils/supabaseService';

export function LegalAnalysisPage() {
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
          <p className="mt-4 text-gray-600">Loading legal analysis...</p>
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

  // Since we don't have legal status data from the mock data, we'll simulate it
  // In real implementation, this would come from the CSV processing
  const classifyLegalStatus = (debtor: any) => {
    // Simulate legal status based on score and other factors
    if (debtor.score < 30) return 'insolvency';
    if (debtor.score < 50 && debtor.lastPayment === 'No payment') return 'legal-process';
    return 'no-legal-action';
  };

  const noLegalAction = allDebtors.filter(debtor => classifyLegalStatus(debtor) === 'no-legal-action');
  const inLegalProcess = allDebtors.filter(debtor => classifyLegalStatus(debtor) === 'legal-process');
  const insolvencyRisk = allDebtors.filter(debtor => classifyLegalStatus(debtor) === 'insolvency');

  const handleDownloadCategory = (category: 'no-legal' | 'legal-process' | 'insolvency') => {
    let categoryData, filename, categoryName;
    
    switch (category) {
      case 'no-legal':
        categoryData = noLegalAction;
        filename = 'no-legal-action-debtors.csv';
        categoryName = 'No Legal Action';
        break;
      case 'legal-process':
        categoryData = inLegalProcess;
        filename = 'legal-process-debtors.csv';
        categoryName = 'Legal Process';
        break;
      case 'insolvency':
        categoryData = insolvencyRisk;
        filename = 'insolvency-risk-debtors.csv';
        categoryName = 'Insolvency Risk';
        break;
    }
    
    const csvContent = [
      'Name,Score,Amount,Legal Status,Last Payment,Phone,Address',
      ...categoryData.map(debtor => 
        `"${debtor.name}",${debtor.score},"${debtor.amount}","${categoryName}","${debtor.lastPayment}","${debtor.phone}","${debtor.address}"`
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

  // Calculate total amounts
  const getTotalValue = (debtors: any[]) => {
    const total = debtors.reduce((sum, d) => sum + parseFloat(d.amount.replace(/[N$,\s]/g, '') || '0'), 0);
    return `N$${total.toLocaleString()}`;
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
              Legal & Administrative Status Analysis
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Legal proceedings and administrative case classification
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-gray-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <CheckCircle size={20} strokeWidth={1.5} />
              <span className="font-light">No Legal Action</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-700 mb-1">
              {noLegalAction.length}
            </div>
            <p className="text-sm text-green-600 mb-2">
              Clean legal status - standard collection
            </p>
            <div className="text-xs text-gray-600 mb-4">
              Total Value: {getTotalValue(noLegalAction)}
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-green-200 hover:bg-green-100"
              onClick={() => handleDownloadCategory('no-legal')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Scale size={20} strokeWidth={1.5} />
              <span className="font-light">Legal Process</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-orange-700 mb-1">
              {inLegalProcess.length}
            </div>
            <p className="text-sm text-orange-600 mb-2">
              Currently in legal proceedings
            </p>
            <div className="text-xs text-gray-600 mb-4">
              Total Value: {getTotalValue(inLegalProcess)}
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-orange-200 hover:bg-orange-100"
              onClick={() => handleDownloadCategory('legal-process')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <FileX size={20} strokeWidth={1.5} />
              <span className="font-light">Insolvency Risk</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-red-700 mb-1">
              {insolvencyRisk.length}
            </div>
            <p className="text-sm text-red-600 mb-2">
              Administrator/insolvency indicators
            </p>
            <div className="text-xs text-gray-600 mb-4">
              Total Value: {getTotalValue(insolvencyRisk)}
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-red-200 hover:bg-red-100"
              onClick={() => handleDownloadCategory('insolvency')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="no-legal" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="no-legal">No Legal Action ({noLegalAction.length})</TabsTrigger>
          <TabsTrigger value="legal-process">Legal Process ({inLegalProcess.length})</TabsTrigger>
          <TabsTrigger value="insolvency">Insolvency Risk ({insolvencyRisk.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="no-legal">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>No Legal Action - Standard Collection Process</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('no-legal')}
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
                  Clean legal status allows full range of collection activities. Use standard procedures: 
                  contact attempts, payment arrangements, and legal escalation if needed. No restrictions apply.
                </p>
              </div>
              <div className="space-y-4">
                {noLegalAction.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Last Payment: {debtor.lastPayment}</span>
                        {debtor.phone !== 'No phone' && (
                          <span className="text-green-600">✓ Contact Available</span>
                        )}
                      </div>
                      <div className="text-xs text-green-600 mt-1">✓ Clear for standard collection</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-green-600">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                ))}
                {noLegalAction.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {noLegalAction.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal-process">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Legal Process - Escalated Cases</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('legal-process')}
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
                  Currently in legal proceedings. Coordinate with legal department/attorneys. 
                  Focus on settlement negotiations and payment arrangements to avoid full litigation costs.
                </p>
              </div>
              <div className="space-y-4">
                {inLegalProcess.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Last Payment: {debtor.lastPayment}</span>
                        <span className="text-orange-600">⚖️ Legal Process</span>
                      </div>
                      <div className="text-xs text-orange-600 mt-1">⚠ Coordinate with legal team</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-orange-600">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                ))}
                {inLegalProcess.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {inLegalProcess.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insolvency">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Insolvency Risk - Low Recovery Probability</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('insolvency')}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Collection Strategy</h4>
                <p className="text-sm text-red-700">
                  Administrator/insolvency cases have very low recovery rates. Monitor for any asset distributions. 
                  Consider writing off unless significant assets are identified. Minimal collection resources should be allocated.
                </p>
              </div>
              <div className="space-y-4">
                {insolvencyRisk.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Last Payment: {debtor.lastPayment}</span>
                        <span className="text-red-600">📋 Insolvency Risk</span>
                      </div>
                      <div className="text-xs text-red-600 mt-1">⚠ Very low recovery probability</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-red-600">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                ))}
                {insolvencyRisk.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {insolvencyRisk.length - 20} more debtors
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