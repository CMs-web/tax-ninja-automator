
import { supabase } from "@/integrations/supabase/client";
import { GstReturn, mockServices } from "@/types/service";

// Mock data for development
const mockGstReturns: GstReturn[] = [
  {
    id: '1',
    user_id: '123',
    filing_period: 'Mar 2025',
    due_date: '2025-04-20',
    filed_date: null,
    sales_gst: 15000,
    purchase_gst: 7500,
    payable_gst: 7500,
    status: 'pending',
    created_at: '2025-03-01T10:00:00Z',
    updated_at: '2025-03-01T10:00:00Z'
  },
  {
    id: '2',
    user_id: '123',
    filing_period: 'Feb 2025',
    due_date: '2025-03-20',
    filed_date: '2025-03-15',
    sales_gst: 18000,
    purchase_gst: 8000,
    payable_gst: 10000,
    status: 'filed',
    created_at: '2025-02-01T10:00:00Z',
    updated_at: '2025-03-15T10:00:00Z'
  },
  {
    id: '3',
    user_id: '123',
    filing_period: 'Jan 2025',
    due_date: '2025-02-20',
    filed_date: '2025-02-18',
    sales_gst: 12000,
    purchase_gst: 5000,
    payable_gst: 7000,
    status: 'paid',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-02-18T10:00:00Z'
  }
];

export const gstReturnsService = {
  /**
   * Get all GST returns for a user
   */
  getAll: async (userId: string) => {
    if (mockServices.enableMocks) {
      return { data: mockGstReturns.filter(gst => gst.user_id === userId) };
    }

    try {
      // Only execute this code when not in mock mode
      // For now, just return empty data to satisfy TypeScript
      return { data: [] };
    } catch (error) {
      console.error('Error fetching GST returns:', error);
      return { data: [], error };
    }
  },

  /**
   * Get a specific GST return
   */
  getById: async (returnId: string) => {
    if (mockServices.enableMocks) {
      const gstReturn = mockGstReturns.find(gst => gst.id === returnId);
      return gstReturn ? { data: gstReturn } : { error: 'GST return not found' };
    }

    try {
      // Only execute this code when not in mock mode
      // For now, just return not found to satisfy TypeScript
      return { error: 'GST return not found' };
    } catch (error) {
      console.error('Error fetching GST return:', error);
      return { error };
    }
  },

  /**
   * Create a new GST return
   */
  create: async (gstReturn: Omit<GstReturn, 'id' | 'created_at' | 'updated_at'>) => {
    if (mockServices.enableMocks) {
      const newReturn = {
        ...gstReturn,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockGstReturns.push(newReturn);
      return { data: newReturn };
    }

    try {
      // Only execute this code when not in mock mode
      // For now, just return mock data to satisfy TypeScript
      const newReturn = {
        ...gstReturn,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return { data: newReturn };
    } catch (error) {
      console.error('Error creating GST return:', error);
      return { error };
    }
  },

  /**
   * Update an existing GST return
   */
  update: async (returnId: string, returnData: Partial<GstReturn>) => {
    if (mockServices.enableMocks) {
      const index = mockGstReturns.findIndex(gst => gst.id === returnId);
      if (index !== -1) {
        mockGstReturns[index] = {
          ...mockGstReturns[index],
          ...returnData,
          updated_at: new Date().toISOString()
        };
        return { data: mockGstReturns[index] };
      }
      return { error: 'GST return not found' };
    }

    try {
      // Only execute this code when not in mock mode
      // For now, just return not found to satisfy TypeScript
      return { error: 'GST return not found' };
    } catch (error) {
      console.error('Error updating GST return:', error);
      return { error };
    }
  }
};
