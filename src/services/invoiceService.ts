
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/service";
import { SupabaseTablesType } from "@/types/supabase";

// Set this to false to use the real Supabase backend
const USE_MOCK_DATA = false;

// Mock data for development only
const mockInvoices: Invoice[] = [
  {
    id: '1',
    user_id: '123',
    invoice_number: 'INV-001',
    invoice_date: '2025-03-15',
    vendor_name: 'ABC Corp',
    vendor_gstin: '29ABCDE1234F1Z5',
    amount: 10000,
    gst_amount: 1800,
    gst_rate: 18,
    type: 'sales',
    processing_status: 'processed',
    reconciliation_status: 'matched',
    confidence_score: 85.5,
    file_url: 'https://example.com/invoice1.pdf',
    created_at: '2025-03-15T10:00:00Z',
    updated_at: '2025-03-15T10:00:00Z'
  },
  {
    id: '2',
    user_id: '123',
    invoice_number: 'INV-002',
    invoice_date: '2025-03-10',
    vendor_name: 'XYZ Ltd',
    amount: 5000,
    gst_amount: 900,
    gst_rate: 18,
    type: 'purchase',
    processing_status: 'pending',
    reconciliation_status: 'pending',
    confidence_score: 65.2,
    file_url: 'https://example.com/invoice2.pdf',
    created_at: '2025-03-10T10:00:00Z',
    updated_at: '2025-03-10T10:00:00Z'
  }
];

export const invoiceService = {
  /**
   * Get all invoices for a user
   */
  getAll: async (userId: string) => {
    if (USE_MOCK_DATA) {
      return { data: mockInvoices.filter(inv => inv.user_id === userId) };
    }
    
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as { data: SupabaseTablesType['invoices'][] | null, error: any };
      
      if (error) throw error;
      
      return { data: data || [] };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return { data: [], error };
    }
  },

  /**
   * Get invoices by type (sales or purchase)
   */
  getByType: async (userId: string, type: 'sales' | 'purchase') => {
    if (USE_MOCK_DATA) {
      return { 
        data: mockInvoices.filter(inv => inv.user_id === userId && inv.type === type) 
      };
    }
    
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('created_at', { ascending: false }) as { data: SupabaseTablesType['invoices'][] | null, error: any };
      
      if (error) throw error;
      
      return { data: data || [] };
    } catch (error) {
      console.error(`Error fetching ${type} invoices:`, error);
      return { data: [], error };
    }
  },

  /**
   * Get invoice by ID
   */
  getById: async (userId: string, invoiceId: string) => {
    if (USE_MOCK_DATA) {
      const invoice = mockInvoices.find(inv => inv.id === invoiceId && inv.user_id === userId);
      return { data: invoice };
    }
    
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .maybeSingle() as { data: SupabaseTablesType['invoices'] | null, error: any };
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return { error };
    }
  },

  /**
   * Create a new invoice
   */
  create: async (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => {
    if (USE_MOCK_DATA) {
      const newInvoice = {
        ...invoice,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockInvoices.push(newInvoice);
      return { data: newInvoice };
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoice])
        .select() as { data: SupabaseTablesType['invoices'][] | null, error: any };
      
      if (error) throw error;
      
      return { data: data?.[0] };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { error };
    }
  },

  /**
   * Update an existing invoice
   */
  update: async (invoiceId: string, invoiceData: Partial<Invoice>) => {
    if (USE_MOCK_DATA) {
      const index = mockInvoices.findIndex(inv => inv.id === invoiceId);
      if (index !== -1) {
        mockInvoices[index] = {
          ...mockInvoices[index],
          ...invoiceData,
          updated_at: new Date().toISOString()
        };
        return { data: mockInvoices[index] };
      }
      return { error: 'Invoice not found' };
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', invoiceId)
        .select() as { data: SupabaseTablesType['invoices'][] | null, error: any };
      
      if (error) throw error;
      
      return { data: data?.[0] };
    } catch (error) {
      console.error('Error updating invoice:', error);
      return { error };
    }
  },

  /**
   * Delete an invoice
   */
  delete: async (userId: string, invoiceId: string) => {
    if (USE_MOCK_DATA) {
      const index = mockInvoices.findIndex(inv => inv.id === invoiceId && inv.user_id === userId);
      if (index !== -1) {
        mockInvoices.splice(index, 1);
        return { success: true };
      }
      return { error: 'Invoice not found' };
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('user_id', userId) as { error: any };
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return { error };
    }
  },

  /**
   * Upload an invoice file to Supabase Storage
   * This function is no longer used directly as file uploads
   * now go through the Node.js backend with Tesseract.js
   */
  uploadFile: async (userId: string, file: File) => {
    if (USE_MOCK_DATA) {
      // Mock file upload with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { 
        fileUrl: `https://example.com/${userId}/${file.name}`,
        fileName: file.name
      };
    }

    try {
      // Use userId as the folder name for organization
      const filePath = `${userId}/${file.name}`;
      
      // Upload the file to the invoices bucket
      const { data, error } = await supabase.storage
        .from('invoices')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(data.path);
      
      return { 
        fileUrl: publicUrl,
        fileName: file.name
      };
    } catch (error) {
      console.error('Error uploading invoice file:', error);
      return { error };
    }
  }
};
