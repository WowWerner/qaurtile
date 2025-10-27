import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Phone, Mail, MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AnalysisResults } from '../utils/csvProcessor';
import { SupabaseService } from '../utils/supabaseService';

export function ContactAnalysisPage() {
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
          <p className="mt-4 text-gray-600">Loading contact analysis...</p>
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

  // Categorize debtors by contact completeness
  const allDebtors = [
    ...results.highProbability.debtors,
    ...results.mediumProbability.debtors,
    ...results.lowProbability.debtors
  ];

  const strongContact = allDebtors.filter(debtor => 
    debtor.phone !== 'No phone' && debtor.email !== 'No email'
  );

  const needsTracing = allDebtors.filter(debtor => 
    (debtor.phone === 'No phone' || debtor.email === 'No email') && 
    debtor.address !== 'No address'
  );

  const lowProbability = allDebtors.filter(debtor => 
    debtor.phone === 'No phone' && debtor.email === 'No email' && debtor.address === 'No address'
  );

  const handleDownloadCategory = (category: 'strong' | 'needs-tracing' | 'low') => {
    let categoryData, filename;
    
    switch (category) {
      case 'strong':
        categoryData = strongContact;
        filename = 'strong-contact-debtors.csv';
        break;
      case 'needs-tracing':
        categoryData = needsTracing;
        filename = 'needs-tracing-debtors.csv';
        break;
      case 'low':
        categoryData = lowProbability;
        filename = 'low-contact-probability-debtors.csv';
        break;
    }
    
    const csvContent = [
      'Name,Score,Amount,Phone,Email,Address,Contact Status',
      ...categoryData.map(debtor => 
        `"${debtor.name}",${debtor.score},"${debtor.amount}","${debtor.phone}","${debtor.email}","${debtor.address}","${category}"`
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      {/* Header */}
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
              Contact Information Completeness
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Analysis of debtor contact information quality
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
              Debtors with both phone and email
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
              Missing key contact info but has address
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
              Minimal contact information available
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
                <span>Strong Contact Information - High Collection Probability</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('strong')}
                >
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
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Phone size={14} />
                          <span>{debtor.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Mail size={14} />
                          <span>{debtor.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-green-600">Score: {debtor.score}/100</div>
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
                <span>Needs Contact Tracing - Medium Priority</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('needs-tracing')}
                >
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
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Phone size={14} />
                          <span className={debtor.phone === 'No phone' ? 'text-red-500' : ''}>{debtor.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin size={14} />
                          <span>{debtor.address}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-orange-600">Score: {debtor.score}/100</div>
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
                <span>Low Contact Probability - Requires Investigation</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCategory('low')}
                >
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
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <div className="text-sm text-red-600 mt-2">
                        Limited contact information - may require legal tracing
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-red-600">Score: {debtor.score}/100</div>
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