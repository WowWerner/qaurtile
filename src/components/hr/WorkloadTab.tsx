import { Clock, AlertTriangle, CheckCircle, TrendingDown, Users, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function WorkloadTab() {
  // Current capacity analysis data
  const capacityData = [
    {
      team: 'Legal Team',
      capacity: 67,
      needed: 1163,
      backlogDays: 17,
      efficiency: (67 / 1163) * 100,
      color: '#ef4444',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700'
    },
    {
      team: 'Negotiation Team', 
      capacity: 120,
      needed: 2139,
      backlogDays: 18,
      efficiency: (120 / 2139) * 100,
      color: '#f59e0b',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700'
    },
    {
      team: 'Initial Contact Team',
      capacity: 105,
      needed: 11034,
      backlogDays: 105,
      efficiency: (105 / 11034) * 100,
      color: '#dc2626',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700'
    }
  ];

  // Chart data for capacity vs demand
  const chartData = capacityData.map(team => ({
    name: team.team.replace(' Team', ''),
    capacity: team.capacity,
    needed: team.needed,
    gap: team.needed - team.capacity
  }));

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 10) return 'bg-green-500';
    if (efficiency >= 5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getBacklogSeverity = (days: number) => {
    if (days <= 20) return 'bg-green-100 text-green-700';
    if (days <= 50) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200">
          <CardContent className="p-6 text-center">
            <Users size={24} strokeWidth={1} className="text-gray-400 mx-auto mb-2" />
            <div className="text-2xl font-light text-gray-800">
              {capacityData.reduce((sum, team) => sum + team.capacity, 0)}
            </div>
            <div className="text-sm text-gray-500 font-light">Total Daily Capacity</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6 text-center">
            <Target size={24} strokeWidth={1} className="text-gray-400 mx-auto mb-2" />
            <div className="text-2xl font-light text-[rgb(0,171,174)]">
              {capacityData.reduce((sum, team) => sum + team.needed, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 font-light">Accounts Needed</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6 text-center">
            <TrendingDown size={24} strokeWidth={1} className="text-gray-400 mx-auto mb-2" />
            <div className="text-2xl font-light text-red-600">
              {Math.round(capacityData.reduce((sum, team) => sum + team.backlogDays, 0) / capacityData.length)}
            </div>
            <div className="text-sm text-gray-500 font-light">Avg Backlog Days</div>
          </CardContent>
        </Card>
      </div>

      {/* Capacity vs Demand Chart */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800">
            Current Capacity vs Demand Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                fontSize={11}
                stroke="#666"
              />
              <YAxis fontSize={11} stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => [
                  value.toLocaleString(), 
                  name === 'capacity' ? 'Daily Capacity' : 
                  name === 'needed' ? 'Accounts Needed' : 'Capacity Gap'
                ]}
              />
              <Bar dataKey="capacity" fill="#00abae" radius={[2, 2, 0, 0]} />
              <Bar dataKey="needed" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Team Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {capacityData.map((team, index) => (
          <Card key={index} className={`border-gray-200 ${team.bgColor}`}>
            <CardHeader>
              <CardTitle className={`text-lg font-light ${team.textColor}`}>
                {team.team}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Daily Capacity:</span>
                  <div className="font-medium text-gray-900">
                    {team.capacity} accounts
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Accounts Needed:</span>
                  <div className="font-medium text-gray-900">
                    {team.needed.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Capacity Utilization:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {team.efficiency.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ease-out ${getEfficiencyColor(team.efficiency)}`}
                    style={{ 
                      width: `${Math.min(team.efficiency, 100)}%`,
                      animationDelay: `${index * 300}ms`
                    }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Processing Backlog:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBacklogSeverity(team.backlogDays)}`}>
                    {team.backlogDays} days
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs text-gray-600 mb-2">Capacity Gap:</div>
                <div className="font-medium text-gray-900">
                  {(team.needed - team.capacity).toLocaleString()} accounts
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Need {Math.ceil((team.needed - team.capacity) / team.capacity)} more agents
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Critical Insights */}
      <Card className="border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
            <AlertTriangle size={20} strokeWidth={1.5} />
            <span>Critical Capacity Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white rounded-lg border border-red-200">
              <h4 className="font-medium text-red-800 mb-2">🚨 Critical Shortage</h4>
              <p className="text-sm text-red-700">
                Initial Contact Team has 105-day backlog - immediate hiring needed to prevent bottleneck
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-800 mb-2">⚡ Moderate Pressure</h4>
              <p className="text-sm text-orange-700">
                Legal and Negotiation teams at 17-18 day backlogs - monitor closely and consider cross-training
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">📈 Recommended Actions</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Hire 8-10 initial contact agents</li>
                <li>• Cross-train existing staff</li>
                <li>• Implement overtime rotations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}