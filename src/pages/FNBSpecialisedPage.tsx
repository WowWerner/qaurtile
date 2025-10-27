import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle, PlayCircle, Download, Phone, MapPin, CreditCard, Users, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useFNBStore, ColumnMap } from '../stores/fnbStore';
import { supabase } from '../lib/supabase';

function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

function csvStringify(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      return typeof value === 'string' && (value.includes(',') || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}`
        : value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

const AUTO_KEYS: Array<keyof ColumnMap> = [
  "clientRef", "amount", "capitalOnDefault", "interestPortion", "legalFeePortion", "interestRate",
  "interestDate", "dateOfDefault", "lastPaymentDate", "lastPaymentAmount",
  "debtorFirstName", "debtorSecondName", "debtorSurname", "debtorID",
  "email1", "email2", "cell1", "cell2", "home1", "work1",
  "streetLine1", "streetLine2", "streetPostalCode",
  "postalLine1", "postalLine2", "postalPostalCode",
  "occupation", "employer", "employerAddress", "previousAttorneyLegalStage"
];

function suggestColumn(header: string): keyof ColumnMap | null {
  const h = header.toLowerCase();
  if (/^client reference$/.test(h)) return "clientRef";
  if (/^amount$/.test(h)) return "amount";
  if (/^capital on default$/.test(h)) return "capitalOnDefault";
  if (/^interest portion$/.test(h)) return "interestPortion";
  if (/^legal fee portion$/.test(h)) return "legalFeePortion";
  if (/^interest rate$/.test(h)) return "interestRate";
  if (/^interest date$/.test(h)) return "interestDate";
  if (/^date of default$/.test(h)) return "dateOfDefault";
  if (/^last payment date/.test(h)) return "lastPaymentDate";
  if (/^last payment amount$/.test(h)) return "lastPaymentAmount";
  if (/debtor\s*first/.test(h)) return "debtorFirstName";
  if (/debtor\s*second/.test(h)) return "debtorSecondName";
  if (/debtor\s*surname|last name/.test(h)) return "debtorSurname";
  if (/^debtor id$/.test(h)) return "debtorID";
  if (/^email\s*1$/.test(h)) return "email1";
  if (/^email\s*2$/.test(h)) return "email2";
  if (/^cell phone\s*1$/.test(h)) return "cell1";
  if (/^cell phone\s*2$/.test(h)) return "cell2";
  if (/^home phone\s*1$/.test(h)) return "home1";
  if (/^work phone\s*1$/.test(h)) return "work1";
  if (/^street address line\s*1$/.test(h)) return "streetLine1";
  if (/^street address line\s*2$/.test(h)) return "streetLine2";
  if (/^street postal code$/.test(h)) return "streetPostalCode";
  if (/^postal address line\s*1$/.test(h)) return "postalLine1";
  if (/^postal address line\s*2$/.test(h)) return "postalLine2";
  if (/^postal postal code$/.test(h)) return "postalPostalCode";
  if (/^occupation$/.test(h)) return "occupation";
  if (/^employer$/.test(h)) return "employer";
  if (/^employer.*address$/.test(h)) return "employerAddress";
  if (/^previous attorney legal stage$/.test(h)) return "previousAttorneyLegalStage";
  return null;
}

export function FNBSpecialisedPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setRawRows, columnMap, setColumnMap, rows } = useFNBStore();

  const [step, setStep] = useState<'upload' | 'mapping' | 'analyze' | 'results'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [previousUploads, setPreviousUploads] = useState<any[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);

  useEffect(() => {
    loadPreviousUploads();
  }, []);

  const loadPreviousUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('fnb_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPreviousUploads(data || []);
    } catch (error) {
      console.error('Error loading previous uploads:', error);
    } finally {
      setLoadingUploads(false);
    }
  };

  const loadPreviousUpload = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('fnb_debtors')
        .select('*')
        .eq('fnb_upload_id', id);

      if (error) throw error;

      const mapped = (data || []).map(d => ({
        clientRef: d.client_ref,
        amount: d.amount,
        capitalOnDefault: d.capital_on_default,
        interestPortion: d.interest_portion,
        legalFeePortion: d.legal_fee_portion,
        interestRate: d.interest_rate,
        interestDate: d.interest_date,
        dateOfDefault: d.date_of_default,
        lastPaymentDate: d.last_payment_date,
        lastPaymentAmount: d.last_payment_amount,
        debtorFirstName: d.debtor_first_name,
        debtorSecondName: d.debtor_second_name,
        debtorSurname: d.debtor_surname,
        debtorID: d.debtor_id,
        email1: d.email1,
        email2: d.email2,
        cell1: d.cell1,
        cell2: d.cell2,
        home1: d.home1,
        work1: d.work1,
        streetLine1: d.street_line1,
        streetLine2: d.street_line2,
        streetPostalCode: d.street_postal_code,
        postalLine1: d.postal_line1,
        postalLine2: d.postal_line2,
        postalPostalCode: d.postal_postal_code,
        occupation: d.occupation,
        employer: d.employer,
        employerAddress: d.employer_address,
        previousAttorneyLegalStage: d.previous_attorney_legal_stage,
        __score__: d.score,
        __bucket__: d.bucket,
        __ses__: d.ses
      }));

      setRawRows(mapped);
      setUploadId(id);
      setStep('results');
    } catch (error) {
      console.error('Error loading previous upload:', error);
      alert('Error loading previous upload: ' + (error as Error).message);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const rawData = parseCSV(content);
        setRawRows(rawData);
        const hdrs = Object.keys(rawData[0] || {});
        setHeaders(hdrs);

        const m: ColumnMap = { ...columnMap };
        for (const h of hdrs) {
          const key = suggestColumn(h);
          if (key && !m[key]) m[key] = h;
        }
        setColumnMap(m);
        setStep('mapping');
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a valid CSV file');
    }
  };

  const toNumeric = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;

    setStep('analyze');

    try {
      const { data: upload, error: uploadError } = await supabase
        .from('fnb_uploads')
        .insert({
          filename: uploadedFile.name,
          name: uploadedFile.name.replace(/\.[^/.]+$/, ''),
          status: 'processing',
          total_debtors: rows.length
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      const debtorRecords = rows.map(debtor => ({
        fnb_upload_id: upload.id,
        client_ref: debtor.clientRef || null,
        amount: toNumeric(debtor.amount),
        capital_on_default: toNumeric(debtor.capitalOnDefault),
        interest_portion: toNumeric(debtor.interestPortion),
        legal_fee_portion: toNumeric(debtor.legalFeePortion),
        interest_rate: toNumeric(debtor.interestRate),
        interest_date: debtor.interestDate || null,
        date_of_default: debtor.dateOfDefault || null,
        last_payment_date: debtor.lastPaymentDate || null,
        last_payment_amount: toNumeric(debtor.lastPaymentAmount),
        debtor_first_name: debtor.debtorFirstName || null,
        debtor_second_name: debtor.debtorSecondName || null,
        debtor_surname: debtor.debtorSurname || null,
        debtor_id: debtor.debtorID || null,
        email1: debtor.email1 || null,
        email2: debtor.email2 || null,
        cell1: debtor.cell1 || null,
        cell2: debtor.cell2 || null,
        home1: debtor.home1 || null,
        work1: debtor.work1 || null,
        street_line1: debtor.streetLine1 || null,
        street_line2: debtor.streetLine2 || null,
        street_postal_code: debtor.streetPostalCode || null,
        postal_line1: debtor.postalLine1 || null,
        postal_line2: debtor.postalLine2 || null,
        postal_postal_code: debtor.postalPostalCode || null,
        occupation: debtor.occupation || null,
        employer: debtor.employer || null,
        employer_address: debtor.employerAddress || null,
        previous_attorney_legal_stage: debtor.previousAttorneyLegalStage || null,
        score: debtor.__score__ || null,
        bucket: debtor.__bucket__ || null,
        ses: debtor.__ses__ || null
      }));

      const { error: debtorsError } = await supabase
        .from('fnb_debtors')
        .insert(debtorRecords);

      if (debtorsError) throw debtorsError;

      await supabase
        .from('fnb_uploads')
        .update({ status: 'completed' })
        .eq('id', upload.id);

      setUploadId(upload.id);
      setStep('results');

      // Reload uploads list to show the new upload
      loadPreviousUploads();
    } catch (error) {
      console.error('Error analyzing file:', error);
      alert('Error analyzing file: ' + (error as Error).message);
      setStep('mapping');
    }
  };

  const exportBucket = (bucketName: string) => {
    const filtered = rows.filter(r => r.__bucket__ === bucketName);
    const csv = csvStringify(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fnb_${bucketName.replace(/\s+/g, '_').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bucketCounts = {
    High: rows.filter(r => r.__bucket__ === 'High').length,
    Medium: rows.filter(r => r.__bucket__ === 'Medium').length,
    Low: rows.filter(r => r.__bucket__ === 'Low').length,
    'Trace Required': rows.filter(r => r.__bucket__ === 'Trace Required').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      <div className="flex justify-between items-start mb-12">
        <div className="flex items-center space-x-6 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/intelligence-center')}
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
              FNB Specialised Analysis
            </h1>
          </div>
        </div>
        <Button
          onClick={() => navigate('/intelligence-center/fnb-scoring-configuration')}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Settings size={16} strokeWidth={1.5} />
          <span>Configure FNB Scoring</span>
        </Button>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {step === 'upload' && (
          <>
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                  <Upload size={20} strokeWidth={1.5} />
                  <span>Upload FNB CSV File</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative bg-white rounded-2xl p-12 border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer transition-all duration-300 hover:shadow-lg"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv"
                    className="hidden"
                  />
                  <div className="text-center">
                    <Upload size={48} className="mx-auto mb-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    <h3 className="text-xl font-medium text-gray-800 mb-2">
                      Choose FNB CSV File
                    </h3>
                    <p className="text-sm text-gray-500">
                      Click to browse or drag and drop your file here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!loadingUploads && previousUploads.length > 0 && (
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                    <FileText size={20} strokeWidth={1.5} />
                    <span>Previous Uploads</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {previousUploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{upload.name}</h4>
                          <p className="text-sm text-gray-500">
                            {upload.total_debtors} debtors • {new Date(upload.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => loadPreviousUpload(upload.id)}
                          variant="outline"
                          size="sm"
                        >
                          Load
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {step === 'mapping' && (
          <>
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
                  <FileText size={20} strokeWidth={1.5} />
                  <span>Column Mapping</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                    <FileText size={16} />
                    <span>File: {uploadedFile?.name}</span>
                    <span className="text-gray-400">|</span>
                    <span>{rows.length} rows detected</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Auto-mapped columns based on header names. Adjust if needed.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {AUTO_KEYS.map((key) => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="w-48 text-sm font-medium text-gray-700">{key}</label>
                      <select
                        className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                        value={(columnMap[key] as string) || ""}
                        onChange={e => setColumnMap({ ...columnMap, [key]: e.target.value })}
                      >
                        <option value="">— not mapped —</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex space-x-3">
                  <Button
                    onClick={handleAnalyze}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <PlayCircle size={16} className="mr-2" />
                    Analyze File
                  </Button>
                  <Button
                    onClick={() => {
                      setStep('upload');
                      setUploadedFile(null);
                      setHeaders([]);
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {step === 'analyze' && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-800">
                Analyzing Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing {rows.length} records...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'results' && (
          <>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle size={24} className="text-green-600" />
                  <div>
                    <h3 className="text-lg font-medium text-green-900">
                      Analysis Complete
                    </h3>
                    <p className="text-sm text-green-700">
                      Successfully analyzed {rows.length} debtors
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Object.entries(bucketCounts).map(([bucket, count]) => (
                <Card key={bucket} className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {bucket}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-semibold text-gray-900">
                        {count}
                      </div>
                      <Button
                        onClick={() => exportBucket(bucket)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={count === 0}
                      >
                        <Download size={16} className="mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Detailed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 justify-start"
                    onClick={() => navigate('/intelligence-center/fnb-contact-analysis', { state: { uploadId } })}
                  >
                    <Phone size={16} />
                    <span>Contact Info</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 justify-start"
                    onClick={() => navigate('/intelligence-center/fnb-address-analysis', { state: { uploadId } })}
                  >
                    <MapPin size={16} />
                    <span>Address SES</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 justify-start"
                    onClick={() => navigate('/intelligence-center/fnb-payment-analysis', { state: { uploadId } })}
                  >
                    <CreditCard size={16} />
                    <span>Payment History</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 justify-start"
                    onClick={() => navigate('/intelligence-center/fnb-demographics-analysis', { state: { uploadId } })}
                  >
                    <Users size={16} />
                    <span>Demographics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-light text-gray-800">
                  Debtor Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Client Ref', 'Name', 'Cell', 'Capital', 'Last Payment', 'SES', 'Score', 'Bucket'].map(h => (
                          <th key={h} className="px-4 py-2 text-left font-medium text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">{r.clientRef || ''}</td>
                          <td className="px-4 py-2">{`${r.debtorFirstName || ''} ${r.debtorSurname || ''}`.trim()}</td>
                          <td className="px-4 py-2">{r.cell1 || ''}</td>
                          <td className="px-4 py-2 text-right">{r.capitalOnDefault || ''}</td>
                          <td className="px-4 py-2">{r.lastPaymentDate || ''}</td>
                          <td className="px-4 py-2">{r.__ses__ || 'Unknown'}</td>
                          <td className="px-4 py-2 text-right font-medium">{r.__score__ ?? 0}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              r.__bucket__ === 'High' ? 'bg-green-100 text-green-700' :
                              r.__bucket__ === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              r.__bucket__ === 'Low' ? 'bg-gray-100 text-gray-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {r.__bucket__}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 50 && (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Showing first 50 of {rows.length} records
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setStep('upload');
                  setUploadedFile(null);
                  setHeaders([]);
                }}
                variant="outline"
              >
                Analyze Another File
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
