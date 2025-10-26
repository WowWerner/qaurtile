/**
 * Specialized Template for Quartile Handover CSV Format
 *
 * This template provides optimized mapping rules for the specific CSV structure
 * used in Quartile debt collection handover files, with special handling for:
 * - Multiple address line fields consolidated for accurate geolocation
 * - Complete contact information extraction (multiple phones/emails)
 * - Financial data parsing and validation
 * - Legal and administrative status tracking
 */

import { FieldMapping } from './headerMapper';

export interface QuartileCSVTemplate {
  name: string;
  description: string;
  mappings: FieldMapping[];
  addressCombinationRules: AddressCombinationRule[];
  validationRules: ValidationRule[];
}

export interface AddressCombinationRule {
  purpose: 'geolocation' | 'display' | 'postal';
  fields: string[];
  separator: string;
  excludeEmpty: boolean;
  excludeDefaults: string[]; // Values to exclude like "0", "N/A"
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'pattern';
  rule: string | RegExp | { min?: number; max?: number };
  message: string;
}

/**
 * Standard Quartile CSV Template
 * Matches the format shown in the attached handover file
 */
export const QUARTILE_STANDARD_TEMPLATE: QuartileCSVTemplate = {
  name: 'Quartile Standard Handover Format',
  description: 'Template for standard Quartile debt collection handover files with complete debtor information',

  mappings: [
    // Identity Fields
    {
      csvHeader: 'Debtor ID',
      internalField: 'debtorId',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Debtor Firstname',
      internalField: 'debtorFirstname',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Debtor Second Name',
      internalField: 'debtorSecondName',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Debtor Surname',
      internalField: 'debtorSurname',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Debtor Initials',
      internalField: 'debtorInitials',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Debtor Title',
      internalField: 'debtorTitle',
      confidence: 1.0,
      alternatives: []
    },

    // Contact Information - Phones
    {
      csvHeader: 'Home Phone 1',
      internalField: 'homePhone1',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Home Phone 2',
      internalField: 'homePhone2',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Home Phone 3',
      internalField: 'homePhone3',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Cell Phone 1',
      internalField: 'cellPhone1',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Cell Phone 2',
      internalField: 'cellPhone2',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Cell Phone 3',
      internalField: 'cellPhone3',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Cell Phone 4',
      internalField: 'cellPhone4',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Work Phone 1',
      internalField: 'workPhone1',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Work Phone 2',
      internalField: 'workPhone2',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Work Phone 3',
      internalField: 'workPhone3',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Work Phone 4',
      internalField: 'workPhone4',
      confidence: 1.0,
      alternatives: []
    },

    // Contact Information - Fax
    {
      csvHeader: 'Fax Number 1',
      internalField: 'faxNumber1',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Fax Number 2',
      internalField: 'faxNumber2',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Fax Number 3',
      internalField: 'faxNumber3',
      confidence: 1.0,
      alternatives: []
    },

    // Contact Information - Emails
    {
      csvHeader: 'Email 1',
      internalField: 'email1',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Email 2',
      internalField: 'email2',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Email 3',
      internalField: 'email3',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Email 4',
      internalField: 'email4',
      confidence: 1.0,
      alternatives: []
    },

    // Postal Address Fields
    {
      csvHeader: 'Postal Address line 1',
      internalField: 'postalAddressLine1',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Postal Address line 2',
      internalField: 'postalAddressLine2',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Postal Address line 3',
      internalField: 'postalAddressLine3',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Postal Address line 4',
      internalField: 'postalAddressLine4',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Postal code',
      internalField: 'postalCode',
      confidence: 1.0,
      alternatives: []
    },

    // Street/Physical Address Fields (CRITICAL for geolocation)
    {
      csvHeader: 'Street Address line 1',
      internalField: 'streetAddressLine1',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Street Address line 2',
      internalField: 'streetAddressLine2',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Street Address line 3',
      internalField: 'streetAddressLine3',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Street Address line 4',
      internalField: 'streetAddressLine4',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Street postal code',
      internalField: 'streetPostalCode',
      confidence: 1.0,
      alternatives: []
    },

    // Financial Information
    {
      csvHeader: 'Client Reference',
      internalField: 'clientReference',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Amount',
      internalField: 'amount',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Capital on Default',
      internalField: 'capitalOnDefault',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Capital Portion',
      internalField: 'capitalPortion',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Interest Portion',
      internalField: 'interestPortion',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Legal Fee Portion',
      internalField: 'legalFeePortion',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Interest Rate',
      internalField: 'interestRate',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Original Cost',
      internalField: 'originalCost',
      confidence: 1.0,
      alternatives: []
    },

    // Dates
    {
      csvHeader: 'Date of Default',
      internalField: 'dateOfDefault',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Last Payment Date Before Handover',
      internalField: 'lastPaymentDate',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Last Payment Amount',
      internalField: 'lastPaymentAmount',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Date Opened',
      internalField: 'dateOpened',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Expiry Date',
      internalField: 'expiryDate',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Interest Date',
      internalField: 'interestDate',
      confidence: 1.0,
      alternatives: []
    },

    // Account Information
    {
      csvHeader: 'Account Type',
      internalField: 'accountType',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Client Division',
      internalField: 'clientDivision',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Old Client Reference',
      internalField: 'oldClientReference',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Client Profile Account',
      internalField: 'clientProfileAccount',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Contract Period',
      internalField: 'contractPeriod',
      confidence: 1.0,
      alternatives: []
    },

    // Personal Information
    {
      csvHeader: 'Occupation',
      internalField: 'occupation',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Employer',
      internalField: 'employer',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Nationality',
      internalField: 'nationality',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Passport number',
      internalField: 'passportNumber',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Gender',
      internalField: 'gender',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Marital Status',
      internalField: 'maritalStatus',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Number of Children',
      internalField: 'numberOfChildren',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Debtor Language',
      internalField: 'debtorLanguage',
      confidence: 1.0,
      alternatives: []
    },

    // Next of Kin
    {
      csvHeader: 'Next of Kin Number 1',
      internalField: 'nextOfKinNumber1',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Next of Kin Number 2',
      internalField: 'nextOfKinNumber2',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Next of Kin Number 3',
      internalField: 'nextOfKinNumber3',
      confidence: 1.0,
      alternatives: []
    },

    // Legal & Administrative
    {
      csvHeader: 'Previous Attorney Legal Stage',
      internalField: 'previousAttorneyLegalStage',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Interruptor Before Handover Description',
      internalField: 'interruptorDescription',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Interruptor Before Handover Date',
      internalField: 'interruptorDate',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Administrator Name',
      internalField: 'administratorName',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Admin Ref',
      internalField: 'adminRef',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Admin Application Date',
      internalField: 'adminApplicationDate',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Admin Case Number',
      internalField: 'adminCaseNumber',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Admin Court Name',
      internalField: 'adminCourtName',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Admin Court Date',
      internalField: 'adminCourtDate',
      confidence: 1.0,
      alternatives: []
    },

    // Additional Fields
    {
      csvHeader: 'Comments',
      internalField: 'comments',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'Client Prefix',
      internalField: 'clientPrefix',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'QTSRef',
      internalField: 'qtsRef',
      confidence: 1.0,
      alternatives: []
    },
    {
      csvHeader: 'QT Client Ref',
      internalField: 'qtClientRef',
      confidence: 1.0,
      alternatives: []
    }
  ],

  /**
   * Address Combination Rules
   * CRITICAL: These rules define how to combine multiple address fields for accurate geolocation
   */
  addressCombinationRules: [
    {
      purpose: 'geolocation',
      fields: [
        'streetAddressLine1',
        'streetAddressLine2',
        'streetAddressLine3',
        'streetAddressLine4',
        'streetPostalCode'
      ],
      separator: ', ',
      excludeEmpty: true,
      excludeDefaults: ['0', 'N/A', 'n/a', 'NA', 'NONE', 'none', '']
    },
    {
      purpose: 'display',
      fields: [
        'streetAddressLine1',
        'streetAddressLine2',
        'streetAddressLine3',
        'streetAddressLine4'
      ],
      separator: '\n',
      excludeEmpty: true,
      excludeDefaults: ['0', 'N/A', 'n/a', 'NA', 'NONE', 'none', '']
    },
    {
      purpose: 'postal',
      fields: [
        'postalAddressLine1',
        'postalAddressLine2',
        'postalAddressLine3',
        'postalAddressLine4',
        'postalCode'
      ],
      separator: ', ',
      excludeEmpty: true,
      excludeDefaults: ['0', 'N/A', 'n/a', 'NA', 'NONE', 'none', '']
    }
  ],

  /**
   * Validation Rules for Critical Fields
   */
  validationRules: [
    {
      field: 'debtorId',
      type: 'required',
      rule: '',
      message: 'Debtor ID is required for each record'
    },
    {
      field: 'debtorFirstname',
      type: 'required',
      rule: '',
      message: 'Debtor first name is required'
    },
    {
      field: 'debtorSurname',
      type: 'required',
      rule: '',
      message: 'Debtor surname is required'
    },
    {
      field: 'amount',
      type: 'required',
      rule: '',
      message: 'Debt amount is required'
    },
    {
      field: 'amount',
      type: 'format',
      rule: /^[\d.,\s]+$/,
      message: 'Amount must be a valid number'
    },
    {
      field: 'amount',
      type: 'range',
      rule: { min: 0, max: 1000000000 },
      message: 'Amount must be between 0 and 1 billion'
    },
    {
      field: 'cellPhone1',
      type: 'pattern',
      rule: /\d{3,}/,
      message: 'Cell phone must contain at least 3 digits'
    },
    {
      field: 'email1',
      type: 'pattern',
      rule: /@.+\..+/,
      message: 'Email must be in valid format'
    }
  ]
};

