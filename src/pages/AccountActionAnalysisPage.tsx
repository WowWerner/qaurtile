import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Target, TrendingUp, Phone, Building, Scale, UserCheck, Award, AlertTriangle, Clock, BarChart3, Download, Settings, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export function AccountActionAnalysisPage() {
  const navigate = useNavigate();

  // Real agent performance data
  const agentData = {
    legalSpecialists: [
      { name: 'Keanan Namuyamba', rate: 17.46, experience: 'Expert', specialization: 'Legal/Government', capacity: 35, recommendation: 'Route all government debt cases here first' },
      { name: 'Roselene Benjamin', rate: 15.50, experience: 'Expert', specialization: 'Legal/Government', capacity: 32, recommendation: 'Route complex legal cases and appeals' }
    ],
    negotiationSpecialists: [
      { name: 'Mo-nique Thobias', rate: 10.91, calls: 9784, specialization: 'Negotiation', capacity: 45, recommendation: 'Route high-value negotiation cases' },
      { name: 'Paulina Oxurus', rate: 10.80, calls: 8178, specialization: 'Negotiation', capacity: 40, recommendation: 'Route payment arrangement requests' },
      { name: 'Leena Alugodhi', rate: 9.81, calls: 6932, specialization: 'Negotiation', capacity: 35, recommendation: 'Route standard settlement discussions' }
    ],
    initialContactSpecialists: [
      { name: 'Michael Jantjies', actions: 111265, accounts: 22373, specialization: 'Initial Contact', capacity: 60, recommendation: 'Route all high-volume initial contact work' },
      { name: 'Tommy Shipanga', actions: 52641, accounts: 21027, specialization: 'Initial Contact', capacity: 45, recommendation: 'Route data management and account setup' }
    ],
    commercialSpecialists: [
      { name: 'Werner Thaniseb', rate: 9.74, specialization: 'Commercial', capacity: 25, recommendation: 'Route all business debt collections' },
      { name: 'Kleopas Malima', rate: 6.09, specialization: 'Commercial', capacity: 20, recommendation: 'Route standard commercial accounts' }
    ],
    underperformers: [
      { name: 'Maxwell Kharisoab', rate: 2.13, issue: 'needs negotiation training', mentor: 'Mo-nique Thobias' },
      { name: 'Naomi Daniel', rate: 0.46, issue: 'needs comprehensive training', mentor: 'Keanan Namuyamba' },
      { name: 'Lasarus Jakobous', rate: 1.50, issue: 'needs phone skills training', mentor: 'Mo-nique Thobias' }
    ]
  };

  // Workload analysis data
  const workloadData = {
    legal: { capacity: 67, needed: 1163, backlog: 17 },
    negotiation: { capacity: 120, needed: 2139, backlog: 18 },
    initialContact: { capacity: 105, needed: 11034, backlog: 105 }
  };

  // Calculate team metrics
  const totalAgents = Object.values(agentData).flat().filter(agent => 'rate' in agent || 'actions' in agent).length;
  const avgSettlementRate = [
    ...agentData.legalSpecialists,
    ...agentData.negotiationSpecialists,
    ...agentData.commercialSpecialists
  ].reduce((sum, agent) => sum + agent.rate, 0) / (agentData.legalSpecialists.length + agentData.negotiationSpecialists.length + agentData.commercialSpecialists.length);

  const topPerformer = agentData.legalSpecialists[0];
  const totalCapacity = Object.values(workloadData).reduce((sum, team) => sum + team.capacity, 0);

  // Chart data preparations
  const performanceChartData = [
    ...agentData.legalSpecialists.map(agent => ({ name: agent.name.split(' ')[0], rate: agent.rate, category: 'Legal' })),
    ...agentData.negotiationSpecialists.map(agent => ({ name: agent.name.split(' ')[0], rate: agent.rate, category: 'Negotiation' })),
    ...agentData.commercialSpecialists.map(agent => ({ name: agent.name.split(' ')[0], rate: agent.rate, category: 'Commercial' }))
  ];

  const capacityData = [
    { name: 'Legal Team', capacity: workloadData.legal.capacity, needed: workloadData.legal.needed, backlog: workloadData.legal.backlog },
    { name: 'Negotiation Team', capacity: workloadData.negotiation.capacity, needed: workloadData.negotiation.needed, backlog: workloadData.negotiation.backlog },
    { name: 'Initial Contact Team', capacity: workloadData.initialContact.capacity, needed: workloadData.initialContact.needed, backlog: workloadData.initialContact.backlog }
  ];

  const specializationDistribution = [
    { name: 'Legal/Government', value: agentData.legalSpecialists.length, color: '#ef4444' },
    { name: 'Negotiation', value: agentData.negotiationSpecialists.length, color: '#3b82f6' },
    { name: 'Initial Contact', value: agentData.initialContactSpecialists.length, color: '#10b981' },
    { name: 'Commercial', value: agentData.commercialSpecialists.length, color: '#f59e0b' }
  ];

  const handleExportWorkforceData = () => {
    const allAgents = [
      ...agentData.legalSpecialists,
      ...agentData.negotiationSpecialists, 
      ...agentData.commercialSpecialists
    ];
    
    const csvContent = [
      'Agent Name,Settlement Rate,Specialization,Experience,Daily Capacity,Recommendation',
      ...allAgents.map(agent => 
        `"${agent.name}","${agent.rate}%","${agent.specialization}","${agent.experience || 'Standard'}","${agent.capacity}","${agent.recommendation}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'workforce-planning-analysis.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 15) return 'text-green-600 bg-green-100';
    if (rate >= 10) return 'text-blue-600 bg-blue-100';
    if (rate >= 5) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getBacklogSeverity = (days: number) => {
    if (days <= 20) return 'bg-green-100 text-green-700';
    if (days <= 50) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

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
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              Workforce Planning Advisor
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Skill-based routing analysis and performance optimization
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleExportWorkforceData}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Download size={16} strokeWidth={1.5} />
          <span>Export Analysis</span>
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Users size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Active Agents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {totalAgents}
            </div>
            <p className="text-xs text-gray-500 mt-1">Across all specializations</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Award size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Top Performer</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-light text-green-600">
              {topPerformer.name}
            </div>
            <p className="text-xs text-gray-500 mt-1">{topPerformer.rate}% settlement rate</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Target size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Avg Settlement Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-[rgb(0,171,174)]">
              {avgSettlementRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Team average</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Clock size={18} strokeWidth={1.5} />
              <span className="font-light text-sm">Daily Capacity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">
              {totalCapacity}
            </div>
            <p className="text-xs text-gray-500 mt-1">Accounts per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Agent Performance by Specialization */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Settlement Rate by Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  fontSize={11}
                  stroke="#666"
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis fontSize={11} stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, name: string) => [`${value}%`, 'Settlement Rate']}
                />
                <Bar 
                  dataKey="rate" 
                  fill="#00abae" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Specialization Distribution */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Team Specialization Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={specializationDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {specializationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
          <TabsTrigger value="specializations">Specializations</TabsTrigger>
          <TabsTrigger value="routing">Smart Routing</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Elite Performance Team */}
          <Card className="border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-lg font-light text-green-800 flex items-center space-x-2">
                <Award size={20} strokeWidth={1.5} />
                <span>Elite Legal Team - Highest Settlement Rates</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agentData.legalSpecialists.map((agent, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border border-green-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-green-900">{agent.name}</h4>
                      <Badge className="bg-green-100 text-green-700">
                        {agent.rate}% Success
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Experience:</span>
                        <span className="font-medium text-gray-800">{agent.experience}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Daily Capacity:</span>
                        <span className="font-medium text-gray-800">{agent.capacity} accounts</span>
                      </div>
                      <div className="text-green-700 text-xs mt-2 font-medium">
                        {agent.recommendation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Master Negotiation Team */}
          <Card className="border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="text-lg font-light text-blue-800 flex items-center space-x-2">
                <Target size={20} strokeWidth={1.5} />
                <span>Master Negotiation Team - Highest ROI</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {agentData.negotiationSpecialists.map((agent, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-blue-900">{agent.name}</h4>
                      <Badge className="bg-blue-100 text-blue-700">
                        {agent.rate}%
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-600">{agent.calls?.toLocaleString()} calls</div>
                      <div className="text-gray-600">{agent.capacity} daily capacity</div>
                      <div className="text-blue-700 text-xs mt-2 font-medium">
                        {agent.recommendation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Volume Processing Team */}
          <Card className="border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
            <CardHeader>
              <CardTitle className="text-lg font-light text-purple-800 flex items-center space-x-2">
                <TrendingUp size={20} strokeWidth={1.5} />
                <span>Volume Processing Team - Highest Throughput</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agentData.initialContactSpecialists.map((agent, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border border-purple-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-purple-900">{agent.name}</h4>
                      <Badge className="bg-purple-100 text-purple-700">
                        Volume Leader
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Actions:</span>
                        <span className="font-medium text-gray-800">{agent.actions?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Accounts Worked:</span>
                        <span className="font-medium text-gray-800">{agent.accounts?.toLocaleString()}</span>
                      </div>
                      <div className="text-purple-700 text-xs mt-2 font-medium">
                        {agent.recommendation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specializations" className="space-y-6">
          {/* Legal/Government Specialists */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                <Scale size={20} strokeWidth={1.5} className="text-red-500" />
                <span>Legal/Government Debt Specialists</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentData.legalSpecialists.map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{agent.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>{agent.experience} level</span>
                        <span>{agent.capacity} daily capacity</span>
                      </div>
                      <div className="text-red-700 text-xs mt-2 bg-red-100 px-2 py-1 rounded">
                        {agent.recommendation}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-medium text-red-600">
                        {agent.rate}%
                      </div>
                      <div className="text-sm text-gray-500">Settlement Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Negotiation Specialists */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                <Phone size={20} strokeWidth={1.5} className="text-blue-500" />
                <span>Negotiation Specialists</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentData.negotiationSpecialists.map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{agent.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>{agent.calls?.toLocaleString()} calls</span>
                        <span>{agent.capacity} daily capacity</span>
                      </div>
                      <div className="text-blue-700 text-xs mt-2 bg-blue-100 px-2 py-1 rounded">
                        {agent.recommendation}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-medium text-blue-600">
                        {agent.rate}%
                      </div>
                      <div className="text-sm text-gray-500">Settlement Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Commercial Collections */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                <Building size={20} strokeWidth={1.5} className="text-orange-500" />
                <span>Commercial Collections Specialists</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentData.commercialSpecialists.map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{agent.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>{agent.capacity} daily capacity</span>
                      </div>
                      <div className="text-orange-700 text-xs mt-2 bg-orange-100 px-2 py-1 rounded">
                        {agent.recommendation}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-medium text-orange-600">
                        {agent.rate}%
                      </div>
                      <div className="text-sm text-gray-500">Settlement Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routing" className="space-y-6">
          {/* Routing Matrix */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Skill-Based Routing Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'GOVERNMENT DEBT', primary: 'Keanan Namuyamba (17.46%)', secondary: 'Roselene Benjamin (15.50%)', color: 'red' },
                  { type: 'PAYMENT NEGOTIATIONS', primary: 'Mo-nique Thobias (10.91%)', secondary: 'Paulina Oxurus (10.80%)', color: 'blue' },
                  { type: 'INITIAL CONTACT', primary: 'Michael Jantjies (22K accounts)', secondary: 'Tommy Shipanga (21K accounts)', color: 'green' },
                  { type: 'COMMERCIAL DEBT', primary: 'Werner Thaniseb (9.74%)', secondary: 'Kleopas Malima (6.09%)', color: 'orange' }
                ].map((route, index) => (
                  <div key={index} className={`p-4 bg-${route.color}-50 rounded-lg border border-${route.color}-200`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Badge className={`bg-${route.color}-100 text-${route.color}-700 font-medium`}>
                          {route.type}
                        </Badge>
                        <ArrowRight size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-800">{route.primary}</span>
                        <ArrowRight size={16} className="text-gray-400" />
                        <span className="text-gray-600">{route.secondary}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Priority Assignment */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Priority-Based Assignment Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-3 flex items-center space-x-2">
                    <AlertTriangle size={16} />
                    <span>URGENT Priority</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>1. Keanan Namuyamba</span>
                      <span className="font-medium">17.46%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2. Roselene Benjamin</span>
                      <span className="font-medium">15.50%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>3. Mo-nique Thobias</span>
                      <span className="font-medium">10.91%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-800 mb-3 flex items-center space-x-2">
                    <Target size={16} />
                    <span>HIGH Priority</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>1. Paulina Oxurus</span>
                      <span className="font-medium">10.80%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2. Leena Alugodhi</span>
                      <span className="font-medium">9.81%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>3. Werner Thaniseb</span>
                      <span className="font-medium">9.74%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-3 flex items-center space-x-2">
                    <UserCheck size={16} />
                    <span>NORMAL Priority</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="text-green-700">Initial Contact Team:</div>
                    <div>• Michael Jantjies</div>
                    <div>• Tommy Shipanga</div>
                    <div className="text-green-700 mt-2">General Collections:</div>
                    <div>• Jamely Van Wyk</div>
                    <div>• Ewald Aebeb</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          {/* Workload Analysis */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Current Capacity vs Demand Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={capacityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={11} stroke="#666" />
                  <YAxis fontSize={11} stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="capacity" fill="#00abae" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="needed" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Skills Gap Analysis */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Skills Gap Analysis & Training Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-3">Underperforming Agents - Immediate Training Required</h4>
                  <div className="space-y-3">
                    {agentData.underperformers.map((agent, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded border border-red-100">
                        <div>
                          <h5 className="font-medium text-gray-900">{agent.name}</h5>
                          <p className="text-sm text-red-600">{agent.issue}</p>
                          <p className="text-xs text-gray-600 mt-1">Recommended mentor: {agent.mentor}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-medium text-red-600">{agent.rate}%</div>
                          <div className="text-xs text-gray-500">Settlement Rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3">📈 Immediate Actions Required</h4>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li>• Cross-train 3-5 agents in negotiation skills</li>
                      <li>• Promote Keanan Namuyamba to Legal Team Supervisor</li>
                      <li>• Implement mentorship: Mo-nique → Maxwell</li>
                      <li>• Legal training: Keanan → Naomi Daniel</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3">⚡ Capacity Solutions</h4>
                    <ul className="space-y-2 text-sm text-green-700">
                      <li>• Legal Team: 17 days backlog → Need 2 more agents</li>
                      <li>• Negotiation Team: 18 days backlog → Need 3 more agents</li>
                      <li>• Initial Contact: 105 days backlog → Critical staffing need</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Restructuring */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Recommended Team Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-4">1. Master Negotiation Team</h4>
                  <div className="text-xs text-blue-600 mb-3 font-medium">HIGHEST ROI</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Leader:</span>
                      <span className="font-medium">Mo-nique Thobias</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-medium text-blue-600">10.91%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Members:</span>
                      <span className="font-medium">Paulina (10.80%), Leena (9.81%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Capacity:</span>
                      <span className="font-medium">120 accounts</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="text-xs text-blue-700 font-medium mb-1">Focus Areas:</div>
                      <ul className="text-xs text-blue-600 space-y-1">
                        <li>• High-value accounts</li>
                        <li>• Payment arrangements</li>
                        <li>• Settlements</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-4">2. Elite Legal Team</h4>
                  <div className="text-xs text-red-600 mb-3 font-medium">HIGHEST SETTLEMENT RATE</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Leader:</span>
                      <span className="font-medium">Keanan Namuyamba</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-medium text-red-600">17.46%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Members:</span>
                      <span className="font-medium">Roselene Benjamin (15.50%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Capacity:</span>
                      <span className="font-medium">67 accounts</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <div className="text-xs text-red-700 font-medium mb-1">Focus Areas:</div>
                      <ul className="text-xs text-red-600 space-y-1">
                        <li>• Government debt</li>
                        <li>• Legal collections</li>
                        <li>• Complex cases</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-4">3. Volume Processing Team</h4>
                  <div className="text-xs text-green-600 mb-3 font-medium">HIGHEST THROUGHPUT</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Leader:</span>
                      <span className="font-medium">Michael Jantjies</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Actions:</span>
                      <span className="font-medium text-green-600">111K actions</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Members:</span>
                      <span className="font-medium">Tommy Shipanga (52K actions)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Capacity:</span>
                      <span className="font-medium">105 accounts</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="text-xs text-green-700 font-medium mb-1">Focus Areas:</div>
                      <ul className="text-xs text-green-600 space-y-1">
                        <li>• Initial contact</li>
                        <li>• Data management</li>
                        <li>• Account setup</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backlog Analysis */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Current Backlog Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(workloadData).map(([team, data], index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 capitalize">{team.replace(/([A-Z])/g, ' $1')} Team</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>{data.capacity} daily capacity</span>
                        <span>{data.needed.toLocaleString()} accounts needed</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${getBacklogSeverity(data.backlog)}`}>
                        {data.backlog} days
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">Backlog</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}