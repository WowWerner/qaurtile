import { AnalysisResults, ProcessedDebtor, DebtorRecord } from './csvProcessor';
import { normalizeHeader, createMappingDictionary, type FieldMapping } from './headerMapper';

// Parse CSV with custom field mappings
export async function parseCSVWithMapping(
  file: File,
  mappings: FieldMapping[]
): Promise<{ rawData: any[]; analysisResults: AnalysisResults; headers: string[] }> {
  return new Promise((resolve, reject) => {
    console.log('Starting enhanced CSV parsing with custom mappings');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const result = processCSVContent(csvContent, mappings);
        resolve(result);
      } catch (error) {
        console.error('CSV processing error:', error);
        if (error instanceof Error) {
          reject(new Error(`Failed to parse CSV file: ${error.message}`));
        } else {
          reject(new Error('Failed to parse CSV file: Unknown parsing error'));
        }
      }
    };

    reader.onerror = () => {
      console.error('File reading error');
      reject(new Error('Failed to read file'));
    };

    setTimeout(() => {
      reject(new Error('File reading timeout - file may be too large'));
    }, 60000); // 60 second timeout

    reader.readAsText(file);
  });
}

// Extract headers and first few rows for preview
export function extractCSVPreview(csvContent: string): {
  headers: string[];
  sampleRows: { [key: string]: string }[];
} {
  const lines = csvContent.split('\n').filter(line => line.trim().length > 0);

  if (lines.length < 1) {
    throw new Error('CSV file is empty');
  }

  // Parse header line
  const headers = parseCSVLine(lines[0]);

  // Parse first 5 data rows for sample
  const sampleRows: { [key: string]: string }[] = [];
  for (let i = 1; i < Math.min(6, lines.length); i++) {
    const values = parseCSVLine(lines[i]);
    const row: { [key: string]: string } = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    sampleRows.push(row);
  }

  return { headers, sampleRows };
}

// Parse a single CSV line handling quotes properly
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Don't forget the last value
  values.push(current.trim());

  return values.map(v => v.replace(/^"|"$/g, ''));
}

