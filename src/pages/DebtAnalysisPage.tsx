import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AnalysisResults } from '../utils/csvProcessor';
import { SupabaseService } from '../utils/supabaseService';

export function DebtAnalysisPage() {
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
          <p className="mt-4 text-gray-600">Loading debt analysis...</p>
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

  // Helper function to extract numeric value
  const getNumericAmount = (amountStr: string) => {
    return parseFloat(amountStr.replace(/[N$,\s]/g, '')) || 0;
  };

  // Classify by debt characteristics
  const smallDebtDebtors = allDebtors.filter(debtor => getNumericAmount(debtor.amount) <= 5000);
  const mediumDebtDebtors = allDebtors.filter(debtor => {
    const amount = getNumericAmount(debtor.amount);
    return amount > 5000 && amount <= 50000;
  });
  const largeDebtDebtors = allDebtors.filter(debtor => getNumericAmount(debtor.amount) > 50000);

  const handleDownloadCategory = (category: 'small' | 'medium' | 'large') => {
    let categoryData, filename, categoryName;
    
    switch (category) {
      case 'small':
        categoryData = smallDebtDebtors;
        filename = 'small-debt-debtors.csv';
        categoryName = 'Small Debt (≤N$5,000)';
        break;
      case 'medium':
        categoryData = mediumDebtDebtors;
        filename = 'medium-debt-debtors.csv';
        categoryName = 'Medium Debt (N$5,001-50,000)';
        break;
      case 'large':
        categoryData = largeDebtDebtors;
        filename = 'large-debt-debtors.csv';
        categoryName = 'Large Debt (>N$50,000)';
        break;
    }
    
    const csvContent = [
      'Name,Score,Amount,Debt Category,Last Payment,Phone,Email',
      ...categoryData.map(debtor => 
        `"${debtor.name}",${debtor.score},"${debtor.amount}","${categoryName}","${debtor.lastPayment}","${debtor.phone}","${debtor.email}"`
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

  // Calculate statistics
  const calculateStats = (debtors: any[]) => {
    if (debtors.length === 0) return { total: 0, average: 0 };
    const amounts = debtors.map(d => getNumericAmount(d.amount));
    const total = amounts.reduce((sum, amt) => sum + amt, 0);
    const average = total / amounts.length;
    return { total, average };
  };

  const smallStats = calculateStats(smallDebtDebtors);
  const mediumStats = calculateStats(mediumDebtDebtors);
  const largeStats = calculateStats(largeDebtDebtors);

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
              Debt Characteristics Analysis
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Debt amount analysis and collection difficulty assessment
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
              <span className="font-light">Small Debts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-700 mb-1">
              {smallDebtDebtors.length}
            </div>
            <p className="text-sm text-green-600 mb-2">
              ≤ N$5,000 - Quick settlement potential
            </p>
            <div className="text-xs text-gray-600 mb-4">
              Total: N${smallStats.total.toLocaleString()}
              <br />
              Avg: N${Math.round(smallStats.average).toLocaleString()}
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-green-200 hover:bg-green-100"
              onClick={() => handleDownloadCategory('small')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <DollarSign size={20} strokeWidth={1.5} />
              <span className="font-light">Medium Debts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-orange-700 mb-1">
              {mediumDebtDebtors.length}
            </div>
            <p className="text-sm text-orange-600 mb-2">
              N$5,001-50,000 - Standard collection
            </p>
            <div className="text-xs text-gray-600 mb-4">
              Total: N${mediumStats.total.toLocaleString()}
              <br />
              Avg: N${Math.round(mediumStats.average).toLocaleString()}
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-orange-200 hover:bg-orange-100"
              onClick={() => handleDownloadCategory('medium')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertTriangle size={20} strokeWidth={1.5} />
              <span className="font-light">Large Debts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-red-700 mb-1">
              {largeDebtDebtors.length}
            </div>
            <p className="text-sm text-red-600 mb-2">
              &gt; N$50,000 - May need legal escalation
            </p>
            <div className="text-xs text-gray-600 mb-4">
              Total: N${largeStats.total.toLocaleString()}
              <br />
              Avg: N${Math.round(largeStats.average).toLocaleString()}
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-red-200 hover:bg-red-100"
              onClick={() => handleDownloadCategory('large')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="small" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="small">Small Debts ({smallDebtDebtors.length})</TabsTrigger>
          <TabsTrigger value="medium">Medium Debts ({mediumDebtDebtors.length})</TabsTrigger>
          <TabsTrigger value="large">Large Debts ({largeDebtDebtors.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="small">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Small Debts (≤N$5,000) - Quick Settlement Targets</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('small')}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Strategy Recommendation</h4>
                <p className="text-sm text-green-700">
                  Small debts are ideal for quick settlements. Focus on immediate contact and offer payment plans. 
                  High success rate expected due to manageable amounts.
                </p>
              </div>
              <div className="space-y-4">
                {smallDebtDebtors.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Last Payment: {debtor.lastPayment}</span>
                        {debtor.phone !== 'No phone' && (
                          <span className="text-green-600">✓ Has Phone</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-700">{debtor.amount}</div>
                      <div className="text-sm text-green-600">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                ))}
                {smallDebtDebtors.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {smallDebtDebtors.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medium">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Medium Debts (N$5,001-50,000) - Standard Collection</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('medium')}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Strategy Recommendation</h4>
                <p className="text-sm text-orange-700">
                  Medium-sized debts require structured approach. Use payment plans, negotiate settlements, 
                  and maintain regular contact. Consider legal action if no response after 90 days.
                </p>
              </div>
              <div className="space-y-4">
                {mediumDebtDebtors.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Last Payment: {debtor.lastPayment}</span>
                        {debtor.occupation !== 'Unknown' && (
                          <span className="text-orange-600">• {debtor.occupation}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-orange-700">{debtor.amount}</div>
                      <div className="text-sm text-orange-600">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                ))}
                {mediumDebtDebtors.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {mediumDebtDebtors.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="large">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Large Debts (&gt;N$50,000) - High-Value Collection</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('large')}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Strategy Recommendation</h4>
                <p className="text-sm text-red-700">
                  Large debts require specialized handling. Consider legal escalation early, asset investigation, 
                  and employer garnishment. These cases justify higher collection costs and legal fees.
                </p>
              </div>
              <div className="space-y-4">
                {largeDebtDebtors.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Last Payment: {debtor.lastPayment}</span>
                        {debtor.occupation !== 'Unknown' && (
                          <span className="text-red-600">• {debtor.occupation}</span>
                        )}
                        {debtor.address !== 'No address' && (
                          <span className="text-gray-500">• Has Address</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-red-700">{debtor.amount}</div>
                      <div className="text-sm text-red-600">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                ))}
                {largeDebtDebtors.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {largeDebtDebtors.length - 20} more debtors
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