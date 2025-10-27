import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Phone, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../lib/supabase';
import { Debtor } from '../lib/fnb/scoring';

export function FNBContactAnalysisPage() {
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
          <p className="mt-4 text-gray-600">Loading contact analysis...</p>
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

  // Helper to check if value is valid (not null, not empty, not "0")
  const isValid = (val: any) => val && val !== '' && val !== '0';

  // Categorize by contact completeness
  const strongContact = debtors.filter(d =>
    (isValid(d.cell1) || isValid(d.cell2) || isValid(d.home1) || isValid(d.work1)) &&
    (isValid(d.email1) || isValid(d.email2))
  );

  const needsTracing = debtors.filter(d => {
    const hasPhone = isValid(d.cell1) || isValid(d.cell2) || isValid(d.home1) || isValid(d.work1);
    const hasEmail = isValid(d.email1) || isValid(d.email2);
    const hasAddress = isValid(d.street_line1) || isValid(d.postal_line1);

    // Needs tracing if missing phone OR email, but has some contact info
    return (!hasPhone || !hasEmail) && (hasPhone || hasEmail || hasAddress);
  });

  const lowProbability = debtors.filter(d => {
    const hasPhone = isValid(d.cell1) || isValid(d.cell2) || isValid(d.home1) || isValid(d.work1);
    const hasEmail = isValid(d.email1) || isValid(d.email2);
    const hasAddress = isValid(d.street_line1) || isValid(d.postal_line1);

    // Low probability if no phone, no email, and no address
    return !hasPhone && !hasEmail && !hasAddress;
  });

  const handleDownloadCategory = (category: 'strong' | 'needs-tracing' | 'low') => {
    let categoryData, filename;

    switch (category) {
      case 'strong':
        categoryData = strongContact;
        filename = 'fnb-strong-contact-debtors.csv';
        break;
      case 'needs-tracing':
        categoryData = needsTracing;
        filename = 'fnb-needs-tracing-debtors.csv';
        break;
      case 'low':
        categoryData = lowProbability;
        filename = 'fnb-low-contact-probability-debtors.csv';
        break;
    }

    const csvContent = [
      'Client Ref,Name,Score,Bucket,Amount,Cell1,Cell2,Email1,Email2',
      ...categoryData.map(d =>
        `"${d.client_ref || ''}","${d.debtor_first_name || ''} ${d.debtor_surname || ''}",${d.score || ''},"${d.bucket || ''}","${d.amount || ''}","${d.cell1 || ''}","${d.cell2 || ''}","${d.email1 || ''}","${d.email2 || ''}"`
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/intelligence-center/fnb-specialised', {
              state: { uploadId }
            })}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              FNB Contact Information Analysis
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Contact completeness for FNB debtors
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
              <span className="font-light">Strong Contact Info</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-700 mb-1">
              {strongContact.length}
            </div>
            <p className="text-sm text-green-600 mb-4">
              Has both phone and email
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-green-200 hover:bg-green-100"
              onClick={() => handleDownloadCategory('strong')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertCircle size={20} strokeWidth={1.5} />
              <span className="font-light">Needs Tracing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-orange-700 mb-1">
              {needsTracing.length}
            </div>
            <p className="text-sm text-orange-600 mb-4">
              Missing key contact information
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-orange-200 hover:bg-orange-100"
              onClick={() => handleDownloadCategory('needs-tracing')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <XCircle size={20} strokeWidth={1.5} />
              <span className="font-light">Low Probability</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-red-700 mb-1">
              {lowProbability.length}
            </div>
            <p className="text-sm text-red-600 mb-4">
              Minimal contact information
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-red-200 hover:bg-red-100"
              onClick={() => handleDownloadCategory('low')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="strong" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="strong">Strong Contact ({strongContact.length})</TabsTrigger>
          <TabsTrigger value="needs-tracing">Needs Tracing ({needsTracing.length})</TabsTrigger>
          <TabsTrigger value="low-prob">Low Probability ({lowProbability.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="strong">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Strong Contact Information</span>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCategory('strong')}>
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strongContact.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {debtor.debtor_first_name} {debtor.debtor_surname}
                      </h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Phone size={14} />
                          <span>{debtor.cell1 || debtor.cell2 || debtor.home1 || debtor.work1}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Mail size={14} />
                          <span>{debtor.email1 || debtor.email2}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">N$ {debtor.amount?.toLocaleString()}</div>
                      <div className="text-sm text-green-600">Score: {debtor.score}/100</div>
                      <div className="text-xs text-gray-500">{debtor.bucket}</div>
                    </div>
                  </div>
                ))}
                {strongContact.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {strongContact.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="needs-tracing">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Needs Contact Tracing</span>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCategory('needs-tracing')}>
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {needsTracing.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {debtor.debtor_first_name} {debtor.debtor_surname}
                      </h4>
                      <div className="text-sm text-orange-600 mt-2">
                        Missing contact information - requires tracing
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">N$ {debtor.amount?.toLocaleString()}</div>
                      <div className="text-sm text-orange-600">Score: {debtor.score}/100</div>
                      <div className="text-xs text-gray-500">{debtor.bucket}</div>
                    </div>
                  </div>
                ))}
                {needsTracing.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {needsTracing.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-prob">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Low Contact Probability</span>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCategory('low')}>
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowProbability.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {debtor.debtor_first_name} {debtor.debtor_surname}
                      </h4>
                      <div className="text-sm text-red-600 mt-2">
                        Minimal contact information available
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">N$ {debtor.amount?.toLocaleString()}</div>
                      <div className="text-sm text-red-600">Score: {debtor.score}/100</div>
                      <div className="text-xs text-gray-500">{debtor.bucket}</div>
                    </div>
                  </div>
                ))}
                {lowProbability.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {lowProbability.length - 20} more debtors
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
