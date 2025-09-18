import { IntelligentCsvAnalyzer } from './intelligentCsvAnalyzer';
import { AdaptiveScoring } from './adaptiveScoring';

interface DebtorRecord {
  // Basic Info
  debtorId: string;
  debtorFirstname: string;
  debtorSurname: string;
  
  // Contact Information
  homePhone1?: string;
  homePhone2?: string;
  cellPhone1?: string;
  cellPhone2?: string;
  cellPhone3?: string;
  cellPhone4?: string;
  workPhone1?: string;
  workPhone2?: string;
  email1?: string;
  email2?: string;
  email3?: string;
  
  // Address Information
  postalAddressLine1?: string;
  postalAddressLine2?: string;
  postalCode?: string;
  streetAddressLine1?: string;
  streetAddressLine2?: string;
  streetPostalCode?: string;
  
  // Financial Information
  amount: string;
  capitalOnDefault?: string;
  capitalPortion?: string;
  interestPortion?: string;
  legalFeePortion?: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: string;
  
  // Demographics
  occupation?: string;
  nationality?: string;
  maritalStatus?: string;
  
  // Legal Status
  previousAttorneyLegalStage?: string;
  adminRef?: string;
  adminApplicationDate?: string;
}

interface ProcessedDebtor {
  id: number;
  name: string;
  score: number;
  amount: string;
  lastPayment: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  occupation: string;
  scoring: {
    contactInfo: { score: number; max: number };
    paymentBehaviour: { score: number; max: number };
    debtCharacteristics: { score: number; max: number };
    socioEconomic: { score: number; max: number };
    legalStatus: { score: number; max: number };
  };
}

export interface AnalysisResults {
  highProbability: {
    count: number;
    totalValue: string;
    avgScore: number;
    debtors: ProcessedDebtor[];
  };
  mediumProbability: {
    count: number;
    totalValue: string;
    avgScore: number;
    debtors: ProcessedDebtor[];
  };
  lowProbability: {
    count: number;
    totalValue: string;
    avgScore: number;
    debtors: ProcessedDebtor[];
  };
}

// Helper function to safely get numeric value
function getNumericValue(value: string | undefined): number {
  if (!value || value.trim() === '') return 0;
  const cleaned = value.replace(/[N$,\s]/g, '').replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Helper function to check if contact info is valid
function isValidContact(value: string | undefined): boolean {
  if (!value || value.trim() === '') return false;
  const cleaned = value.trim();
  if (cleaned.length < 5) return false;
  // Basic validation for phone (should contain digits) and email (should contain @)
  return /\d{3,}/.test(cleaned) || /@.+\..+/.test(cleaned);
}

// Helper function to classify socio-economic area based on postal code/address
function classifySocioEconomic(postalCode: string | undefined, address: string | undefined): 'upmarket' | 'mid-income' | 'low-income' {
  const addressLower = (address || '').toLowerCase();
  const postalCodeNum = parseInt(postalCode?.replace(/\D/g, '') || '0');
  
  // Updated area classifications for Windhoek, Namibia
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
  
  // Check for upmarket areas
  if (upmarketKeywords.some(keyword => addressLower.includes(keyword)) || postalCodeNum >= 9000) {
    return 'upmarket';
  }
  
  // Check for mid-income areas
  if (midIncomeKeywords.some(keyword => addressLower.includes(keyword))) {
    return 'mid-income';
  }
  
  // Check for low-income areas
  if (lowIncomeKeywords.some(keyword => addressLower.includes(keyword)) || postalCodeNum < 1000) {
    return 'low-income';
  }
  
  return 'mid-income';
}

// Helper function to parse date
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Try different date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
  ];
  
  const cleaned = dateStr.trim();
  
  try {
    // Try parsing as-is first
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // If DD/MM/YYYY format, convert to YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      const [day, month, year] = cleaned.split('/');
      return new Date(`${year}-${month}-${day}`);
    }
    
    // If DD-MM-YYYY format, convert to YYYY-MM-DD
    if (/^\d{2}-\d{2}-\d{4}$/.test(cleaned)) {
      const [day, month, year] = cleaned.split('-');
      return new Date(`${year}-${month}-${day}`);
    }
  } catch (error) {
    console.warn('Failed to parse date:', dateStr);
  }
  
  return null;
}

