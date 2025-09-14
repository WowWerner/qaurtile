import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function WorkloadTab() {
  return (
    <div className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
            <Clock size={20} strokeWidth={1.5} />
            <span>Workload Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertTriangle size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Workload Data Coming Soon
            </h3>
            <p className="text-sm text-gray-500">
              Workload analysis will be implemented when data is provided
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}