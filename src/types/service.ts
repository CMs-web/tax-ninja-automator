
export interface Invoice {
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
