export interface FieldMapping {
  csvHeader: string;
  internalField: string;
  confidence: number;
  alternatives: string[];
}

export interface MappingResult {
  mappings: FieldMapping[];
  unmappedHeaders: string[];
  missingRequiredFields: string[];
  suggestions: { header: string; suggestions: Array<{ field: string; confidence: number }> }[];
}

export interface FieldDefinition {
  internalField: string;
  displayName: string;
  required: boolean;
  variations: string[];
  patterns?: RegExp[];
  dataTypeValidator?: (value: string) => boolean;
}

// Comprehensive field definitions with variations and patterns
export const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    internalField: 'debtorId',
    displayName: 'Debtor ID',
    required: true,
    variations: [
      'debtorid', 'debtor_id', 'debtor-id', 'id', 'debtorcode', 'debtor_code',
      'accountid', 'account_id', 'clientdebtorref', 'client_debtor_ref',
      'reference', 'ref', 'debtornumber', 'debtor_number', 'accountnumber', 'account_number'
    ]
  },
  {
    internalField: 'debtorFirstname',
    displayName: 'First Name',
    required: true,
    variations: [
      'debtorfirstname', 'debtor_first_name', 'firstname', 'first_name', 'first-name',
      'fname', 'givenname', 'given_name', 'forename', 'christian_name', 'name', 'given'
    ]
  },
  {
    internalField: 'debtorSurname',
    displayName: 'Surname',
    required: true,
    variations: [
      'debtorsurname', 'debtor_surname', 'surname', 'lastname', 'last_name', 'last-name',
      'lname', 'familyname', 'family_name', 'sname', 'family'
    ]
  },
  {
    internalField: 'amount',
    displayName: 'Debt Amount',
    required: true,
    variations: [
      'amount', 'debtamount', 'debt_amount', 'totalamount', 'total_amount',
      'balance', 'outstanding', 'outstandingbalance', 'outstanding_balance',
      'capitalamount', 'capital_amount', 'debt', 'value', 'total'
    ],
    patterns: [/amount/i, /debt/i, /balance/i, /outstanding/i, /capital/i],
    dataTypeValidator: (value: string) => {
      const cleaned = value.replace(/[N$,\s]/g, '');
      return !isNaN(parseFloat(cleaned)) && parseFloat(cleaned) >= 0;
    }
  },
  {
    internalField: 'cellPhone1',
    displayName: 'Cell Phone 1',
    required: false,
    variations: [
      'cellphone1', 'cell_phone_1', 'cellphone', 'cell_phone', 'mobile1', 'mobile_1',
      'mobile', 'cell', 'phone1', 'phone_1', 'phone', 'contact1', 'contactnumber',
      'mobilenumber', 'mobile_number', 'cellnumber', 'cell_number', 'tel', 'telephone'
    ],
    patterns: [/cell/i, /mobile/i, /phone/i, /contact/i],
    dataTypeValidator: (value: string) => /\d{3,}/.test(value)
  },
  {
    internalField: 'cellPhone2',
    displayName: 'Cell Phone 2',
    required: false,
    variations: [
      'cellphone2', 'cell_phone_2', 'mobile2', 'mobile_2', 'phone2', 'phone_2',
      'alternativephone', 'alternative_phone', 'altphone', 'secondaryphone', 'secondary_phone'
    ],
    patterns: [/cell.*2/i, /mobile.*2/i, /phone.*2/i, /alt.*phone/i]
  },
  {
    internalField: 'cellPhone3',
    displayName: 'Cell Phone 3',
    required: false,
    variations: [
      'cellphone3', 'cell_phone_3', 'mobile3', 'mobile_3', 'phone3', 'phone_3'
    ]
  },
  {
    internalField: 'cellPhone4',
    displayName: 'Cell Phone 4',
    required: false,
    variations: [
      'cellphone4', 'cell_phone_4', 'mobile4', 'mobile_4', 'phone4', 'phone_4'
    ]
  },
  {
    internalField: 'homePhone1',
    displayName: 'Home Phone 1',
    required: false,
    variations: [
      'homephone1', 'home_phone_1', 'homephone', 'home_phone', 'landline',
      'landline1', 'home', 'homelandline', 'home_landline', 'homenumber', 'home_number'
    ],
    patterns: [/home.*phone/i, /landline/i]
  },
  {
    internalField: 'homePhone2',
    displayName: 'Home Phone 2',
    required: false,
    variations: [
      'homephone2', 'home_phone_2', 'landline2'
    ]
  },
  {
    internalField: 'workPhone1',
    displayName: 'Work Phone 1',
    required: false,
    variations: [
      'workphone1', 'work_phone_1', 'workphone', 'work_phone', 'businessphone',
      'business_phone', 'officephone', 'office_phone', 'work', 'office', 'business'
    ],
    patterns: [/work.*phone/i, /office.*phone/i, /business.*phone/i]
  },
  {
    internalField: 'workPhone2',
    displayName: 'Work Phone 2',
    required: false,
    variations: [
      'workphone2', 'work_phone_2', 'businessphone2', 'officephone2'
    ]
  },
  {
    internalField: 'email1',
    displayName: 'Email 1',
    required: false,
    variations: [
      'email1', 'email_1', 'email', 'emailaddress', 'email_address', 'e-mail',
      'mail', 'contact', 'contactemail', 'primaryemail', 'primary_email'
    ],
    patterns: [/email/i, /mail/i],
    dataTypeValidator: (value: string) => /@.+\..+/.test(value)
  },
  {
    internalField: 'email2',
    displayName: 'Email 2',
    required: false,
    variations: [
      'email2', 'email_2', 'alternativeemail', 'alternative_email', 'secondaryemail',
      'secondary_email', 'altemail'
    ]
  },
  {
    internalField: 'email3',
    displayName: 'Email 3',
    required: false,
    variations: [
      'email3', 'email_3'
    ]
  },
  {
    internalField: 'streetAddressLine1',
    displayName: 'Street Address Line 1',
    required: false,
    variations: [
      'streetaddressline1', 'street_address_line_1', 'streetaddress1', 'street_address_1',
      'address1', 'address_1', 'address', 'streetaddress', 'street_address',
      'physicaladdress', 'physical_address', 'street', 'residentialaddress', 'residential_address'
    ],
    patterns: [/street/i, /address/i, /physical/i, /residential/i]
  },
  {
    internalField: 'streetAddressLine2',
    displayName: 'Street Address Line 2',
    required: false,
    variations: [
      'streetaddressline2', 'street_address_line_2', 'streetaddress2', 'street_address_2',
      'address2', 'address_2', 'addressline2', 'address_line_2'
    ]
  },
  {
    internalField: 'streetPostalCode',
    displayName: 'Street Postal Code',
    required: false,
    variations: [
      'streetpostalcode', 'street_postal_code', 'postalcode', 'postal_code',
      'postcode', 'post_code', 'zipcode', 'zip_code', 'zip', 'code'
    ],
    patterns: [/postal/i, /post.*code/i, /zip/i]
  },
  {
    internalField: 'postalAddressLine1',
    displayName: 'Postal Address Line 1',
    required: false,
    variations: [
      'postaladdressline1', 'postal_address_line_1', 'postaladdress1', 'postal_address_1',
      'mailingaddress', 'mailing_address', 'pobox', 'po_box', 'postbox'
    ],
    patterns: [/postal.*address/i, /mailing/i, /po.*box/i]
  },
  {
    internalField: 'postalAddressLine2',
    displayName: 'Postal Address Line 2',
    required: false,
    variations: [
      'postaladdressline2', 'postal_address_line_2', 'postaladdress2', 'postal_address_2'
    ]
  },
  {
    internalField: 'postalCode',
    displayName: 'Postal Code',
    required: false,
    variations: [
      'postalcode', 'postal_code', 'postcode', 'mailingcode', 'mailing_code'
    ]
  },
  {
    internalField: 'capitalOnDefault',
    displayName: 'Capital on Default',
    required: false,
    variations: [
      'capitalondefault', 'capital_on_default', 'originalamount', 'original_amount',
      'principalamount', 'principal_amount', 'principal', 'capitalamount', 'capital_amount'
    ]
  },
  {
    internalField: 'capitalPortion',
    displayName: 'Capital Portion',
    required: false,
    variations: [
      'capitalportion', 'capital_portion', 'capital', 'principalportion', 'principal_portion'
    ]
  },
  {
    internalField: 'interestPortion',
    displayName: 'Interest Portion',
    required: false,
    variations: [
      'interestportion', 'interest_portion', 'interest', 'interestamount', 'interest_amount'
    ],
    patterns: [/interest/i]
  },
  {
    internalField: 'legalFeePortion',
    displayName: 'Legal Fee Portion',
    required: false,
    variations: [
      'legalfeeportion', 'legal_fee_portion', 'legalfees', 'legal_fees', 'legalfee',
      'legalcosts', 'legal_costs', 'fees', 'costs'
    ],
    patterns: [/legal.*fee/i, /legal.*cost/i]
  },
  {
    internalField: 'lastPaymentDate',
    displayName: 'Last Payment Date',
    required: false,
    variations: [
      'lastpaymentdate', 'last_payment_date', 'lastpaymentdatebeforehandover',
      'last_payment_date_before_handover', 'paymentdate', 'payment_date',
      'lastpaid', 'last_paid', 'dateoflastpayment', 'date_of_last_payment'
    ],
    patterns: [/last.*payment.*date/i, /payment.*date/i, /last.*paid/i]
  },
  {
    internalField: 'lastPaymentAmount',
    displayName: 'Last Payment Amount',
    required: false,
    variations: [
      'lastpaymentamount', 'last_payment_amount', 'paymentamount', 'payment_amount',
      'lastpaid', 'last_paid_amount', 'amountpaid', 'amount_paid'
    ],
    patterns: [/last.*payment.*amount/i, /payment.*amount/i]
  },
  {
    internalField: 'occupation',
    displayName: 'Occupation',
    required: false,
    variations: [
      'occupation', 'job', 'employment', 'profession', 'career', 'work',
      'jobtitle', 'job_title', 'employmenttype', 'employment_type'
    ],
    patterns: [/occupation/i, /job/i, /employment/i, /profession/i]
  },
  {
    internalField: 'nationality',
    displayName: 'Nationality',
    required: false,
    variations: [
      'nationality', 'citizenship', 'citizen', 'country', 'countryoforigin', 'country_of_origin'
    ]
  },
  {
    internalField: 'maritalStatus',
    displayName: 'Marital Status',
    required: false,
    variations: [
      'maritalstatus', 'marital_status', 'marital', 'married', 'civilstatus', 'civil_status'
    ]
  },
  {
    internalField: 'previousAttorneyLegalStage',
    displayName: 'Previous Attorney Legal Stage',
    required: false,
    variations: [
      'previousattorneylegalstage', 'previous_attorney_legal_stage', 'legalstage',
      'legal_stage', 'legalprogress', 'legal_progress', 'legalstatus', 'legal_status',
      'attorneystage', 'attorney_stage', 'litigationstage', 'litigation_stage'
    ],
    patterns: [/legal.*stage/i, /attorney/i, /litigation/i]
  },
  {
    internalField: 'adminRef',
    displayName: 'Admin Reference',
    required: false,
    variations: [
      'adminref', 'admin_ref', 'adminreference', 'admin_reference',
      'administratorreference', 'administrator_reference', 'adminno', 'admin_no'
    ]
  },
  {
    internalField: 'adminApplicationDate',
    displayName: 'Admin Application Date',
    required: false,
    variations: [
      'adminapplicationdate', 'admin_application_date', 'admindate', 'admin_date',
      'administrationdate', 'administration_date', 'sequestrationdate', 'sequestration_date'
    ]
  }
];

