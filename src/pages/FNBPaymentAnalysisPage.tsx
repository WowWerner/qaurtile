import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, CreditCard, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../lib/supabase';
import { Debtor } from '../lib/fnb/scoring';

export function FNBPaymentAnalysisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { uploadId } = location.state || {};
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!uploadId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('fnb_debtors')
          .select('*')
          .eq('fnb_upload_id', uploadId);

        if (error) throw error;
        setDebtors(data || []);
      } catch (error) {
        console.error('Error loading FNB debtors:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [uploadId]);

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

  if (!debtors.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-thin text-gray-600 mb-4">No data found</h2>
          <p className="text-gray-500 mb-4">Please return to FNB analysis</p>
          <Button onClick={() => navigate('/intelligence-center/fnb-specialised')} variant="outline">
            Back to FNB Specialised
          </Button>
        </div>
      </div>
    );
  }

  // Classify by payment behavior
  const classifyByPaymentBehavior = (debtor: Debtor) => {
    if (!debtor.last_payment_date || !debtor.last_payment_amount) {
      return 'no-payment';
    }

    try {
      const paymentDate = new Date(debtor.last_payment_date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff < 30) return 'recent';
      if (daysDiff <= 90) return 'medium';
      return 'old';
    } catch {
      return 'no-payment';
    }
  };

  const recentPayments = debtors.filter(d => classifyByPaymentBehavior(d) === 'recent');
  const mediumPayments = debtors.filter(d => classifyByPaymentBehavior(d) === 'medium');
  const oldPayments = debtors.filter(d => classifyByPaymentBehavior(d) === 'old');
  const noPayments = debtors.filter(d => classifyByPaymentBehavior(d) === 'no-payment');

  const handleDownloadCategory = (category: 'recent' | 'medium' | 'old' | 'no-payment') => {
    let categoryData, filename;

    switch (category) {
      case 'recent':
        categoryData = recentPayments;
        filename = 'fnb-recent-payment-debtors.csv';
        break;
      case 'medium':
        categoryData = mediumPayments;
        filename = 'fnb-medium-payment-debtors.csv';
        break;
      case 'old':
        categoryData = oldPayments;
        filename = 'fnb-old-payment-debtors.csv';
        break;
      case 'no-payment':
        categoryData = noPayments;
        filename = 'fnb-no-payment-debtors.csv';
        break;
    }

    const csvContent = [
      'Client Ref,Name,Score,Bucket,Amount,Last Payment Date,Last Payment Amount',
      ...categoryData.map(d =>
        `"${d.client_ref || ''}","${d.debtor_first_name || ''} ${d.debtor_surname || ''}",${d.score || ''},"${d.bucket || ''}","${d.amount || ''}","${d.last_payment_date || ''}","${d.last_payment_amount || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const calculateDaysSince = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
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
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              FNB Payment Behavior Analysis
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Payment patterns and commitment signals
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
              Paid within last 30 days
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
              Medium probability
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
              90+ days ago
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
              No payment history
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
                <span>Recent Payments</span>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCategory('recent')}>
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
                      <h4 className="font-medium text-gray-900">
                        {debtor.debtor_first_name} {debtor.debtor_surname}
                      </h4>
                      <div className="text-sm text-gray-600 mt-2">
                        Last Payment: {calculateDaysSince(debtor.last_payment_date)} - N$ {debtor.last_payment_amount?.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">N$ {debtor.amount?.toLocaleString()}</div>
                      <div className="text-sm text-green-600">Score: {debtor.score}/100</div>
                      <div className="text-xs text-gray-500">{debtor.bucket}</div>
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
                <span>Medium Term Payments</span>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCategory('medium')}>
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
                      <h4 className="font-medium text-gray-900">
                        {debtor.debtor_first_name} {debtor.debtor_surname}
                      </h4>
                      <div className="text-sm text-gray-600 mt-2">
                        Last Payment: {calculateDaysSince(debtor.last_payment_date)} - N$ {debtor.last_payment_amount?.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">N$ {debtor.amount?.toLocaleString()}</div>
                      <div className="text-sm text-orange-600">Score: {debtor.score}/100</div>
                      <div className="text-xs text-gray-500">{debtor.bucket}</div>
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
                <span>Old Payments</span>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCategory('old')}>
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
                      <h4 className="font-medium text-gray-900">
                        {debtor.debtor_first_name} {debtor.debtor_surname}
                      </h4>
                      <div className="text-sm text-gray-600 mt-2">
                        Last Payment: {calculateDaysSince(debtor.last_payment_date)} - N$ {debtor.last_payment_amount?.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">N$ {debtor.amount?.toLocaleString()}</div>
                      <div className="text-sm text-red-600">Score: {debtor.score}/100</div>
                      <div className="text-xs text-gray-500">{debtor.bucket}</div>
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
                <span>No Payment History</span>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCategory('no-payment')}>
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
                      <h4 className="font-medium text-gray-900">
                        {debtor.debtor_first_name} {debtor.debtor_surname}
                      </h4>
                      <div className="text-sm text-gray-500 mt-2">
                        No payment history recorded
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">N$ {debtor.amount?.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Score: {debtor.score}/100</div>
                      <div className="text-xs text-gray-500">{debtor.bucket}</div>
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
