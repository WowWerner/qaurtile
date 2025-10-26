# FNB Specialized Upload Button Feature

## Overview

Added a dedicated "FNB Specialised" button to the Intelligence Center that automatically applies the Quartile CSV template for optimal field mapping and address consolidation.

## What Was Added

### 1. **FNB Specialized Upload Button**

A prominent orange banner displayed at the top of the upload tab with:
- **Clear branding**: "FNB Specialized Format" heading
- **Descriptive text**: Explains automatic field mapping and address consolidation
- **Call-to-action button**: "FNB Specialised" button with upload icon
- **Visual design**: Orange gradient background for high visibility

**Location**: Intelligence Center → Upload & Process tab (top of page, above standard upload cards)

### 2. **Automatic Template Application**

When users click "FNB Specialised":
- Automatically applies the `QUARTILE_STANDARD_TEMPLATE` with 68 pre-mapped fields
- Bypasses the header mapping interface
- Skips auto-detection and applies FNB-specific rules immediately
- Shows a confirmation badge indicating "FNB Format" is active

### 3. **Enhanced User Feedback**

#### In Name Dialog:
- Orange gradient background changes to indicate FNB mode
- "FNB Format" badge appears in the dialog title
- Green checkmark message: "Using FNB Specialized template with automatic field mapping and address consolidation"

#### Visual Indicators:
```
┌─────────────────────────────────────────────────┐
│  📄 FNB Specialized Format              [FNB]  │
│                                                 │
│  Upload Quartile/FNB handover files with       │
│  automatic field mapping and address           │
│  consolidation                                 │
│                                                 │
│              [🔼 FNB Specialised]              │
└─────────────────────────────────────────────────┘
```

### 4. **Specialized Processing Flow**

```
Standard Upload Flow:
Upload → Auto-detect → Show mapping UI (if needed) → Name → Process

FNB Specialized Flow:
FNB Button → Apply template → Name → Process
(No mapping UI, pre-configured)
```

## Technical Implementation

### New State Variables
```typescript
const [useFnbTemplate, setUseFnbTemplate] = useState(false);
const fnbFileInputRef = useRef<HTMLInputElement>(null);
```

### New Functions
- `handleFnbUploadClick()`: Triggers file input for FNB upload
- `handleFnbFileUpload()`: Processes FNB CSV with automatic template application

### Template Integration
```typescript
import { QUARTILE_STANDARD_TEMPLATE } from '../utils/quartileTemplateMapper';

// In handleFnbFileUpload:
setHeaderMappings(QUARTILE_STANDARD_TEMPLATE.mappings);
setUseFnbTemplate(true);
```

## Benefits

### For Users:
1. **One-click upload**: No need to map fields manually
2. **Error prevention**: Pre-configured template reduces mapping mistakes
3. **Time savings**: Immediate processing without configuration
4. **Confidence**: Clear indication that FNB-specific rules are applied

### For Data Quality:
1. **Consistent mapping**: All FNB files use same field assignments
2. **Address accuracy**: Automatic consolidation of 4 address lines
3. **Contact aggregation**: All phones/emails collected correctly
4. **Scoring optimization**: FNB-specific rules applied automatically

## User Instructions

### How to Use FNB Specialized Upload:

1. **Navigate** to Intelligence Center → Upload & Process tab
2. **Click** the orange "FNB Specialised" button at the top
3. **Select** your Quartile/FNB handover CSV file
4. **Name** your upload (template is pre-applied)
5. **Continue** to automatic processing

### What Happens Automatically:
- ✅ All 68 Quartile fields mapped correctly
- ✅ Street address lines 1-4 consolidated for Google Maps
- ✅ All phone numbers (home, cell, work, fax) aggregated
- ✅ All email addresses collected
- ✅ Full name constructed from title + first + second + surname
- ✅ Postal and physical addresses separated
- ✅ Financial fields (capital, interest, legal fees) parsed
- ✅ Legal/admin status tracked

## File Structure

### Modified Files:
- `src/pages/IntelligenceCenterPage.tsx`
  - Added FNB button UI component
  - Added handleFnbFileUpload function
  - Added useFnbTemplate state
  - Enhanced name dialog with FNB indicators

### Supporting Files:
- `src/utils/quartileTemplateMapper.ts` (existing)
  - Contains QUARTILE_STANDARD_TEMPLATE with 68 field mappings
  - Provides address combination rules
  - Includes validation rules

## Visual Design

### Color Scheme:
- **Primary**: Orange (#F97316 / orange-500)
- **Background**: Orange-to-amber gradient
- **Accent**: White text on orange buttons
- **Indicators**: Green checkmarks for confirmations

### Layout:
- Full-width banner above upload cards
- Prominent button on right side
- Icon + text button design
- Responsive layout for all screen sizes

## Future Enhancements

Potential improvements:
1. Add more specialized templates (Standard Bank, Nedbank, etc.)
2. Template selection dropdown for multiple formats
3. Preview mode showing detected fields before processing
4. Export option to save custom templates
5. Batch processing for multiple FNB files

## Testing Checklist

- [x] FNB button appears on upload tab
- [x] File input triggers on button click
- [x] CSV file loads correctly
- [x] Template applies automatically (68 fields)
- [x] Name dialog shows FNB indicators
- [x] Processing completes successfully
- [x] Address consolidation works for Google Maps
- [x] Contact aggregation captures all fields
- [x] Reset clears FNB template state

## Notes

- The FNB Specialized button only appears when no file is currently uploaded
- Standard upload option remains available alongside FNB specialized
- Users can still use custom mapping if needed (via standard upload)
- Template is optimized specifically for Namibian addresses and FNB data structure