// Process CSV content with field mappings
function processCSVContent(
  csvContent: string,
  mappings: FieldMapping[]
): { rawData: any[]; analysisResults: AnalysisResults; headers: string[] } {
  console.log('Processing CSV content with custom mappings');

  const lines = csvContent.split('\n').filter(line => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }

  const headers = parseCSVLine(lines[0]);
  console.log('Headers found:', headers.slice(0, 10));

  // Create mapping dictionary for quick lookup
  const mappingDict = createMappingDictionary(mappings);

  const rawData: any[] = [];
  const processedDebtors: ProcessedDebtor[] = [];

  // Process each data row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    if (values.length !== headers.length) {
      console.warn(`Row ${i} has ${values.length} values but expected ${headers.length}`);
    }

    const record: any = {};
    const mappedRecord: Partial<DebtorRecord> = {};

    // Map each column to its internal field
    headers.forEach((header, index) => {
      const value = values[index] || '';
      const normalizedHeader = normalizeHeader(header);
      const internalField = mappingDict[normalizedHeader];

      // Store raw data with original header
      record[header] = value;

      // Store mapped data with internal field name
      if (internalField) {
        mappedRecord[internalField as keyof DebtorRecord] = value as any;
      }
    });

    rawData.push(record);

    // Create debtor record with fallbacks for required fields
    const debtorRecord: DebtorRecord = {
      debtorId: mappedRecord.debtorId || `DEBTOR_${i}`,
      debtorFirstname: mappedRecord.debtorFirstname || 'Unknown',
      debtorSurname: mappedRecord.debtorSurname || 'Debtor',
      amount: mappedRecord.amount || '0',
      homePhone1: mappedRecord.homePhone1,
      homePhone2: mappedRecord.homePhone2,
      cellPhone1: mappedRecord.cellPhone1,
      cellPhone2: mappedRecord.cellPhone2,
      cellPhone3: mappedRecord.cellPhone3,
      cellPhone4: mappedRecord.cellPhone4,
      workPhone1: mappedRecord.workPhone1,
      workPhone2: mappedRecord.workPhone2,
      email1: mappedRecord.email1,
      email2: mappedRecord.email2,
      email3: mappedRecord.email3,
      postalAddressLine1: mappedRecord.postalAddressLine1,
      postalAddressLine2: mappedRecord.postalAddressLine2,
      postalCode: mappedRecord.postalCode,
      streetAddressLine1: mappedRecord.streetAddressLine1,
      streetAddressLine2: mappedRecord.streetAddressLine2,
      streetPostalCode: mappedRecord.streetPostalCode,
      capitalOnDefault: mappedRecord.capitalOnDefault,
      capitalPortion: mappedRecord.capitalPortion,
      interestPortion: mappedRecord.interestPortion,
      legalFeePortion: mappedRecord.legalFeePortion,
      lastPaymentDate: mappedRecord.lastPaymentDate,
      lastPaymentAmount: mappedRecord.lastPaymentAmount,
      occupation: mappedRecord.occupation,
      nationality: mappedRecord.nationality,
      maritalStatus: mappedRecord.maritalStatus,
      previousAttorneyLegalStage: mappedRecord.previousAttorneyLegalStage,
      adminRef: mappedRecord.adminRef,
      adminApplicationDate: mappedRecord.adminApplicationDate
    };

    // Calculate scoring (import from existing csvProcessor)
    const scoring = calculateDebtorScore(debtorRecord);

    // Create processed debtor
    const processedDebtor: ProcessedDebtor = {
      id: i,
      name: `${debtorRecord.debtorFirstname} ${debtorRecord.debtorSurname}`,
      score: scoring.totalScore,
      amount: `N$ ${getNumericValue(debtorRecord.amount).toLocaleString()}`,
      lastPayment: debtorRecord.lastPaymentDate || 'No payment',
      phone: debtorRecord.cellPhone1 || debtorRecord.homePhone1 || 'No phone',
      email: debtorRecord.email1 || 'No email',
      address: debtorRecord.streetAddressLine1 || debtorRecord.postalAddressLine1 || 'No address',
      postalCode: debtorRecord.postalCode || debtorRecord.streetPostalCode || 'N/A',
      occupation: debtorRecord.occupation || 'Unknown',
      scoring: {
        contactInfo: scoring.contactInfo,
        paymentBehaviour: scoring.paymentBehaviour,
        debtCharacteristics: scoring.debtCharacteristics,
        socioEconomic: scoring.socioEconomic,
        legalStatus: scoring.legalStatus
      }
    };

    processedDebtors.push(processedDebtor);
  }

  console.log('Processed debtors:', processedDebtors.length);

  if (processedDebtors.length === 0) {
    throw new Error('No valid debtor records found in CSV file');
  }

  // Categorize debtors
  const highProbability = processedDebtors.filter(d => d.score >= 70);
  const mediumProbability = processedDebtors.filter(d => d.score >= 40 && d.score < 70);
  const lowProbability = processedDebtors.filter(d => d.score < 40);

  console.log('Categorization:', {
    high: highProbability.length,
    medium: mediumProbability.length,
    low: lowProbability.length
  });

  // Calculate category statistics
  const calculateCategoryStats = (debtors: ProcessedDebtor[]) => {
    const totalValue = debtors.reduce((sum, d) => sum + getNumericValue(d.amount), 0);
    const avgScore = debtors.length > 0
      ? Math.round(debtors.reduce((sum, d) => sum + d.score, 0) / debtors.length)
      : 0;

    return {
      count: debtors.length,
      totalValue: `N$ ${totalValue.toLocaleString()}`,
      avgScore,
      debtors
    };
  };

  const analysisResults: AnalysisResults = {
    highProbability: calculateCategoryStats(highProbability),
    mediumProbability: calculateCategoryStats(mediumProbability),
    lowProbability: calculateCategoryStats(lowProbability)
  };

  console.log('Analysis complete');
  return { rawData, analysisResults, headers };
}

