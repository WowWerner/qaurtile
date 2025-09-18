interface ColumnPattern {
  originalName: string;
  normalizedName: string;
  confidence: number;
  dataType: 'text' | 'number' | 'date' | 'phone' | 'email' | 'currency';
  sampleValues: string[];
  mappedField?: string;
  isRequired: boolean;
}

interface CsvAnalysisResult {
  columns: ColumnPattern[];
  dataQuality: {
    totalRows: number;
    validRows: number;
    missingDataPercentage: number;
    duplicateRows: number;
  };
  suggestedMappings: Record<string, string>;
  confidence: number;
  requiredFieldsCovered: number;
  warnings: string[];
}

interface FieldTemplate {
  field: string;
  aliases: string[];
  patterns: RegExp[];
  required: boolean;
  dataType: 'text' | 'number' | 'date' | 'phone' | 'email' | 'currency';
  weight: number;
}

export class IntelligentCsvAnalyzer {
  private static readonly FIELD_TEMPLATES: FieldTemplate[] = [
    // Identity Fields
    {
      field: 'debtorId',
      aliases: ['debtor_id', 'debtorid', 'id', 'account_id', 'customer_id', 'client_id', 'reference', 'ref_no'],
      patterns: [/^(debtor|account|customer|client).*id$/i, /^id$/i, /^ref/i],
      required: false,
      dataType: 'text',
      weight: 5
    },
    {
      field: 'debtorFirstname',
      aliases: ['first_name', 'firstname', 'fname', 'given_name', 'debtor_firstname', 'name_first'],
      patterns: [/^(first|given|fname).*name$/i, /.*firstname$/i],
      required: true,
      dataType: 'text',
      weight: 10
    },
    {
      field: 'debtorSurname',
      aliases: ['last_name', 'lastname', 'surname', 'family_name', 'debtor_surname', 'name_last'],
      patterns: [/^(last|family|surname).*name$/i, /.*surname$/i, /.*lastname$/i],
      required: true,
      dataType: 'text',
      weight: 10
    },
    
    // Contact Fields
    {
      field: 'cellPhone1',
      aliases: ['cell_phone', 'cellphone', 'mobile', 'cell', 'phone', 'contact_number', 'phone_number'],
      patterns: [/^(cell|mobile).*phone$/i, /^phone$/i, /contact.*number/i],
      required: false,
      dataType: 'phone',
      weight: 8
    },
    {
      field: 'homePhone1',
      aliases: ['home_phone', 'homephone', 'tel', 'telephone', 'landline'],
      patterns: [/^home.*phone$/i, /^tel/i],
      required: false,
      dataType: 'phone',
      weight: 6
    },
    {
      field: 'email1',
      aliases: ['email', 'email_address', 'e_mail', 'electronic_mail'],
      patterns: [/^email/i, /^e_mail/i],
      required: false,
      dataType: 'email',
      weight: 7
    },
    
    // Address Fields
    {
      field: 'streetAddressLine1',
      aliases: ['address', 'street_address', 'physical_address', 'home_address', 'residential_address'],
      patterns: [/^(street|physical|home|residential).*address$/i, /^address$/i],
      required: false,
      dataType: 'text',
      weight: 6
    },
    {
      field: 'postalCode',
      aliases: ['postal_code', 'zip_code', 'postcode', 'zip'],
      patterns: [/^(postal|zip).*code$/i, /^postcode$/i],
      required: false,
      dataType: 'text',
      weight: 5
    },
    
    // Financial Fields
    {
      field: 'amount',
      aliases: ['amount', 'debt_amount', 'outstanding', 'balance', 'total_amount', 'principal'],
      patterns: [/^(debt_|outstanding_|total_)?amount$/i, /^balance$/i, /^principal$/i],
      required: true,
      dataType: 'currency',
      weight: 10
    },
    {
      field: 'lastPaymentDate',
      aliases: ['last_payment_date', 'payment_date', 'last_payment', 'recent_payment_date'],
      patterns: [/^(last_|recent_)?payment.*date$/i],
      required: false,
      dataType: 'date',
      weight: 7
    },
    {
      field: 'lastPaymentAmount',
      aliases: ['last_payment_amount', 'payment_amount', 'recent_payment_amount'],
      patterns: [/^(last_|recent_)?payment.*amount$/i],
      required: false,
      dataType: 'currency',
      weight: 6
    },
    
    // Demographics
    {
      field: 'occupation',
      aliases: ['occupation', 'job', 'profession', 'employment', 'work'],
      patterns: [/^(occupation|job|profession|employment)$/i],
      required: false,
      dataType: 'text',
      weight: 5
    },
    
    // Legal
    {
      field: 'legalStatus',
      aliases: ['legal_status', 'attorney_status', 'previous_attorney', 'legal_stage'],
      patterns: [/^(legal|attorney).*status$/i, /^legal.*stage$/i],
      required: false,
      dataType: 'text',
      weight: 4
    }
  ];

