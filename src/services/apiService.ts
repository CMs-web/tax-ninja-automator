
import { supabase } from "@/integrations/supabase/client";
import { Invoice, GstReturn, Payment } from "@/types";

export const apiService = {
  // Profile API
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
  
  // Invoice API
  async getInvoices(userId: string) {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
    
    return data;
  },
  
  async getInvoicesByType(userId: string, type: 'sales' | 'purchase') {
    if (!userId) return [];
    
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
    
    return data;
  },
  
  async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoice]);
    
    if (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
    
    return data;
  },
  
  async updateInvoice(invoiceId: string, invoiceData: any) {
    const { data, error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', invoiceId);
    
    if (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
    
    return data;
  },
  
  async deleteInvoice(invoiceId: string) {
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
  
  // GstReturns API
  async getGstReturns(userId: string) {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('gst_returns')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching GST returns:', error);
      throw error;
    }
    
    return data;
  },
  
  async getGstReturn(returnId: string) {
    if (!returnId) return null;
    
    const { data, error } = await supabase
      .from('gst_returns')
      .select('*')
      .eq('id', returnId)
      .single();
    
    if (error) {
      console.error('Error fetching GST return:', error);
      throw error;
    }
    
    return data;
  },
  
  async createGstReturn(gstReturn: Omit<GstReturn, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('gst_returns')
      .insert([gstReturn]);
    
    if (error) {
      console.error('Error creating GST return:', error);
      throw error;
    }
    
    return data;
  },
  
  async updateGstReturnStatus(returnId: string, status: 'pending' | 'submitted' | 'paid', filedDate?: string) {
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
    
    return data;
  },
  
  // Payments API
  async getPaymentsByUser(userId: string) {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
    
    return data;
  },
  
  async createPayment(payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment]);
    
    if (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
    
    return data;
  },
  
  async updatePaymentStatus(paymentId: string, status: 'pending' | 'processing' | 'completed' | 'failed') {
    const { data, error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', paymentId);
    
    if (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
    
    return data;
  },
  
  // Dashboard API
  async getDashboardStats() {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return { salesCount: 0, purchaseCount: 0, pendingFilings: 0, gstDue: 0 };
      
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
      
      // Get pending filings
      const { data: pendingFilings, error: filingsError } = await supabase
        .from('gst_returns')
        .select('id, gst_payable')
        .eq('user_id', userId)
        .eq('status', 'pending');
      
      // Calculate total GST due
      let gstDue = 0;
      if (pendingFilings) {
        gstDue = pendingFilings.reduce((sum, currentReturn) => {
          return sum + (currentReturn ? parseFloat(currentReturn.gst_payable as any) || 0 : 0);
        }, 0);
      }
      
      if (salesError || purchaseError || filingsError) {
        console.error('Error fetching dashboard stats:', { salesError, purchaseError, filingsError });
      }
      
      return {
        salesCount: salesInvoices?.length || 0,
        purchaseCount: purchaseInvoices?.length || 0,
        pendingFilings: pendingFilings?.length || 0,
        gstDue: gstDue
      };
      
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return { salesCount: 0, purchaseCount: 0, pendingFilings: 0, gstDue: 0 };
    }
  }
};
