import { Download, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { FIELD_DEFINITIONS } from '../utils/headerMapper';

export function CSVTemplateGenerator() {
  const handleDownloadTemplate = () => {
    // Create CSV header with all field variations
    const requiredFields = FIELD_DEFINITIONS.filter(def => def.required);
    const optionalFields = FIELD_DEFINITIONS.filter(def => !def.required);

    // Use display names as headers
    const headers = [
      ...requiredFields.map(def => def.displayName),
      ...optionalFields.map(def => def.displayName)
    ];

    // Create sample data row
    const sampleData = [
      ...requiredFields.map(def => getSampleValue(def.internalField)),
      ...optionalFields.map(def => getSampleValue(def.internalField))
    ];

    // Create CSV content
    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'debtor_handover_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFieldGuide = () => {
    // Create a detailed field guide document
    const guideContent = [
      'DEBTOR HANDOVER CSV FIELD GUIDE',
      '=' .repeat(80),
      '',
      'REQUIRED FIELDS:',
      '-'.repeat(80),
      ...FIELD_DEFINITIONS.filter(def => def.required).map(def => formatFieldGuide(def)),
      '',
      'OPTIONAL FIELDS:',
      '-'.repeat(80),
      ...FIELD_DEFINITIONS.filter(def => !def.required).map(def => formatFieldGuide(def)),
      '',
      'ACCEPTED HEADER VARIATIONS:',
      '-'.repeat(80),
      'The system accepts multiple header name variations for each field.',
      'For example, "First Name" can also be:',
      '  - firstname',
      '  - first_name',
      '  - fname',
      '  - given_name',
      '',
      'The system uses intelligent matching to automatically detect your headers.',
      ''
    ].join('\n');

    const blob = new Blob([guideContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'csv_field_guide.txt');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
          <FileText size={20} strokeWidth={1.5} />
          <span>CSV Template & Guide</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Download a CSV template with the correct format and field names, or view the field guide
            to understand which headers are accepted.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="flex items-center justify-center space-x-2 h-24 border-2 hover:border-[rgb(0,171,174)] hover:bg-[rgb(0,171,174)]/5"
            >
              <div className="text-center">
                <Download size={24} className="mx-auto mb-2 text-[rgb(0,171,174)]" />
                <div className="font-medium">Download CSV Template</div>
                <div className="text-xs text-gray-500">With sample data</div>
              </div>
            </Button>

            <Button
              onClick={handleDownloadFieldGuide}
              variant="outline"
              className="flex items-center justify-center space-x-2 h-24 border-2 hover:border-blue-500 hover:bg-blue-50"
            >
              <div className="text-center">
                <FileText size={24} className="mx-auto mb-2 text-blue-500" />
                <div className="font-medium">Download Field Guide</div>
                <div className="text-xs text-gray-500">Accepted variations</div>
              </div>
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h4 className="font-medium text-blue-900 mb-2">Flexible Header Matching</h4>
            <p className="text-sm text-blue-800">
              The system automatically detects and maps your CSV headers, even if they use different
              naming conventions. Most common variations are supported without manual mapping.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get sample values
function getSampleValue(fieldName: string): string {
  const samples: { [key: string]: string } = {
    debtorId: 'DEB001',
    debtorFirstname: 'John',
    debtorSurname: 'Doe',
    amount: '5000',
    cellPhone1: '+264811234567',
    cellPhone2: '+264811234568',
    cellPhone3: '',
    cellPhone4: '',
    homePhone1: '+26461234567',
    homePhone2: '',
    workPhone1: '+26461987654',
    workPhone2: '',
    email1: 'john.doe@example.com',
    email2: '',
    email3: '',
    streetAddressLine1: '123 Main Street',
    streetAddressLine2: 'Apartment 4B',
    streetPostalCode: '9000',
    postalAddressLine1: 'PO Box 1234',
    postalAddressLine2: '',
    postalCode: '9000',
    capitalOnDefault: '4500',
    capitalPortion: '4000',
    interestPortion: '800',
    legalFeePortion: '200',
    lastPaymentDate: '2024-01-15',
    lastPaymentAmount: '500',
    occupation: 'Teacher',
    nationality: 'Namibian',
    maritalStatus: 'Married',
    previousAttorneyLegalStage: 'None',
    adminRef: '',
    adminApplicationDate: ''
  };

  return samples[fieldName] || '';
}

// Helper function to format field guide entry
function formatFieldGuide(def: any): string {
  const required = def.required ? '[REQUIRED]' : '[OPTIONAL]';
  const variations = def.variations.slice(0, 5).join(', ');

  return [
    '',
    `${def.displayName} ${required}`,
    `  Description: ${getFieldDescription(def.internalField)}`,
    `  Example variations: ${variations}`,
    `  Example value: ${getSampleValue(def.internalField)}`
  ].join('\n');
}

// Helper function to get field descriptions
function getFieldDescription(fieldName: string): string {
  const descriptions: { [key: string]: string } = {
    debtorId: 'Unique identifier for the debtor',
    debtorFirstname: 'Debtor\'s first name or given name',
    debtorSurname: 'Debtor\'s last name or surname',
    amount: 'Total debt amount owed',
    cellPhone1: 'Primary mobile phone number',
    cellPhone2: 'Secondary mobile phone number',
    cellPhone3: 'Tertiary mobile phone number',
    cellPhone4: 'Quaternary mobile phone number',
    homePhone1: 'Primary home/landline number',
    homePhone2: 'Secondary home/landline number',
    workPhone1: 'Primary work/office number',
    workPhone2: 'Secondary work/office number',
    email1: 'Primary email address',
    email2: 'Secondary email address',
    email3: 'Tertiary email address',
    streetAddressLine1: 'Physical street address line 1',
    streetAddressLine2: 'Physical street address line 2',
    streetPostalCode: 'Postal code for physical address',
    postalAddressLine1: 'Mailing address line 1',
    postalAddressLine2: 'Mailing address line 2',
    postalCode: 'Postal code for mailing address',
    capitalOnDefault: 'Original capital amount when defaulted',
    capitalPortion: 'Current capital portion of debt',
    interestPortion: 'Interest amount on debt',
    legalFeePortion: 'Legal fees added to debt',
    lastPaymentDate: 'Date of last payment (YYYY-MM-DD)',
    lastPaymentAmount: 'Amount of last payment made',
    occupation: 'Debtor\'s occupation or job title',
    nationality: 'Debtor\'s nationality',
    maritalStatus: 'Debtor\'s marital status',
    previousAttorneyLegalStage: 'Previous legal actions taken',
    adminRef: 'Administration/sequestration reference',
    adminApplicationDate: 'Date of admin/sequestration application'
  };

  return descriptions[fieldName] || 'No description available';
}
