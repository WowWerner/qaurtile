import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Target, AlertTriangle, BarChart3, Filter, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AnalysisResults } from '../utils/csvProcessor';
import { SupabaseService } from '../utils/supabaseService';

export function AnalysisResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fileName = 'debtors.csv', csvUploadId } = location.state || {};
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [filterBy, setFilterBy] = useState('all');

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
          <p className="mt-4 text-gray-600">Loading analysis results...</p>
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

  const analysisResults = results;

  const handleDownloadCSV = (category: string) => {
    let categoryData;
    let filename;
    
    switch (category) {
      case 'high':
        categoryData = analysisResults.highProbability.debtors;
        filename = 'high-priority-debtors.csv';
        break;
      case 'medium':
        categoryData = analysisResults.mediumProbability.debtors;
        filename = 'medium-priority-debtors.csv';
        break;
      case 'low':
        categoryData = analysisResults.lowProbability.debtors;
        filename = 'low-priority-debtors.csv';
        break;
      default:
        return;
    }
    
    // Create CSV content
    const csvContent = [
      // Header
      'Name,Score,Amount,Last Payment,Phone,Email,Address,Occupation',
      // Data rows
      ...categoryData.map(debtor => 
        `"${debtor.name}",${debtor.score},"${debtor.amount}","${debtor.lastPayment}","${debtor.phone}","${debtor.email}","${debtor.address}","${debtor.occupation}"`
      )
    ].join('\n');
    
    // Download file
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
    
    console.log(`Downloading CSV for ${category} probability debtors...`);
  };

  const handleViewDebtor = (debtorId: number) => {
    navigate(`/intelligence-center/debtor/${debtorId}`);
  };

  const getFilteredDebtors = (debtors: any[]) => {
    let filtered = debtors.filter(debtor =>
      debtor.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterBy !== 'all') {
      // Apply additional filters based on filterBy value
      filtered = filtered.filter(debtor => {
        switch (filterBy) {
          case 'recent-payment':
            return new Date(debtor.lastPayment) > new Date('2024-12-01');
          case 'high-amount':
            return parseFloat(debtor.amount.replace('N$ ', '').replace(',', '')) > 15000;
          default:
            return true;
        }
      });
    }

    // Sort debtors
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'amount':
          return parseFloat(b.amount.replace(/[N$,\s]/g, '')) - 
                 parseFloat(a.amount.replace(/[N$,\s]/g, ''));
        case 'name':
          return parseFloat(debtor.amount.replace(/[N$,\s]/g, '')) > 15000;
        default:
          return 0;
      }
    });
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
              Analysis Results
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">File: {fileName}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div 
          className="group relative bg-white rounded-2xl p-8 h-60 cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 border border-gray-100"
          onClick={() => handleDownloadCSV('high')}
        >
          <div className="relative z-10 h-full flex flex-col">
            <div className="mb-4">
              <Target 
                size={28} 
                strokeWidth={1} 
                className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300"
              />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-left leading-tight mb-2">
                <div className="block">
                  <span className="text-xl tracking-wide transition-colors duration-300 font-medium text-gray-800">
                    High Priority
                  </span>
                </div>
                <div className="block">
                  <span className="text-lg tracking-wide transition-colors duration-300 font-thin text-gray-600">
                    {analysisResults.highProbability.count} Debtors
                  </span>
                </div>
              </h3>
              
              <div className="space-y-1 text-sm font-light text-gray-500">
                <div>Total: {analysisResults.highProbability.totalValue}</div>
                <div>Avg Score: {analysisResults.highProbability.avgScore}/100</div>
              </div>
            </div>

            <div 
              className="absolute bottom-6 right-6 w-4 h-4 rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backgroundColor: 'rgb(34, 197, 94)' }}
            />
          </div>

          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"
            style={{ backgroundColor: 'rgb(34, 197, 94)' }}
          />
        </div>

        <div 
          className="group relative bg-white rounded-2xl p-8 h-60 cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 border border-gray-100"
          onClick={() => handleDownloadCSV('medium')}
        >
          <div className="relative z-10 h-full flex flex-col">
            <div className="mb-4">
              <BarChart3 
                size={28} 
                strokeWidth={1} 
                className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300"
              />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-left leading-tight mb-2">
                <div className="block">
                  <span className="text-xl tracking-wide transition-colors duration-300 font-medium text-gray-800">
                    Medium Priority
                  </span>
                </div>
                <div className="block">
                  <span className="text-lg tracking-wide transition-colors duration-300 font-thin text-gray-600">
                    {analysisResults.mediumProbability.count} Debtors
                  </span>
                </div>
              </h3>
              
              <div className="space-y-1 text-sm font-light text-gray-500">
                <div>Total: {analysisResults.mediumProbability.totalValue}</div>
                <div>Avg Score: {analysisResults.mediumProbability.avgScore}/100</div>
              </div>
            </div>

            <div 
              className="absolute bottom-6 right-6 w-4 h-4 rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backgroundColor: 'rgb(251, 146, 60)' }}
            />
          </div>

          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"
            style={{ backgroundColor: 'rgb(251, 146, 60)' }}
          />
        </div>

        <div 
          className="group relative bg-white rounded-2xl p-8 h-60 cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 border border-gray-100"
          onClick={() => handleDownloadCSV('low')}
        >
          <div className="relative z-10 h-full flex flex-col">
            <div className="mb-4">
              <AlertTriangle 
                size={28} 
                strokeWidth={1} 
                className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300"
              />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-left leading-tight mb-2">
                <div className="block">
                  <span className="text-xl tracking-wide transition-colors duration-300 font-medium text-gray-800">
                    Low Priority
                  </span>
                </div>
                <div className="block">
                  <span className="text-lg tracking-wide transition-colors duration-300 font-thin text-gray-600">
                    {analysisResults.lowProbability.count} Debtors
                  </span>
                </div>
              </h3>
              
              <div className="space-y-1 text-sm font-light text-gray-500">
                <div>Total: {analysisResults.lowProbability.totalValue}</div>
                <div>Avg Score: {analysisResults.lowProbability.avgScore}/100</div>
              </div>
            </div>

            <div 
              className="absolute bottom-6 right-6 w-4 h-4 rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backgroundColor: 'rgb(239, 68, 68)' }}
            />
          </div>

          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"
            style={{ backgroundColor: 'rgb(239, 68, 68)' }}
          />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-4xl">
        <div className="relative flex-1">
          <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search debtors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-200 focus:border-[rgb(0,171,174)] focus:ring-[rgb(0,171,174)]/20"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Sort by Score</SelectItem>
            <SelectItem value="amount">Sort by Amount</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Debtors</SelectItem>
            <SelectItem value="recent-payment">Recent Payments</SelectItem>
            <SelectItem value="high-amount">High Value (&gt;N$15k)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Detailed Lists */}
      <Tabs defaultValue="high" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="high" className="font-light">High Priority</TabsTrigger>
          <TabsTrigger value="medium" className="font-light">Medium Priority</TabsTrigger>
          <TabsTrigger value="low" className="font-light">Low Priority</TabsTrigger>
        </TabsList>
        
        <TabsContent value="high">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-light text-gray-800">High Priority Debtors</h3>
              <Button
                onClick={() => handleDownloadCSV('high')}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download size={16} strokeWidth={1.5} />
                <span>Download CSV</span>
              </Button>
            </div>
            <div className="divide-y divide-gray-200">
              {getFilteredDebtors(analysisResults.highProbability.debtors).map((debtor) => (
                <div 
                  key={debtor.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleViewDebtor(debtor.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <p className="text-sm text-gray-500">Last Payment: {debtor.lastPayment}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-green-600 font-medium">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="medium">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-light text-gray-800">Medium Priority Debtors</h3>
              <Button
                onClick={() => handleDownloadCSV('medium')}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download size={16} strokeWidth={1.5} />
                <span>Download CSV</span>
              </Button>
            </div>
            <div className="divide-y divide-gray-200">
              {getFilteredDebtors(analysisResults.mediumProbability.debtors).map((debtor) => (
                <div 
                  key={debtor.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleViewDebtor(debtor.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <p className="text-sm text-gray-500">Last Payment: {debtor.lastPayment}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-orange-600 font-medium">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="low">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-light text-gray-800">Low Priority Debtors</h3>
              <Button
                onClick={() => handleDownloadCSV('low')}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download size={16} strokeWidth={1.5} />
                <span>Download CSV</span>
              </Button>
            </div>
            <div className="divide-y divide-gray-200">
              {getFilteredDebtors(analysisResults.lowProbability.debtors).map((debtor) => (
                <div 
                  key={debtor.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleViewDebtor(debtor.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                      <p className="text-sm text-gray-500">Last Payment: {debtor.lastPayment}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{debtor.amount}</div>
                      <div className="text-sm text-red-600 font-medium">Score: {debtor.score}/100</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}