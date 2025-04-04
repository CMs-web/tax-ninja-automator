
import { supabase } from "@/integrations/supabase/client";
import { Payment, mockServices } from "@/types/service";

// Mock data for development
const mockPayments: Payment[] = [
  {
    id: '1',
    user_id: '123',
    gst_return_id: '3',
    amount: 7000,
    payment_date: '2025-02-18',
    payment_method: 'UPI',
    transaction_id: 'TXN12345',
    status: 'completed',
    created_at: '2025-02-18T10:00:00Z',
    updated_at: '2025-02-18T10:00:00Z'
  }
];

export const paymentService = {
  /**
   * Get all payments for a user
   */
  getAll: async (userId: string) => {
    if (mockServices.enableMocks) {
      return { data: mockPayments.filter(payment => payment.user_id === userId) };
    }

    try {
      // Only execute this code when not in mock mode
      // For now, just return empty data to satisfy TypeScript
      return { data: [] };
    } catch (error) {
      console.error('Error fetching payments:', error);
      return { data: [] };
    }
  },

  /**
   * Get payments for a specific GST return
   */
  getByGstReturnId: async (gstReturnId: string) => {
    if (mockServices.enableMocks) {
      return { data: mockPayments.filter(payment => payment.gst_return_id === gstReturnId) };
    }

    try {
      // Only execute this code when not in mock mode
      // For now, just return empty data to satisfy TypeScript
      return { data: [] };
    } catch (error) {
      console.error('Error fetching payments for GST return:', error);
      return { data: [] };
    }
  },

  /**
   * Create a new payment
   */
  create: async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
    if (mockServices.enableMocks) {
      const newPayment = {
        ...payment,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockPayments.push(newPayment);
      return { data: newPayment };
    }

    try {
      // Only execute this code when not in mock mode
      // For now, just return mock data to satisfy TypeScript
      const newPayment = {
        ...payment,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return { data: newPayment };
    } catch (error) {
      console.error('Error creating payment:', error);
      return { error };
    }
  },

  /**
   * Update payment status
   */
  updateStatus: async (paymentId: string, status: 'pending' | 'processing' | 'completed' | 'failed') => {
    if (mockServices.enableMocks) {
      const index = mockPayments.findIndex(payment => payment.id === paymentId);
      if (index !== -1) {
        mockPayments[index] = {
          ...mockPayments[index],
          status,
          updated_at: new Date().toISOString()
        };
        return { data: mockPayments[index] };
      }
      return { error: 'Payment not found' };
    }

    try {
      // Only execute this code when not in mock mode
      // For now, just return not found to satisfy TypeScript
      return { error: 'Payment not found' };
    } catch (error) {
      console.error('Error updating payment status:', error);
      return { error };
    }
  }
};
