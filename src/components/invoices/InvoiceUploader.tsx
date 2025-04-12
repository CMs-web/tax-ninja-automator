
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, AlertCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_BASE_URL = "http://localhost:5000/api";

const InvoiceUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [invoiceType, setInvoiceType] = useState<'sales' | 'purchase'>('sales');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    details?: any;
  }>({ status: 'idle' });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
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
          variant: "default", // Changed from "warning" to "default"
        });
        return;
      }
      
      if (result.potentialDuplicates && result.potentialDuplicates.length > 0) {
        toast({
          title: "Possible Duplicate",
          description: "This invoice is similar to one you've already uploaded. Please check carefully.",
          variant: "default", // Changed from "warning" to "default"
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
            variant: "default", // Changed from "warning" to "default"
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
        setTimeout(() => {
          setFile(null);
          const fileInput = document.getElementById('invoice-file') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }, 2000);
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

  const renderStatusMessage = () => {
    switch (uploadStatus.status) {
      case 'uploading':
        return (
          <Alert className="mt-4 bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <div className="animate-spin mr-2">⏳</div>
              <div>
                <p className="text-sm font-medium">Uploading and processing invoice...</p>
                <p className="text-xs text-muted-foreground">This might take a few moments.</p>
              </div>
            </div>
          </Alert>
        );
        
      case 'success':
        if (uploadStatus.details?.needs_review) {
          return (
            <Alert className="mt-4 bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <p className="text-sm font-medium">Invoice uploaded but needs review</p>
                <p className="text-xs text-muted-foreground">
                  Confidence score: {uploadStatus.details.confidence_score}%
                </p>
                {uploadStatus.details.missing_fields?.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs font-medium">Fields to check:</p>
                    <ul className="text-xs list-disc pl-4">
                      {uploadStatus.details.missing_fields.map((field: string) => (
                        <li key={field}>{field.replace('_', ' ')}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          );
        }
        return (
          <Alert className="mt-4 bg-green-50 border-green-200">
            <div className="text-green-600 mr-2">✅</div>
            <AlertDescription>
              <p className="text-sm font-medium">Invoice uploaded successfully!</p>
            </AlertDescription>
          </Alert>
        );
        
      case 'error':
        if (uploadStatus.details?.type === 'duplicate') {
          return (
            <Alert className="mt-4 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                <p className="text-sm font-medium">Duplicate invoice detected</p>
                <p className="text-xs text-muted-foreground">
                  Invoice number {uploadStatus.details.data.invoice_number} already exists in your records.
                </p>
              </AlertDescription>
            </Alert>
          );
        }
        return (
          <Alert className="mt-4 bg-red-50 border-red-200" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm font-medium">Upload failed</p>
              <p className="text-xs">
                {uploadStatus.details?.message || "An unknown error occurred"}
              </p>
            </AlertDescription>
          </Alert>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Invoice</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-type">Invoice Type</Label>
            <RadioGroup 
              id="invoice-type"
              value={invoiceType} 
              onValueChange={(value) => setInvoiceType(value as 'sales' | 'purchase')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sales" id="sales" />
                <Label htmlFor="sales">Sales Invoice</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="purchase" id="purchase" />
                <Label htmlFor="purchase">Purchase Invoice</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="invoice-file">Select Invoice File</Label>
            <div className="border-2 border-dashed border-gray-200 rounded-md p-6 flex flex-col items-center justify-center">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-2">Upload PDF or image file</p>
              <Input 
                id="invoice-file"
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png,.webp" 
                onChange={handleFileChange} 
                className="max-w-xs"
                disabled={isUploading}
              />
              {file && (
                <p className="text-sm text-emerald-600 mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              The system will automatically extract invoice details using OCR technology
            </p>
          </div>

          {renderStatusMessage()}
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={!file || isUploading}
          >
            {isUploading ? "Uploading & Processing..." : "Upload Invoice"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default InvoiceUploader;
