import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Calendar, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

// Mock batch history data
const mockBatches = [
  {
    id: 1,
    fileName: 'clients_handover_jan2025.csv',
    processedDate: '2025-01-15',
    totalDebtors: 630,
    highPriority: 145,
    mediumPriority: 298,
    lowPriority: 187,
    totalValue: 'N$ 7,450,000',
    status: 'Completed'
  },
  {
    id: 2,
    fileName: 'december_accounts.csv',
    processedDate: '2024-12-28',
    totalDebtors: 452,
    highPriority: 89,
    mediumPriority: 201,
    lowPriority: 162,
    totalValue: 'N$ 5,230,000',
    status: 'Completed'
  },
  {
    id: 3,
    fileName: 'november_batch.csv',
    processedDate: '2024-11-30',
    totalDebtors: 378,
    highPriority: 67,
    mediumPriority: 189,
    lowPriority: 122,
    totalValue: 'N$ 4,180,000',
    status: 'Completed'
  }
];

export function BatchHistoryPage() {
  const navigate = useNavigate();

  const handleViewBatch = (batchId: number) => {
    navigate('/intelligence-center/analysis-results', { 
      state: { batchId, fromHistory: true } 
    });
  };

  const handleDownloadReport = (batchId: number) => {
    console.log(`Downloading report for batch ${batchId}...`);
    // Implement download functionality
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'Processing': return 'text-orange-600 bg-orange-100';
      case 'Failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
          <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
            Batch History
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <FileText size={24} strokeWidth={1} className="text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-light text-gray-800">
                {mockBatches.length}
              </div>
              <div className="text-sm text-gray-500 font-light">Total Batches</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <BarChart3 size={24} strokeWidth={1} className="text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-light text-gray-800">
                {mockBatches.reduce((sum, batch) => sum + batch.totalDebtors, 0)}
              </div>
              <div className="text-sm text-gray-500 font-light">Total Debtors</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <Calendar size={24} strokeWidth={1} className="text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-light text-gray-800">
                {mockBatches[0]?.processedDate || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 font-light">Latest Batch</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="text-lg font-light text-gray-800 mb-1">N$</div>
              <div className="text-xl font-light text-gray-800">
                16.86M
              </div>
              <div className="text-sm text-gray-500 font-light">Total Value</div>
            </CardContent>
          </Card>
        </div>

        {/* Batch List */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Processing History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockBatches.map((batch) => (
                <div 
                  key={batch.id}
                  className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-800 mb-1">{batch.fileName}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Processed: {batch.processedDate}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(batch.status)}`}>
                          {batch.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleViewBatch(batch.id)}
                        variant="outline"
                        size="sm"
                      >
                        View Results
                      </Button>
                      <Button
                        onClick={() => handleDownloadReport(batch.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Download size={16} strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="text-lg font-medium text-gray-800">{batch.totalDebtors}</div>
                      <div className="text-xs text-gray-500">Total Debtors</div>
                    </div>
                    <div>
                      <div className="text-lg font-medium text-green-600">{batch.highPriority}</div>
                      <div className="text-xs text-gray-500">High Priority</div>
                    </div>
                    <div>
                      <div className="text-lg font-medium text-orange-600">{batch.mediumPriority}</div>
                      <div className="text-xs text-gray-500">Medium Priority</div>
                    </div>
                    <div>
                      <div className="text-lg font-medium text-red-600">{batch.lowPriority}</div>
                      <div className="text-xs text-gray-500">Low Priority</div>
                    </div>
                    <div>
                      <div className="text-lg font-medium text-gray-800">{batch.totalValue}</div>
                      <div className="text-xs text-gray-500">Total Value</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}