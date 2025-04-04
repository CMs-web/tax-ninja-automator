
import { supabase } from "@/integrations/supabase/client";
import { GstReturn } from "@/types/service";

export const gstReturnsService = {
  /**
   * Get all GST returns for a user
   */
  getAll: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('gst_returns')
        .select('*')
        .eq('user_id', userId)
        .order('filing_period', { ascending: false });

      if (error) throw error;
      return { data: data || [] };
    } catch (error) {
      console.error('Error fetching GST returns:', error);
      return { data: [], error };
    }
  },

  /**
   * Get a specific GST return
   */
  getById: async (returnId: string) => {
    try {
      const { data, error } = await supabase
        .from('gst_returns')
        .select('*')
        .eq('id', returnId)
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching GST return:', error);
      return { error };
    }
  },

  /**
   * Create a new GST return
   */
  create: async (gstReturn: Omit<GstReturn, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('gst_returns')
        .insert([gstReturn])
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error creating GST return:', error);
      return { error };
    }
  },

  /**
   * Update an existing GST return
   */
  update: async (returnId: string, returnData: Partial<GstReturn>) => {
    try {
      const { data, error } = await supabase
        .from('gst_returns')
        .update(returnData)
        .eq('id', returnId)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error updating GST return:', error);
      return { error };
    }
  }
};
