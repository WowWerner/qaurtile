import { supabase, CsvUpload, DebtorRecord } from '../lib/supabase';
import { AnalysisResults, ProcessedDebtor } from './csvProcessor';

export class SupabaseService {
  
  // Save CSV analysis results to database
  static async saveCsvAnalysis(filename: string, results: AnalysisResults): Promise<string> {
    console.log('SupabaseService.saveCsvAnalysis is deprecated. Use saveRawCsvData and processRawData instead.');
    // Keep for backward compatibility but should not be used in new multi-step process
    return this.saveRawCsvDataAndProcess(filename, '', results);
  }

  // Step 1: Save raw CSV data to database
  static async saveRawCsvData(filename: string, customName: string, rawCsvData: any[]): Promise<string> {
    try {
      console.log('Saving raw CSV data to Supabase:', { filename, customName, recordCount: rawCsvData.length });
      
     // Validate input data
     if (!rawCsvData || rawCsvData.length === 0) {
       throw new Error('No data provided to save');
     }
     
     if (!filename || !customName) {
       throw new Error('Filename and custom name are required');
     }
      // Insert CSV upload record with initial status
      const { data: uploadData, error: uploadError } = await supabase
        .from('csv_uploads')
        .insert([{
          filename,
          name: customName,
          total_debtors: rawCsvData.length,
          processing_step: 'uploaded',
          raw_data_count: rawCsvData.length,
          status: 'processing'
        }])
        .select()
        .single();

      if (uploadError) {
        console.error('Error saving upload record:', uploadError);
        throw uploadError;
      }

      const csvUploadId = uploadData.id;
      console.log('Created upload record with ID:', csvUploadId);

      // Create dedicated table for this CSV
     console.log('Creating dedicated table for CSV...');
      const { data: tableNameData, error: tableError } = await supabase
        .rpc('create_csv_table', { upload_id: csvUploadId });

      if (tableError) {
        console.error('Error creating CSV table:', tableError);
        throw tableError;
      }

      const tableName = tableNameData;
      console.log('Created CSV table:', tableName);

      // Update upload record with table name
     console.log('Updating upload record with table name...');
      const { error: updateError } = await supabase
        .from('csv_uploads')
        .update({ table_name: tableName })
        .eq('id', csvUploadId);

      if (updateError) {
        console.error('Error updating upload record:', updateError);
        throw updateError;
      }

      // Insert raw CSV records in batches
     console.log('Preparing raw records for insertion...');
      const rawRecords = rawCsvData.map(record => ({
        csv_upload_id: csvUploadId,
        debtor_id: record.debtorId || null,
        debtor_firstname: record.debtorFirstname || null,
        debtor_surname: record.debtorSurname || null,
        home_phone_1: record.homePhone1 || null,
        home_phone_2: record.homePhone2 || null,
        cell_phone_1: record.cellPhone1 || null,
        cell_phone_2: record.cellPhone2 || null,
        cell_phone_3: record.cellPhone3 || null,
        cell_phone_4: record.cellPhone4 || null,
        work_phone_1: record.workPhone1 || null,
        work_phone_2: record.workPhone2 || null,
        email_1: record.email1 || null,
        email_2: record.email2 || null,
        email_3: record.email3 || null,
        postal_address_line_1: record.postalAddressLine1 || null,
        postal_address_line_2: record.postalAddressLine2 || null,
        postal_code: record.postalCode || null,
        street_address_line_1: record.streetAddressLine1 || null,
        street_address_line_2: record.streetAddressLine2 || null,
        street_postal_code: record.streetPostalCode || null,
        amount: record.amount || null,
        capital_on_default: record.capitalOnDefault || null,
        capital_portion: record.capitalPortion || null,
        interest_portion: record.interestPortion || null,
        legal_fee_portion: record.legalFeePortion || null,
        last_payment_date: record.lastPaymentDate || null,
        last_payment_amount: record.lastPaymentAmount || null,
        occupation: record.occupation || null,
        nationality: record.nationality || null,
        marital_status: record.maritalStatus || null,
        previous_attorney_legal_stage: record.previousAttorneyLegalStage || null,
        admin_ref: record.adminRef || null,
        admin_application_date: record.adminApplicationDate || null
      }));

      // Insert raw records in batches to the dedicated table
      const batchSize = 100;
     console.log(`Inserting ${rawRecords.length} records in batches of ${batchSize}...`);
      for (let i = 0; i < rawRecords.length; i += batchSize) {
        const batch = rawRecords.slice(i, i + batchSize);
       console.log(`Inserting batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(rawRecords.length / batchSize)}`);
        
        // Insert into the dedicated CSV table
        const { error: rawDataError } = await supabase
          .from(tableName)
          .insert(batch);

        if (rawDataError) {
          console.error('Error saving raw CSV data batch:', rawDataError);
          throw rawDataError;
        }
      }

      // Update status to indicate raw data is saved
     console.log('Updating processing step to raw_data_saved...');
      await supabase
        .from('csv_uploads')
        .update({ processing_step: 'raw_data_saved' })
        .eq('id', csvUploadId);

      console.log('Successfully saved raw CSV data to Supabase');
      return csvUploadId;

    } catch (error) {
      console.error('Error in saveRawCsvData:', error);
     // Provide more context in error message
     if (error instanceof Error) {
       throw new Error(`Failed to save CSV data: ${error.message}`);
     } else {
       throw new Error('Failed to save CSV data: Unknown error');
     }
      throw error;
    }
  }

