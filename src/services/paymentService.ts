
import { supabase } from "@/integrations/supabase/client";
import { Payment } from "@/types/service";

export const paymentService = {
  /**
   * Get all payments for a user
   */
  getAll: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return { data: data || [] };
    } catch (error) {
      console.error('Error fetching payments:', error);
      return { data: [] };
    }
  },

  /**
   * Get payments for a specific GST return
   */
  getByGstReturnId: async (gstReturnId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('gst_return_id', gstReturnId);

      if (error) throw error;
      return { data: data || [] };
    } catch (error) {
      console.error('Error fetching payments for GST return:', error);
      return { data: [] };
    }
  },

  /**
   * Create a new payment
   */
  create: async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([payment])
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error creating payment:', error);
      return { error };
    }
  },

  /**
   * Update payment status
   */
  updateStatus: async (paymentId: string, status: 'pending' | 'processing' | 'completed' | 'failed') => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ status })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error updating payment status:', error);
      return { error };
    }
  }
};