/**
 * Combine address fields according to rules
 */
export function combineAddressFields(
  record: any,
  rule: AddressCombinationRule
): string {
  const parts: string[] = [];

  for (const field of rule.fields) {
    const value = record[field];

    // Skip if empty and excludeEmpty is true
    if (rule.excludeEmpty && (!value || value.trim() === '')) {
      continue;
    }

    // Skip if value matches exclusion list
    if (rule.excludeDefaults.includes(value?.trim())) {
      continue;
    }

    if (value && value.trim()) {
      parts.push(value.trim());
    }
  }

  return parts.join(rule.separator);
}

/**
 * Apply the Quartile template to enhance a record with combined address fields
 */
export function applyQuartileTemplate(record: any): any {
  const enhanced = { ...record };

  // Add combined address fields for different purposes
  for (const rule of QUARTILE_STANDARD_TEMPLATE.addressCombinationRules) {
    const combinedAddress = combineAddressFields(record, rule);

    if (rule.purpose === 'geolocation') {
      enhanced.fullAddress = combinedAddress;
      enhanced.geocodingAddress = combinedAddress + ', Namibia'; // Add country for accuracy
    } else if (rule.purpose === 'display') {
      enhanced.displayAddress = combinedAddress;
    } else if (rule.purpose === 'postal') {
      enhanced.postalAddress = combinedAddress;
    }
  }

  // Combine full name
  const nameParts = [
    record.debtorTitle,
    record.debtorFirstname,
    record.debtorSecondName,
    record.debtorSurname
  ].filter(p => p && p.trim() && !['0', 'N/A'].includes(p.trim()));

  enhanced.fullName = nameParts.join(' ');

  // Collect all valid contact numbers
  const allPhones = [
    record.cellPhone1, record.cellPhone2, record.cellPhone3, record.cellPhone4,
    record.homePhone1, record.homePhone2, record.homePhone3,
    record.workPhone1, record.workPhone2, record.workPhone3, record.workPhone4
  ].filter(p => p && p.trim() && p !== '0' && /\d{3,}/.test(p));

  enhanced.allContactNumbers = allPhones;
  enhanced.primaryContact = allPhones[0] || 'No contact';

  // Collect all valid emails
  const allEmails = [
    record.email1, record.email2, record.email3, record.email4
  ].filter(e => e && e.trim() && e !== '0' && /@.+\..+/.test(e));

  enhanced.allEmails = allEmails;
  enhanced.primaryEmail = allEmails[0] || 'No email';

  return enhanced;
}

/**
 * Validate a record against the template rules
 */
export function validateQuartileRecord(record: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of QUARTILE_STANDARD_TEMPLATE.validationRules) {
    const value = record[rule.field];

    if (rule.type === 'required' && (!value || value.trim() === '')) {
      errors.push(rule.message);
    } else if (rule.type === 'format' && value && !(rule.rule as RegExp).test(value)) {
      errors.push(rule.message);
    } else if (rule.type === 'pattern' && value && value.trim() && !(rule.rule as RegExp).test(value)) {
      warnings.push(rule.message);
    } else if (rule.type === 'range' && value) {
      const numValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
      const range = rule.rule as { min?: number; max?: number };
      if ((range.min !== undefined && numValue < range.min) ||
          (range.max !== undefined && numValue > range.max)) {
        errors.push(rule.message);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
