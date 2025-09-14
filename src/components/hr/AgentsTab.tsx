import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Badge as BadgeIcon, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface Agent {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  specialization: string;
  hire_date: string;
  status: string;
  experience_level: string;
  max_daily_capacity: number;
}

export function AgentsTab() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-red-100 text-red-700';
      case 'training': return 'bg-orange-100 text-orange-700';
      case 'leave': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-700';
      case 'senior': return 'bg-blue-100 text-blue-700';
      case 'mid': return 'bg-green-100 text-green-700';
      case 'junior': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(0,171,174)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <User size={18} strokeWidth={1.5} className="text-gray-600" />
                <span className="font-medium text-gray-900">
                  {agent.first_name} {agent.last_name}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge className={getStatusColor(agent.status)}>
                  {agent.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Experience:</span>
                <Badge className={getExperienceColor(agent.experience_level)}>
                  {agent.experience_level}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <BadgeIcon size={14} className="text-gray-400" />
                  <span className="text-gray-600">ID: {agent.employee_id}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-gray-600">{agent.email}</span>
                </div>
                
                {agent.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-gray-600">{agent.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-gray-600">
                    Hired: {new Date(agent.hire_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Specialization:</div>
                <div className="font-medium text-gray-900">{agent.specialization || 'General'}</div>
                
                <div className="text-sm text-gray-600 mt-2 mb-1">Daily Capacity:</div>
                <div className="font-medium text-gray-900">{agent.max_daily_capacity} accounts</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}