  static analyzeHeaders(headers: string[]): ColumnPattern[] {
    return headers.map(header => {
      const normalized = this.normalizeColumnName(header);
      const dataType = this.detectDataType(header);
      
      return {
        originalName: header,
        normalizedName: normalized,
        confidence: 0,
        dataType,
        sampleValues: [],
        isRequired: false
      };
    });
  }

  static analyzeCsvStructure(csvContent: string): CsvAnalysisResult {
    console.log('🔍 Starting intelligent CSV analysis...');
    
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one data row');
    }

    // Parse headers with better CSV handling
    const headers = this.parseCSVLine(lines[0]);
    console.log('📋 Headers detected:', headers);

    // Analyze columns
    const columns = this.analyzeHeaders(headers);

    // Sample data from first few rows to understand patterns
    const sampleSize = Math.min(20, lines.length - 1);
    const sampleRows: string[][] = [];
    
    for (let i = 1; i <= sampleSize; i++) {
      if (lines[i]) {
        const values = this.parseCSVLine(lines[i]);
        sampleRows.push(values);
      }
    }

    // Enhance column analysis with sample data
    columns.forEach((column, index) => {
      const sampleValues = sampleRows
        .map(row => row[index] || '')
        .filter(val => val.trim().length > 0)
        .slice(0, 5);
      
      column.sampleValues = sampleValues;
      column.dataType = this.refineDataType(column.originalName, sampleValues);
    });

    // Generate intelligent field mappings
    const suggestedMappings = this.generateMappings(columns);
    
    // Calculate data quality metrics
    const dataQuality = this.assessDataQuality(lines, headers);
    
    // Calculate confidence and warnings
    const { confidence, requiredFieldsCovered, warnings } = this.calculateConfidence(columns, suggestedMappings);

    console.log('✅ CSV analysis complete:', {
      columnsFound: columns.length,
      confidence,
      requiredFieldsCovered,
      warningCount: warnings.length
    });

