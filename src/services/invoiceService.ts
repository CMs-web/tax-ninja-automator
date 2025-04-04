
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/service";

export const invoiceService = {
  /**
   * Get all invoices for a user
   */
  getAll: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      return { data: data || [] };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return { data: [] };
    }
  },

  /**
   * Get invoices by type (sales or purchase)
   */
  getByType: async (userId: string, type: 'sales' | 'purchase') => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      return { data: data || [] };
    } catch (error) {
      console.error(`Error fetching ${type} invoices:`, error);
      return { data: [] };
    }
  },

  /**
   * Create a new invoice
   */
  create: async (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoice])
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { error };
    }
  },

  /**
   * Update an existing invoice
   */
  update: async (invoiceId: string, invoiceData: Partial<Invoice>) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error updating invoice:', error);
      return { error };
    }
  },

  /**
   * Delete an invoice
   */
  delete: async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return { error };
    }
  },

  /**
   * Upload an invoice file to Supabase Storage
   */
  uploadFile: async (userId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (error) throw error;
      
      const fileUrl = supabase.storage
        .from('invoices')
        .getPublicUrl(data.path).data.publicUrl;
        
      return { fileUrl };
    } catch (error) {
      console.error('Error uploading invoice file:', error);
      return { error };
    }
  }
};