// Helper functions imported from original csvProcessor
function getNumericValue(value: string | undefined): number {
  if (!value || value.trim() === '') return 0;

  // Remove currency symbols, spaces, and commas
  const cleaned = value.replace(/[N$,\s]/g, '');

  // Check if this looks like a date (contains multiple slashes or dashes, or is too long)
  if (cleaned.includes('/') || cleaned.includes('-') || cleaned.length > 15) {
    console.warn(`Invalid amount value detected (possibly a date): ${value}`);
    return 0;
  }

  // Remove all non-numeric characters except dot and minus
  const numeric = cleaned.replace(/[^\d.-]/g, '');
  const num = parseFloat(numeric);

  // Sanity check: amounts should be reasonable (< 1 billion)
  if (isNaN(num) || num < 0 || num > 1000000000) {
    console.warn(`Invalid or unreasonable amount value: ${value} -> ${num}`);
    return 0;
  }

  return num;
}

function isValidContact(value: string | undefined): boolean {
  if (!value || value.trim() === '') return false;
  const cleaned = value.trim();
  if (cleaned.length < 5) return false;
  return /\d{3,}/.test(cleaned) || /@.+\..+/.test(cleaned);
}

function classifySocioEconomic(
  postalCode: string | undefined,
  address: string | undefined
): 'upmarket' | 'mid-income' | 'low-income' {
  const addressLower = (address || '').toLowerCase();
  const postalCodeNum = parseInt(postalCode?.replace(/\D/g, '') || '0');

  const lowIncomeKeywords = [
    'okuryangava', 'wanaheda', 'goreangab', 'havana', 'greenwell matongo',
    'okahandja park', 'one nation', 'ombili', 'katutura', 'mix'
  ];

  const midIncomeKeywords = [
    'windhoek west', 'windhoek north', 'khomasdal', 'otjomuise',
    'academia', 'dorado park', 'dorado valley'
  ];

  const upmarketKeywords = [
    'klein windhoek', 'ludwigsdorf', 'eros', 'luxuryhill', 'olympia', 'avis',
    'auasblick', 'finkenstein estate', 'cimbebasia', 'pionierspark', 'suiderhof',
    'hochland park', 'kleine kuppe', 'elisenheim', 'omeya', 'cbd',
    'southern industry', 'northern industry', 'prosperita', 'lafrenz', 'brakwater'
  ];

  if (upmarketKeywords.some(keyword => addressLower.includes(keyword)) || postalCodeNum >= 9000) {
    return 'upmarket';
  }

  if (midIncomeKeywords.some(keyword => addressLower.includes(keyword))) {
    return 'mid-income';
  }

  if (lowIncomeKeywords.some(keyword => addressLower.includes(keyword)) || postalCodeNum < 1000) {
    return 'low-income';
  }

  return 'mid-income';
}

function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;

  const cleaned = dateStr.trim();

  try {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      const [day, month, year] = cleaned.split('/');
      return new Date(`${year}-${month}-${day}`);
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(cleaned)) {
      const [day, month, year] = cleaned.split('-');
      return new Date(`${year}-${month}-${day}`);
    }
  } catch (error) {
    console.warn('Failed to parse date:', dateStr);
  }

  return null;
}

