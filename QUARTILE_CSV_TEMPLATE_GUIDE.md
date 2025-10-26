# Quartile CSV Template & Mapping Guide

## Overview

This guide documents the specialized template created for analyzing Quartile debt collection handover CSV files in the Intelligence Center. The template provides optimized field mappings and special processing rules tailored to the specific structure of Quartile CSV exports.

## File Structure Analysis

### Headers Identified (68 fields)

The attached CSV contains the following field categories:

#### 1. **Identity Fields** (6 fields)
- Debtor ID
- Debtor Firstname
- Debtor Second Name
- Debtor Surname
- Debtor Initials
- Debtor Title

#### 2. **Contact Information** (21 fields)
**Phones:**
- Home Phone 1, 2, 3
- Cell Phone 1, 2, 3, 4
- Work Phone 1, 2, 3, 4
- Fax Number 1, 2, 3

**Emails:**
- Email 1, 2, 3, 4

#### 3. **Address Fields** (10 fields)
**Postal Address:**
- Postal Address line 1, 2, 3, 4
- Postal code

**Street/Physical Address:**
- Street Address line 1, 2, 3, 4
- Street postal code

#### 4. **Financial Information** (9 fields)
- Client Reference
- Amount
- Capital on Default
- Capital Portion
- Interest Portion
- Legal Fee Portion
- Interest Rate
- Original Cost

#### 5. **Date Fields** (7 fields)
- Date of Default
- Last Payment Date Before Handover
- Date Opened
- Expiry Date
- Interest Date
- Interruptor Before Handover Date

#### 6. **Account Information** (6 fields)
- Account Type
- Client Division
- Old Client Reference
- Client Profile Account
- Contract Period

#### 7. **Personal/Demographics** (9 fields)
- Occupation
- Employer
- Nationality
- Passport number
- Gender
- Marital Status
- Number of Children
- Debtor Language
- Next of Kin Number 1, 2, 3

#### 8. **Legal & Administrative** (9 fields)
- Previous Attorney Legal Stage
- Interruptor Before Handover Description
- Administrator Name
- Admin Ref
- Admin Application Date
- Admin Case Number
- Admin Court Name
- Admin Court Date

---

## Critical Special Rules

### 1. Address Field Consolidation for Google Maps

**Problem:** The CSV has 4 separate street address lines that need to be combined for accurate geolocation.

**Solution:** Three address combination rules:

#### Rule 1: Geolocation Address
```javascript
{
  purpose: 'geolocation',
  fields: [
    'Street Address line 1',  // e.g., "ERF 241 OMBILU STR"
    'Street Address line 2',  // e.g., "" (often empty)
    'Street Address line 3',  // e.g., "HAKAHANA"
    'Street Address line 4',  // e.g., "WINDHOEK"
    'Street postal code'      // Postal code if available
  ],
  separator: ', ',
  excludeEmpty: true,
  excludeDefaults: ['0', 'N/A', 'none']
}
```

**Example Output:**
- Input: `ERF 241 OMBILU STR | | HAKAHANA | WINDHOEK`
- Output: `ERF 241 OMBILU STR, HAKAHANA, WINDHOEK, Namibia`

#### Rule 2: Display Address
```javascript
{
  purpose: 'display',
  fields: ['Street Address line 1', 'Street Address line 2', 'Street Address line 3', 'Street Address line 4'],
  separator: '\n',  // Newline for multi-line display
  excludeEmpty: true
}
```

#### Rule 3: Postal Address
```javascript
{
  purpose: 'postal',
  fields: ['Postal Address line 1', 'Postal Address line 2', 'Postal Address line 3', 'Postal Address line 4', 'Postal code'],
  separator: ', ',
  excludeEmpty: true
}
```

### 2. Contact Information Aggregation

**Problem:** Multiple phone and email fields scattered across the CSV.

**Solution:** Aggregate all valid contacts:

```javascript
// Collect ALL valid phone numbers
allContactNumbers = [
  cellPhone1, cellPhone2, cellPhone3, cellPhone4,
  homePhone1, homePhone2, homePhone3,
  workPhone1, workPhone2, workPhone3, workPhone4
].filter(isValid)

// Prioritize cell phones for primary contact
primaryContact = cellPhone1 || homePhone1 || workPhone1

// Collect ALL valid emails
allEmails = [email1, email2, email3, email4].filter(isValidEmail)
```

