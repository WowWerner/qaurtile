import { useState, useEffect } from 'react';
import { Download, Eye, AlertTriangle, CheckCircle, RefreshCw, Wand2, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { IntelligentCsvAnalyzer } from '../utils/intelligentCsvAnalyzer';
import { AdaptiveScoring } from '../utils/adaptiveScoring';

interface CsvMappingInterfaceProps {
  csvContent: string;
  fileName: string;
  onMappingComplete: (mapping: Record<string, string>, processedData: any[]) => void;
  onCancel: () => void;
}

interface PreviewRecord {
  originalData: Record<string, string>;
  mappedData: Record<string, string>;
  score?: number;
  scoreBreakdown?: any;
}

export function CsvMappingInterface({ csvContent, fileName, onMappingComplete, onCancel }: CsvMappingInterfaceProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<PreviewRecord[]>([]);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    analyzeCsv();
  }, [csvContent]);

  const analyzeCsv = async () => {
    try {
      setProcessing(true);
      console.log('🚀 Starting intelligent CSV analysis...');
      
      const analysisResult = IntelligentCsvAnalyzer.analyzeCsvStructure(csvContent);
      setAnalysis(analysisResult);
      setMapping(analysisResult.suggestedMappings);
      
      // Generate preview data
      generatePreview(analysisResult.suggestedMappings);
      
      console.log('✅ Analysis complete:', analysisResult);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const generatePreview = (currentMapping: Record<string, string>) => {
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    const headers = IntelligentCsvAnalyzer.parseCSVLine(lines[0]);
    
    const preview: PreviewRecord[] = [];
    const sampleSize = Math.min(10, lines.length - 1);
    
    for (let i = 1; i <= sampleSize; i++) {
      if (lines[i]) {
        const values = IntelligentCsvAnalyzer.parseCSVLine(lines[i]);
        const originalData: Record<string, string> = {};
        const mappedData: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          originalData[header] = values[index] || '';
          
          if (currentMapping[header]) {
            mappedData[currentMapping[header]] = values[index] || '';
          }
        });

        // Calculate adaptive score for this record
        try {
          const scoringResult = AdaptiveScoring.calculateAdaptiveScore(
            originalData, 
            currentMapping, 
            analysis?.dataQuality?.validRows || 85
          );
          
          preview.push({
            originalData,
            mappedData,
            score: scoringResult.totalScore,
            scoreBreakdown: scoringResult.breakdown
          });
        } catch (scoringError) {
          console.warn('Scoring failed for preview record:', scoringError);
          preview.push({
            originalData,
            mappedData
          });
        }
      }
    }
    
    setPreviewData(preview);
    
    // Validate current mapping
    const validation = IntelligentCsvAnalyzer.validateMapping(currentMapping, preview.map(p => p.originalData));
    setValidationResult(validation);
  };

  const updateMapping = (originalColumn: string, targetField: string) => {
    const newMapping = { ...mapping };
    
    // Remove any existing mapping to this target field
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === targetField) {
        delete newMapping[key];
      }
    });
    
    if (targetField === 'unmapped') {
      delete newMapping[originalColumn];
    } else {
      newMapping[originalColumn] = targetField;
    }
    
    setMapping(newMapping);
    generatePreview(newMapping);
  };

  const handleAutoRemap = () => {
    if (!analysis) return;
    
    setProcessing(true);
    setTimeout(() => {
      const newAnalysis = IntelligentCsvAnalyzer.analyzeCsvStructure(csvContent);
      setMapping(newAnalysis.suggestedMappings);
      generatePreview(newAnalysis.suggestedMappings);
      setProcessing(false);
    }, 1000);
  };

  const handleComplete = () => {
    if (!validationResult?.isValid) return;
    
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    const headers = IntelligentCsvAnalyzer.parseCSVLine(lines[0]);
    
    const processedData = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]) {
        const values = IntelligentCsvAnalyzer.parseCSVLine(lines[i]);
        const record: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          if (mapping[header]) {
            record[mapping[header]] = values[index] || '';
          }
        });
        
        processedData.push(record);
      }
    }
    
    onMappingComplete(mapping, processedData);
  };

  const getFieldOptions = () => {
    const standardFields = [
      { value: 'debtorId', label: 'Debtor ID', required: false },
      { value: 'debtorFirstname', label: 'First Name', required: true },
      { value: 'debtorSurname', label: 'Surname', required: true },
      { value: 'cellPhone1', label: 'Cell Phone', required: false },
      { value: 'homePhone1', label: 'Home Phone', required: false },
      { value: 'email1', label: 'Email', required: false },
      { value: 'streetAddressLine1', label: 'Street Address', required: false },
      { value: 'postalCode', label: 'Postal Code', required: false },
      { value: 'amount', label: 'Debt Amount', required: true },
      { value: 'lastPaymentDate', label: 'Last Payment Date', required: false },
      { value: 'lastPaymentAmount', label: 'Last Payment Amount', required: false },
      { value: 'occupation', label: 'Occupation', required: false },
      { value: 'legalStatus', label: 'Legal Status', required: false },
      { value: 'unmapped', label: '-- Not Used --', required: false }
    ];

    return standardFields;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'phone': return '📞';
      case 'email': return '📧';
      case 'currency': return '💰';
      case 'date': return '📅';
      case 'number': return '#️⃣';
      default: return '📝';
    }
  };

  if (processing) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[rgb(0,171,174)] mx-auto mb-4"></div>
          <p className="text-gray-600 font-light">Analyzing CSV structure...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center p-12">
        <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
        <p className="text-red-600">Failed to analyze CSV structure</p>
        <Button onClick={onCancel} variant="outline" className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with confidence indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-gray-800">Smart CSV Analysis</h2>
          <p className="text-sm text-gray-500 mt-1">File: {fileName}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <Badge className={getConfidenceColor(analysis.confidence)}>
              {analysis.confidence.toFixed(1)}% Confidence
            </Badge>
            <div className="text-xs text-gray-500 mt-1">
              {analysis.requiredFieldsCovered.toFixed(0)}% required fields covered
            </div>
          </div>
          <Button
            onClick={handleAutoRemap}
            disabled={processing}
            variant="outline"
            size="sm"
          >
            <Wand2 size={16} className="mr-2" />
            Auto-Remap
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle size={18} />
              <span>Analysis Warnings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {analysis.warnings.map((warning: string, index: number) => (
                <li key={index} className="text-sm text-orange-700">{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Data Quality Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-light text-gray-800">{analysis.columns.length}</div>
            <div className="text-sm text-gray-600">Columns Detected</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-light text-blue-600">{analysis.dataQuality.validRows}</div>
            <div className="text-sm text-gray-600">Valid Rows</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-light text-orange-600">{analysis.dataQuality.missingDataPercentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Missing Data</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-light text-green-600">{Object.keys(mapping).length}</div>
            <div className="text-sm text-gray-600">Fields Mapped</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">Column Analysis</TabsTrigger>
          <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
          <TabsTrigger value="preview">Data Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Intelligent Column Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Column Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Data Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Confidence</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Sample Values</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Suggested Mapping</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.columns.map((column: any, index: number) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {column.originalName}
                          {column.isRequired && (
                            <Badge className="ml-2 bg-red-100 text-red-700">Required</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span>{getDataTypeIcon(column.dataType)}</span>
                            <span className="text-sm text-gray-600">{column.dataType}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getConfidenceColor(column.confidence * 100)}>
                            {(column.confidence * 100).toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-48 truncate">
                          {column.sampleValues.slice(0, 3).join(', ')}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {column.mappedField ? (
                            <Badge className="bg-green-100 text-green-700">
                              {column.mappedField}
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600">
                              Unmapped
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Field Mapping Configuration</span>
                <div className="text-sm text-gray-600">
                  {Object.keys(mapping).length} of {analysis.columns.length} columns mapped
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.columns.map((column: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{column.originalName}</span>
                        <span>{getDataTypeIcon(column.dataType)}</span>
                        {column.confidence > 0 && (
                          <Badge className={getConfidenceColor(column.confidence * 100)}>
                            {(column.confidence * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Sample: {column.sampleValues.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    <div className="w-64">
                      <Select
                        value={mapping[column.originalName] || 'unmapped'}
                        onValueChange={(value) => updateMapping(column.originalName, value)}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getFieldOptions().map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center justify-between w-full">
                                <span>{option.label}</span>
                                {option.required && (
                                  <Badge className="ml-2 bg-red-100 text-red-700 text-xs">Required</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
                <span>Data Preview & Scoring</span>
                <div className="text-sm text-gray-600">
                  Sample of {previewData.length} records
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {previewData.map((record, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        Record {index + 1}
                        {record.mappedData.debtorFirstname && record.mappedData.debtorSurname && (
                          <span className="text-gray-600 font-normal ml-2">
                            - {record.mappedData.debtorFirstname} {record.mappedData.debtorSurname}
                          </span>
                        )}
                      </h4>
                      {record.score !== undefined && (
                        <Badge className={`${
                          record.score >= 70 ? 'bg-green-100 text-green-700' :
                          record.score >= 40 ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          Score: {record.score}/100
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Mapped Data:</h5>
                        <div className="space-y-1 text-sm">
                          {Object.entries(record.mappedData).map(([field, value]) => (
                            <div key={field} className="flex justify-between">
                              <span className="text-gray-600">{field}:</span>
                              <span className="text-gray-900 font-medium">{value || 'N/A'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {record.scoreBreakdown && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Score Breakdown:</h5>
                          <div className="space-y-1 text-xs">
                            {Object.entries(record.scoreBreakdown).map(([category, data]: [string, any]) => (
                              <div key={category} className="flex justify-between">
                                <span className="text-gray-600 capitalize">
                                  {category.replace(/([A-Z])/g, ' $1')}:
                                </span>
                                <span className="text-gray-900 font-medium">
                                  {data.score.toFixed(1)}/{data.max}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Validation Status */}
      {validationResult && (
        <Card className={`border-gray-200 ${
          validationResult.isValid ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <CardHeader>
            <CardTitle className={`text-lg font-light flex items-center space-x-2 ${
              validationResult.isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {validationResult.isValid ? (
                <CheckCircle size={18} />
              ) : (
                <AlertTriangle size={18} />
              )}
              <span>Mapping Validation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validationResult.errors.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                <ul className="space-y-1">
                  {validationResult.errors.map((error: string, index: number) => (
                    <li key={index} className="text-sm text-red-700">❌ {error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {validationResult.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium text-orange-800 mb-2">Suggestions:</h4>
                <ul className="space-y-1">
                  {validationResult.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="text-sm text-orange-700">💡 {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {validationResult.isValid && (
              <div className="text-green-700 font-medium">
                ✅ Mapping is valid and ready for processing
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <Button
          onClick={onCancel}
          variant="outline"
        >
          Cancel
        </Button>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setActiveTab('preview')}
            variant="outline"
            disabled={Object.keys(mapping).length === 0}
          >
            <Eye size={16} className="mr-2" />
            Preview Data
          </Button>
          
          <Button
            onClick={handleComplete}
            disabled={!validationResult?.isValid || processing}
            className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
          >
            <Upload size={16} className="mr-2" />
            Process CSV ({analysis.dataQuality.validRows} records)
          </Button>
        </div>
      </div>
    </div>
  );
}