// Main scoring function
function calculateDebtorScore(record: DebtorRecord): ProcessedDebtor['scoring'] & { totalScore: number } {
  let contactScore = 0;
  let paymentScore = 0;
  let debtScore = 0;
  let socioScore = 0;
  let legalScore = 0;

  // 1. Contact Information Scoring (Max 30 points)
  const phones = [record.cellPhone1, record.cellPhone2, record.cellPhone3, record.cellPhone4, record.homePhone1, record.homePhone2].filter(isValidContact);
  const emails = [record.email1, record.email2, record.email3].filter(isValidContact);
  const workContacts = [record.workPhone1, record.workPhone2].filter(isValidContact);
  const hasValidAddress = !!(record.streetAddressLine1 || record.postalAddressLine1);

  if (phones.length > 0) contactScore += 15; // Valid cellphone
  if (emails.length > 0) contactScore += 5;  // Valid email
  if (workContacts.length > 0) contactScore += 5; // Valid workplace contact
  if (hasValidAddress) contactScore += 5; // Valid address
  if (phones.length === 0 && emails.length === 0 && workContacts.length === 0) {
    contactScore -= 10; // No contact info penalty
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
    // > 90 days = 0 points
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
      debtScore -= 5; // Penalty for high interest portion
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

  // Stable occupation bonus
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
  // Insolvency/Administrator = 0 points

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

// Enhanced CSV processing with intelligent analysis
export async function processIntelligentCsv(
  file: File, 
  customMapping?: Record<string, string>
): Promise<{
  rawData: any[];
  analysisResults: AnalysisResults;
  mapping: Record<string, string>;
  confidence: number;
}> {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting intelligent CSV processing for:', file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        
        // Use intelligent analysis if no custom mapping provided
        let mapping = customMapping;
        let confidence = 100;
        
        if (!customMapping) {
          console.log('🧠 No custom mapping - using intelligent analysis...');
          const analysis = IntelligentCsvAnalyzer.analyzeCsvStructure(csvContent);
          mapping = analysis.suggestedMappings;
          confidence = analysis.confidence;
          
          console.log('📊 Intelligent analysis complete:', {
            confidence,
            mappingsFound: Object.keys(mapping).length
          });
        }
        
        const { rawData, analysisResults } = this.parseWithMapping(csvContent, mapping || {});
        
        resolve({
          rawData,
          analysisResults,
          mapping: mapping || {},
          confidence
        });
      } catch (error) {
        console.error('Intelligent CSV processing error:', error);
        reject(new Error('Failed to process CSV file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      console.error('File reading error');
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

// Parse CSV with intelligent mapping
export function parseWithMapping(
  csvContent: string, 
  mapping: Record<string, string>
): { rawData: any[]; analysisResults: AnalysisResults } {
  console.log('🔄 Processing CSV with intelligent mapping...');
  
  const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }
  
  const headers = IntelligentCsvAnalyzer.parseCSVLine(lines[0]);
  console.log('📋 Headers:', headers);
  console.log('🗺️ Using mapping:', mapping);
  
  const rawData: any[] = [];
  const processedDebtors: ProcessedDebtor[] = [];
  
  // Process each row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = IntelligentCsvAnalyzer.parseCSVLine(line);
    const rawRecord: Record<string, string> = {};
    const mappedRecord: Record<string, string> = {};
    
    // Create both raw and mapped records
    headers.forEach((header, index) => {
      const value = values[index] || '';
      rawRecord[header] = value;
      
      if (mapping[header]) {
        mappedRecord[mapping[header]] = value;
      }
    });
    
    rawData.push(rawRecord);
    
    console.log(`🏗️ Processing debtor ${i}:`, {
      name: `${mappedRecord.debtorFirstname || 'Unknown'} ${mappedRecord.debtorSurname || 'Unknown'}`,
      amount: mappedRecord.amount,
      hasPhone: !!mappedRecord.cellPhone1,
      hasEmail: !!mappedRecord.email1
    });
    
    // Calculate adaptive score
    try {
      const scoringResult = AdaptiveScoring.calculateAdaptiveScore(
        rawRecord,
        mapping,
        85 // Default data quality if not calculated
      );
      
      // Create processed debtor with enhanced data
      const processedDebtor: ProcessedDebtor = {
        id: i,
        name: `${mappedRecord.debtorFirstname || 'Unknown'} ${mappedRecord.debtorSurname || 'Unknown'}`,
        score: scoringResult.totalScore,
        amount: this.formatAmount(mappedRecord.amount),
        lastPayment: mappedRecord.lastPaymentDate || 'No payment',
        phone: mappedRecord.cellPhone1 || mappedRecord.homePhone1 || 'No phone',
        email: mappedRecord.email1 || 'No email',
        address: mappedRecord.streetAddressLine1 || mappedRecord.postalAddressLine1 || 'No address',
        postalCode: mappedRecord.postalCode || mappedRecord.streetPostalCode || 'N/A',
        occupation: mappedRecord.occupation || 'Unknown',
        scoring: {
          contactInfo: scoringResult.breakdown.contactInfo,
          paymentBehaviour: scoringResult.breakdown.paymentBehaviour,
          debtCharacteristics: scoringResult.breakdown.debtCharacteristics,
          socioEconomic: scoringResult.breakdown.socioEconomic,
          legalStatus: scoringResult.breakdown.legalStatus
        }
      };
      
      processedDebtors.push(processedDebtor);
      
    } catch (scoringError) {
      console.warn(`⚠️ Scoring failed for debtor ${i}:`, scoringError);
      
      // Fallback to legacy scoring
      const legacyRecord: DebtorRecord = this.convertToLegacyRecord(mappedRecord, i);
      const legacyScoring = calculateDebtorScore(legacyRecord);
      
      const processedDebtor: ProcessedDebtor = {
        id: i,
        name: `${mappedRecord.debtorFirstname || 'Unknown'} ${mappedRecord.debtorSurname || 'Unknown'}`,
        score: legacyScoring.totalScore,
        amount: this.formatAmount(mappedRecord.amount),
        lastPayment: mappedRecord.lastPaymentDate || 'No payment',
        phone: mappedRecord.cellPhone1 || mappedRecord.homePhone1 || 'No phone',
        email: mappedRecord.email1 || 'No email',
        address: mappedRecord.streetAddressLine1 || mappedRecord.postalAddressLine1 || 'No address',
        postalCode: mappedRecord.postalCode || mappedRecord.streetPostalCode || 'N/A',
        occupation: mappedRecord.occupation || 'Unknown',
        scoring: {
          contactInfo: legacyScoring.contactInfo,
          paymentBehaviour: legacyScoring.paymentBehaviour,
          debtCharacteristics: legacyScoring.debtCharacteristics,
          socioEconomic: legacyScoring.socioEconomic,
          legalStatus: legacyScoring.legalStatus
        }
      };
      
      processedDebtors.push(processedDebtor);
    }
  }
  
  console.log('📊 Processed debtors:', processedDebtors.length);
  
  if (processedDebtors.length === 0) {
    throw new Error('No valid debtor records could be processed from the CSV file');
  }
  
  // Categorize debtors
  const highProbability = processedDebtors.filter(d => d.score >= 70);
  const mediumProbability = processedDebtors.filter(d => d.score >= 40 && d.score < 70);
  const lowProbability = processedDebtors.filter(d => d.score < 40);
  
  console.log('📈 Categorization complete:', {
    high: highProbability.length,
    medium: mediumProbability.length,
    low: lowProbability.length
  });
  
  // Calculate category statistics
  const calculateCategoryStats = (debtors: ProcessedDebtor[]) => {
    const totalValue = debtors.reduce((sum, d) => sum + this.parseAmount(d.amount), 0);
    const avgScore = debtors.length > 0 ? Math.round(debtors.reduce((sum, d) => sum + d.score, 0) / debtors.length) : 0;
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
  
  return { rawData, analysisResults };
}

// Helper methods for the new system
export class CsvProcessorHelpers {
  static parseCSVLine = IntelligentCsvAnalyzer.parseCSVLine;
  
  static formatAmount(amountStr: string | null): string {
    if (!amountStr) return 'N$ 0';
    const numericValue = parseFloat(amountStr.replace(/[^\d.-]/g, '')) || 0;
    return `N$ ${numericValue.toLocaleString()}`;
  }
  
  static parseAmount(amountStr: string): number {
    return parseFloat(amountStr.replace(/[N$,\s]/g, '')) || 0;
  }
  
  static convertToLegacyRecord(mappedRecord: Record<string, string>, id: number): DebtorRecord {
    return {
      debtorId: mappedRecord.debtorId || `DEBTOR_${id}`,
      debtorFirstname: mappedRecord.debtorFirstname || 'Unknown',
      debtorSurname: mappedRecord.debtorSurname || 'Unknown',
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
      amount: mappedRecord.amount || '0',
      capitalOnDefault: mappedRecord.capitalOnDefault,
      capitalPortion: mappedRecord.capitalPortion,
      interestPortion: mappedRecord.interestPortion,
      legalFeePortion: mappedRecord.legalFeePortion,
      lastPaymentDate: mappedRecord.lastPaymentDate,
      lastPaymentAmount: mappedRecord.lastPaymentAmount,
      occupation: mappedRecord.occupation,
      nationality: mappedRecord.nationality,
      maritalStatus: mappedRecord.maritalStatus,
      previousAttorneyLegalStage: mappedRecord.legalStatus || mappedRecord.previousAttorneyLegalStage,
      adminRef: mappedRecord.adminRef,
      adminApplicationDate: mappedRecord.adminApplicationDate
    };
  }
}

// Legacy function - keeping for compatibility
export async function processCsvFile(file: File): Promise<AnalysisResults> {
  const result = await processIntelligentCsv(file);
  return result.analysisResults;
}

// Separate function to parse CSV and return both raw data and analysis
export async function parseCsvFile(file: File): Promise<{ rawData: any[], analysisResults: AnalysisResults }> {
  return new Promise((resolve, reject) => {
   console.log('Starting CSV file parsing for:', file.name, 'Size:', file.size, 'bytes');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
       console.log('File read successfully, processing content...');
        const csvContent = e.target?.result as string;
        
        // Try intelligent processing first
        try {
          const analysis = IntelligentCsvAnalyzer.analyzeCsvStructure(csvContent);
          const result = parseWithMapping(csvContent, analysis.suggestedMappings);
          console.log('✅ Intelligent processing successful');
          resolve(result);
          return;
        } catch (intelligentError) {
          console.warn('⚠️ Intelligent processing failed, falling back to legacy:', intelligentError);
        }
        
        // Fallback to legacy processing
        const result = parseAndProcessCsv(csvContent);
       console.log('CSV parsing completed successfully');
        resolve(result);
      } catch (error) {
        console.error('CSV parsing error:', error);
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
    
   // Add timeout for large files
   setTimeout(() => {
     reject(new Error('File reading timeout - file may be too large'));
   }, 30000); // 30 second timeout
   
    reader.readAsText(file);
  });
}

// Internal function to parse and process CSV content
function parseAndProcessCsv(csvContent: string): { rawData: any[], analysisResults: AnalysisResults } {
  console.log('CSV content loaded:', csvContent.substring(0, 200) + '...');
  
  const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
  console.log('Total lines:', lines.length);
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log('Headers found:', headers.slice(0, 10));
  
  const rawData: any[] = [];
  const processedDebtors: ProcessedDebtor[] = [];
  
  // Process each row (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle CSV parsing with proper comma splitting (respecting quotes)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Don't forget the last value
    
    const record: any = {};
    
    // Map CSV columns to record object with more flexible matching
    headers.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^\w]/g, '');
      
      let value = values[index] || '';
      value = value.replace(/"/g, '').trim();
      
      // Create a more flexible mapping
      const fieldMapping: { [key: string]: string } = {
        'debtorid': 'debtorId',
        'debtorfirstname': 'debtorFirstname', 
        'debtorsurname': 'debtorSurname',
        'homephone1': 'homePhone1',
        'homephone2': 'homePhone2',
        'cellphone1': 'cellPhone1',
        'cellphone2': 'cellPhone2',
        'cellphone3': 'cellPhone3',
        'cellphone4': 'cellPhone4',
        'workphone1': 'workPhone1',
        'workphone2': 'workPhone2',
        'email1': 'email1',
        'email2': 'email2',
        'email3': 'email3',
        'postaladdressline1': 'postalAddressLine1',
        'postaladdressline2': 'postalAddressLine2',
        'postalcode': 'postalCode',
        'streetaddressline1': 'streetAddressLine1',
        'streetaddressline2': 'streetAddressLine2',
        'streetpostalcode': 'streetPostalCode',
        'amount': 'amount',
        'capitalondefault': 'capitalOnDefault',
        'capitalportion': 'capitalPortion',
        'interestportion': 'interestPortion',
        'legalfeeportion': 'legalFeePortion',
        'lastpaymentdatebeforehandover': 'lastPaymentDate',
        'lastpaymentamount': 'lastPaymentAmount',
        'occupation': 'occupation',
        'nationality': 'nationality',
        'maritalstatus': 'maritalStatus',
        'previousattorneylegalstage': 'previousAttorneyLegalStage',
        'adminref': 'adminRef',
        'adminapplicationdate': 'adminApplicationDate'
      };
      
      const mappedField = fieldMapping[normalizedHeader] || normalizedHeader;
      record[mappedField] = value;
    });
    
    // Store raw data
    rawData.push(record);
    
    console.log(`Processing debtor ${i}:`, {
      name: `${record.debtorFirstname || 'Unknown'} ${record.debtorSurname || 'Debtor'}`,
      amount: record.amount,
      phone: record.cellPhone1,
      email: record.email1
    });
    
    // Create debtor record with fallbacks
    const debtorRecord: DebtorRecord = {
      debtorId: record.debtorId || `DEBTOR_${i}`,
      debtorFirstname: record.debtorFirstname || 'Unknown',
      debtorSurname: record.debtorSurname || 'Debtor',
      homePhone1: record.homePhone1,
      homePhone2: record.homePhone2,
      cellPhone1: record.cellPhone1,
      cellPhone2: record.cellPhone2,
      cellPhone3: record.cellPhone3,
      cellPhone4: record.cellPhone4,
      workPhone1: record.workPhone1,
      workPhone2: record.workPhone2,
      email1: record.email1,
      email2: record.email2,
      email3: record.email3,
      postalAddressLine1: record.postalAddressLine1,
      postalAddressLine2: record.postalAddressLine2,
      postalCode: record.postalCode,
      streetAddressLine1: record.streetAddressLine1,
      streetAddressLine2: record.streetAddressLine2,
      streetPostalCode: record.streetPostalCode,
      amount: record.amount || '0',
      capitalOnDefault: record.capitalOnDefault,
      capitalPortion: record.capitalPortion,
      interestPortion: record.interestPortion,
      legalFeePortion: record.legalFeePortion,
      lastPaymentDate: record.lastPaymentDate,
      lastPaymentAmount: record.lastPaymentAmount,
      occupation: record.occupation,
      nationality: record.nationality,
      maritalStatus: record.maritalStatus,
      previousAttorneyLegalStage: record.previousAttorneyLegalStage,
      adminRef: record.adminRef,
      adminApplicationDate: record.adminApplicationDate
    };
    
    // Calculate scoring
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
  
  // Calculate totals
  const calculateCategoryStats = (debtors: ProcessedDebtor[]) => {
    const totalValue = debtors.reduce((sum, d) => sum + getNumericValue(d.amount), 0);
    const avgScore = debtors.length > 0 ? Math.round(debtors.reduce((sum, d) => sum + d.score, 0) / debtors.length) : 0;
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
  
  console.log('Final results:', analysisResults);
  return { rawData, analysisResults };
}

// Legacy function - keeping for compatibility
export async function legacyProcessCsvFile(file: File): Promise<AnalysisResults> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        console.log('CSV content loaded:', csv.substring(0, 200) + '...');
        
        const lines = csv.split('\n').filter(line => line.trim().length > 0);
        console.log('Total lines:', lines.length);
        
        if (lines.length < 2) {
          throw new Error('CSV file must contain at least a header row and one data row');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        console.log('Headers found:', headers.slice(0, 10));
        
        const processedDebtors: ProcessedDebtor[] = [];
        
        // Process each row (skip header)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Handle CSV parsing with proper comma splitting (respecting quotes)
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim()); // Don't forget the last value
          
          const record: any = {};
          
          // Map CSV columns to record object with more flexible matching
          headers.forEach((header, index) => {
            const normalizedHeader = header.toLowerCase()
              .replace(/\s+/g, '')
              .replace(/[^\w]/g, '');
            
            let value = values[index] || '';
            value = value.replace(/"/g, '').trim();
            
            // Create a more flexible mapping
            const fieldMapping: { [key: string]: string } = {
              'debtorid': 'debtorId',
              'debtorfirstname': 'debtorFirstname', 
              'debtorsurname': 'debtorSurname',
              'homephone1': 'homePhone1',
              'homephone2': 'homePhone2',
              'cellphone1': 'cellPhone1',
              'cellphone2': 'cellPhone2',
              'cellphone3': 'cellPhone3',
              'cellphone4': 'cellPhone4',
              'workphone1': 'workPhone1',
              'workphone2': 'workPhone2',
              'email1': 'email1',
              'email2': 'email2',
              'email3': 'email3',
              'postaladdressline1': 'postalAddressLine1',
              'postaladdressline2': 'postalAddressLine2',
              'postalcode': 'postalCode',
              'streetaddressline1': 'streetAddressLine1',
              'streetaddressline2': 'streetAddressLine2',
              'streetpostalcode': 'streetPostalCode',
              'amount': 'amount',
              'capitalondefault': 'capitalOnDefault',
              'capitalportion': 'capitalPortion',
              'interestportion': 'interestPortion',
              'legalfeeportion': 'legalFeePortion',
              'lastpaymentdatebeforehandover': 'lastPaymentDate',
              'lastpaymentamount': 'lastPaymentAmount',
              'occupation': 'occupation',
              'nationality': 'nationality',
              'maritalstatus': 'maritalStatus',
              'previousattorneylegalstage': 'previousAttorneyLegalStage',
              'adminref': 'adminRef',
              'adminapplicationdate': 'adminApplicationDate'
            };
            
            const mappedField = fieldMapping[normalizedHeader] || normalizedHeader;
            record[mappedField] = value;
          });
          
          console.log(`Processing debtor ${i}:`, {
            name: `${record.debtorFirstname || 'Unknown'} ${record.debtorSurname || 'Debtor'}`,
            amount: record.amount,
            phone: record.cellPhone1,
            email: record.email1
          });
          
          // Create debtor record with fallbacks
          const debtorRecord: DebtorRecord = {
            debtorId: record.debtorId || `DEBTOR_${i}`,
            debtorFirstname: record.debtorFirstname || 'Unknown',
            debtorSurname: record.debtorSurname || 'Debtor',
            homePhone1: record.homePhone1,
            homePhone2: record.homePhone2,
            cellPhone1: record.cellPhone1,
            cellPhone2: record.cellPhone2,
            cellPhone3: record.cellPhone3,
            cellPhone4: record.cellPhone4,
            workPhone1: record.workPhone1,
            workPhone2: record.workPhone2,
            email1: record.email1,
            email2: record.email2,
            email3: record.email3,
            postalAddressLine1: record.postalAddressLine1,
            postalAddressLine2: record.postalAddressLine2,
            postalCode: record.postalCode,
            streetAddressLine1: record.streetAddressLine1,
            streetAddressLine2: record.streetAddressLine2,
            streetPostalCode: record.streetPostalCode,
            amount: record.amount || '0',
            capitalOnDefault: record.capitalOnDefault,
            capitalPortion: record.capitalPortion,
            interestPortion: record.interestPortion,
            legalFeePortion: record.legalFeePortion,
            lastPaymentDate: record.lastPaymentDate,
            lastPaymentAmount: record.lastPaymentAmount,
            occupation: record.occupation,
            nationality: record.nationality,
            maritalStatus: record.maritalStatus,
            previousAttorneyLegalStage: record.previousAttorneyLegalStage,
            adminRef: record.adminRef,
            adminApplicationDate: record.adminApplicationDate
          };
          
          // Calculate scoring
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
        
        // Calculate totals
        const calculateCategoryStats = (debtors: ProcessedDebtor[]) => {
          const totalValue = debtors.reduce((sum, d) => sum + getNumericValue(d.amount), 0);
          const avgScore = debtors.length > 0 ? Math.round(debtors.reduce((sum, d) => sum + d.score, 0) / debtors.length) : 0;
          return {
            count: debtors.length,
            totalValue: `N$ ${totalValue.toLocaleString()}`,
            avgScore,
            debtors
          };
        };
        
        const results: AnalysisResults = {
          highProbability: calculateCategoryStats(highProbability),
          mediumProbability: calculateCategoryStats(mediumProbability),
          lowProbability: calculateCategoryStats(lowProbability)
        };
        
        console.log('Final results:', results);
        resolve(results);
        
      } catch (error) {
        console.error('CSV processing error:', error);
        reject(new Error('Failed to process CSV file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      console.error('File reading error');
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}