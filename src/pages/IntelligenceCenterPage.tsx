import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, ChevronDown, FileText, CheckCircle2, Loader2, Settings, Info } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AnalysisResults } from '../utils/csvProcessor';
import { extractCSVPreview, parseCSVWithMapping } from '../utils/enhancedCsvProcessor';
import { mapHeaders, type FieldMapping } from '../utils/headerMapper';
import { CSVHeaderPreview } from '../components/CSVHeaderPreview';
import { SupabaseService } from '../utils/supabaseService';

type Step = 'choice' | 'upload' | 'mapping' | 'naming' | 'processing' | 'complete';

export function IntelligenceCenterPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [step, setStep] = useState<Step>('choice');
  const [selectedOption, setSelectedOption] = useState<'existing' | 'new' | null>(null);
  const [previousUploads, setPreviousUploads] = useState<any[]>([]);
  const [selectedCsvId, setSelectedCsvId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [csvName, setCsvName] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvSampleRow, setCsvSampleRow] = useState<{ [key: string]: string }>();
  const [headerMappings, setHeaderMappings] = useState<FieldMapping[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const [csvUploadId, setCsvUploadId] = useState<string | null>(null);

  // Load previous uploads on mount
  useEffect(() => {
    loadPreviousUploads();
  }, []);

  const loadPreviousUploads = async () => {
    try {
      const uploads = await SupabaseService.getRecentUploads(50);
      setPreviousUploads(uploads);
    } catch (error) {
      console.error('Error loading previous uploads:', error);
    }
  };

  const handleOptionSelect = (option: 'existing' | 'new') => {
    setSelectedOption(option);
    if (option === 'new') {
      fileInputRef.current?.click();
    }
  };

  const handleExistingCsvSelect = (csvId: string) => {
    setSelectedCsvId(csvId);
    const selected = previousUploads.find(u => u.id === csvId);
    if (selected) {
      // Navigate directly to contact analysis
      navigate('/intelligence-center/contact-analysis', {
        state: { csvUploadId: csvId }
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'text/csv') {
      alert('Please upload a valid CSV file');
      return;
    }

    setUploadedFile(file);
    const defaultName = file.name.replace(/\.[^/.]+$/, '');
    setCsvName(defaultName);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const { headers, sampleRows } = extractCSVPreview(content);
        setCsvHeaders(headers);
        setCsvSampleRow(sampleRows[0]);

        // Auto-detect mappings
        const mappingResult = mapHeaders(headers, sampleRows[0]);
        setHeaderMappings(mappingResult.mappings);

        // Check if mapping is needed
        if (mappingResult.unmappedHeaders.length > 0 || mappingResult.missingRequiredFields.length > 0) {
          setStep('mapping');
        } else {
          setStep('naming');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error reading CSV file:', error);
      alert('Error reading CSV file: ' + (error as Error).message);
      resetFlow();
    }
  };

  const handleMappingComplete = (mappings: FieldMapping[]) => {
    setHeaderMappings(mappings);
    setStep('naming');
  };

  const handleMappingSkip = () => {
    setStep('naming');
  };

  const handleStartProcessing = async () => {
    if (!uploadedFile || !csvName.trim()) {
      alert('Please provide a name for your CSV upload');
      return;
    }

    if (headerMappings.length === 0) {
      alert('Please map at least one field before analyzing');
      return;
    }

    setStep('processing');
    setProcessingProgress(0);

    try {
      // Parse CSV
      setProcessingMessage('Parsing CSV file...');
      setProcessingProgress(25);
      const { rawData, analysisResults } = await parseCSVWithMapping(uploadedFile, headerMappings);

      // Save raw data
      setProcessingMessage('Saving to database...');
      setProcessingProgress(50);
      const uploadId = await SupabaseService.saveRawCsvData(uploadedFile.name, csvName.trim(), rawData);
      setCsvUploadId(uploadId);

      // Process analysis
      setProcessingMessage('Applying intelligence scoring...');
      setProcessingProgress(75);
      await SupabaseService.processRawData(uploadId, analysisResults);

      // Complete
      setProcessingMessage('Analysis complete!');
      setProcessingProgress(100);
      setStep('complete');

      // Auto-navigate to contact analysis after 1.5 seconds
      setTimeout(() => {
        navigate('/intelligence-center/contact-analysis', {
          state: { csvUploadId: uploadId }
        });
      }, 1500);

    } catch (error) {
      console.error('Error processing CSV:', error);
      alert('Error processing CSV file: ' + (error as Error).message);
      resetFlow();
    }
  };

  const resetFlow = () => {
    setStep('choice');
    setSelectedOption(null);
    setSelectedCsvId(null);
    setUploadedFile(null);
    setCsvName('');
    setCsvHeaders([]);
    setCsvSampleRow(undefined);
    setHeaderMappings([]);
    setProcessingProgress(0);
    setProcessingMessage('');
    setCsvUploadId(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-50 rounded-full"
              >
                <ArrowLeft size={18} strokeWidth={1} className="text-gray-500" />
              </Button>
              <div>
                <img
                  src="https://qaurtile.com/wp-content/uploads/2021/12/qaurtile-logo.png"
                  alt="Quartile Logo"
                  className="h-8 w-auto mb-2 object-contain"
                />
                <h1 className="text-xl font-light text-gray-900 tracking-wide">
                  Intelligence Center
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={() => navigate('/intelligence-center/scoring-methodology')}
                variant="ghost"
                size="sm"
                className="text-gray-600 font-light"
              >
                <Info size={14} strokeWidth={1} className="mr-2" />
                Scoring Guide
              </Button>
              <Button
                onClick={() => navigate('/intelligence-center/scoring-configuration')}
                variant="ghost"
                size="sm"
                className="text-gray-600 font-light"
              >
                <Settings size={14} strokeWidth={1} className="mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">

        {/* Step 1: Choice */}
        {step === 'choice' && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-light text-gray-900 mb-2">Get Started</h2>
              <p className="text-sm font-light text-gray-500">Choose how you'd like to begin</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Option 1: Existing Files */}
              <button
                onClick={() => handleOptionSelect('existing')}
                className="group relative bg-white border border-gray-200 rounded-2xl p-8 text-left transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
              >
                <div className="mb-4">
                  <FileText size={24} strokeWidth={1} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <h3 className="text-lg font-light text-gray-900 mb-2">Previously Uploaded Files</h3>
                <p className="text-sm font-light text-gray-500">Work with existing CSV data</p>
                <div className="absolute top-4 right-4">
                  <ChevronDown size={16} strokeWidth={1} className="text-gray-400" />
                </div>
              </button>

              {/* Option 2: New Upload */}
              <button
                onClick={() => handleOptionSelect('new')}
                className="group relative bg-white border border-gray-200 rounded-2xl p-8 text-left transition-all duration-200 hover:border-[rgb(0,171,174)] hover:shadow-sm"
              >
                <div className="mb-4">
                  <Upload size={24} strokeWidth={1} className="text-gray-400 group-hover:text-[rgb(0,171,174)] transition-colors" />
                </div>
                <h3 className="text-lg font-light text-gray-900 mb-2">Upload New File</h3>
                <p className="text-sm font-light text-gray-500">Process a new CSV file</p>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />

            {/* Existing Files Dropdown */}
            {selectedOption === 'existing' && (
              <Card className="border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <CardContent className="p-6">
                  <label className="text-sm font-light text-gray-700 mb-3 block">
                    Select a CSV file to work with:
                  </label>
                  <Select onValueChange={handleExistingCsvSelect}>
                    <SelectTrigger className="w-full border-gray-200 font-light">
                      <SelectValue placeholder="Choose from previously uploaded files..." />
                    </SelectTrigger>
                    <SelectContent>
                      {previousUploads.map((upload) => (
                        <SelectItem key={upload.id} value={upload.id} className="font-light">
                          <div className="flex items-center justify-between w-full">
                            <span>{upload.name || upload.filename}</span>
                            <span className="text-xs text-gray-400 ml-4">
                              {new Date(upload.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Field Mapping */}
        {step === 'mapping' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-1">Map CSV Fields</h2>
                <p className="text-sm font-light text-gray-500">Match your columns to our system</p>
              </div>
              <Button
                onClick={() => resetFlow()}
                variant="ghost"
                size="sm"
                className="font-light text-gray-500"
              >
                Cancel
              </Button>
            </div>

            <CSVHeaderPreview
              headers={csvHeaders}
              sampleRow={csvSampleRow}
              onMappingComplete={handleMappingComplete}
              onCancel={resetFlow}
            />
          </div>
        )}

        {/* Step 3: Name CSV */}
        {step === 'naming' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-1">Name Your Upload</h2>
                <p className="text-sm font-light text-gray-500">Provide a descriptive name</p>
              </div>
              <Button
                onClick={() => resetFlow()}
                variant="ghost"
                size="sm"
                className="font-light text-gray-500"
              >
                Cancel
              </Button>
            </div>

            <Card className="border-gray-200">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                    <FileText size={16} strokeWidth={1} className="text-gray-400" />
                    <span className="font-light">File: {uploadedFile?.name}</span>
                  </div>

                  <div>
                    <label className="text-sm font-light text-gray-700 mb-2 block">
                      CSV Name
                    </label>
                    <input
                      type="text"
                      value={csvName}
                      onChange={(e) => setCsvName(e.target.value)}
                      placeholder="e.g., Q4 2024 Debtors"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[rgb(0,171,174)] focus:border-transparent font-light text-gray-900"
                      maxLength={255}
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-4">
                    <Button
                      onClick={handleStartProcessing}
                      disabled={!csvName.trim()}
                      className="flex-1 bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)] font-light"
                    >
                      Process & Analyze
                    </Button>
                    <Button
                      onClick={() => setStep('mapping')}
                      variant="ghost"
                      className="font-light text-gray-600"
                    >
                      Back to Mapping
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Processing */}
        {step === 'processing' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-light text-gray-900 mb-2">Processing</h2>
              <p className="text-sm font-light text-gray-500">{processingMessage}</p>
            </div>

            <Card className="border-gray-200">
              <CardContent className="p-12">
                <div className="space-y-8">
                  <div className="flex justify-center">
                    <Loader2 size={48} strokeWidth={1} className="text-[rgb(0,171,174)] animate-spin" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-light text-gray-600 mb-2">
                      <span>{processingMessage}</span>
                      <span>{processingProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[rgb(0,171,174)] h-full transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-center text-xs font-light text-gray-400">
                    This may take a few moments...
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <CheckCircle2 size={32} strokeWidth={1} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-light text-gray-900 mb-2">Analysis Complete</h2>
              <p className="text-sm font-light text-gray-500">Redirecting to contact analysis...</p>
            </div>

            <Card className="border-gray-200 bg-green-50/50">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="text-sm font-light text-gray-700">
                    CSV Upload ID: <span className="font-mono text-xs text-gray-500">{csvUploadId}</span>
                  </div>
                  <div className="text-sm font-light text-gray-700">
                    Intelligence scoring applied successfully
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={() => navigate('/intelligence-center/contact-analysis', {
                        state: { csvUploadId }
                      })}
                      className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)] font-light"
                    >
                      Continue to Contact Analysis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instructions - only show on choice screen */}
        {step === 'choice' && (
          <Card className="border-gray-200 mt-12">
            <CardContent className="p-8">
              <h3 className="text-lg font-light text-gray-900 mb-6 text-center">
                How It Works
              </h3>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                    <span className="text-sm font-light text-gray-600">1</span>
                  </div>
                  <h4 className="font-light text-gray-900 mb-2 text-sm">Upload CSV</h4>
                  <p className="text-xs font-light text-gray-500">Select your debtor data file</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                    <span className="text-sm font-light text-gray-600">2</span>
                  </div>
                  <h4 className="font-light text-gray-900 mb-2 text-sm">Map Fields</h4>
                  <p className="text-xs font-light text-gray-500">Match columns to our system</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                    <span className="text-sm font-light text-gray-600">3</span>
                  </div>
                  <h4 className="font-light text-gray-900 mb-2 text-sm">Analyze</h4>
                  <p className="text-xs font-light text-gray-500">Get intelligent insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
