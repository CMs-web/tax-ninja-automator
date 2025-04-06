
// Define proper types for Supabase tables
export type InvoiceDB = {
  id: string;
  user_id: string;
  invoice_number: string;
  invoice_date: string;
  vendor_name: string;
  vendor_gstin?: string;
  amount: number;
  gst_amount: number;
  gst_rate?: number;
  type: 'sales' | 'purchase' | 'unknown';
  processing_status: 'pending' | 'processed' | 'failed' | 'reviewed';
  reconciliation_status?: 'matched' | 'unmatched' | 'pending';
  ocr_data?: any;
  confidence_score?: number;
  file_url: string;
  created_at: string;
  updated_at: string;
}

export type SupabaseTablesType = {
  invoices: InvoiceDB;
}