// Normalize a header string for comparison
export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\w]/g, '');
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Calculate similarity score between two strings (0-1)
function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

// Find the best matching field for a given header
function findBestMatch(
  csvHeader: string,
  sampleValue?: string
): { field: string; confidence: number; alternatives: string[] } | null {
  const normalized = normalizeHeader(csvHeader);
  let bestMatch: { field: FieldDefinition; confidence: number } | null = null;
  const alternatives: Array<{ field: string; confidence: number }> = [];

  for (const fieldDef of FIELD_DEFINITIONS) {
    let confidence = 0;

    // Check for exact match in variations
    if (fieldDef.variations.some(v => normalizeHeader(v) === normalized)) {
      confidence = 1.0;
    }
    // Check pattern matching
    else if (fieldDef.patterns?.some(pattern => pattern.test(csvHeader))) {
      confidence = 0.85;
    }
    // Check fuzzy matching against variations
    else {
      const similarities = fieldDef.variations.map(v =>
        calculateSimilarity(normalized, normalizeHeader(v))
      );
      const maxSimilarity = Math.max(...similarities);

      if (maxSimilarity >= 0.7) {
        confidence = maxSimilarity * 0.8; // Scale down fuzzy matches
      }
    }

    // Boost confidence if sample value validates
    if (confidence > 0 && sampleValue && fieldDef.dataTypeValidator) {
      if (fieldDef.dataTypeValidator(sampleValue)) {
        confidence = Math.min(1.0, confidence + 0.1);
      }
    }

    if (confidence > 0.5) {
      alternatives.push({ field: fieldDef.internalField, confidence });
    }

    if (confidence > (bestMatch?.confidence || 0)) {
      bestMatch = { field: fieldDef, confidence };
    }
  }

  if (!bestMatch || bestMatch.confidence < 0.6) {
    return null;
  }

  // Sort alternatives by confidence
  alternatives.sort((a, b) => b.confidence - a.confidence);

  return {
    field: bestMatch.field.internalField,
    confidence: bestMatch.confidence,
    alternatives: alternatives.slice(0, 3).map(a => a.field)
  };
}