function calculateDebtorScore(record: DebtorRecord): {
  contactInfo: { score: number; max: number };
  paymentBehaviour: { score: number; max: number };
  debtCharacteristics: { score: number; max: number };
  socioEconomic: { score: number; max: number };
  legalStatus: { score: number; max: number };
  totalScore: number;
} {
  let contactScore = 0;
  let paymentScore = 0;
  let debtScore = 0;
  let socioScore = 0;
  let legalScore = 0;

  // 1. Contact Information Scoring (Max 30 points)
  const phones = [
    record.cellPhone1,
    record.cellPhone2,
    record.cellPhone3,
    record.cellPhone4,
    record.homePhone1,
    record.homePhone2
  ].filter(isValidContact);
  const emails = [record.email1, record.email2, record.email3].filter(isValidContact);
  const workContacts = [record.workPhone1, record.workPhone2].filter(isValidContact);
  const hasValidAddress = !!(record.streetAddressLine1 || record.postalAddressLine1);

  if (phones.length > 0) contactScore += 15;
  if (emails.length > 0) contactScore += 5;
  if (workContacts.length > 0) contactScore += 5;
  if (hasValidAddress) contactScore += 5;
  if (phones.length === 0 && emails.length === 0 && workContacts.length === 0) {
    contactScore -= 10;
  }

  // 2. Payment Behaviour Scoring (Max 30 points)
  const lastPaymentDate = parseDate(record.lastPaymentDate);
  if (lastPaymentDate) {
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 30) {
      paymentScore += 20;
    } else if (daysDiff <= 90) {
      paymentScore += 10;
    }
  }

  const lastAmount = getNumericValue(record.lastPaymentAmount);
  const totalDebt = getNumericValue(record.amount);
  if (lastAmount > 0 && totalDebt > 0) {
    const paymentPercentage = (lastAmount / totalDebt) * 100;
    if (paymentPercentage >= 25) {
      paymentScore += 10;
    } else if (paymentPercentage >= 5) {
      paymentScore += 5;
    }
  }

  // 3. Debt Characteristics Scoring (Max 20 points)
  const capitalAmount = getNumericValue(record.capitalOnDefault) || getNumericValue(record.amount);
  if (capitalAmount <= 5000) {
    debtScore += 10;
  } else if (capitalAmount <= 50000) {
    debtScore += 5;
  }

  const interestPortion = getNumericValue(record.interestPortion);
  const legalFeePortion = getNumericValue(record.legalFeePortion);
  if (totalDebt > 0 && (interestPortion + legalFeePortion) > 0) {
    const feePercentage = ((interestPortion + legalFeePortion) / totalDebt) * 100;
    if (feePercentage > 50) {
      debtScore -= 5;
    }
  }

  // 4. Socio-Economic Scoring (Max 10 points)
  const socioClass = classifySocioEconomic(
    record.postalCode || record.streetPostalCode,
    record.streetAddressLine1 || record.postalAddressLine1
  );

  if (socioClass === 'upmarket') {
    socioScore += 10;
  } else if (socioClass === 'mid-income') {
    socioScore += 5;
  }

  const occupation = (record.occupation || '').toLowerCase();
  const stableOccupations = ['government', 'corporate', 'manager', 'professional', 'teacher', 'nurse', 'police', 'army'];
  if (stableOccupations.some(occ => occupation.includes(occ))) {
    socioScore += 5;
  }

  // 5. Legal Status Scoring (Max 10 points)
  const legalStage = (record.previousAttorneyLegalStage || '').toLowerCase();
  if (!legalStage || legalStage === 'none' || legalStage === '') {
    legalScore += 10;
  } else if (legalStage.includes('legal') && !legalStage.includes('insolvency') && !legalStage.includes('admin')) {
    legalScore += 5;
  }

  const totalScore = Math.max(0, Math.min(100, contactScore + paymentScore + debtScore + socioScore + legalScore));

  return {
    contactInfo: { score: Math.max(0, contactScore), max: 30 },
    paymentBehaviour: { score: Math.max(0, paymentScore), max: 30 },
    debtCharacteristics: { score: Math.max(0, debtScore), max: 20 },
    socioEconomic: { score: Math.max(0, socioScore), max: 10 },
    legalStatus: { score: Math.max(0, legalScore), max: 10 },
    totalScore
  };
}
