
export interface Invoice {
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
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export interface GstReturn {
  id: string;
  user_id: string;
  filing_period: string;
  due_date: string;
  filed_date: string | null;
  sales_gst: number;
  purchase_gst: number;
  payable_gst: number;
  status: 'pending' | 'filed' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  gst_return_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// Mock service flag (set to false to use real Supabase backend)
export const mockServices = {
  enableMocks: false // Now using real Supabase backend
};