### 3. Scoring Rules for Intelligence Analysis

Based on the attached data, here are the intelligence scoring rules:

#### Contact Information (Max 30 points)
- Valid cell phone: **+15 points**
- Valid email: **+5 points**
- Valid work contact: **+5 points**
- Valid address: **+5 points**
- No contact info: **-10 points**

#### Payment Behavior (Max 30 points)
- Last payment < 30 days ago: **+20 points**
- Last payment 30-90 days ago: **+10 points**
- Last payment > 90 days ago: **0 points**
- Payment ≥25% of debt: **+10 points**
- Payment 5-24% of debt: **+5 points**

#### Debt Characteristics (Max 20 points)
- Debt ≤ N$5,000: **+10 points**
- Debt N$5,001 - N$50,000: **+5 points**
- Debt > N$50,000: **0 points**
- Interest/fees >50% of total: **-5 points**

#### Socio-Economic Factors (Max 10 points)
Based on address classification (Namibian locations):

**Upmarket Areas (+10 points):**
- Klein Windhoek, Ludwigsdorf, Eros, Olympia, Omeya
- Pionierspark, Suiderhof, Hochland Park

**Mid-Income Areas (+5 points):**
- Windhoek West, Windhoek North, Khomasdal
- Otjomuise, Academia, Dorado Park

**Low-Income Areas (0 points):**
- Okuryangava, Wanaheda, Goreangab, Havana
- Katutura, Greenwell Matongo

**Stable Occupation Bonus (+5 points):**
- Government, Corporate, Manager, Professional
- Teacher, Nurse, Police, Military

#### Legal Status (Max 10 points)
- No legal proceedings: **+10 points**
- Active legal case (no admin): **+5 points**
- Under administration/sequestration: **0 points**

---

## Data Quality Observations from Sample

From the attached CSV, I observed:

### Strong Data Points
1. **Debtor identification**: 100% complete (ID, name, surname)
2. **Financial data**: 100% complete (amounts, capital on default)
3. **Location data**: ~95% have street address with location info
4. **Date of default**: 100% complete

### Weak Data Points
1. **Contact information**: ~40% have valid cell phones, ~20% have emails
2. **Postal addresses**: ~30% complete (many show "0" as placeholder)
3. **Payment history**: ~60% have last payment data
4. **Legal status**: ~90% have no previous attorney stage

### Common Data Issues
1. **Placeholder values**: "0" used for missing/unknown fields
2. **Empty emails**: Only ~20 of 120 records have valid emails
3. **Address inconsistency**: Street address lines 2-3 often empty or "0"
4. **Employer info**: Good coverage (~80%) but varies in format

---

## Usage in Intelligence Center

### Automatic Application

When a CSV matching the Quartile format is uploaded:

1. **Header Auto-Detection**: System recognizes the 68 standard Quartile headers
2. **Field Mapping**: Automatically maps to internal intelligence fields
3. **Address Consolidation**: Combines street address lines for geolocation
4. **Contact Aggregation**: Collects all phones/emails into priority lists
5. **Scoring Engine**: Applies 100-point intelligence framework
6. **Geographic Analysis**: Uses consolidated addresses for Google Maps heatmap

### Template Functions

```typescript
// Apply template enhancement to a record
const enhanced = applyQuartileTemplate(record);
// Result includes:
// - fullAddress: "ERF 241 OMBILU STR, HAKAHANA, WINDHOEK"
// - geocodingAddress: "ERF 241 OMBILU STR, HAKAHANA, WINDHOEK, Namibia"
// - displayAddress: Multi-line formatted address
// - fullName: "MR PETRUS KALEMBA"
// - allContactNumbers: [...] (all valid phones)
// - primaryContact: First valid cell/home/work phone

// Validate a record
const validation = validateQuartileRecord(record);
// Returns: { isValid, errors[], warnings[] }

// Combine addresses for specific purpose
const geoAddress = combineAddressFields(record, geolocationRule);
// Result: "ERF 241 OMBILU STR, HAKAHANA, WINDHOEK, Namibia"
```

