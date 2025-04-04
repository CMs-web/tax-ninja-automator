
import { supabase } from "@/integrations/supabase/client";

export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  getStats: async () => {
    try {
      // Mock data for development
      return {
        salesInvoicesCount: 12,
        purchaseInvoicesCount: 18,
        filingDueDate: '2025-04-20',
        lastFiled: '2025-03-18',
        complianceScore: 94
      };
      
      // In production, fetch actual data from Supabase
      /*
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Get sales invoices count
      const { count: salesCount, error: salesError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'sales');
        
      // Get purchase invoices count
      const { count: purchaseCount, error: purchaseError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'purchase');
        
      // Get latest GST return for due date
      const { data: latestReturn, error: returnError } = await supabase
        .from('gst_returns')
        .select('*')
        .eq('user_id', userId)
        .order('filing_period', { ascending: false })
        .limit(1)
        .single();
        
      // Get last filed GST return
      const { data: lastFiledReturn, error: lastFiledError } = await supabase
        .from('gst_returns')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'filed')
        .order('filed_date', { ascending: false })
        .limit(1)
        .single();
        
      if (salesError || purchaseError || returnError) {
        throw new Error('Error fetching dashboard data');
      }
        
      // Calculate compliance score (mock algorithm)
      const complianceScore = Math.min(100, Math.floor(Math.random() * 30) + 70);
        
      return {
        salesInvoicesCount: salesCount || 0,
        purchaseInvoicesCount: purchaseCount || 0,
        filingDueDate: latestReturn?.due_date || null,
        lastFiled: lastFiledReturn?.filed_date || null,
        complianceScore
      };
      */
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