  // Step 2: Process raw data into analysis results
  static async processRawData(csvUploadId: string, results: AnalysisResults): Promise<string> {
    try {
      console.log('Processing raw data to analysis results:', { csvUploadId, results });
      
      // Calculate totals
      const totalDebtors = results.highProbability.count + results.mediumProbability.count + results.lowProbability.count;
      const totalValue = this.parseAmount(results.highProbability.totalValue) + 
                        this.parseAmount(results.mediumProbability.totalValue) + 
                        this.parseAmount(results.lowProbability.totalValue);

      // Update existing CSV upload record with analysis results
      const { data: uploadData, error: uploadError } = await supabase
        .from('csv_uploads')
        .update({
          total_debtors: totalDebtors,
          high_priority_count: results.highProbability.count,
          medium_priority_count: results.mediumProbability.count,
          low_priority_count: results.lowProbability.count,
          total_value: totalValue,
          processing_step: 'analyzed',
          status: 'completed'
        })
        .eq('id', csvUploadId)
        .select()
        .single();

      if (uploadError) {
        console.error('Error saving upload record:', uploadError);
        throw uploadError;
      }

      console.log('Updated upload record with analysis results');

      // Insert debtor records
      const allDebtors = [
        ...results.highProbability.debtors.map(d => ({ ...d, priority_category: 'high' as const })),
        ...results.mediumProbability.debtors.map(d => ({ ...d, priority_category: 'medium' as const })),
        ...results.lowProbability.debtors.map(d => ({ ...d, priority_category: 'low' as const }))
      ];

      const debtorRecords = allDebtors.map(debtor => ({
        csv_upload_id: csvUploadId,
        name: debtor.name,
        score: debtor.score,
        amount: this.parseAmount(debtor.amount),
        last_payment: debtor.lastPayment || null,
        phone: debtor.phone !== 'No phone' ? debtor.phone : null,
        email: debtor.email !== 'No email' ? debtor.email : null,
        address: debtor.address !== 'No address' ? debtor.address : null,
        postal_code: debtor.postalCode !== 'N/A' ? debtor.postalCode : null,
        occupation: debtor.occupation !== 'Unknown' ? debtor.occupation : null,
        priority_category: debtor.priority_category,
        scoring_breakdown: debtor.scoring
      }));

      // Insert debtor records in batches to avoid size limits
      const batchSize = 100;
      for (let i = 0; i < debtorRecords.length; i += batchSize) {
        const batch = debtorRecords.slice(i, i + batchSize);
        const { error: debtorError } = await supabase
          .from('debtor_records')
          .insert(batch);

        if (debtorError) {
          console.error('Error saving debtor records batch:', debtorError);
          throw debtorError;
        }
      }

      console.log('Successfully processed and saved analysis data to Supabase');
      return csvUploadId;

    } catch (error) {
      console.error('Error in processRawData:', error);
      throw error;
    }
  }

  // Backward compatibility method
  private static async saveRawCsvDataAndProcess(filename: string, customName: string, results: AnalysisResults): Promise<string> {
    // This is a fallback that combines both steps for backward compatibility
    // In real implementation, you'd need the raw CSV data here
    const csvUploadId = Math.random().toString(36).substring(2, 15);
    return this.processRawData(csvUploadId, results);
  }

