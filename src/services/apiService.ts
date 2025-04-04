
import { supabase } from "@/integrations/supabase/client";
import { Profile, Invoice, GstReturn, Payment } from "@/types";

// Profiles Service
export const profilesService = {
  async getProfile(userId: string) {
    return supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
  },
  
  async updateProfile(userId: string, data: any) {
    const updates = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    
    return supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
  }
};

// Invoices Service
export const invoicesService = {
  async getAllInvoices(userId: string) {
    return supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },
  
  async getInvoicesByType(userId: string, type: 'sales' | 'purchase') {
    return supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false });
  },
  
  async addInvoice(data: any) {
    return supabase
      .from('invoices')
      .insert([data]);
  },
  
  async updateInvoice(invoiceId: string, data: any) {
    const updates = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    
    return supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId);
  },
  
  async deleteInvoice(invoiceId: string) {
    return supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);
  },
  
  async uploadInvoiceFile(file: File, userId: string) {
    const filePath = `${userId}/${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase
      .storage
      .from('invoices')
      .upload(filePath, file);
      
    if (error) throw error;
    
    // Get the public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('invoices')
      .getPublicUrl(filePath);
      
    return publicUrlData.publicUrl;
  }
};

// GST Returns Service
export const gstReturnsService = {
  async getAll(userId: string) {
    return supabase
      .from('gst_returns')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false });
  },
  
  async getByPeriod(userId: string, period: string) {
    return supabase
      .from('gst_returns')
      .select('*')
      .eq('user_id', userId)
      .eq('filing_period', period)
      .single();
  },
  
  async createOrUpdate(userId: string, data: any) {
    const { filing_period } = data;
    
    // Check if this period already exists
    const { data: existingReturn } = await this.getByPeriod(userId, filing_period);
    
    if (existingReturn) {
      // Update existing return
      return supabase
        .from('gst_returns')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReturn.id);
    } else {
      // Create new return
      return supabase
        .from('gst_returns')
        .insert([{
          ...data,
          user_id: userId
        }]);
    }
  },
  
  async updateStatus(returnId: string, status: "pending" | "submitted" | "paid") {
    return supabase
      .from('gst_returns')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
        filed_date: status === 'submitted' ? new Date().toISOString() : null
      })
      .eq('id', returnId);
  }
};

// Payments Service
export const paymentsService = {
  async getAll(userId: string) {
    return supabase
      .from('payments')
      .select('*, gst_returns(filing_period)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },
  
  async createPayment(data: any) {
    return supabase
      .from('payments')
      .insert([data]);
  },
  
  async updatePaymentStatus(paymentId: string, status: string, transactionId?: string) {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (transactionId) {
      updates.transaction_id = transactionId;
    }
    
    return supabase
      .from('payments')
      .update(updates)
      .eq('id', paymentId);
  }
};

// Dashboard Stats Service
export const dashboardService = {
  async getStats(userId: string) {
    try {
      // Get current month GST returns
      const currentMonth = new Date().toLocaleString('default', { month: 'short' });
      const currentYear = new Date().getFullYear();
      const currentPeriod = `${currentMonth} ${currentYear}`;
      
      const { data: currentReturn } = await gstReturnsService.getByPeriod(userId, currentPeriod);
      
      // Get recent returns
      const { data: recentReturns } = await gstReturnsService.getAll(userId);
      
      // Get invoice counts
      const { data: salesInvoices } = await invoicesService.getInvoicesByType(userId, 'sales');
      const { data: purchaseInvoices } = await invoicesService.getInvoicesByType(userId, 'purchase');
      
      return {
        currentReturn: currentReturn || null,
        recentReturns: recentReturns || [],
        salesInvoicesCount: salesInvoices?.length || 0,
        purchaseInvoicesCount: purchaseInvoices?.length || 0,
        filingDueDate: currentReturn?.due_date || null,
        lastFiled: (recentReturns && recentReturns.length > 0) ? recentReturns[0].filed_date : null,
        complianceScore: calculateComplianceScore(recentReturns || [])
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      return {
        currentReturn: null,
        recentReturns: [],
        salesInvoicesCount: 0,
        purchaseInvoicesCount: 0,
        filingDueDate: null,
        lastFiled: null,
        complianceScore: 100
      };
    }
  }
};

// Helper function to calculate compliance score
function calculateComplianceScore(returns: GstReturn[]) {
  if (returns.length === 0) return 100;
  
  const totalReturns = returns.length;
  const onTimeReturns = returns.filter(ret => {
    if (ret.status !== 'pending') {
      const filedDate = ret.filed_date ? new Date(ret.filed_date) : null;
      const dueDate = new Date(ret.due_date);
      return filedDate && filedDate <= dueDate;
    }
    return false;
  }).length;
  
  return Math.round((onTimeReturns / totalReturns) * 100);
}
