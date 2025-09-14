import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, CreditCard, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AnalysisResults } from '../utils/csvProcessor';
import { SupabaseService } from '../utils/supabaseService';

export function PaymentAnalysisPage() {
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
          <p className="mt-4 text-gray-600">Loading payment analysis...</p>
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

  // Classify by payment behavior
  const classifyByPaymentBehavior = (debtor: any) => {
    if (debtor.lastPayment === 'No payment') {
      return 'no-payment';
    }
    
    try {
      const paymentDate = new Date(debtor.lastPayment);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 30) return 'recent';
      if (daysDiff <= 90) return 'medium';
      return 'old';
    } catch {
      return 'no-payment';
    }
  };

  const recentPayments = allDebtors.filter(debtor => classifyByPaymentBehavior(debtor) === 'recent');
  const mediumPayments = allDebtors.filter(debtor => classifyByPaymentBehavior(debtor) === 'medium');
  const oldPayments = allDebtors.filter(debtor => classifyByPaymentBehavior(debtor) === 'old');
  const noPayments = allDebtors.filter(debtor => classifyByPaymentBehavior(debtor) === 'no-payment');

  const handleDownloadCategory = (category: 'recent' | 'medium' | 'old' | 'no-payment') => {
    let categoryData, filename, categoryName;
    
    switch (category) {
      case 'recent':
        categoryData = recentPayments;
        filename = 'recent-payment-debtors.csv';
        categoryName = 'Recent Payment';
        break;
      case 'medium':
        categoryData = mediumPayments;
        filename = 'medium-payment-debtors.csv';
        categoryName = 'Medium Payment';
        break;
      case 'old':
        categoryData = oldPayments;
        filename = 'old-payment-debtors.csv';
        categoryName = 'Old Payment';
        break;
      case 'no-payment':
        categoryData = noPayments;
        filename = 'no-payment-debtors.csv';
        categoryName = 'No Payment';
        break;
    }
    
    const csvContent = [
      'Name,Score,Amount,Last Payment,Payment Category,Occupation',
      ...categoryData.map(debtor => 
        `"${debtor.name}",${debtor.score},"${debtor.amount}","${debtor.lastPayment}","${categoryName}","${debtor.occupation}"`
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

  const calculateDaysSince = (dateStr: string) => {
    if (dateStr === 'No payment') return 'Never';
    try {
      const paymentDate = new Date(dateStr);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
      return `${daysDiff} days ago`;
    } catch {
      return 'Invalid date';
    }
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
              Payment Behavior Analysis
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Debtors categorized by payment patterns and commitment signals
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <TrendingUp size={20} strokeWidth={1.5} />
              <span className="font-light">Recent Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-700 mb-1">
              {recentPayments.length}
            </div>
            <p className="text-sm text-green-600 mb-4">
              Paid within last 30 days - high probability
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-green-200 hover:bg-green-100"
              onClick={() => handleDownloadCategory('recent')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Clock size={20} strokeWidth={1.5} />
              <span className="font-light">30-90 Days Ago</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-orange-700 mb-1">
              {mediumPayments.length}
            </div>
            <p className="text-sm text-orange-600 mb-4">
              Medium probability - worth pursuing
            </p>
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
              <AlertCircle size={20} strokeWidth={1.5} />
              <span className="font-light">Old Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-red-700 mb-1">
              {oldPayments.length}
            </div>
            <p className="text-sm text-red-600 mb-4">
              90+ days ago - low probability
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-red-200 hover:bg-red-100"
              onClick={() => handleDownloadCategory('old')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <CreditCard size={20} strokeWidth={1.5} />
              <span className="font-light">No Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-700 mb-1">
              {noPayments.length}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              No payment history recorded
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-gray-200 hover:bg-gray-100"
              onClick={() => handleDownloadCategory('no-payment')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="recent">Recent ({recentPayments.length})</TabsTrigger>
          <TabsTrigger value="medium">Medium ({mediumPayments.length})</TabsTrigger>
          <TabsTrigger value="old">Old ({oldPayments.length})</TabsTrigger>
          <TabsTrigger value="no-payment">None ({noPayments.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Recent Payments - High Settlement Probability</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('recent')}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayments.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Last Payment: {calculateDaysSince(debtor.lastPayment)}</span>
                        {debtor.occupation !== 'Unknown' && (
                          <span className="text-gray-400">• {debtor.occupation}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-green-600">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                ))}
                {recentPayments.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {recentPayments.length - 20} more debtors
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
                <span>Medium Term Payments - Worth Pursuing</span>
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
              <div className="space-y-4">
                {mediumPayments.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Last Payment: {calculateDaysSince(debtor.lastPayment)}</span>
                        {debtor.occupation !== 'Unknown' && (
                          <span className="text-gray-400">• {debtor.occupation}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-orange-600">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                ))}
                {mediumPayments.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {mediumPayments.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="old">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Old Payments - Low Recovery Probability</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('old')}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {oldPayments.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Last Payment: {calculateDaysSince(debtor.lastPayment)}</span>
                        {debtor.occupation !== 'Unknown' && (
                          <span className="text-gray-400">• {debtor.occupation}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-red-600">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                ))}
                {oldPayments.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {oldPayments.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="no-payment">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>No Payment History - Commitment Unknown</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('no-payment')}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {noPayments.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="text-sm text-gray-500 mt-2">
                        No payment history - debtor commitment uncertain
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-gray-600">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                ))}
                {noPayments.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {noPayments.length - 20} more debtors
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