// Map CSV headers to internal fields
export function mapHeaders(
  csvHeaders: string[],
  sampleRow?: { [key: string]: string }
): MappingResult {
  const mappings: FieldMapping[] = [];
  const unmappedHeaders: string[] = [];
  const suggestions: { header: string; suggestions: Array<{ field: string; confidence: number }> }[] = [];

  // Try to map each header
  for (const header of csvHeaders) {
    const sampleValue = sampleRow?.[header];
    const match = findBestMatch(header, sampleValue);

    if (match) {
      mappings.push({
        csvHeader: header,
        internalField: match.field,
        confidence: match.confidence,
        alternatives: match.alternatives
      });
    } else {
      unmappedHeaders.push(header);

      // Generate suggestions for unmapped headers
      const allMatches: Array<{ field: string; confidence: number }> = [];
      for (const fieldDef of FIELD_DEFINITIONS) {
        const similarities = fieldDef.variations.map(v =>
          calculateSimilarity(normalizeHeader(header), normalizeHeader(v))
        );
        const maxSimilarity = Math.max(...similarities);
        if (maxSimilarity >= 0.4) {
          allMatches.push({ field: fieldDef.internalField, confidence: maxSimilarity });
        }
      }

      allMatches.sort((a, b) => b.confidence - a.confidence);
      if (allMatches.length > 0) {
        suggestions.push({
          header,
          suggestions: allMatches.slice(0, 3)
        });
      }
    }
  }

  // Check for missing required fields
  const mappedFields = new Set(mappings.map(m => m.internalField));
  const missingRequiredFields = FIELD_DEFINITIONS
    .filter(def => def.required && !mappedFields.has(def.internalField))
    .map(def => def.displayName);

  return {
    mappings,
    unmappedHeaders,
    missingRequiredFields,
    suggestions
  };
}

