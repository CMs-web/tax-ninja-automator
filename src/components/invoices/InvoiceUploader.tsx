
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const API_BASE_URL = "http://localhost:5000/api";

const InvoiceUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [invoiceType, setInvoiceType] = useState<'sales' | 'purchase'>('sales');
  const [isUploading, setIsUploading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
      setUploadProgress(0);
    }
  };

  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prevProgress => {
        const increment = Math.random() * 10;
        const newProgress = Math.min(prevProgress + increment, 95);
        
        if (newProgress >= 95) {
          clearInterval(interval);
        }
        
        return newProgress;
      });
    }, 300);

    return interval;
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
    setUploadStatus('uploading');
    
    // Simulate progress for better UX
    const progressInterval = simulateProgress();
    
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
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to upload invoice');
      }
      
      setUploadStatus('success');
      
      toast({
        title: "Upload Successful",
        description: `Your ${invoiceType} invoice has been uploaded and processed successfully.`,
      });
      
      // Dispatch custom event to notify other components to refresh
      const event = new CustomEvent('invoice-uploaded');
      window.dispatchEvent(event);
      
    } catch (error) {
      clearInterval(progressInterval);
      setUploadStatus('error');
      console.error("Error uploading invoice:", error);
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "There was an error uploading your invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetry = async () => {
    if (!file || !user) return;
    
    setIsRetrying(true);
    setUploadStatus('uploading');
    
    // Simulate progress for better UX
    const progressInterval = simulateProgress();
    
    try {
      // Create form data for retry
      const formData = new FormData();
      formData.append('files', file);
      formData.append('userId', user.id);
      formData.append('invoiceType', invoiceType);
      formData.append('isRetry', 'true'); // Signal that this is a retry
      
      // Call our backend API with retry flag
      const response = await fetch(`${API_BASE_URL}/invoices/upload`, {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to retry invoice processing');
      }
      
      setUploadStatus('success');
      
      toast({
        title: "Retry Successful",
        description: `Your ${invoiceType} invoice has been reprocessed successfully.`,
      });
      
      // Dispatch custom event to notify other components to refresh
      const event = new CustomEvent('invoice-uploaded');
      window.dispatchEvent(event);
      
    } catch (error) {
      clearInterval(progressInterval);
      setUploadStatus('error');
      console.error("Error retrying invoice:", error);
      
      toast({
        title: "Retry Failed",
        description: error instanceof Error ? error.message : "There was an error retrying your invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const renderStatusMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {isRetrying ? "Retrying..." : "Uploading & Processing..."}
              </span>
              <span className="text-sm font-medium">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center gap-2 text-emerald-600 mt-4">
            <CheckCircle className="h-5 w-5" />
            <span>{isRetrying ? "Retry completed successfully!" : "Upload completed successfully!"}</span>
          </div>
        );
      case 'error':
        return (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to process invoice</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              <RefreshCw className="h-4 w-4" />
              Retry Processing
            </Button>
          </div>
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
            disabled={!file || isUploading || isRetrying}
          >
            {isUploading ? "Uploading & Processing..." : "Upload Invoice"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default InvoiceUploader;
