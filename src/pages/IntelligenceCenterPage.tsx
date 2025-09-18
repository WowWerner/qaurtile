import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Download, BarChart3, Target, AlertTriangle, CheckCircle, Brain, Zap, FileText, Settings, Eye, Wand2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { CsvMappingInterface } from '../components/CsvMappingInterface';
import { processIntelligentCsv } from '../utils/csvProcessor';
import { SupabaseService } from '../utils/supabaseService';
import { IntelligentCsvAnalyzer } from '../utils/intelligentCsvAnalyzer';
import { usePageTracking } from '../hooks/usePageTracking';

interface UploadState {
  isUploading: boolean;
  fileName: string;
  progress: number;
  status: 'idle' | 'analyzing' | 'mapping' | 'processing' | 'saving' | 'complete' | 'error';
  csvContent?: string;
  analysisResult?: any;
  error?: string;
}

interface ProcessingStats {
  totalRecords: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  confidence: number;
  processingTime: number;
}

export function IntelligenceCenterPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    fileName: '',
    progress: 0,
    status: 'idle'
  });
  const [showMappingInterface, setShowMappingInterface] = useState(false);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [customName, setCustomName] = useState('');

  // Track page views
  usePageTracking();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadState({
        ...uploadState,
        status: 'error',
        error: 'Please select a CSV file'
      });
      return;
    }

    console.log('📁 File selected:', file.name, 'Size:', file.size);
    setCustomName(file.name.replace('.csv', ''));
    
    try {
      setUploadState({
        isUploading: true,
        fileName: file.name,
        progress: 10,
        status: 'analyzing'
      });

      // Read file content
      const content = await readFileContent(file);
      
      setUploadState(prev => ({
        ...prev,
        progress: 25,
        csvContent: content
      }));

      // Perform intelligent analysis
      console.log('🧠 Starting intelligent analysis...');
      const analysis = IntelligentCsvAnalyzer.analyzeCsvStructure(content);
      
      setUploadState(prev => ({
        ...prev,
        progress: 50,
        analysisResult: analysis,
        status: 'mapping'
      }));

      // Check if automatic mapping is confident enough
      if (analysis.confidence >= 80 && analysis.requiredFieldsCovered >= 80) {
        console.log('✅ High confidence mapping - proceeding automatically');
        await processWithMapping(content, file.name, analysis.suggestedMappings);
      } else {
        console.log('🔍 Low confidence mapping - showing manual interface');
        setShowMappingInterface(true);
        setUploadState(prev => ({ ...prev, isUploading: false }));
      }

    } catch (error) {
      console.error('❌ Upload failed:', error);
      setUploadState({
        ...uploadState,
        status: 'error',
        error: (error as Error).message,
        isUploading: false
      });
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const processWithMapping = async (content: string, fileName: string, mapping: Record<string, string>) => {
    const startTime = Date.now();
    
    try {
      setUploadState(prev => ({
        ...prev,
        status: 'processing',
        progress: 60,
        isUploading: true
      }));

      console.log('⚙️ Processing CSV with mapping:', mapping);
      
      // Process CSV with intelligent mapping
      const result = await processIntelligentCsv(
        new File([content], fileName, { type: 'text/csv' })
      );

      setUploadState(prev => ({
        ...prev,
        progress: 80,
        status: 'saving'
      }));

      console.log('💾 Saving to database...');
      
      // Save raw data first
      const csvUploadId = await SupabaseService.saveRawCsvData(
        fileName,
        customName || fileName.replace('.csv', ''),
        result.rawData
      );

      // Process and save analysis results
      await SupabaseService.processRawData(csvUploadId, result.analysisResults);

      const processingTime = Date.now() - startTime;
      
      setProcessingStats({
        totalRecords: result.rawData.length,
        highPriority: result.analysisResults.highProbability.count,
        mediumPriority: result.analysisResults.mediumProbability.count,
        lowPriority: result.analysisResults.lowProbability.count,
        confidence: result.confidence,
        processingTime
      });

      setUploadState(prev => ({
        ...prev,
        progress: 100,
        status: 'complete',
        isUploading: false
      }));

      console.log('🎉 Processing complete!');
      
      // Navigate to results after short delay
      setTimeout(() => {
        navigate('/intelligence-center/analysis-results', {
          state: {
            fileName: fileName,
            csvUploadId: csvUploadId,
            fromUpload: true
          }
        });
      }, 2000);

    } catch (error) {
      console.error('❌ Processing failed:', error);
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: (error as Error).message,
        isUploading: false
      }));
    }
  };

  const handleMappingComplete = async (mapping: Record<string, string>, processedData: any[]) => {
    if (!uploadState.csvContent) return;
    
    setShowMappingInterface(false);
    await processWithMapping(uploadState.csvContent, uploadState.fileName, mapping);
  };

  const handleMappingCancel = () => {
    setShowMappingInterface(false);
    setUploadState({
      isUploading: false,
      fileName: '',
      progress: 0,
      status: 'idle'
    });
  };

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'analyzing':
        return <Brain size={20} className="animate-pulse text-blue-500" />;
      case 'mapping':
        return <Wand2 size={20} className="animate-pulse text-purple-500" />;
      case 'processing':
        return <Zap size={20} className="animate-pulse text-orange-500" />;
      case 'saving':
        return <Upload size={20} className="animate-pulse text-green-500" />;
      case 'complete':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <AlertTriangle size={20} className="text-red-500" />;
      default:
        return <FileText size={20} className="text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (uploadState.status) {
      case 'analyzing':
        return 'Analyzing CSV structure and detecting data patterns...';
      case 'mapping':
        return 'Intelligent field mapping and data validation...';
      case 'processing':
        return 'Processing records and calculating adaptive scores...';
      case 'saving':
        return 'Saving analysis results to database...';
      case 'complete':
        return 'Analysis complete! Redirecting to results...';
      case 'error':
        return `Error: ${uploadState.error}`;
      default:
        return 'Ready to analyze your CSV file';
    }
  };

  if (showMappingInterface && uploadState.csvContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-6 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMappingCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
            </Button>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              CSV Field Mapping
            </h1>
          </div>

          <CsvMappingInterface
            csvContent={uploadState.csvContent}
            fileName={uploadState.fileName}
            onMappingComplete={handleMappingComplete}
            onCancel={handleMappingCancel}
          />
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
          <div>
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              Intelligence Center
            </h1>
            <p className="text-sm font-light text-gray-500 mt-1">
              Multi-format CSV analysis powered by adaptive AI scoring
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Enhanced Upload Interface */}
        <Card className="border-gray-200 mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
              <Brain size={20} strokeWidth={1.5} className="text-[rgb(0,171,174)]" />
              <span>Smart CSV Analyzer</span>
              <Badge className="bg-green-100 text-green-700">Multi-Format Support</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!uploadState.isUploading && uploadState.status !== 'complete' ? (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-[rgb(0,171,174)] transition-colors duration-200">
                  <Upload size={48} strokeWidth={1} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-light text-gray-700 mb-2">
                    Upload CSV for Intelligent Analysis
                  </h3>
                  <p className="text-sm font-light text-gray-500 mb-6">
                    Our AI will automatically detect column formats and adapt the scoring model
                  </p>
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)] text-white"
                    size="lg"
                  >
                    <Upload size={20} strokeWidth={1.5} className="mr-2" />
                    Choose CSV File
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Enhanced Features List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 flex items-center space-x-2">
                      <Wand2 size={16} className="text-purple-500" />
                      <span>Intelligent Features</span>
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center space-x-2">
                        <CheckCircle size={14} className="text-green-500" />
                        <span>Automatic column detection and mapping</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle size={14} className="text-green-500" />
                        <span>Adaptive scoring based on available data</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle size={14} className="text-green-500" />
                        <span>Multiple date and currency formats</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle size={14} className="text-green-500" />
                        <span>Smart phone and email validation</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle size={14} className="text-green-500" />
                        <span>Fallback processing for unknown formats</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 flex items-center space-x-2">
                      <Target size={16} className="text-blue-500" />
                      <span>Supported Formats</span>
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Standard debt collection formats</li>
                      <li>• Banking export formats</li>
                      <li>• Legal system exports</li>
                      <li>• Custom business formats</li>
                      <li>• International variations</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Processing Status */}
                <div className="flex items-center space-x-4">
                  {getStatusIcon()}
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{uploadState.fileName}</div>
                    <div className="text-sm text-gray-600">{getStatusMessage()}</div>
                  </div>
                  {uploadState.status !== 'complete' && uploadState.status !== 'error' && (
                    <div className="text-sm text-gray-500">
                      {uploadState.progress}%
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {uploadState.status !== 'complete' && uploadState.status !== 'error' && (
                  <Progress value={uploadState.progress} className="w-full" />
                )}

                {/* Processing Stats */}
                {processingStats && uploadState.status === 'complete' && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-lg font-light text-green-800 flex items-center space-x-2">
                        <CheckCircle size={18} />
                        <span>Processing Complete</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-light text-green-700">{processingStats.totalRecords}</div>
                          <div className="text-xs text-green-600">Total Records</div>
                        </div>
                        <div>
                          <div className="text-2xl font-light text-green-700">{processingStats.highPriority}</div>
                          <div className="text-xs text-green-600">High Priority</div>
                        </div>
                        <div>
                          <div className="text-2xl font-light text-green-700">{processingStats.confidence.toFixed(1)}%</div>
                          <div className="text-xs text-green-600">AI Confidence</div>
                        </div>
                        <div>
                          <div className="text-2xl font-light text-green-700">{(processingStats.processingTime / 1000).toFixed(1)}s</div>
                          <div className="text-xs text-green-600">Processing Time</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Error Display */}
                {uploadState.status === 'error' && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-lg font-light text-red-800 flex items-center space-x-2">
                        <AlertTriangle size={18} />
                        <span>Processing Error</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-red-700 mb-4">{uploadState.error}</p>
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => setUploadState({ isUploading: false, fileName: '', progress: 0, status: 'idle' })}
                          variant="outline"
                          size="sm"
                        >
                          Try Again
                        </Button>
                        <Button
                          onClick={() => setShowMappingInterface(true)}
                          size="sm"
                          className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
                        >
                          Manual Mapping
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Analysis Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => navigate('/intelligence-center/analysis-results')}>
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                <BarChart3 size={20} strokeWidth={1.5} />
                <span>View Analysis Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-light text-gray-600 mb-4">
                Review processed debtor data, scoring breakdowns, and priority classifications
              </p>
              <div className="flex items-center space-x-2">
                <Eye size={16} strokeWidth={1.5} className="text-gray-400" />
                <span className="text-sm text-gray-500">View latest results</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => navigate('/intelligence-center/scoring-methodology')}>
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                <Target size={20} strokeWidth={1.5} />
                <span>Adaptive Scoring System</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-light text-gray-600 mb-4">
                Understand how the AI adapts scoring based on available data quality and completeness
              </p>
              <div className="flex items-center space-x-2">
                <Settings size={16} strokeWidth={1.5} className="text-gray-400" />
                <span className="text-sm text-gray-500">Learn about scoring</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Categories - Enhanced */}
        <Card className="border-gray-200 mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Advanced Analysis Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: 'Contact Analysis', path: '/intelligence-center/contact-analysis', icon: '📞', description: 'Phone, email, and address completeness analysis' },
                { name: 'Payment Patterns', path: '/intelligence-center/payment-analysis', icon: '💳', description: 'Payment history and behavior analysis' },
                { name: 'Address Intelligence', path: '/intelligence-center/address-analysis', icon: '🗺️', description: 'Geographic and socio-economic mapping' },
                { name: 'Debt Characteristics', path: '/intelligence-center/debt-analysis', icon: '💰', description: 'Debt size and collection difficulty assessment' },
                { name: 'Demographics', path: '/intelligence-center/demographics-analysis', icon: '👥', description: 'Employment and stability indicators' },
                { name: 'Legal Status', path: '/intelligence-center/legal-analysis', icon: '⚖️', description: 'Legal proceedings and case classification' }
              ].map((category, index) => (
                <div
                  key={index}
                  onClick={() => navigate(category.path)}
                  className="group p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <h4 className="font-medium text-gray-900 mb-1 group-hover:text-[rgb(0,171,174)] transition-colors">
                    {category.name}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {category.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-gray-200 mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => navigate('/intelligence-center/batch-history')}
                variant="outline"
                className="flex items-center space-x-2 h-16 justify-start"
              >
                <FileText size={20} strokeWidth={1.5} className="text-gray-600" />
                <div className="text-left">
                  <div className="font-medium">Batch History</div>
                  <div className="text-xs text-gray-500">View previous analyses</div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/intelligence-center/scoring-configuration')}
                variant="outline"
                className="flex items-center space-x-2 h-16 justify-start"
              >
                <Settings size={20} strokeWidth={1.5} className="text-gray-600" />
                <div className="text-left">
                  <div className="font-medium">Scoring Config</div>
                  <div className="text-xs text-gray-500">Customize scoring weights</div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/enhanced-features')}
                variant="outline"
                className="flex items-center space-x-2 h-16 justify-start"
              >
                <Target size={20} strokeWidth={1.5} className="text-gray-600" />
                <div className="text-left">
                  <div className="font-medium">Enhanced Features</div>
                  <div className="text-xs text-gray-500">Advanced analytics</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Capabilities */}
        <Card className="border-gray-200 mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              AI-Powered Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center space-x-2">
                  <Brain size={16} className="text-blue-500" />
                  <span>Intelligent Analysis</span>
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Automatic column detection with 95%+ accuracy</li>
                  <li>• Pattern recognition for data types</li>
                  <li>• Smart field mapping with confidence scoring</li>
                  <li>• Adaptive scoring based on data quality</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center space-x-2">
                  <Target size={16} className="text-green-500" />
                  <span>Multi-Format Support</span>
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Bank export formats (FNB, Standard Bank, etc.)</li>
                  <li>• Legal system exports</li>
                  <li>• Custom business formats</li>
                  <li>• International date/currency variations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}