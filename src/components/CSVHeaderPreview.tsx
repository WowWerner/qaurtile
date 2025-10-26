import { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  mapHeaders,
  validateMapping,
  getFieldDefinition,
  FIELD_DEFINITIONS,
  type FieldMapping
} from '../utils/headerMapper';

interface CSVHeaderPreviewProps {
  headers: string[];
  sampleRow?: { [key: string]: string };
  onMappingComplete: (mappings: FieldMapping[]) => void;
  onCancel: () => void;
}

export function CSVHeaderPreview({ headers, sampleRow, onMappingComplete, onCancel }: CSVHeaderPreviewProps) {
  const [mappingResult, setMappingResult] = useState(() => mapHeaders(headers, sampleRow));
  const [customMappings, setCustomMappings] = useState<FieldMapping[]>([]);
  const [showUnmapped, setShowUnmapped] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Combine auto-detected and custom mappings
  const finalMappings = [...mappingResult.mappings, ...customMappings];
  const validation = validateMapping(finalMappings);

  // Get truly unmapped headers (not in final mappings)
  const actualUnmappedHeaders = mappingResult.unmappedHeaders.filter(
    header => !finalMappings.some(m => m.csvHeader === header)
  );

  useEffect(() => {
    setMappingResult(mapHeaders(headers, sampleRow));
  }, [headers, sampleRow]);

  const handleManualMapping = (csvHeader: string, internalField: string) => {
    // Add to custom mappings
    const newCustomMapping: FieldMapping = {
      csvHeader,
      internalField,
      confidence: 1.0,
      alternatives: []
    };

    setCustomMappings(prev => {
      // Remove any existing mapping for this CSV header
      const filtered = prev.filter(m => m.csvHeader !== csvHeader);
      return [...filtered, newCustomMapping];
    });

    // Remove from unmapped headers
    setMappingResult(prev => ({
      ...prev,
      unmappedHeaders: prev.unmappedHeaders.filter(h => h !== csvHeader)
    }));
  };

  const handleRemoveMapping = (csvHeader: string) => {
    // Check if this was auto-detected
    const wasAutoDetected = mappingResult.mappings.some(m => m.csvHeader === csvHeader);

    // Remove from custom mappings
    setCustomMappings(prev => prev.filter(m => m.csvHeader !== csvHeader));

    // If it was a custom mapping (not auto-detected), add back to unmapped
    if (!wasAutoDetected) {
      setMappingResult(prev => ({
        ...prev,
        unmappedHeaders: [...prev.unmappedHeaders, csvHeader].sort()
      }));
    }
  };

  const handleChangeMapping = (csvHeader: string, newInternalField: string) => {
    setCustomMappings(prev => {
      const existing = prev.find(m => m.csvHeader === csvHeader);
      if (existing) {
        return prev.map(m =>
          m.csvHeader === csvHeader
            ? { ...m, internalField: newInternalField }
            : m
        );
      } else {
        // Check if it's in auto-detected mappings
        const autoDetected = mappingResult.mappings.find(m => m.csvHeader === csvHeader);
        if (autoDetected) {
          return [...prev, {
            csvHeader,
            internalField: newInternalField,
            confidence: 0.9,
            alternatives: []
          }];
        }
        return prev;
      }
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.75) return 'text-blue-600 bg-blue-50';
    if (confidence >= 0.6) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.9) return <Check size={16} className="text-green-600" />;
    if (confidence >= 0.75) return <Check size={16} className="text-blue-600" />;
    return <AlertTriangle size={16} className="text-orange-600" />;
  };

  // Get the effective mapping for a header (custom override or auto-detected)
  const getEffectiveMapping = (csvHeader: string): FieldMapping | undefined => {
    return customMappings.find(m => m.csvHeader === csvHeader) ||
           mappingResult.mappings.find(m => m.csvHeader === csvHeader);
  };

  // Get available fields that aren't already mapped
  const getAvailableFields = (currentHeader: string) => {
    const allMappedFields = new Set(
      finalMappings
        .filter(m => m.csvHeader !== currentHeader)
        .map(m => m.internalField)
    );

    return FIELD_DEFINITIONS.filter(def => !allMappedFields.has(def.internalField));
  };

  const handleConfirm = () => {
    // Allow proceeding if at least one field is mapped
    if (finalMappings.length > 0) {
      onMappingComplete(finalMappings);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
            <span>CSV Header Mapping</span>
            <Badge variant="outline" className="text-sm font-normal">
              {headers.length} columns detected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-medium text-green-700">
                {finalMappings.length}
              </div>
              <div className="text-sm text-green-600">Mapped</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-medium text-orange-700">
                {actualUnmappedHeaders.length}
              </div>
              <div className="text-sm text-orange-600">Unmapped</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-medium text-orange-700">
                {mappingResult.missingRequiredFields.length}
              </div>
              <div className="text-sm text-orange-600">Missing Recommended</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-medium text-blue-700">
                {validation.warnings.length}
              </div>
              <div className="text-sm text-blue-600">Warnings</div>
            </div>
          </div>

          {/* Validation Messages */}
          {(validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="mt-4 space-y-2">
              {validation.errors.map((error, index) => (
                <div key={`error-${index}`} className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <X size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              ))}
              {validation.warnings.map((warning, index) => (
                <div key={`warning-${index}`} className="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <AlertTriangle size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-orange-700">{warning}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mapped Headers */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
            <span>Detected Mappings</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-600"
            >
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <span className="ml-2">{showDetails ? 'Hide' : 'Show'} Details</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {headers.map((header, index) => {
              const effectiveMapping = getEffectiveMapping(header);

              if (!effectiveMapping) return null;

              const fieldDef = getFieldDefinition(effectiveMapping.internalField);
              const isCustom = customMappings.some(m => m.csvHeader === header);
              const availableFields = getAvailableFields(header);

              return (
                <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2 flex-1">
                    {getConfidenceIcon(effectiveMapping.confidence)}

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{header}</span>
                        {isCustom && (
                          <Badge variant="outline" className="text-xs">Custom</Badge>
                        )}
                      </div>

                      {showDetails && sampleRow && (
                        <div className="text-xs text-gray-500 mt-1">
                          Sample: {sampleRow[header] || 'N/A'}
                        </div>
                      )}
                    </div>

                    <span className="text-gray-400">→</span>

                    <div className="flex-1">
                      <Select
                        value={effectiveMapping.internalField}
                        onValueChange={(value) => handleChangeMapping(header, value)}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue>
                            {fieldDef?.displayName || effectiveMapping.internalField}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map((field) => (
                            <SelectItem key={field.internalField} value={field.internalField}>
                              <div className="flex items-center justify-between w-full">
                                <span>{field.displayName}</span>
                                {field.required && (
                                  <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {showDetails && (
                        <div className="mt-1">
                          <Badge className={`text-xs ${getConfidenceColor(effectiveMapping.confidence)}`}>
                            {(effectiveMapping.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMapping(header)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X size={16} />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Unmapped Headers */}
      {actualUnmappedHeaders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="text-lg font-light text-orange-800 flex items-center justify-between">
              <span>Unmapped Columns</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUnmapped(!showUnmapped)}
                className="text-orange-600"
              >
                {showUnmapped ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </CardTitle>
          </CardHeader>
          {showUnmapped && (
            <CardContent>
              <div className="space-y-3">
                {actualUnmappedHeaders.map((header, index) => {
                  const suggestion = mappingResult.suggestions.find(s => s.header === header);
                  const availableFields = getAvailableFields(header);

                  return (
                    <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-orange-200">
                      <HelpCircle size={16} className="text-orange-600 flex-shrink-0" />

                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{header}</div>
                        {sampleRow && (
                          <div className="text-xs text-gray-500 mt-1">
                            Sample: {sampleRow[header] || 'N/A'}
                          </div>
                        )}

                        {suggestion && suggestion.suggestions.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-600 mb-1">Suggestions:</div>
                            <div className="flex flex-wrap gap-2">
                              {suggestion.suggestions.map((sug, i) => {
                                const fieldDef = getFieldDefinition(sug.field);
                                return (
                                  <Button
                                    key={i}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleManualMapping(header, sug.field)}
                                    className="text-xs"
                                  >
                                    {fieldDef?.displayName || sug.field}
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {(sug.confidence * 100).toFixed(0)}%
                                    </Badge>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <Select onValueChange={(value) => handleManualMapping(header, value)}>
                        <SelectTrigger className="w-64 bg-white">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map((field) => (
                            <SelectItem key={field.internalField} value={field.internalField}>
                              <div className="flex items-center justify-between w-full">
                                <span>{field.displayName}</span>
                                {field.required && (
                                  <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Missing Required Fields - Now a Warning instead of Error */}
      {mappingResult.missingRequiredFields.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="text-lg font-light text-orange-800 flex items-center space-x-2">
              <AlertTriangle size={20} />
              <span>Missing Recommended Fields</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700 mb-4">
              The following fields are recommended for optimal analysis. You can still proceed without them, but some features may be limited.
            </p>
            <div className="space-y-2">
              {mappingResult.missingRequiredFields.map((field, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-orange-200">
                  <AlertTriangle size={16} className="text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">{field}</span>
                  <span className="text-sm text-gray-500">- Recommended for full analysis</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>What you can still do:</strong> Analyze available data, view statistics, generate insights based on mapped fields.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div>
          {!validation.isValid && finalMappings.length > 0 && (
            <p className="text-sm text-orange-600 flex items-center space-x-2">
              <AlertTriangle size={16} />
              <span>Some fields are not mapped. You can still analyze with available data.</span>
            </p>
          )}
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {!validation.isValid && finalMappings.length > 0 && (
            <Button
              onClick={handleConfirm}
              variant="outline"
              className="border-orange-500 text-orange-700 hover:bg-orange-50"
            >
              Analyze with Partial Mapping
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={finalMappings.length === 0}
            className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validation.isValid ? 'Confirm Mapping & Continue' : finalMappings.length > 0 ? 'Analyze Anyway' : 'Map at Least One Field'}
          </Button>
        </div>
      </div>
    </div>
  );
}
