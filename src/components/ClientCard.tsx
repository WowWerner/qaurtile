import { Building2, DollarSign, Activity } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  industry: string;
  revenue: string;
  status: string;
}

interface ClientCardProps {
  client: Client;
  viewMode: 'grid' | 'list';
  onClick: () => void;
}

export function ClientCard({ client, viewMode, onClick }: ClientCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'rgb(0, 171, 174)';
      case 'Pending': return 'rgb(255, 193, 7)';
      case 'Inactive': return 'rgb(156, 163, 175)';
      default: return 'rgb(156, 163, 175)';
    }
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={onClick}
        className="group bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 ease-out hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Building2 size={20} strokeWidth={1.5} className="text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-light text-gray-800 group-hover:text-gray-900 transition-colors">
                {client.name}
              </h3>
              <p className="text-sm font-light text-gray-500">{client.industry}</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="flex items-center space-x-1 text-gray-600">
                <DollarSign size={14} strokeWidth={1.5} />
                <span className="font-light">{client.revenue}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getStatusColor(client.status) }}
              />
              <span className="text-sm font-light text-gray-600">{client.status}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-2xl p-6 h-48 cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 border border-gray-100 relative overflow-hidden"
    >
      {/* Background gradient on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-3 transition-opacity duration-300 rounded-2xl"
        style={{ backgroundColor: getStatusColor(client.status) }}
      />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Icon */}
        <div className="mb-4">
          <Building2 
            size={24} 
            strokeWidth={1} 
            className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-light text-gray-800 group-hover:text-gray-900 transition-colors mb-2 leading-tight">
            {client.name}
          </h3>
          <p className="text-sm font-light text-gray-500 mb-3">{client.industry}</p>
          
          <div className="flex items-center space-x-1 text-gray-600 mb-2">
            <DollarSign size={12} strokeWidth={1.5} />
            <span className="text-xs font-light">{client.revenue}</span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity size={12} strokeWidth={1.5} className="text-gray-400" />
            <span className="text-xs font-light text-gray-500">{client.status}</span>
          </div>
          <div 
            className="w-3 h-3 rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            style={{ backgroundColor: getStatusColor(client.status) }}
          />
        </div>
      </div>
    </div>
  );
}