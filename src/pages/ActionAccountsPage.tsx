import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function ActionAccountsPage() {
  const { accountType } = useParams<{ accountType: string }>();
  const navigate = useNavigate();

  const getAccountTypeName = (type: string) => {
    const types: Record<string, string> = {
      'high-priority': 'High Priority Accounts',
      'medium-priority': 'Medium Priority Accounts',
      'low-priority': 'Low Priority Accounts'
    };
    return types[type || ''] || 'Unknown Account Type';
  };

  const handleDownloadCSV = () => {
    // Placeholder for CSV download functionality
    console.log(`Downloading CSV for ${accountType} accounts...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/action-analysis')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              {getAccountTypeName(accountType || '')}
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">Action Analysis</p>
          </div>
        </div>
        
        <Button
          onClick={handleDownloadCSV}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Download size={16} strokeWidth={1.5} />
          <span>Download CSV</span>
        </Button>
      </div>

      {/* Placeholder for account data table */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800">
            Account Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <p className="text-gray-500 font-light text-lg mb-4">
              Account data table will be implemented here
            </p>
            <p className="text-sm text-gray-400 font-light">
              This page will contain the detailed account information and CSV download functionality
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}