  // Get raw CSV data for processing
  static async getRawCsvData(csvUploadId: string): Promise<any[]> {
    // First get the upload record to find the table name
    const { data: uploadData, error: uploadError } = await supabase
      .from('csv_uploads')
      .select('table_name')
      .eq('id', csvUploadId)
      .single();

    if (uploadError || !uploadData?.table_name) {
      throw new Error('CSV upload not found or table name missing');
    }

    // Query the dedicated CSV table
    const { data, error } = await supabase
      .from(uploadData.table_name)
      .select('*')
      .eq('csv_upload_id', csvUploadId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get upload status
  static async getUploadStatus(csvUploadId: string): Promise<any> {
    const { data, error } = await supabase
      .from('csv_uploads')
      .select('*')
      .eq('id', csvUploadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  // Get recent CSV uploads
  static async getRecentUploads(limit: number = 10): Promise<CsvUpload[]> {
    const { data, error } = await supabase
      .from('csv_uploads')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Delete CSV upload and all associated data
  static async deleteCsvUpload(id: string): Promise<void> {
    try {
      console.log('Deleting CSV upload:', id);

      // Get the upload record first to get the table name
      const uploadData = await this.getCsvUpload(id);

      if (!uploadData) {
        throw new Error('CSV upload not found');
      }

      // Delete all debtor records associated with this CSV
      // The ON DELETE CASCADE should handle this, but we'll be explicit
      const { error: debtorError } = await supabase
        .from('debtor_records')
        .delete()
        .eq('csv_upload_id', id);

      if (debtorError) {
        console.error('Error deleting debtor records:', debtorError);
        throw debtorError;
      }

      // Delete the CSV upload record
      const { error: uploadError } = await supabase
        .from('csv_uploads')
        .delete()
        .eq('id', id);

      if (uploadError) {
        console.error('Error deleting CSV upload:', uploadError);
        throw uploadError;
      }

      console.log('Successfully deleted CSV upload and associated records');
    } catch (error) {
      console.error('Error in deleteCsvUpload:', error);
      throw error;
    }
  }

  // Get CSV upload by ID
  static async getCsvUpload(id: string): Promise<CsvUpload | null> {
    const { data, error } = await supabase
      .from('csv_uploads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  }

  // Get debtor records for a specific upload
  static async getDebtorRecords(csvUploadId: string): Promise<DebtorRecord[]> {
    const { data, error } = await supabase
      .from('debtor_records')
      .select('*')
      .eq('csv_upload_id', csvUploadId)
      .order('score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get debtor records by category
  static async getDebtorsByCategory(csvUploadId: string, category: 'high' | 'medium' | 'low'): Promise<DebtorRecord[]> {
    const { data, error } = await supabase
      .from('debtor_records')
      .select('*')
      .eq('csv_upload_id', csvUploadId)
      .eq('priority_category', category)
      .order('score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Convert database records back to AnalysisResults format
  static async getAnalysisResults(csvUploadId: string): Promise<AnalysisResults> {
    const debtors = await this.getDebtorRecords(csvUploadId);
    
    const convertToProcessedDebtor = (record: DebtorRecord): ProcessedDebtor => ({
      id: parseInt(record.id.replace(/-/g, '').slice(0, 8), 16), // Convert UUID to number
      name: record.name,
      score: record.score,
      amount: `N$ ${record.amount.toLocaleString()}`,
      lastPayment: record.last_payment || 'No payment',
      phone: record.phone || 'No phone',
      email: record.email || 'No email',
      address: record.address || 'No address',
      postalCode: record.postal_code || 'N/A',
      occupation: record.occupation || 'Unknown',
      scoring: record.scoring_breakdown
    });

    const highPriorityDebtors = debtors
      .filter(d => d.priority_category === 'high')
      .map(convertToProcessedDebtor);
    
    const mediumPriorityDebtors = debtors
      .filter(d => d.priority_category === 'medium')
      .map(convertToProcessedDebtor);
    
    const lowPriorityDebtors = debtors
      .filter(d => d.priority_category === 'low')
      .map(convertToProcessedDebtor);

    const calculateCategoryStats = (categoryDebtors: ProcessedDebtor[]) => {
      const totalValue = categoryDebtors.reduce((sum, d) => sum + this.parseAmount(d.amount), 0);
      const avgScore = categoryDebtors.length > 0 
        ? Math.round(categoryDebtors.reduce((sum, d) => sum + d.score, 0) / categoryDebtors.length) 
        : 0;
      
      return {
        count: categoryDebtors.length,
        totalValue: `N$ ${totalValue.toLocaleString()}`,
        avgScore,
        debtors: categoryDebtors
      };
    };

    return {
      highProbability: calculateCategoryStats(highPriorityDebtors),
      mediumProbability: calculateCategoryStats(mediumPriorityDebtors),
      lowProbability: calculateCategoryStats(lowPriorityDebtors)
    };
  }

  // Helper method to parse amount strings
  private static parseAmount(amountStr: string | number): number {
    if (typeof amountStr === 'number') {
      // Sanity check for numbers too
      if (amountStr < 0 || amountStr > 1000000000 || isNaN(amountStr)) {
        console.warn(`Invalid numeric amount: ${amountStr}`);
        return 0;
      }
      return amountStr;
    }

    // Remove currency symbols, spaces, and commas
    const cleaned = amountStr.replace(/[N$,\s]/g, '');

    // Check if this looks like a date (contains slashes, dashes, or is suspiciously long)
    if (cleaned.includes('/') || cleaned.includes('-') || cleaned.length > 15) {
      console.warn(`Invalid amount string detected (possibly a date): ${amountStr}`);
      return 0;
    }

    // Parse the numeric value
    const numeric = cleaned.replace(/[^\d.-]/g, '');
    const num = parseFloat(numeric);

    // Sanity check: amounts should be reasonable
    if (isNaN(num) || num < 0 || num > 1000000000) {
      console.warn(`Invalid or unreasonable amount: ${amountStr} -> ${num}`);
      return 0;
    }

    return num;
  }
}