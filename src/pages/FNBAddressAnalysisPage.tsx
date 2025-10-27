import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, MapPin, Building, Home, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../lib/supabase';
import { Debtor } from '../lib/fnb/scoring';

export function FNBAddressAnalysisPage() {
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
          <p className="mt-4 text-gray-600">Loading address analysis...</p>
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

  // Categorize by SES (already calculated in scoring)
  const highSES = debtors.filter(d => d.ses === 'High');
  const midSES = debtors.filter(d => d.ses === 'Medium');
  const lowSES = debtors.filter(d => d.ses === 'Low');

  const handleDownloadCategory = (category: 'high' | 'mid' | 'low') => {
    let categoryData, filename;

    switch (category) {
      case 'high':
        categoryData = highSES;
        filename = 'fnb-high-ses-debtors.csv';
        break;
      case 'mid':
        categoryData = midSES;
        filename = 'fnb-mid-ses-debtors.csv';
        break;
      case 'low':
        categoryData = lowSES;
        filename = 'fnb-low-ses-debtors.csv';
        break;
    }

    const csvContent = [
      'Client Ref,Name,Score,Bucket,SES,Amount,Street Address,Postal Address',
      ...categoryData.map(d =>
        `"${d.client_ref || ''}","${d.debtor_first_name || ''} ${d.debtor_surname || ''}",${d.score || ''},"${d.bucket || ''}","${d.ses || ''}","${d.amount || ''}","${d.street_line1 || ''}","${d.postal_line1 || ''}"`
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
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              FNB Address-Based SES Classification
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Namibian socio-economic status classification
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-gray-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Building size={20} strokeWidth={1.5} />
              <span className="font-light">High SES Areas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-700 mb-1">
              {highSES.length}
            </div>
            <p className="text-sm text-green-600 mb-4">
              High-income neighborhoods
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-green-200 hover:bg-green-100"
              onClick={() => handleDownloadCategory('high')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Home size={20} strokeWidth={1.5} />
              <span className="font-light">Mid SES Areas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-orange-700 mb-1">
              {midSES.length}
            </div>
            <p className="text-sm text-orange-600 mb-4">
              Middle-income neighborhoods
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-orange-200 hover:bg-orange-100"
              onClick={() => handleDownloadCategory('mid')}
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
              <span className="font-light">Low SES Areas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-red-700 mb-1">
              {lowSES.length}
            </div>
            <p className="text-sm text-red-600 mb-4">
              Lower-income neighborhoods
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
      <Tabs defaultValue="high" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="high">High SES ({highSES.length})</TabsTrigger>
          <TabsTrigger value="mid">Mid SES ({midSES.length})</TabsTrigger>
          <TabsTrigger value="low">Low SES ({lowSES.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="high">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>High SES Areas</span>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCategory('high')}>
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {highSES.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {debtor.debtor_first_name} {debtor.debtor_surname}
                      </h4>
                      <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span>{debtor.street_line1 || debtor.postal_line1 || 'No address'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">N$ {debtor.amount?.toLocaleString()}</div>
                      <div className="text-sm text-green-600">Score: {debtor.score}/100</div>
                      <div className="text-xs text-gray-500">{debtor.bucket}</div>
                    </div>
                  </div>
                ))}
                {highSES.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {highSES.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mid">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Mid SES Areas</span>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCategory('mid')}>
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {midSES.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {debtor.debtor_first_name} {debtor.debtor_surname}
                      </h4>
                      <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span>{debtor.street_line1 || debtor.postal_line1 || 'No address'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">N$ {debtor.amount?.toLocaleString()}</div>
                      <div className="text-sm text-orange-600">Score: {debtor.score}/100</div>
                      <div className="text-xs text-gray-500">{debtor.bucket}</div>
                    </div>
                  </div>
                ))}
                {midSES.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {midSES.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Low SES Areas</span>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCategory('low')}>
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowSES.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {debtor.debtor_first_name} {debtor.debtor_surname}
                      </h4>
                      <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span>{debtor.street_line1 || debtor.postal_line1 || 'No address'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">N$ {debtor.amount?.toLocaleString()}</div>
                      <div className="text-sm text-red-600">Score: {debtor.score}/100</div>
                      <div className="text-xs text-gray-500">{debtor.bucket}</div>
                    </div>
                  </div>
                ))}
                {lowSES.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {lowSES.length - 20} more debtors
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
