import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, BarChart3, Settings, Info, Phone, MapPin, CreditCard, DollarSign, Users, Scale, CheckCircle, Clock, Play, MoreVertical, Trash2, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Checkbox } from '../components/ui/checkbox';
import { AnalysisResults } from '../utils/csvProcessor';
import { extractCSVPreview, parseCSVWithMapping } from '../utils/enhancedCsvProcessor';
import { mapHeaders, type FieldMapping } from '../utils/headerMapper';
import { QUARTILE_STANDARD_TEMPLATE } from '../utils/quartileTemplateMapper';
import { CSVHeaderPreview } from '../components/CSVHeaderPreview';
import { CSVTemplateGenerator } from '../components/CSVTemplateGenerator';
import { SupabaseService } from '../utils/supabaseService';

export function IntelligenceCenterPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fnbFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [csvName, setCsvName] = useState<string>('');
  const [activeCsvId, setActiveCsvId] = useState<string | null>(() => {
    return localStorage.getItem('activeCsvId') || null;
  });
  const [activeCsvName, setActiveCsvName] = useState<string | null>(() => {
    return localStorage.getItem('activeCsvName') || null;
  });
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('upload');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [csvUploadId, setCsvUploadId] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [rawDataSaved, setRawDataSaved] = useState(false);
  const [previousUploads, setPreviousUploads] = useState<any[]>([]);
 const [isProcessing, setIsProcessing] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showHeaderMapping, setShowHeaderMapping] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvSampleRow, setCsvSampleRow] = useState<{ [key: string]: string }>();
  const [headerMappings, setHeaderMappings] = useState<FieldMapping[]>([]);
  const [csvFileContent, setCsvFileContent] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [csvToDelete, setCsvToDelete] = useState<{ id: string; name: string } | null>(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedCsvIds, setSelectedCsvIds] = useState<Set<string>>(new Set());
  const [useFnbTemplate, setUseFnbTemplate] = useState(false);

  // Load previous uploads on component mount
  useEffect(() => {
    loadPreviousUploads();
  }, []);

  // Update localStorage whenever activeCsvId or activeCsvName changes
  useEffect(() => {
    if (activeCsvId && activeCsvName) {
      localStorage.setItem('activeCsvId', activeCsvId);
      localStorage.setItem('activeCsvName', activeCsvName);
    } else {
      localStorage.removeItem('activeCsvId');
      localStorage.removeItem('activeCsvName');
    }
  }, [activeCsvId, activeCsvName]);

  const loadPreviousUploads = async () => {
    try {
      const uploads = await SupabaseService.getRecentUploads(10);
      setPreviousUploads(uploads);
    } catch (error) {
      console.error('Error loading previous uploads:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setUploadedFile(file);
      // Set default name to filename without extension
      const defaultName = file.name.replace(/\.[^/.]+$/, '');
      setCsvName(defaultName);

      // Read file to preview headers
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setCsvFileContent(content);
          const { headers, sampleRows } = extractCSVPreview(content);
          setCsvHeaders(headers);
          setCsvSampleRow(sampleRows[0]);

          // Auto-detect mappings
          const mappingResult = mapHeaders(headers, sampleRows[0]);

          // If we have unmapped or missing required fields, show mapping UI
          if (mappingResult.unmappedHeaders.length > 0 || mappingResult.missingRequiredFields.length > 0) {
            setShowNameDialog(true);
          } else {
            // Auto-mapping successful, just show name dialog
            setHeaderMappings(mappingResult.mappings);
            setShowNameDialog(true);
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('Error reading CSV file:', error);
        alert('Error reading CSV file: ' + (error as Error).message);
      }
    } else {
      alert('Please upload a valid CSV file');
    }
  };

  const handleFnbFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setUploadedFile(file);
      setUseFnbTemplate(true);

      // Set default name to filename without extension
      const defaultName = file.name.replace(/\.[^/.]+$/, '');
      setCsvName(defaultName);

      // Read file to preview headers
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setCsvFileContent(content);
          const { headers, sampleRows } = extractCSVPreview(content);
          setCsvHeaders(headers);
          setCsvSampleRow(sampleRows[0]);

          // Apply FNB Quartile template mappings directly
          setHeaderMappings(QUARTILE_STANDARD_TEMPLATE.mappings);
          setShowNameDialog(true);
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('Error reading CSV file:', error);
        alert('Error reading CSV file: ' + (error as Error).message);
      }
    } else {
      alert('Please upload a valid CSV file');
    }
  };

  const handleConfirmName = () => {
    if (!csvName.trim()) {
      alert('Please provide a name for your CSV upload');
      return;
    }

    // Check if header mapping is needed
    const mappingResult = mapHeaders(csvHeaders, csvSampleRow);
    if (mappingResult.unmappedHeaders.length > 0 || mappingResult.missingRequiredFields.length > 0) {
      setShowNameDialog(false);
      setShowHeaderMapping(true);
    } else {
      // Auto-mapping successful, use detected mappings
      setHeaderMappings(mappingResult.mappings);
      setShowNameDialog(false);
    }
  };

  const handleMappingComplete = (mappings: FieldMapping[]) => {
    setHeaderMappings(mappings);
    setShowHeaderMapping(false);
  };

  const handleCancelMapping = () => {
    setShowHeaderMapping(false);
    resetUpload();
  };

  const handleProcessAnalysis = async () => {
    if (!uploadedFile) {
      alert('Please upload a CSV file first');
      return;
    }

    if (headerMappings.length === 0) {
      alert('Please map at least one field before analyzing');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStep('parse');

    try {
      console.log('Starting multi-step CSV process with custom mappings for file:', uploadedFile.name);

      // Step 1: Parse CSV file with custom mappings
      setProcessingStep('parse');
      setProcessingProgress(20);

      const { rawData, analysisResults } = await parseCSVWithMapping(uploadedFile, headerMappings);
      console.log('CSV parsing completed:', { rawDataCount: rawData.length });
      
      // Step 2: Save raw data to database
      setProcessingStep('save');
      setProcessingProgress(40);
      
      const uploadId = await SupabaseService.saveRawCsvData(uploadedFile.name, csvName.trim(), rawData);
      setCsvUploadId(uploadId);
      setRawDataSaved(true);
      console.log('Raw CSV data saved with unique ID and dedicated table:', uploadId);
      
      // Step 3: Process analysis
      setProcessingStep('analyze');
      setProcessingProgress(70);
      
      await SupabaseService.processRawData(uploadId, analysisResults);
      console.log('Analysis processing completed');
      
      // Step 4: Complete
      setProcessingStep('complete');
      setProcessingProgress(100);
      setUploadComplete(true);
      
      // Store results for navigation
      setAnalysisResults(analysisResults);
      
      // Set this as the active CSV
      setActiveCsvId(uploadId);
      setActiveCsvName(csvName.trim());
      
      // Auto-navigate to results after 1 second
      setTimeout(() => {
        navigate('/intelligence-center/analysis-results', {
          state: { fileName: csvName.trim(), csvUploadId: uploadId }
        });
      }, 1000);
      
      // Reload previous uploads to include this new one
      await loadPreviousUploads();
      
    } catch (error) {
      console.error('Error in multi-step CSV processing:', error);
      alert('Error processing CSV file: ' + (error as Error).message);
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStep('upload');
    }
  };

  const handleStartAnalysis = async () => {
    if (!csvUploadId) return;
    
    try {
      // Navigate directly to results if analysis is already complete
      navigate('/intelligence-center/analysis-results', {
        state: { fileName: csvName || uploadedFile?.name || 'analysis', csvUploadId }
      });
    } catch (error) {
      console.error('Error navigating to analysis:', error);
    }
  };

  const handleSelectPreviousUpload = (uploadId: string) => {
    setActiveCsvId(uploadId);
    const selectedUpload = previousUploads.find(upload => upload.id === uploadId);
    if (selectedUpload) {
      setActiveCsvName(selectedUpload.name || selectedUpload.filename);
      setCsvUploadId(uploadId);
    }
  };

  const handleUnselectCsv = () => {
    setActiveCsvId(null);
    setActiveCsvName('');
    setCsvUploadId(null);
  };

  const handleDownloadCsv = async (upload: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent selecting the CSV when clicking download

    try {
      // Fetch all debtor records for this CSV
      const debtors = await SupabaseService.getRawCsvData(upload.id);

      if (!debtors || debtors.length === 0) {
        alert('No data available to download for this CSV');
        return;
      }

      // Get all unique column names from the data
      const allColumns = new Set<string>();
      debtors.forEach((debtor: any) => {
        Object.keys(debtor).forEach(key => {
          // Exclude internal fields
          if (key !== 'id' && key !== 'csv_upload_id' && key !== 'created_at') {
            allColumns.add(key);
          }
        });
      });

      const columns = Array.from(allColumns);

      // Create CSV header
      const csvHeader = columns.join(',');

      // Create CSV rows
      const csvRows = debtors.map((debtor: any) => {
        return columns.map(column => {
          const value = debtor[column] || '';
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',');
      });

      // Combine header and rows
      const csvContent = [csvHeader, ...csvRows].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${upload.name || upload.filename}_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download CSV file: ' + (error as Error).message);
    }
  };

  const handleDeleteCsv = (upload: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent selecting the CSV when clicking delete
    setCsvToDelete({ id: upload.id, name: upload.name || upload.filename });
    setDeleteDialogOpen(true);
  };

  const handleToggleBulkDelete = () => {
    setBulkDeleteMode(!bulkDeleteMode);
    setSelectedCsvIds(new Set());
  };

  const handleSelectCsv = (id: string) => {
    const newSelected = new Set(selectedCsvIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCsvIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCsvIds.size === previousUploads.length) {
      setSelectedCsvIds(new Set());
    } else {
      setSelectedCsvIds(new Set(previousUploads.map(u => u.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedCsvIds.size === 0) {
      alert('Please select at least one file to delete');
      return;
    }
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCsv = async () => {
    try {
      // Handle bulk delete
      if (bulkDeleteMode && selectedCsvIds.size > 0) {
        for (const id of selectedCsvIds) {
          await SupabaseService.deleteCsvUpload(id);
          // If any deleted CSV was active, unselect it
          if (activeCsvId === id) {
            handleUnselectCsv();
          }
        }
        setSelectedCsvIds(new Set());
        setBulkDeleteMode(false);
      }
      // Handle single delete
      else if (csvToDelete) {
        await SupabaseService.deleteCsvUpload(csvToDelete.id);
        // If the deleted CSV was active, unselect it
        if (activeCsvId === csvToDelete.id) {
          handleUnselectCsv();
        }
        setCsvToDelete(null);
      }

      // Reload the uploads list
      await loadPreviousUploads();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting CSV:', error);
      alert('Failed to delete CSV file: ' + (error as Error).message);
    }
  };

  const cancelDeleteCsv = () => {
    setDeleteDialogOpen(false);
    setCsvToDelete(null);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setCsvName('');
    setIsProcessing(false);
    setProcessingStep('upload');
    setProcessingProgress(0);
    setAnalysisResults(null);
    setCsvUploadId(null);
    setUploadComplete(false);
    setRawDataSaved(false);
    setActiveCsvId(null);
    setActiveCsvName('');
    setShowNameDialog(false);
    setShowHeaderMapping(false);
    setCsvHeaders([]);
    setCsvSampleRow(undefined);
    setHeaderMappings([]);
    setCsvFileContent('');
    setUseFnbTemplate(false);
  };

  const getStepStatus = (step: string) => {
    const steps = ['upload', 'parse', 'save', 'analyze', 'complete'];
    const currentIndex = steps.indexOf(processingStep);
    const stepIndex = steps.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex && isProcessing) return 'active';
    if (stepIndex === currentIndex && !isProcessing) return 'completed';
    return 'pending';
  };

  const getProgressDescription = () => {
    switch (processingStep) {
      case 'parse': return 'Parsing CSV file and validating data...';
      case 'save': return 'Saving raw data to database...';
      case 'analyze': return 'Applying 100-point intelligence scoring...';
      case 'complete': return 'Analysis complete! Redirecting...';
      default: return 'Ready to process';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFnbUploadClick = () => {
    fnbFileInputRef.current?.click();
  };

  const handleScoringMethodology = () => {
    navigate('/intelligence-center/scoring-methodology');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div className="flex items-center space-x-6 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-gray-600" />
          </Button>
          <div className="flex flex-col">
            <img 
              src="https://qaurtile.com/wp-content/uploads/2021/12/qaurtile-logo.png" 
              alt="Quartile Logo" 
              className="max-h-12 w-auto mb-4 object-contain self-start"
            />
            <h1 className="text-3xl font-thin text-gray-800 tracking-wide">
              Intelligence Center
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            onClick={handleScoringMethodology}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Info size={16} strokeWidth={1.5} />
            <span>Scoring Guide</span>
          </Button>
          <Button
            onClick={() => navigate('/intelligence-center/scoring-configuration')}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Settings size={16} strokeWidth={1.5} />
            <span>Configure Scoring</span>
          </Button>
        </div>
      </div>

      {/* Main Cards Grid */}
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="upload">Upload & Process</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
            <TabsTrigger value="address">Address Classification</TabsTrigger>
            <TabsTrigger value="payment">Payment Behavior</TabsTrigger>
            <TabsTrigger value="debt">Debt Characteristics</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="legal">Legal Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload">
            {/* Header Mapping Dialog */}
            {showHeaderMapping && (
              <div className="mb-6">
                <CSVHeaderPreview
                  headers={csvHeaders}
                  sampleRow={csvSampleRow}
                  onMappingComplete={handleMappingComplete}
                  onCancel={handleCancelMapping}
                />
              </div>
            )}

            {!showHeaderMapping && (
            <>
            {/* FNB Specialized Upload Banner */}
            {!uploadedFile && !isProcessing && !showNameDialog && (
              <div className="mb-6">
                <Card className="border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-orange-500 text-white rounded-full p-3">
                          <FileText size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-lg">FNB Specialized Format</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Upload Quartile/FNB handover files with automatic field mapping and address consolidation
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleFnbUploadClick}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6"
                      >
                        <Upload size={16} className="mr-2" />
                        FNB Specialised
                      </Button>
                      <input
                        type="file"
                        ref={fnbFileInputRef}
                        onChange={handleFnbFileUpload}
                        accept=".csv"
                        className="hidden"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* CSV Name Dialog */}
              {showNameDialog && (
                <div className="lg:col-span-2 mb-6">
                  <Card className={`border-orange-200 ${useFnbTemplate ? 'bg-gradient-to-r from-orange-50 to-amber-50' : 'bg-orange-50'}`}>
                    <CardHeader>
                      <CardTitle className="text-lg font-light text-orange-800 flex items-center space-x-2">
                        <span>Name Your CSV Upload</span>
                        {useFnbTemplate && (
                          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-medium">
                            FNB Format
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {useFnbTemplate && (
                          <div className="bg-white/50 border border-orange-200 rounded-lg p-3 mb-2">
                            <p className="text-sm text-gray-700 flex items-center">
                              <CheckCircle size={16} className="text-green-500 mr-2" />
                              Using FNB Specialized template with automatic field mapping and address consolidation
                            </p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            CSV Name (this will be used to identify your upload):
                          </label>
                          <input
                            type="text"
                            value={csvName}
                            onChange={(e) => setCsvName(e.target.value)}
                            placeholder="Enter a descriptive name for this CSV"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(0,171,174)] focus:border-transparent"
                            maxLength={255}
                            autoFocus
                          />
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            onClick={handleConfirmName}
                            disabled={!csvName.trim()}
                            className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
                          >
                            Continue
                          </Button>
                          <Button
                            onClick={resetUpload}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Multi-step Process Indicator */}
              {(uploadedFile || isProcessing || uploadComplete) && !showNameDialog && (
                <div className="lg:col-span-2 mb-6">
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-light text-gray-800">
                        Processing Steps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        {[
                          { key: 'upload', label: 'Upload', icon: Upload },
                          { key: 'parse', label: 'Parse', icon: FileText },
                          { key: 'save', label: 'Save', icon: BarChart3 },
                          { key: 'analyze', label: 'Analyze', icon: Settings },
                          { key: 'complete', label: 'Complete', icon: CheckCircle }
                        ].map(({ key, label, icon: Icon }, index) => {
                          const status = getStepStatus(key);
                          return (
                            <div key={key} className="flex flex-col items-center">
                              <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                                ${status === 'completed' ? 'bg-green-500 text-white' : 
                                  status === 'active' ? 'bg-[rgb(0,171,174)] text-white animate-pulse' : 
                                  'bg-gray-200 text-gray-400'}
                              `}>
                                <Icon size={16} strokeWidth={1.5} />
                              </div>
                              <span className={`text-xs font-light ${
                                status === 'completed' ? 'text-green-600' :
                                status === 'active' ? 'text-[rgb(0,171,174)]' :
                                'text-gray-400'
                              }`}>
                                {label}
                              </span>
                              {index < 4 && (
                                <div className={`
                                  absolute h-0.5 w-16 mt-5 ml-16 transition-all duration-300
                                  ${status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}
                                `} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {isProcessing && (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600 font-light">
                            {getProgressDescription()}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[rgb(0,171,174)] h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${processingProgress}%` }} 
                            />
                          </div>
                          <div className="text-xs text-gray-400 text-center">
                            {processingProgress}% complete
                          </div>
                        </div>
                      )}
                      
                      {uploadComplete && (
                        <div className="text-center">
                          <div className="text-green-600 font-medium mb-2">
                            ✅ Upload and analysis completed successfully!
                          </div>
                          <div className="text-sm text-gray-600">
                            CSV data saved with ID: {csvUploadId}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Upload Card */}
              <div 
                onClick={!uploadedFile && !isProcessing && !showNameDialog ? handleUploadClick : undefined}
                className={`group relative bg-white rounded-2xl p-8 h-80 border border-gray-100 transition-all duration-300 ease-out ${
                  !uploadedFile && !isProcessing && !showNameDialog ? 'cursor-pointer hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1' : 
                  uploadComplete ? 'border-green-200 bg-green-50' : ''
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
                
                <div className="relative z-10 h-full flex flex-col">
                  <div className="mb-6">
                    <Upload 
                      size={32} 
                      strokeWidth={1} 
                      className={`transition-colors duration-300 ${
                        uploadComplete
                          ? 'text-green-500'
                        : uploadedFile 
                          ? 'text-[rgb(0,171,174)]'
                          : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-left leading-tight mb-4">
                      <div className="block">
                        <span className="text-2xl tracking-wide transition-colors duration-300 font-medium text-gray-800">
                          {uploadComplete ? 'Uploaded' : 'Upload'}
                        </span>
                      </div>
                      <div className="block">
                        <span className="text-2xl tracking-wide transition-colors duration-300 font-thin text-gray-600">
                          CSV File
                        </span>
                      </div>
                    </h3>
                    
                    {uploadedFile && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <FileText size={16} strokeWidth={1.5} />
                          <span className="font-light">File: {uploadedFile.name}</span>
                          {uploadComplete && (
                            <CheckCircle size={16} strokeWidth={1.5} className="text-green-500 ml-2" />
                          )}
                        </div>
                        
                        {csvName && !showNameDialog && (
                          <div className="text-sm font-medium text-[rgb(0,171,174)]">
                            "{csvName}"
                          </div>
                        )}
                      </div>
                    )}

                    {!uploadedFile && !isProcessing && (
                      <p className="text-sm text-gray-500 font-light mt-2">
                        Select CSV file and provide a custom name
                      </p>
                    )}
                    
                    {uploadComplete && (
                      <div className="mt-4">
                        <Button 
                          onClick={resetUpload}
                          variant="outline" 
                          size="sm"
                          className="w-full"
                        >
                          Upload New File
                        </Button>
                      </div>
                    )}
                  </div>

                  <div 
                    className={`absolute bottom-6 right-6 w-4 h-4 rounded-full opacity-80 transition-all duration-300 ${
                      uploadComplete ? 'opacity-100' :
                      uploadedFile ? 'opacity-100' : 'group-hover:opacity-100'
                    }`}
                    style={{ backgroundColor: 
                      uploadComplete ? 'rgb(34, 197, 94)' :
                      uploadedFile ? 'rgb(0,171,174)' : 'rgb(150, 150, 255)' }}
                  />
                </div>

                {!uploadedFile && !isProcessing && (
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                    style={{ backgroundColor: 'rgb(150, 150, 255)' }}
                  />
                )}
              </div>

              {/* Process Analysis Card */}
              <div 
                onClick={uploadedFile && csvName.trim() && !isProcessing && !uploadComplete && !showNameDialog ? handleProcessAnalysis : 
                        uploadComplete && csvUploadId ? handleStartAnalysis : undefined}
                className={`group relative bg-white rounded-2xl p-8 h-80 border border-gray-100 transition-all duration-300 ease-out ${
                  (uploadedFile && csvName.trim() && !isProcessing) || (uploadComplete && csvUploadId)
                    ? 'cursor-pointer hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="relative z-10 h-full flex flex-col">
                  <div className="mb-6">
                    {uploadComplete ? (
                      <Play
                        size={32}
                        strokeWidth={1}
                        className="text-green-500"
                      />
                    ) : (
                      <BarChart3 
                      size={32} 
                      strokeWidth={1} 
                      className={`transition-colors duration-300 ${
                        uploadedFile && !isProcessing
                          ? 'text-gray-400 group-hover:text-gray-600' 
                          : 'text-gray-300'
                      } ${isProcessing ? 'animate-pulse' : ''}`}
                    />
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-left leading-tight mb-4">
                      <div className="block">
                        <span className="text-2xl tracking-wide transition-colors duration-300 font-medium text-gray-800">
                          {uploadComplete ? 'View Results' :
                           isProcessing ? 'Processing' : 'Analyze'}
                        </span>
                      </div>
                      <div className="block">
                        <span className="text-2xl tracking-wide transition-colors duration-300 font-thin text-gray-600">
                          {uploadComplete ? 'Data' :
                           isProcessing ? 'Data...' : 'Debtors'}
                        </span>
                      </div>
                    </h3>
                    
                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500 font-light">
                          {getProgressDescription()}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[rgb(0,171,174)] h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${processingProgress}%` }} 
                          />
                        </div>
                        <div className="text-xs text-gray-400 text-center">
                          {processingProgress}% complete
                        </div>
                       {/* Cancel button for long-running processes */}
                       <div className="text-center mt-2">
                         <Button
                           onClick={resetUpload}
                           variant="outline"
                           size="sm"
                           className="text-xs"
                         >
                           Cancel
                         </Button>
                       </div>
                      </div>
                    )}

                    {!isProcessing && !uploadedFile && !uploadComplete && (
                      <p className="text-sm text-gray-500 font-light">
                        Upload a CSV file to begin analysis
                      </p>
                    )}
                    
                    {!isProcessing && uploadedFile && !csvName.trim() && !uploadComplete && !showNameDialog && (
                      <p className="text-sm text-orange-500 font-light">
                        Please provide a name for your CSV upload
                      </p>
                    )}
                    
                    {uploadComplete && (
                      <p className="text-sm text-green-600 font-light">
                        Click to view detailed analysis results
                      </p>
                    )}
                  </div>

                  <div 
                    className={`absolute bottom-6 right-6 w-4 h-4 rounded-full transition-all duration-300 ${
                      isProcessing ? 'animate-pulse' : ''
                    } ${
                      uploadComplete ? 'opacity-100' :
                      uploadedFile ? 'opacity-80 group-hover:opacity-100' : 'opacity-30'
                    }`}
                    style={{ backgroundColor: 
                      uploadComplete ? 'rgb(34, 197, 94)' :
                      'rgb(100, 200, 150)' }}
                  />
                </div>

                {((uploadedFile && !isProcessing) || uploadComplete) && (
                  <div 
                    className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 ${
                      csvName.trim() ? 'group-hover:opacity-5' : ''
                    }`}
                    style={{ backgroundColor: 
                      uploadComplete ? 'rgb(34, 197, 94)' :
                      'rgb(100, 200, 150)' }}
                  />
                )}
              </div>
            </div>
            </>
            )}

            {/* Previously Uploaded CSV Files */}
            {previousUploads.length > 0 && !showHeaderMapping && (
              <Card className="border-gray-200 mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-light text-gray-800">
                      Previously Uploaded CSV Files
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {bulkDeleteMode && (
                        <>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedCsvIds.size === previousUploads.length}
                              onCheckedChange={handleSelectAll}
                              id="select-all"
                            />
                            <label htmlFor="select-all" className="text-sm text-gray-600 cursor-pointer">
                              Select All
                            </label>
                          </div>
                          <Button
                            onClick={handleBulkDelete}
                            variant="destructive"
                            size="sm"
                            disabled={selectedCsvIds.size === 0}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete Selected ({selectedCsvIds.size})
                          </Button>
                          <Button
                            onClick={handleToggleBulkDelete}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {!bulkDeleteMode && (
                        <Button
                          onClick={handleToggleBulkDelete}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete Files
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {previousUploads.map((upload) => (
                      <div
                        key={upload.id}
                        className={`p-4 rounded-lg border ${bulkDeleteMode ? 'cursor-default' : 'cursor-pointer'} ${
                          activeCsvId === upload.id && !bulkDeleteMode
                            ? 'border-[rgb(0,171,174)] bg-[rgb(0,171,174)]/5'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => !bulkDeleteMode && handleSelectPreviousUpload(upload.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 flex-1">
                            {bulkDeleteMode && (
                              <Checkbox
                                checked={selectedCsvIds.has(upload.id)}
                                onCheckedChange={() => handleSelectCsv(upload.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{upload.name || upload.filename}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <span>File: {upload.filename}</span>
                                <span>Rows: {upload.total_debtors?.toLocaleString() || 'N/A'}</span>
                                <span>Uploaded: {new Date(upload.uploaded_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              upload.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {upload.status}
                            </span>
                            {activeCsvId === upload.id && !bulkDeleteMode && (
                              <CheckCircle size={16} className="text-[rgb(0,171,174)]" />
                            )}
                            {!bulkDeleteMode && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-200"
                                >
                                  <MoreVertical size={16} className="text-gray-600" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="animate-none data-[state=open]:animate-none data-[state=closed]:animate-none"
                                style={{
                                  animation: 'none',
                                  transformOrigin: 'top',
                                  transition: 'opacity 0.15s ease-out, transform 0.15s ease-out'
                                }}
                              >
                                <DropdownMenuItem
                                  onClick={(e) => handleDownloadCsv(upload, e)}
                                  className="cursor-pointer focus:bg-blue-50"
                                >
                                  <Download size={16} className="mr-2" />
                                  Download File
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => handleDeleteCsv(upload, e)}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Delete CSV
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {activeCsvId && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="mb-3 p-3 bg-[rgb(0,171,174)]/10 rounded-lg border border-[rgb(0,171,174)]/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">Active CSV:</div>
                            <div className="text-sm text-[rgb(0,171,174)] font-medium">{activeCsvName}</div>
                          </div>
                          <Button
                            onClick={handleUnselectCsv}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Unselect
                          </Button>
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate('/intelligence-center/analysis-results', {
                          state: { fileName: activeCsvName, csvUploadId: activeCsvId }
                        })}
                        className="w-full bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
                      >
                        Work with Selected CSV
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="contact">
            {activeCsvId || csvUploadId ? (
              <div>
                {/* Active CSV Banner */}
                <Card className="border-[rgb(0,171,174)]/20 bg-[rgb(0,171,174)]/5 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-600">Working with CSV:</span>
                        <span className="ml-2 font-medium text-[rgb(0,171,174)]">{activeCsvName || csvName}</span>
                      </div>
                      <Button
                        onClick={handleUnselectCsv}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Change CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                    <Phone size={20} strokeWidth={1.5} />
                    <span>Contact Information Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">
                      Analyze contact completeness for: <strong>{activeCsvName || csvName}</strong>
                    </p>
                    <Button 
                      onClick={() => navigate('/intelligence-center/contact-analysis', { 
                        state: { csvUploadId: activeCsvId || csvUploadId } 
                      })} 
                      className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
                    >
                      <Phone size={16} className="mr-2" />
                      Analyze Contact Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            ) : (
              <div className="text-center py-16">
                <Phone size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-light text-gray-700 mb-2">Contact Information Analysis</h3>
                <p className="text-gray-500 mb-6">Select or upload a CSV file to analyze contact completeness</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="address">
            {activeCsvId || csvUploadId ? (
              <div>
                {/* Active CSV Banner */}
                <Card className="border-[rgb(0,171,174)]/20 bg-[rgb(0,171,174)]/5 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-600">Working with CSV:</span>
                        <span className="ml-2 font-medium text-[rgb(0,171,174)]">{activeCsvName || csvName}</span>
                      </div>
                      <Button
                        onClick={handleUnselectCsv}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Change CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                    <MapPin size={20} strokeWidth={1.5} />
                    <span>Address-Based Classification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">
                      Socio-economic analysis for: <strong>{activeCsvName || csvName}</strong>
                    </p>
                    <Button 
                      onClick={() => navigate('/intelligence-center/address-analysis', { 
                        state: { csvUploadId: activeCsvId || csvUploadId } 
                      })} 
                      className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
                    >
                      <MapPin size={16} className="mr-2" />
                      Analyze Address Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            ) : (
              <div className="text-center py-16">
                <MapPin size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-light text-gray-700 mb-2">Address-Based Classification</h3>
                <p className="text-gray-500 mb-6">Select or upload a CSV file to analyze address data</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="payment">
            {activeCsvId || csvUploadId ? (
              <div>
                {/* Active CSV Banner */}
                <Card className="border-[rgb(0,171,174)]/20 bg-[rgb(0,171,174)]/5 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-600">Working with CSV:</span>
                        <span className="ml-2 font-medium text-[rgb(0,171,174)]">{activeCsvName || csvName}</span>
                      </div>
                      <Button
                        onClick={handleUnselectCsv}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Change CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                    <CreditCard size={20} strokeWidth={1.5} />
                    <span>Payment Behavior Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">
                      Payment pattern analysis for: <strong>{activeCsvName || csvName}</strong>
                    </p>
                    <Button 
                      onClick={() => navigate('/intelligence-center/payment-analysis', { 
                        state: { csvUploadId: activeCsvId || csvUploadId } 
                      })} 
                      className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
                    >
                      <CreditCard size={16} className="mr-2" />
                      Analyze Payment Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            ) : (
              <div className="text-center py-16">
                <CreditCard size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-light text-gray-700 mb-2">Payment Behavior Analysis</h3>
                <p className="text-gray-500 mb-6">Select or upload a CSV file to analyze payment patterns</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="debt">
            {activeCsvId || csvUploadId ? (
              <div>
                {/* Active CSV Banner */}
                <Card className="border-[rgb(0,171,174)]/20 bg-[rgb(0,171,174)]/5 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-600">Working with CSV:</span>
                        <span className="ml-2 font-medium text-[rgb(0,171,174)]">{activeCsvName || csvName}</span>
                      </div>
                      <Button
                        onClick={handleUnselectCsv}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Change CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                    <DollarSign size={20} strokeWidth={1.5} />
                    <span>Debt Characteristics Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">
                      Debt composition analysis for: <strong>{activeCsvName || csvName}</strong>
                    </p>
                    <Button 
                      onClick={() => navigate('/intelligence-center/debt-analysis', { 
                        state: { csvUploadId: activeCsvId || csvUploadId } 
                      })} 
                      className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
                    >
                      <DollarSign size={16} className="mr-2" />
                      Analyze Debt Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            ) : (
              <div className="text-center py-16">
                <DollarSign size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-light text-gray-700 mb-2">Debt Characteristics</h3>
                <p className="text-gray-500 mb-6">Select or upload a CSV file to analyze debt data</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="demographics">
            {activeCsvId || csvUploadId ? (
              <div>
                {/* Active CSV Banner */}
                <Card className="border-[rgb(0,171,174)]/20 bg-[rgb(0,171,174)]/5 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-600">Working with CSV:</span>
                        <span className="ml-2 font-medium text-[rgb(0,171,174)]">{activeCsvName || csvName}</span>
                      </div>
                      <Button
                        onClick={handleUnselectCsv}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Change CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                    <Users size={20} strokeWidth={1.5} />
                    <span>Demographics & Stability Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">
                      Demographics analysis for: <strong>{activeCsvName || csvName}</strong>
                    </p>
                    <Button 
                      onClick={() => navigate('/intelligence-center/demographics-analysis', { 
                        state: { csvUploadId: activeCsvId || csvUploadId } 
                      })} 
                      className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
                    >
                      <Users size={16} className="mr-2" />
                      Analyze Demographics
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            ) : (
              <div className="text-center py-16">
                <Users size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-light text-gray-700 mb-2">Demographics & Stability</h3>
                <p className="text-gray-500 mb-6">Select or upload a CSV file to analyze demographics</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="legal">
            {activeCsvId || csvUploadId ? (
              <div>
                {/* Active CSV Banner */}
                <Card className="border-[rgb(0,171,174)]/20 bg-[rgb(0,171,174)]/5 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-600">Working with CSV:</span>
                        <span className="ml-2 font-medium text-[rgb(0,171,174)]">{activeCsvName || csvName}</span>
                      </div>
                      <Button
                        onClick={handleUnselectCsv}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Change CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                    <Scale size={20} strokeWidth={1.5} />
                    <span>Legal & Administrative Status Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">
                      Legal status analysis for: <strong>{activeCsvName || csvName}</strong>
                    </p>
                    <Button 
                      onClick={() => navigate('/intelligence-center/legal-analysis', { 
                        state: { csvUploadId: activeCsvId || csvUploadId } 
                      })} 
                      className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
                    >
                      <Scale size={16} className="mr-2" />
                      Analyze Legal Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            ) : (
              <div className="text-center py-16">
                <Scale size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-light text-gray-700 mb-2">Legal & Administrative Status</h3>
                <p className="text-gray-500 mb-6">Select or upload a CSV file to analyze legal status</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div 
            onClick={() => navigate('/intelligence-center/scoring-methodology')}
            className="group relative bg-white rounded-xl p-6 h-32 cursor-pointer transition-all duration-300 ease-out hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 border border-gray-100"
          >
            <div className="relative z-10 h-full flex items-center space-x-4">
              <Settings size={24} strokeWidth={1} className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300" />
              <div>
                <h4 className="font-medium text-gray-800">Scoring Method</h4>
                <p className="text-sm text-gray-500 font-light">View 100-point framework</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/intelligence-center/scoring-configuration')}
            className="group relative bg-white rounded-xl p-6 h-32 cursor-pointer transition-all duration-300 ease-out hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 border border-gray-100"
          >
            <div className="relative z-10 h-full flex items-center space-x-4">
              <Settings size={24} strokeWidth={1} className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300" />
              <div>
                <h4 className="font-medium text-gray-800">Configure Scoring</h4>
                <p className="text-sm text-gray-500 font-light">Adjust weights & criteria</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/intelligence-center/batch-history')}
            className="group relative bg-white rounded-xl p-6 h-32 cursor-pointer transition-all duration-300 ease-out hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 border border-gray-100"
          >
            <div className="relative z-10 h-full flex items-center space-x-4">
              <FileText size={24} strokeWidth={1} className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300" />
              <div>
                <h4 className="font-medium text-gray-800">Batch History</h4>
                <p className="text-sm text-gray-500 font-light">Previous analyses</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => (activeCsvId || csvUploadId) && navigate('/intelligence-center/analysis-results', { state: { fileName: activeCsvName || csvName || uploadedFile?.name || 'Latest Analysis', csvUploadId: activeCsvId || csvUploadId } })}
            className={`group relative bg-white rounded-xl p-6 h-32 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 border border-gray-100 ${
              (activeCsvId || csvUploadId) ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="relative z-10 h-full flex items-center space-x-4">
              <BarChart3 size={24} strokeWidth={1} className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300" />
              <div>
                <h4 className="font-medium text-gray-800">View Results</h4>
                <p className="text-sm text-gray-500 font-light">Latest analysis</p>
              </div>
            </div>
          </div>
        </div>

        {/* CSV Template Generator */}
        <div className="mb-8">
          <CSVTemplateGenerator />
        </div>

        {/* Instructions */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800">
              How Intelligence Scoring Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-600 font-medium">1</span>
                </div>
                <h4 className="font-light text-gray-800 mb-2">Upload CSV</h4>
                <p className="text-sm text-gray-500 font-light">Upload your debtor handover CSV file - system auto-detects headers</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-600 font-medium">2</span>
                </div>
                <h4 className="font-light text-gray-800 mb-2">AI Scoring</h4>
                <p className="text-sm text-gray-500 font-light">System applies 100-point intelligence framework across 5 key categories</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-600 font-medium">3</span>
                </div>
                <h4 className="font-light text-gray-800 mb-2">Smart Prioritization</h4>
                <p className="text-sm text-gray-500 font-light">Debtors categorized by collection probability for optimal resource allocation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkDeleteMode && selectedCsvIds.size > 0
                ? `Delete ${selectedCsvIds.size} CSV Upload${selectedCsvIds.size > 1 ? 's' : ''}`
                : 'Delete CSV Upload'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkDeleteMode && selectedCsvIds.size > 0
                ? `Are you sure you want to delete ${selectedCsvIds.size} CSV file${selectedCsvIds.size > 1 ? 's' : ''}? This will permanently remove ${selectedCsvIds.size > 1 ? 'these files' : 'this file'} and all associated debtor records. This action cannot be undone.`
                : `Are you sure you want to delete "${csvToDelete?.name}"? This will permanently remove the CSV file and all associated debtor records. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteCsv}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCsv}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete {bulkDeleteMode && selectedCsvIds.size > 0 ? `${selectedCsvIds.size} File${selectedCsvIds.size > 1 ? 's' : ''}` : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}