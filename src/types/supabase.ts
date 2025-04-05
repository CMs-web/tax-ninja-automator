
// Define proper types for Supabase tables
export type InvoiceDB = {
  id: string;
  user_id: string;
  invoice_number: string;
  invoice_date: string;
  vendor: string;
  amount: number;
  gst_amount: number;
  type: 'sales' | 'purchase';
  status: 'pending' | 'processed' | 'error';
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export type SupabaseTablesType = {
  invoices: InvoiceDB;
}