// Get field definition by internal field name
export function getFieldDefinition(internalField: string): FieldDefinition | undefined {
  return FIELD_DEFINITIONS.find(def => def.internalField === internalField);
}

// Get all required fields
export function getRequiredFields(): FieldDefinition[] {
  return FIELD_DEFINITIONS.filter(def => def.required);
}

// Validate if a mapping is complete and valid
export function validateMapping(mappings: FieldMapping[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const mappedFields = new Set(mappings.map(m => m.internalField));

  // Check required fields
  for (const fieldDef of FIELD_DEFINITIONS) {
    if (fieldDef.required && !mappedFields.has(fieldDef.internalField)) {
      errors.push(`Required field "${fieldDef.displayName}" is not mapped`);
    }
  }

  // Check for duplicate mappings
  const fieldCounts = new Map<string, number>();
  for (const mapping of mappings) {
    fieldCounts.set(mapping.internalField, (fieldCounts.get(mapping.internalField) || 0) + 1);
  }

  for (const [field, count] of fieldCounts.entries()) {
    if (count > 1) {
      const fieldDef = getFieldDefinition(field);
      errors.push(`Field "${fieldDef?.displayName || field}" is mapped ${count} times`);
    }
  }

  // Check for low confidence mappings
  for (const mapping of mappings) {
    if (mapping.confidence < 0.75) {
      const fieldDef = getFieldDefinition(mapping.internalField);
      warnings.push(
        `Low confidence (${(mapping.confidence * 100).toFixed(0)}%) mapping: "${mapping.csvHeader}" → "${fieldDef?.displayName || mapping.internalField}"`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Create a mapping object for CSV processing
export function createMappingDictionary(mappings: FieldMapping[]): { [csvHeader: string]: string } {
  const dictionary: { [csvHeader: string]: string } = {};

  for (const mapping of mappings) {
    dictionary[normalizeHeader(mapping.csvHeader)] = mapping.internalField;
  }

  return dictionary;
}