    return {
      columns,
      dataQuality,
      suggestedMappings,
      confidence,
      requiredFieldsCovered,
      warnings
    };
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  }

  private static normalizeColumnName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private static detectDataType(columnName: string): 'text' | 'number' | 'date' | 'phone' | 'email' | 'currency' {
    const normalized = columnName.toLowerCase();
    
    if (/phone|tel|mobile|cell/i.test(normalized)) return 'phone';
    if (/email|e_mail/i.test(normalized)) return 'email';
    if (/date|time/i.test(normalized)) return 'date';
    if (/amount|balance|payment|debt|value|price|cost/i.test(normalized)) return 'currency';
    if (/id|number|count|age|year/i.test(normalized)) return 'number';
    
    return 'text';
  }

  private static refineDataType(columnName: string, sampleValues: string[]): 'text' | 'number' | 'date' | 'phone' | 'email' | 'currency' {
    if (sampleValues.length === 0) return this.detectDataType(columnName);

    // Phone number detection
    const phonePattern = /^[\d\s\+\-\(\)]{7,}$/;
    if (sampleValues.some(val => phonePattern.test(val))) return 'phone';

    // Email detection
    const emailPattern = /@.+\./;
    if (sampleValues.some(val => emailPattern.test(val))) return 'email';

    // Currency detection
    const currencyPattern = /^[N$R£€¥]?[\d,\.\s]+$/;
    if (sampleValues.some(val => currencyPattern.test(val.replace(/\s/g, '')))) return 'currency';

    // Date detection
    const datePattern = /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$|^\d{4}-\d{2}-\d{2}$/;
    if (sampleValues.some(val => datePattern.test(val))) return 'date';

    // Number detection
    const numberPattern = /^\d+\.?\d*$/;
    if (sampleValues.every(val => numberPattern.test(val.replace(/,/g, '')))) return 'number';

    return 'text';
  }

  private static generateMappings(columns: ColumnPattern[]): Record<string, string> {
    const mappings: Record<string, string> = {};
    const usedFields = new Set<string>();

    // First pass: exact matches
    columns.forEach(column => {
      const exactMatch = this.FIELD_TEMPLATES.find(template => 
        template.aliases.includes(column.normalizedName)
      );
      
      if (exactMatch && !usedFields.has(exactMatch.field)) {
        mappings[column.originalName] = exactMatch.field;
        usedFields.add(exactMatch.field);
        column.mappedField = exactMatch.field;
        column.confidence = 0.95;
        column.isRequired = exactMatch.required;
      }
    });

    // Second pass: pattern matching
    columns.forEach(column => {
      if (column.mappedField) return; // Already mapped

      let bestMatch: FieldTemplate | null = null;
      let bestScore = 0;

      this.FIELD_TEMPLATES.forEach(template => {
        if (usedFields.has(template.field)) return;

        let score = 0;

        // Pattern matching
        template.patterns.forEach(pattern => {
          if (pattern.test(column.originalName)) {
            score += 0.8;
          }
        });

        // Fuzzy alias matching
        template.aliases.forEach(alias => {
          const similarity = this.calculateStringSimilarity(column.normalizedName, alias);
          if (similarity > 0.7) {
            score += similarity * 0.6;
          }
        });

        // Data type matching
        if (template.dataType === column.dataType) {
          score += 0.3;
        }

        // Boost score for high-weight fields
        score *= (template.weight / 10);

        if (score > bestScore && score > 0.5) {
          bestMatch = template;
          bestScore = score;
        }
      });

      if (bestMatch) {
        mappings[column.originalName] = bestMatch.field;
        usedFields.add(bestMatch.field);
        column.mappedField = bestMatch.field;
        column.confidence = Math.min(0.95, bestScore);
        column.isRequired = bestMatch.required;
      }
    });

    // Third pass: intelligent guessing based on sample data
    columns.forEach(column => {
      if (column.mappedField) return;

      const guess = this.guessFieldFromSamples(column, usedFields);
      if (guess) {
        mappings[column.originalName] = guess.field;
        usedFields.add(guess.field);
        column.mappedField = guess.field;
        column.confidence = guess.confidence;
        column.isRequired = guess.required;
      }
    });

    return mappings;
  }

  private static guessFieldFromSamples(column: ColumnPattern, usedFields: Set<string>): {field: string, confidence: number, required: boolean} | null {
    const samples = column.sampleValues;
    if (samples.length === 0) return null;

    // Phone number guess
    if (column.dataType === 'phone' && !usedFields.has('cellPhone1')) {
      return { field: 'cellPhone1', confidence: 0.7, required: false };
    }

    // Email guess
    if (column.dataType === 'email' && !usedFields.has('email1')) {
      return { field: 'email1', confidence: 0.8, required: false };
    }

    // Currency/amount guess
    if (column.dataType === 'currency') {
      // Check if values look like debt amounts (typically higher values)
      const avgValue = samples
        .map(s => parseFloat(s.replace(/[^\d.]/g, '')))
        .filter(n => !isNaN(n))
        .reduce((sum, n, _, arr) => sum + n / arr.length, 0);

      if (avgValue > 1000 && !usedFields.has('amount')) {
        return { field: 'amount', confidence: 0.8, required: true };
      } else if (!usedFields.has('lastPaymentAmount')) {
        return { field: 'lastPaymentAmount', confidence: 0.6, required: false };
      }
    }

    // Date guess
    if (column.dataType === 'date' && !usedFields.has('lastPaymentDate')) {
      return { field: 'lastPaymentDate', confidence: 0.7, required: false };
    }

    // Address guess
    if (column.dataType === 'text') {
      // Look for address-like content
      const hasAddressKeywords = samples.some(sample => 
        /street|road|avenue|plot|house|area|suburb/i.test(sample)
      );
      
      if (hasAddressKeywords && !usedFields.has('streetAddressLine1')) {
        return { field: 'streetAddressLine1', confidence: 0.6, required: false };
      }

      // Look for occupation-like content
      const hasOccupationKeywords = samples.some(sample =>
        /teacher|manager|nurse|government|corporate|self|employed/i.test(sample)
      );
      
      if (hasOccupationKeywords && !usedFields.has('occupation')) {
        return { field: 'occupation', confidence: 0.6, required: false };
      }
    }

    return null;
  }

  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static getEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private static assessDataQuality(lines: string[], headers: string[]) {
    const totalRows = lines.length - 1; // Exclude header
    let validRows = 0;
    let missingDataCount = 0;
    const rowHashes = new Set<string>();
    let duplicateRows = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      
      // Check for valid row (has some non-empty values)
      const nonEmptyValues = values.filter(val => val.trim().length > 0);
      if (nonEmptyValues.length > 0) {
        validRows++;
      }

      // Count missing data
      missingDataCount += values.filter(val => val.trim().length === 0).length;

      // Check for duplicates
      const rowHash = values.join('|').toLowerCase();
      if (rowHashes.has(rowHash)) {
        duplicateRows++;
      } else {
        rowHashes.add(rowHash);
      }
    }

    const totalCells = totalRows * headers.length;
    const missingDataPercentage = totalCells > 0 ? (missingDataCount / totalCells) * 100 : 0;

    return {
      totalRows,
      validRows,
      missingDataPercentage,
      duplicateRows
    };
  }

  private static calculateConfidence(columns: ColumnPattern[], mappings: Record<string, string>): {
    confidence: number;
    requiredFieldsCovered: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    // Check required fields
    const requiredFields = this.FIELD_TEMPLATES.filter(t => t.required);
    const mappedRequiredFields = requiredFields.filter(field => 
      Object.values(mappings).includes(field.field)
    );
    
    const requiredFieldsCovered = (mappedRequiredFields.length / requiredFields.length) * 100;

    // Check for missing critical fields
    if (!Object.values(mappings).includes('debtorFirstname')) {
      warnings.push('⚠️ No first name field detected - debtor identification may be difficult');
    }
    if (!Object.values(mappings).includes('amount')) {
      warnings.push('⚠️ No debt amount field detected - financial analysis will be limited');
    }
    if (!Object.values(mappings).includes('cellPhone1') && !Object.values(mappings).includes('email1')) {
      warnings.push('⚠️ No contact information detected - collection will be challenging');
    }

    // Check data quality warnings
    const lowConfidenceColumns = columns.filter(col => col.confidence < 0.6);
    if (lowConfidenceColumns.length > 0) {
      warnings.push(`🔍 ${lowConfidenceColumns.length} columns need manual verification`);
    }

    // Calculate overall confidence
    const avgColumnConfidence = columns.length > 0 
      ? columns.reduce((sum, col) => sum + col.confidence, 0) / columns.length
      : 0;
    
    const confidence = (avgColumnConfidence * 0.6) + (requiredFieldsCovered / 100 * 0.4);

    return {
      confidence: confidence * 100,
      requiredFieldsCovered,
      warnings
    };
  }

  static validateMapping(mapping: Record<string, string>, sampleData: any[]): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Check required fields
    const requiredFields = ['debtorFirstname', 'amount'];
    requiredFields.forEach(field => {
      if (!Object.values(mapping).includes(field)) {
        errors.push(`Required field "${field}" is not mapped`);
      }
    });

    // Check data consistency
    if (sampleData.length > 0) {
      const firstRow = sampleData[0];
      
      // Validate amount field if mapped
      const amountField = Object.keys(mapping).find(k => mapping[k] === 'amount');
      if (amountField && firstRow[amountField]) {
        const amountValue = firstRow[amountField];
        const numericAmount = parseFloat(amountValue.replace(/[^\d.]/g, ''));
        
        if (isNaN(numericAmount) || numericAmount <= 0) {
          errors.push(`Amount field "${amountField}" contains invalid data: "${amountValue}"`);
        } else if (numericAmount < 100) {
          suggestions.push(`Amount values seem low - verify this is the correct debt amount field`);
        }
      }

      // Validate phone field if mapped
      const phoneField = Object.keys(mapping).find(k => mapping[k] === 'cellPhone1');
      if (phoneField && firstRow[phoneField]) {
        const phoneValue = firstRow[phoneField];
        const phonePattern = /[\d]{7,}/;
        
        if (!phonePattern.test(phoneValue.replace(/\D/g, ''))) {
          suggestions.push(`Phone field "${phoneField}" may not contain valid phone numbers`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    };
  }

  static createAdaptiveMapping(columns: ColumnPattern[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    columns.forEach(column => {
      if (column.mappedField && column.confidence >= 0.5) {
        mapping[column.originalName] = column.mappedField;
      }
    });

    return mapping;
  }

  static generateFieldSuggestions(columnName: string): string[] {
    const normalized = this.normalizeColumnName(columnName);
    const suggestions: string[] = [];

    this.FIELD_TEMPLATES.forEach(template => {
      template.aliases.forEach(alias => {
        const similarity = this.calculateStringSimilarity(normalized, alias);
        if (similarity > 0.6) {
          suggestions.push(template.field);
        }
      });
    });

    return [...new Set(suggestions)]; // Remove duplicates
  }

  // Public method for parsing CSV lines (used by components)
  static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  }
}