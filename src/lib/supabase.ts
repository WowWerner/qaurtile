import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Prevent page reloads on token refresh
    storage: {
      getItem: (key) => {
        return localStorage.getItem(key);
      },
      setItem: (key, value) => {
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        localStorage.removeItem(key);
      }
    }
  }
});

// Database types
export interface CsvUpload {
  id: string;
  filename: string;
  name: string;
  table_name: string;
  uploaded_at: string;
  total_debtors: number;
  high_priority_count: number;
  medium_priority_count: number;
  low_priority_count: number;
  total_value: number;
  status: string;
}

export interface DebtorRecord {
  id: string;
  csv_upload_id: string;
  name: string;
  score: number;
  amount: number;
  last_payment: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  postal_code: string | null;
  occupation: string | null;
  priority_category: 'high' | 'medium' | 'low';
  scoring_breakdown: any;
  created_at: string;
}