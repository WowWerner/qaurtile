import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Search, Eye, DollarSign, Calendar, Target, Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { supabase } from '../lib/supabase';

interface ClientAccount {
  account_id: number;
  client_id: number;
  client_name: string;
  client_debtor_id: string;
  debt_amount: number;
  hand_over_date: string;
  days_since_handover: number;
  client_tier: string;
  prediction_score: number;
  probability_category: 'HIGH' | 'MEDIUM' | 'LOW';
  next_action: string;
  action_priority: 'URGENT' | 'HIGH' | 'NORMAL';
  action_timeframe: string;
  last_activity_date: string;
}

export function AccountsPage() {
  const { clientId, accountType } = useParams<{ clientId: string; accountType: string }>();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('prediction_score');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    if (clientId && accountType) {
      loadAccounts();
    }
  }, [clientId, accountType]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('client_account_predictions')
        .select('*')
        .eq('client_id', parseInt(clientId!))
        .eq('probability_category', accountType)
        .not('client_name', 'ilike', '%test%')
        .order(sortBy, { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };
  const getAccountTypeName = (type: string) => {
    const types: Record<string, string> = {
      'HIGH': 'High Priority Accounts',
      'MEDIUM': 'Medium Priority Accounts',
      'LOW': 'Low Priority Accounts'
    };
    return types[type || ''] || 'Unknown Account Type';
  };

  const handleDownloadCSV = () => {
    const csvContent = [
      'Account ID,Client,Debtor ID,Debt Amount,Handover Date,Days Since Handover,Prediction Score,Priority Category,Next Action,Action Priority,Action Timeframe',
      ...filteredAccounts.map(account => 
        `"${account.account_id}","${account.client_name}","${account.client_debtor_id || 'N/A'}","N$${account.debt_amount?.toLocaleString() || '0'}","${account.hand_over_date || 'N/A'}","${account.days_since_handover || 0}","${account.prediction_score || 0}","${account.probability_category}","${account.next_action || 'N/A'}","${account.action_priority || 'N/A'}","${account.action_timeframe || 'N/A'}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${accountType.toLowerCase()}-priority-accounts.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewAccount = (accountId: number) => {
    navigate(`/client/${clientId}/account/${accountId}`, { 
      state: { account: accounts.find(acc => acc.account_id === accountId) }
    });
  };

  const filteredAccounts = accounts.filter(account =>
    account.client_debtor_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.next_action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const getPriorityColor = (category: string) => {
    switch (category) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-orange-600 bg-orange-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-700 bg-red-100';
      case 'HIGH': return 'text-orange-700 bg-orange-100';
      case 'NORMAL': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(0,171,174)]"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/client/${clientId}`)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              {getAccountTypeName(accountType || '')}
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              {accounts.length > 0 ? accounts[0].client_name : 'Client'} - {filteredAccounts.length} accounts
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleDownloadCSV}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
          disabled={filteredAccounts.length === 0}
        >
          <Download size={16} strokeWidth={1.5} />
          <span>Download CSV</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Target size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Total Accounts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {filteredAccounts.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">{accountType} priority</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <DollarSign size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Total Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              N${(filteredAccounts.reduce((sum, acc) => sum + (acc.debt_amount || 0), 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-gray-500 mt-1">Portfolio value</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <TrendingUp size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Avg Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-[rgb(0,171,174)]">
              {filteredAccounts.length > 0 
                ? Math.round(filteredAccounts.reduce((sum, acc) => sum + (acc.prediction_score || 0), 0) / filteredAccounts.length)
                : 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Prediction score</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Clock size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Avg Days</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {filteredAccounts.length > 0 
                ? Math.round(filteredAccounts.reduce((sum, acc) => sum + (acc.days_since_handover || 0), 0) / filteredAccounts.length)
                : 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Since handover</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search accounts by debtor ID or action..."
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
            <SelectItem value="prediction_score">Sort by Score</SelectItem>
            <SelectItem value="debt_amount">Sort by Amount</SelectItem>
            <SelectItem value="days_since_handover">Sort by Days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
          <SelectTrigger className="w-32 bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="25">25 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredAccounts.length)} of {filteredAccounts.length} accounts
        </p>
      </div>

      {/* Accounts Table */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
            <span>{getAccountTypeName(accountType || '')} Details</span>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={handleDownloadCSV}
                variant="outline"
                size="sm"
                disabled={filteredAccounts.length === 0}
              >
                <Download size={16} className="mr-2" />
                Export ({filteredAccounts.length})
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAccounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Account ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Debtor ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Debt Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Days Since Handover</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Action Priority</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Next Action</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAccounts.map((account) => (
                    <tr key={account.account_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm text-gray-700">
                        {account.account_id}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {account.client_debtor_id || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        N${account.debt_amount?.toLocaleString() || '0'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(account.probability_category)}`}>
                          {account.prediction_score || 0}/10
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {account.days_since_handover || 0}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionPriorityColor(account.action_priority)}`}>
                          {account.action_priority || 'NORMAL'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-48 truncate">
                        {account.next_action || 'No action specified'}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          onClick={() => handleViewAccount(account.account_id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Eye size={14} strokeWidth={1.5} />
                          <span>View</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <ChevronLeft size={16} strokeWidth={1.5} />
                    <span>Previous</span>
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (pageNum > totalPages) return null;
                      
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className="w-10 h-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="text-gray-400">...</span>
                        <Button
                          onClick={() => handlePageChange(totalPages)}
                          variant="outline"
                          size="sm"
                          className="w-10 h-10"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} strokeWidth={1.5} />
                  </Button>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[rgb(0,171,174)] mx-auto mb-4"></div>
              <p className="text-gray-500">Loading accounts...</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 font-light text-lg mb-4">
                No {accountType.toLowerCase()} priority accounts found
              </p>
              <p className="text-sm text-gray-400 font-light">
                Try adjusting your search criteria or check other priority levels
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}