
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface UploadStatusDetails {
  needs_review?: boolean;
  missing_fields?: string[];
  confidence_score?: number;
  type?: string;
  message?: string;
  data?: {
    invoice_number?: string;
  };
}

export interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  details?: UploadStatusDetails;
}

const API_BASE_URL = "http://localhost:5000/api";

export const useInvoiceUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [invoiceType, setInvoiceType] = useState<'sales' | 'purchase'>('sales');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setTimeout(() => {
      setFile(null);
      const fileInput = document.getElementById('invoice-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload invoices",
        variant: "destructive",
      });
      return;
    }
    
    if (!file) {
      toast({
        title: "Missing File",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadStatus({ status: 'uploading' });
    
    try {
      // Create form data for the multipart/form-data request
      const formData = new FormData();
      formData.append('files', file);
      formData.append('userId', user.id);
      formData.append('invoiceType', invoiceType);
      
      // Call our backend API
      const response = await fetch(`${API_BASE_URL}/invoices/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to upload invoice');
      }
      
      // Handle various result scenarios
      if (result.duplicates && result.duplicates.length > 0) {
        setUploadStatus({ 
          status: 'error', 
          details: { 
            type: 'duplicate', 
            data: result.duplicates[0]
          }
        });
        
        toast({
          title: "Duplicate Invoice",
          description: `This invoice appears to be a duplicate of an existing invoice.`,
          variant: "default",
        });
        return;
      }
      
      if (result.potentialDuplicates && result.potentialDuplicates.length > 0) {
        toast({
          title: "Possible Duplicate",
          description: "This invoice is similar to one you've already uploaded. Please check carefully.",
          variant: "default",
        });
      }
      
      // Check for processed results with warnings
      if (result.processed && result.processed.length > 0) {
        const processedInvoice = result.processed[0];
        
        if (processedInvoice.needs_review) {
          setUploadStatus({ 
            status: 'success', 
            details: { 
              needs_review: true, 
              missing_fields: processedInvoice.missing_fields,
              confidence_score: processedInvoice.confidence_score
            }
          });
          
          toast({
            title: "Invoice Needs Review",
            description: `The invoice was uploaded but needs your review to verify the extracted data.`,
            variant: "default",
          });
        } else {
          setUploadStatus({ status: 'success' });
          
          toast({
            title: "Upload Successful",
            description: `Your ${invoiceType} invoice has been uploaded and processed successfully.`,
          });
        }
        
        // Dispatch custom event to notify other components to refresh
        const event = new CustomEvent('invoice-uploaded');
        window.dispatchEvent(event);
      } else if (result.errors && result.errors.length > 0) {
        // Handle processing errors
        setUploadStatus({ 
          status: 'error', 
          details: { 
            type: 'processing',
            message: result.errors[0].error 
          }
        });
        
        toast({
          title: "Processing Error",
          description: result.errors[0].error || "There was an error processing your invoice.",
          variant: "destructive",
        });
      }
      
      // Reset form after successful upload
      if (result.success) {
        resetForm();
      }
      
    } catch (error) {
      console.error("Error uploading invoice:", error);
      setUploadStatus({ 
        status: 'error',
        details: { 
          type: 'system',
          message: error instanceof Error ? error.message : "Unknown error"
        }
      });
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "There was an error uploading your invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    file,
    invoiceType,
    isUploading,
    uploadStatus,
    handleFileChange,
    setInvoiceType,
    handleSubmit
  };
};
