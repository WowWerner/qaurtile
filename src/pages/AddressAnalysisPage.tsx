import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, MapPin, Home, Building, AlertTriangle, Map, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AnalysisResults } from '../utils/csvProcessor';
import { SupabaseService } from '../utils/supabaseService';
import { GoogleMapsHeatmap } from '../components/GoogleMapsHeatmap';

interface HeatmapData {
  area: string;
  coordinates: { lat: number; lng: number };
  intensity: number;
  category: 'high-income' | 'mid-income' | 'low-income';
  count: number;
  addresses: string[];
}

interface HeatmapSummary {
  totalAddresses: number;
  highIncomeCount: number;
  midIncomeCount: number;
  lowIncomeCount: number;
  unmappedCount: number;
}

export function AddressAnalysisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { csvUploadId } = location.state || {};
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [heatmapSummary, setHeatmapSummary] = useState<HeatmapSummary | null>(null);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);

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

  // Generate heatmap data using OpenAI
  const generateHeatmap = async () => {
    if (!csvUploadId) return;
    
    setLoadingHeatmap(true);
    setHeatmapError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/address-heatmap`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvUploadId })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate heatmap');
      }

      setHeatmapData(result.heatmapData || []);
      setHeatmapSummary(result.summary || null);
      
    } catch (error) {
      console.error('Heatmap generation error:', error);
      setHeatmapError((error as Error).message);
    } finally {
      setLoadingHeatmap(false);
    }
  };

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

  // Classify by address-based socio-economic status
  const classifyBySocioEconomic = (debtor: any) => {
    const address = (debtor.address || '').toLowerCase();
    const postalCode = debtor.postalCode || '';
    
    // Updated area classifications for Windhoek, Namibia
    const lowIncomeKeywords = [
      'okuryangava', 'wanaheda', 'goreangab', 'havana', 'greenwell matongo', 
      'okahandja park', 'one nation', 'ombili', 'katutura', 'mix'
    ];
    
    const midIncomeKeywords = [
      'windhoek west', 'windhoek north', 'khomasdal', 'otjomuise', 
      'academia', 'dorado park', 'dorado valley'
    ];
    
    const upmarketKeywords = [
      'klein windhoek', 'ludwigsdorf', 'eros', 'luxuryhill', 'olympia', 'avis', 
      'auasblick', 'finkenstein estate', 'cimbebasia', 'pionierspark', 'suiderhof', 
      'hochland park', 'kleine kuppe', 'elisenheim', 'omeya', 'cbd', 
      'southern industry', 'northern industry', 'prosperita', 'lafrenz', 'brakwater'
    ];
    
    if (upmarketKeywords.some(keyword => address.includes(keyword)) || parseInt(postalCode.replace(/\D/g, '') || '0') >= 9000) {
      return 'upmarket';
    }
    
    if (midIncomeKeywords.some(keyword => address.includes(keyword))) {
      return 'mid-income';
    }
    
    if (lowIncomeKeywords.some(keyword => address.includes(keyword)) || parseInt(postalCode.replace(/\D/g, '') || '0') < 1000) {
      return 'low-income';
    }
    
    return 'mid-income';
  };

  const upmarketDebtors = allDebtors.filter(debtor => classifyBySocioEconomic(debtor) === 'upmarket');
  const midIncomeDebtors = allDebtors.filter(debtor => classifyBySocioEconomic(debtor) === 'mid-income');
  const lowIncomeDebtors = allDebtors.filter(debtor => classifyBySocioEconomic(debtor) === 'low-income');

  const handleDownloadCategory = (category: 'upmarket' | 'mid-income' | 'low-income') => {
    let categoryData, filename;
    
    switch (category) {
      case 'upmarket':
        categoryData = upmarketDebtors;
        filename = 'upmarket-area-debtors.csv';
        break;
      case 'mid-income':
        categoryData = midIncomeDebtors;
        filename = 'mid-income-area-debtors.csv';
        break;
      case 'low-income':
        categoryData = lowIncomeDebtors;
        filename = 'low-income-area-debtors.csv';
        break;
    }
    
    const csvContent = [
      'Name,Score,Amount,Address,Postal Code,Area Classification',
      ...categoryData.map(debtor => 
        `"${debtor.name}",${debtor.score},"${debtor.amount}","${debtor.address}","${debtor.postalCode || 'N/A'}","${category}"`
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
            onClick={() => navigate('/intelligence-center')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              Address-Based Socio-Economic Classification
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Debtors classified by residential area economic indicators
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
              <span className="font-light">Upmarket Areas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-700 mb-1">
              {upmarketDebtors.length}
            </div>
            <p className="text-sm text-green-600 mb-4">
              High probability - stable employment, better assets
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-green-200 hover:bg-green-100"
              onClick={() => handleDownloadCategory('upmarket')}
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
              <span className="font-light">Mid-Income Areas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-orange-700 mb-1">
              {midIncomeDebtors.length}
            </div>
            <p className="text-sm text-orange-600 mb-4">
              Average probability - worth pursuing
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-orange-200 hover:bg-orange-100"
              onClick={() => handleDownloadCategory('mid-income')}
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
              <span className="font-light">Low-Income Areas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-red-700 mb-1">
              {lowIncomeDebtors.length}
            </div>
            <p className="text-sm text-red-600 mb-4">
              Lower recovery likelihood unless employer details present
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-red-200 hover:bg-red-100"
              onClick={() => handleDownloadCategory('low-income')}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI-Generated Heatmap Section */}
      <GoogleMapsHeatmap 
        debtors={allDebtors}
        onError={(error) => setHeatmapError(error)}
      />

      <Card className="border-gray-200 mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Map size={20} strokeWidth={1.5} />
              <span>AI-Generated Address Analysis</span>
            </div>
            <Button
              onClick={generateHeatmap}
              disabled={loadingHeatmap}
              size="sm"
              className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
            >
              {loadingHeatmap ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <BarChart3 size={16} strokeWidth={1.5} />
                  <span>AI Address Analysis</span>
                </div>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {heatmapError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-700">Error: {heatmapError}</p>
            </div>
          )}
          
          {heatmapSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-light text-gray-800">{heatmapSummary.totalAddresses}</div>
                <div className="text-sm text-gray-600">Total Addresses</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-light text-green-700">{heatmapSummary.highIncomeCount}</div>
                <div className="text-sm text-green-600">High Income</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-light text-orange-700">{heatmapSummary.midIncomeCount}</div>
                <div className="text-sm text-orange-600">Mid Income</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-light text-red-700">{heatmapSummary.lowIncomeCount}</div>
                <div className="text-sm text-red-600">Low Income</div>
              </div>
            </div>
          )}

          {heatmapData.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800 mb-4">Geographic Distribution</h4>
              <div className="grid gap-4">
                {heatmapData.map((area, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${
                      area.category === 'high-income' ? 'bg-green-50 border-green-200' :
                      area.category === 'mid-income' ? 'bg-orange-50 border-orange-200' :
                      'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-gray-900">{area.area}</h5>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{area.count} debtors</span>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: area.category === 'high-income' ? '#22c55e' :
                                           area.category === 'mid-income' ? '#fb923c' : '#ef4444',
                            opacity: area.intensity 
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Coordinates: {area.coordinates.lat}, {area.coordinates.lng}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Category: <span className={`font-medium ${
                        area.category === 'high-income' ? 'text-green-700' :
                        area.category === 'mid-income' ? 'text-orange-700' :
                        'text-red-700'
                      }`}>
                        {area.category.charAt(0).toUpperCase() + area.category.slice(1).replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!heatmapData.length && !loadingHeatmap && !heatmapError && (
            <div className="text-center py-8">
              <BarChart3 size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-light">
                Click "AI Address Analysis" to get detailed area insights using AI
              </p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}