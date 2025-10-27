import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Users, Briefcase } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../lib/supabase';
import { Debtor } from '../lib/fnb/scoring';

export function FNBDemographicsAnalysisPage() {
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
          <p className="mt-4 text-gray-600">Loading demographics analysis...</p>
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

  // Categorize by employer/occupation data
  const withEmployer = debtors.filter(d => d.employer && d.employer.trim() !== '');
  const withOccupation = debtors.filter(d => d.occupation && d.occupation.trim() !== '' && !d.employer);
  const noEmploymentData = debtors.filter(d => (!d.employer || d.employer.trim() === '') && (!d.occupation || d.occupation.trim() === ''));

  const handleDownloadCategory = (category: 'employer' | 'occupation' | 'none') => {
    let categoryData, filename;

    switch (category) {
      case 'employer':
        categoryData = withEmployer;
        filename = 'fnb-with-employer-debtors.csv';
        break;
      case 'occupation':
        categoryData = withOccupation;
        filename = 'fnb-with-occupation-debtors.csv';
        break;
      case 'none':
        categoryData = noEmploymentData;
        filename = 'fnb-no-employment-data-debtors.csv';
        break;
    }

    const csvContent = [
      'Client Ref,Name,Score,Bucket,Amount,Employer,Employer Address,Occupation',
      ...categoryData.map(d =>
        `"${d.client_ref || ''}","${d.debtor_first_name || ''} ${d.debtor_surname || ''}",${d.score || ''},"${d.bucket || ''}","${d.amount || ''}","${d.employer || ''}","${d.employer_address || ''}","${d.occupation || ''}"`
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
              FNB Demographics & Employment Analysis
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Employment and occupation data for collection strategy
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-gray-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Briefcase size={20} strokeWidth={1.5} />
              <span className="font-light">With Employer Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-700 mb-1">
              {withEmployer.length}
            </div>
            <p className="text-sm text-green-600 mb-4">
              High recovery potential via emoluments order
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-green-200 hover:bg-green-100"
              onClick={() => handleDownloadCategory('employer')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Users size={20} strokeWidth={1.5} />
              <span className="font-light">Occupation Only</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-orange-700 mb-1">
              {withOccupation.length}
            </div>
            <p className="text-sm text-orange-600 mb-4">
              Medium priority - employer tracing needed
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-orange-200 hover:bg-orange-100"
              onClick={() => handleDownloadCategory('occupation')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <Users size={20} strokeWidth={1.5} />
              <span className="font-light">No Employment Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-red-700 mb-1">
              {noEmploymentData.length}
            </div>
            <p className="text-sm text-red-600 mb-4">
              Requires extensive tracing
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-red-200 hover:bg-red-100"
              onClick={() => handleDownloadCategory('none')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="employer" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="employer">With Employer ({withEmployer.length})</TabsTrigger>
          <TabsTrigger value="occupation">Occupation Only ({withOccupation.length})</TabsTrigger>
          <TabsTrigger value="none">No Data ({noEmploymentData.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="employer">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Debtors with Employer Details</span>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCategory('employer')}>
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {withEmployer.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {debtor.debtor_first_name} {debtor.debtor_surname}
                      </h4>
                      <div className="text-sm text-gray-600 mt-2">
                        <div className="flex items-center space-x-2">
                          <Briefcase size={14} />
                          <span>{debtor.employer}</span>
                        </div>
                        {debtor.occupation && (
                          <div className="text-xs text-gray-500 mt-1">{debtor.occupation}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">N$ {debtor.amount?.toLocaleString()}</div>
                      <div className="text-sm text-green-600">Score: {debtor.score}/100</div>
                      <div className="text-xs text-gray-500">{debtor.bucket}</div>
                    </div>
                  </div>
                ))}
                {withEmployer.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {withEmployer.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupation">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Debtors with Occupation Only</span>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCategory('occupation')}>
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {withOccupation.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {debtor.debtor_first_name} {debtor.debtor_surname}
                      </h4>
                      <div className="text-sm text-gray-600 mt-2">
                        Occupation: {debtor.occupation}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">N$ {debtor.amount?.toLocaleString()}</div>
                      <div className="text-sm text-orange-600">Score: {debtor.score}/100</div>
                      <div className="text-xs text-gray-500">{debtor.bucket}</div>
                    </div>
                  </div>
                ))}
                {withOccupation.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {withOccupation.length - 20} more debtors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="none">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>No Employment Data</span>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCategory('none')}>
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {noEmploymentData.slice(0, 20).map((debtor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {debtor.debtor_first_name} {debtor.debtor_surname}
                      </h4>
                      <div className="text-sm text-red-600 mt-2">
                        No employment information available
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">N$ {debtor.amount?.toLocaleString()}</div>
                      <div className="text-sm text-red-600">Score: {debtor.score}/100</div>
                      <div className="text-xs text-gray-500">{debtor.bucket}</div>
                    </div>
                  </div>
                ))}
                {noEmploymentData.length > 20 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {noEmploymentData.length - 20} more debtors
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