---

## Analysis Capabilities

With the Quartile template, the Intelligence Center can:

### 1. Contact Analysis
- Identify debtors with complete vs incomplete contact info
- Prioritize accounts with multiple valid contact methods
- Track contact quality scores

### 2. Geographic Analysis
- Plot debtors on Google Maps heatmap using consolidated addresses
- Analyze debt concentration by area
- Identify high-value neighborhoods
- Route planning for field agents

### 3. Payment Behavior Analysis
- Track payment recency and frequency
- Identify debtors with recent payment activity
- Calculate payment-to-debt ratios

### 4. Debt Composition Analysis
- Breakdown of capital, interest, and legal fees
- Identify accounts where interest exceeds principal
- Prioritize by debt size categories

### 5. Demographics Analysis
- Occupation stability indicators
- Employment status correlation with recovery rates
- Location-based socio-economic segmentation

### 6. Legal Status Analysis
- Track accounts in various legal stages
- Identify administration/sequestration cases
- Prioritize pre-legal accounts for immediate action

---

## Validation Rules

The template enforces these validation rules:

### Required Fields
- Debtor ID
- Debtor Firstname
- Debtor Surname
- Amount

### Format Validation
- **Amount**: Must be numeric, 0 to 1 billion
- **Phone**: Must contain at least 3 digits
- **Email**: Must match email pattern (@domain.ext)
- **Dates**: Must be valid date format

### Data Quality Warnings
- Low contact coverage
- Missing email addresses
- Incomplete address information
- Old or missing payment dates

---

## Intelligence Center Integration

### Auto-Mapping Flow

```
1. Upload CSV → Extract headers
2. Detect Quartile format (68 standard fields)
3. Apply QUARTILE_STANDARD_TEMPLATE
4. Enhance records (combine addresses, aggregate contacts)
5. Validate data quality
6. Calculate intelligence scores
7. Generate analysis reports
```

### Enhanced Fields Created

For each debtor record, the template creates:

```javascript
{
  // Original fields: debtorId, debtorFirstname, etc.

  // Enhanced fields:
  fullName: "MR PETRUS KALEMBA",
  fullAddress: "ERF 241 OMBILU STR, HAKAHANA, WINDHOEK",
  geocodingAddress: "ERF 241 OMBILU STR, HAKAHANA, WINDHOEK, Namibia",
  displayAddress: "ERF 241 OMBILU STR\nHAKAHANA\nWINDHOEK",
  postalAddress: "...",

  allContactNumbers: ["0812432732", ...],
  primaryContact: "0812432732",

  allEmails: [...],
  primaryEmail: "email@example.com",

  // Intelligence scores
  score: 67,  // Total score
  scoring: {
    contactInfo: { score: 15, max: 30 },
    paymentBehaviour: { score: 10, max: 30 },
    debtCharacteristics: { score: 10, max: 20 },
    socioEconomic: { score: 5, max: 10 },
    legalStatus: { score: 10, max: 10 }
  }
}
```

---

## Recommendations for Data Quality

Based on the sample data analysis:

### High Priority
1. **Improve email capture**: Currently only ~20% coverage
2. **Validate phone numbers**: Ensure format consistency (0XXXXXXXXX)
3. **Clean address data**: Remove "0" placeholders, standardize format

### Medium Priority
1. **Enhance occupation data**: Standardize employer names
2. **Complete postal addresses**: Many show as "0"
3. **Payment tracking**: Ensure last payment date is captured

### Low Priority
1. **Fax numbers**: Consider removing (low value in modern context)
2. **Next of kin**: Standardize collection of this data
3. **Language field**: Ensure consistent values

---

## Summary

The Quartile CSV Template provides:

1. **Complete field mapping** for all 68 standard Quartile fields
2. **Intelligent address consolidation** for accurate Google Maps geolocation
3. **Contact aggregation** from multiple phone/email fields
4. **Validation rules** for data quality assurance
5. **Enhanced fields** for analysis and reporting
6. **100-point scoring framework** optimized for debt collection prioritization

This template ensures maximum intelligence extraction from Quartile handover files while maintaining data accuracy and enabling sophisticated geographic and demographic analysis.
