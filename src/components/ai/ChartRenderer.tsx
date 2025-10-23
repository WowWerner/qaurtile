import { BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Download, Lightbulb, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AIChartConfiguration } from '../../services/aiChartService';

interface ChartRendererProps {
  config: AIChartConfiguration | {
    type: string;
    data: any[];
    labelKey: string;
    valueKeys: string[];
    colors?: string[];
    metadata?: {
      title?: string;
      description?: string;
      insights?: string[];
      recommendation?: string;
    };
    colorScheme?: {
      palette: string[];
    };
    showLegend?: boolean;
    showGrid?: boolean;
  };
  onExport?: () => void;
}

export function ChartRenderer({ config, onExport }: ChartRendererProps) {
  const { type, labelKey, valueKeys } = config;
  const data = 'data' in config ? config.data : [];
  const colors = config.colorScheme?.palette || ('colors' in config ? config.colors : undefined) || ['#00ABAE', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
  const metadata = config.metadata;
  const showLegend = config.showLegend !== false;
  const showGrid = config.showGrid !== false;
  const confidence = 'confidence' in config ? config.confidence : undefined;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
              <XAxis dataKey={labelKey} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }} />
              {showLegend && <Legend />}
              {valueKeys.map((key, idx) => (
                <Bar key={key} dataKey={key} fill={colors[idx % colors.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
              <XAxis dataKey={labelKey} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }} />
              {showLegend && <Legend />}
              {valueKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                dataKey={valueKeys[0]}
                nameKey={labelKey}
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry) => `${entry[labelKey]}: ${entry[valueKeys[0]]}`}
              >
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
              <XAxis dataKey={valueKeys[0]} fontSize={12} name={valueKeys[0]} />
              <YAxis dataKey={valueKeys[1]} fontSize={12} name={valueKeys[1]} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }} cursor={{ strokeDasharray: '3 3' }} />
              {showLegend && <Legend />}
              <Scatter name="Data Points" data={data} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
              <XAxis dataKey={labelKey} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }} />
              {showLegend && <Legend />}
              {valueKeys.map((key, idx) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[idx % colors.length]}
                  fill={colors[idx % colors.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return <div className="text-center text-gray-500 py-8">Unsupported chart type</div>;
    }
  };

  return (
    <Card className="border-gray-200 mt-4 mb-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {metadata?.title || 'Data Visualization'}
              </CardTitle>
              {confidence && confidence > 0.8 && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  High Confidence
                </Badge>
              )}
            </div>
            {metadata?.description && (
              <CardDescription className="mt-1">{metadata.description}</CardDescription>
            )}
          </div>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download size={14} className="mr-2" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderChart()}

        {metadata?.insights && metadata.insights.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <Lightbulb size={20} className="text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Key Insights</h4>
                <ul className="space-y-1.5">
                  {metadata.insights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-blue-800 flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {metadata?.recommendation && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-start gap-3">
              <TrendingUp size={20} className="text-green-600 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-green-900 mb-1">Recommendation</h4>
                <p className="text-sm text-green-800">{metadata.recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
