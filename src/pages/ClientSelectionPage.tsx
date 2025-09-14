import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Grid3X3, List, Search } from 'lucide-react';
import { ClientCard } from '../components/ClientCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';

interface ClientSummary {
  id: number;
  name: string;
  industry: string;
  revenue: string;
  status: string;
  totalAccounts: number;
  totalDebt: number;
  avgScore: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

export function ClientSelectionPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      
      // Get all clients with their account summaries
      const { data, error } = await supabase
        .from('client_account_predictions')
        .select('client_id, client_name, debt_amount, prediction_score, probability_category')
        .not('client_name', 'ilike', '%test%'); // Exclude test clients

      if (error) throw error;

      // Group by client and calculate summaries
      const clientMap = new Map<string, {
        id: number;
        name: string;
        accounts: any[];
      }>();

      data?.forEach(account => {
        const clientName = account.client_name;
        if (!clientMap.has(clientName)) {
          clientMap.set(clientName, {
            id: account.client_id,
            name: clientName,
            accounts: []
          });
        }
        clientMap.get(clientName)?.accounts.push(account);
      });

      // Convert to client summaries
      const clientSummaries: ClientSummary[] = Array.from(clientMap.values()).map(client => {
        const totalAccounts = client.accounts.length;
        const totalDebt = client.accounts.reduce((sum, acc) => sum + (acc.debt_amount || 0), 0);
        const avgScore = totalAccounts > 0 
          ? client.accounts.reduce((sum, acc) => sum + (acc.prediction_score || 0), 0) / totalAccounts
          : 0;
        
        const highPriority = client.accounts.filter(acc => acc.probability_category === 'HIGH').length;
        const mediumPriority = client.accounts.filter(acc => acc.probability_category === 'MEDIUM').length;
        const lowPriority = client.accounts.filter(acc => acc.probability_category === 'LOW').length;

        return {
          id: client.id,
          name: client.name,
          industry: 'Debt Collection', // Default industry
          revenue: `N$${(totalDebt / 1000000).toFixed(1)}M`,
          status: 'Active',
          totalAccounts,
          totalDebt,
          avgScore: Math.round(avgScore),
          highPriority,
          mediumPriority,
          lowPriority
        };
      });

      setClients(clientSummaries.sort((a, b) => b.totalDebt - a.totalDebt));
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(0,171,174)]"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
            Select Client
          </h1>
        </div>

        {/* View controls */}
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm' 
                  : 'hover:bg-gray-200/50'
              }`}
            >
              <Grid3X3 size={16} strokeWidth={1.5} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-white shadow-sm' 
                  : 'hover:bg-gray-200/50'
              }`}
            >
              <List size={16} strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white border-gray-200 focus:border-[rgb(0,171,174)] focus:ring-[rgb(0,171,174)]/20 font-light"
        />
      </div>

      {/* Clients */}
      <div className={`
        ${viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
          : 'space-y-4 max-w-4xl'
        }
      `}>
        {filteredClients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            viewMode={viewMode}
            onClick={() => navigate(`/client/${client.id}`)}
          />
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 font-light text-lg">No clients found matching your search.</p>
        </div>
      )}
    </div>
  );
}