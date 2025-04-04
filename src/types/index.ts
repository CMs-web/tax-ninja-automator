
export interface Profile {
  id: string;
  business_name: string;
  gstin?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  type: "sales" | "purchase";
  invoice_number: string;
  invoice_date: string;
  customer_vendor_name?: string;
  amount: number;
  gst_rate: number;
  gst_amount: number;
  file_url?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface GstReturn {
  id: string;
  user_id: string;
  filing_period: string; // Format: "MMM YYYY", e.g., "Apr 2025"
  due_date: string;
  sales_gst: number;
  purchase_gst: number;
  gst_payable: number;
  status: "pending" | "submitted" | "paid";
  filed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  gst_return_id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  transaction_id?: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}
