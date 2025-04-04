import { supabase } from "@/integrations/supabase/client";
import { Invoice, GstReturn, Payment } from "@/types";

// Profile service
export const profileService = {
  async getProfile(userId: string) {
    if (!userId) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
    
    return data;
  },
  
  async updateProfile(userId: string, profileData: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    
    return data;
  },
};

// Invoice service
export const invoicesService = {
  async getAll(userId: string) {
    if (!userId) return { data: [] };
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
    
    return { data };
  },
  
  async getByType(userId: string, type: 'sales' | 'purchase') {
    if (!userId) return { data: [] };
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invoices by type:', error);
      throw error;
    }
    
    return { data };
  },
  
  async create(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoice]);
    
    if (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
    
    return { data };
  },
  
  async update(invoiceId: string, invoiceData: Partial<Invoice>) {
    const { data, error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', invoiceId);
    
    if (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
    
    return { data };
  },
  
  async delete(invoiceId: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);
    
    if (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
    
    return true;
  },
};

// GST Returns service
export const gstReturnsService = {
  async getAll(userId: string) {
    if (!userId) return { data: [] };
    
    const { data, error } = await supabase
      .from('gst_returns')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching GST returns:', error);
      throw error;
    }
    
    return { data };
  },
  
  async getById(returnId: string) {
    if (!returnId) return { data: null };
    
    const { data, error } = await supabase
      .from('gst_returns')
      .select('*')
      .eq('id', returnId)
      .single();
    
    if (error) {
      console.error('Error fetching GST return:', error);
      throw error;
    }
    
    return { data };
  },
  
  async create(gstReturn: Omit<GstReturn, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('gst_returns')
      .insert([gstReturn]);
    
    if (error) {
      console.error('Error creating GST return:', error);
      throw error;
    }
    
    return { data };
  },
  
  async updateStatus(returnId: string, status: 'pending' | 'submitted' | 'paid', filedDate?: string) {
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    
    if (filedDate) {
      updateData.filed_date = filedDate;
    }
    
    const { data, error } = await supabase
      .from('gst_returns')
      .update(updateData)
      .eq('id', returnId);
    
    if (error) {
      console.error('Error updating GST return status:', error);
      throw error;
    }
    
    return { data };
  },
};

// Payments service
export const paymentsService = {  
  async getByUser(userId: string) {
    if (!userId) return { data: [] };
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
    
    return { data };
  },
  
  async create(payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment]);
    
    if (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
    
    return { data };
  },
  
  async updateStatus(paymentId: string, status: 'pending' | 'processing' | 'completed' | 'failed') {
    const { data, error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', paymentId);
    
    if (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
    
    return { data };
  },
};

// Dashboard service
export const dashboardService = {
  async getStats() {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      if (!user) {
        return {
          salesInvoicesCount: 0,
          purchaseInvoicesCount: 0,
          filingDueDate: null,
          lastFiled: null,
          complianceScore: 0
        };
      }
      
      const userId = user.id;
      
      // Get sales invoices count
      const { data: salesInvoices, error: salesError } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'sales');
      
      // Get purchase invoices count
      const { data: purchaseInvoices, error: purchaseError } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'purchase');
      
      // Get GST filings
      const { data: gstFilings, error: filingsError } = await supabase
        .from('gst_returns')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });
      
      // Find next filing due
      let filingDueDate = null;
      let lastFiled = null;
      let complianceScore = 0;
      
      if (gstFilings && gstFilings.length > 0) {
        // Find pending filing with earliest due date
        const pendingFilings = gstFilings.filter(filing => filing.status === 'pending');
        if (pendingFilings.length > 0) {
          filingDueDate = pendingFilings[0].due_date;
        }
        
        // Find most recent filed return
        const filedReturns = gstFilings.filter(filing => filing.status === 'submitted' || filing.status === 'paid');
        if (filedReturns.length > 0) {
          lastFiled = filedReturns[0].filed_date;
        }
        
        // Calculate compliance score (percentage of returns filed on time)
        const dueFilings = gstFilings.filter(filing => {
          const dueDate = new Date(filing.due_date);
          const today = new Date();
          return dueDate < today;
        });
        
        if (dueFilings.length > 0) {
          const filedOnTime = dueFilings.filter(filing => {
            if (!filing.filed_date) return false;
            const filedDate = new Date(filing.filed_date);
            const dueDate = new Date(filing.due_date);
            return filedDate <= dueDate;
          });
          
          complianceScore = Math.round((filedOnTime.length / dueFilings.length) * 100);
        } else {
          complianceScore = 100; // No missed deadlines yet
        }
      }
      
      if (salesError || purchaseError || filingsError) {
        console.error('Error fetching dashboard stats:', { salesError, purchaseError, filingsError });
      }
      
      return {
        salesInvoicesCount: salesInvoices?.length || 0,
        purchaseInvoicesCount: purchaseInvoices?.length || 0,
        filingDueDate,
        lastFiled,
        complianceScore
      };
      
    } catch (error) {
      console.error('Error in getStats:', error);
      return {
        salesInvoicesCount: 0,
        purchaseInvoicesCount: 0,
        filingDueDate: null,
        lastFiled: null,
        complianceScore: 0
      };
    }
  }
};

// Keep backward compatibility for existing code
export const apiService = {
  getProfile: profileService.getProfile,
  updateProfile: profileService.updateProfile,
  getInvoices: invoicesService.getAll,
  getInvoicesByType: invoicesService.getByType,
  createInvoice: invoicesService.create,
  updateInvoice: invoicesService.update,
  deleteInvoice: invoicesService.delete,
  getGstReturns: gstReturnsService.getAll,
  getGstReturn: gstReturnsService.getById,
  createGstReturn: gstReturnsService.create, 
  updateGstReturnStatus: gstReturnsService.updateStatus,
  getPaymentsByUser: paymentsService.getByUser,
  createPayment: paymentsService.create,
  updatePaymentStatus: paymentsService.updateStatus,
  getDashboardStats: dashboardService.getStats
};
