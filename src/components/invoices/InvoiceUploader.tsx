import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, RefreshCw, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import InvoiceMissingFieldsAlert from "./InvoiceMissingFieldsAlert";

const API_BASE_URL = "http://localhost:5000/api";

const InvoiceUploader = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [invoiceType, setInvoiceType] = useState<'sales' | 'purchase'>('sales');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingResults, setProcessingResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setProcessingResults([]);
      setShowResults(false);
      setUploadProgress(0);
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
    
    if (files.length === 0) {
      toast({
        title: "Missing File",
        description: "Please select at least one file to upload",
        variant: "default",
      });
      return;
    }
    
    await processFiles();
  };

  const processFiles = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    setProcessingResults([]);
    setShowResults(false);
    
    const results = [];
    const totalFiles = files.length;
    let completed = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('files', file);
        formData.append('userId', user.id);
        formData.append('invoiceType', invoiceType);
        
        const response = await fetch(`${API_BASE_URL}/invoices/upload`, {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        completed++;
        setUploadProgress(Math.round((completed / totalFiles) * 100));
        
        if (!response.ok) {
          results.push({
            fileName: file.name,
            success: false,
            error: result.error || result.details || 'Failed to upload invoice',
            invoiceId: null
          });
        } else {
          results.push({
            fileName: file.name,
            success: true,
            data: result.data || {},
            invoiceId: result.data?.id || null
          });
        }
      }
      
      setProcessingResults(results);
      setShowResults(true);
      
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        toast({
          title: `${successCount} ${successCount === 1 ? 'Invoice' : 'Invoices'} Uploaded`,
          description: `Successfully processed ${successCount} of ${totalFiles} files.`,
          variant: "default",
        });
        
        const event = new CustomEvent('invoice-uploaded');
        window.dispatchEvent(event);
      }
      
      if (successCount < totalFiles) {
        toast({
          title: "Some Uploads Failed",
          description: `${totalFiles - successCount} of ${totalFiles} files failed to process.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing invoices:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "There was an error uploading your invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetryProcessing = async (index: number) => {
    if (!user || !files[index]) return;
    
    const file = files[index];
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('userId', user.id);
      formData.append('invoiceType', invoiceType);
      formData.append('retry', 'true');
      
      if (processingResults[index]?.invoiceId) {
        formData.append('invoiceId', processingResults[index].invoiceId);
      }
      
      const response = await fetch(`${API_BASE_URL}/invoices/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to retry processing');
      }
      
      const updatedResults = [...processingResults];
      updatedResults[index] = {
        fileName: file.name,
        success: true,
        data: result.data || {},
        invoiceId: result.data?.id || null
      };
      
      setProcessingResults(updatedResults);
      
      toast({
        title: "Retry Successful",
        description: `Successfully re-processed ${file.name}.`,
        variant: "default",
      });
      
      const event = new CustomEvent('invoice-uploaded');
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error retrying invoice processing:", error);
      toast({
        title: "Retry Failed",
        description: error instanceof Error ? error.message : "There was an error retrying the invoice processing.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditInvoice = (invoiceId: string) => {
    window.location.href = `/invoices/review?id=${invoiceId}`;
  };

  const resetForm = () => {
    setFiles([]);
    setProcessingResults([]);
    setShowResults(false);
    setUploadProgress(0);
    const fileInput = document.getElementById('invoice-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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
            <Label htmlFor="invoice-file">Select Invoice File(s)</Label>
            <div className="border-2 border-dashed border-gray-200 rounded-md p-6 flex flex-col items-center justify-center">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-2">Upload PDF or image files</p>
              <Input 
                id="invoice-file"
                type="file" 
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp" 
                onChange={handleFileChange} 
                className="max-w-xs"
                disabled={isUploading}
              />
              {files.length > 0 && (
                <p className="text-sm text-emerald-600 mt-2">
                  Selected: {files.length} {files.length === 1 ? 'file' : 'files'}
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              The system will automatically extract invoice details using OCR technology
            </p>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Uploading & Processing...</span>
                <span className="text-sm font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {showResults && processingResults.length > 0 && (
            <div className="space-y-4 mt-4">
              <h3 className="text-sm font-medium">Processing Results:</h3>
              <div className="space-y-3">
                {processingResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-md border ${
                      result.success ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{result.fileName}</span>
                      {!result.success ? (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRetryProcessing(index)}
                          disabled={isUploading}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" /> Retry
                        </Button>
                      ) : result.data && (
                        <div className="flex gap-2">
                          {result.invoiceId && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditInvoice(result.invoiceId)}
                            >
                              Edit Details
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {result.success && result.data && (
                      <InvoiceMissingFieldsAlert 
                        invoice={result.data} 
                        onEditClick={() => handleEditInvoice(result.invoiceId)}
                      />
                    )}
                    
                    {!result.success && (
                      <p className="text-xs text-red-600 mt-1">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {showResults && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetForm}
              disabled={isUploading}
            >
              Upload More
            </Button>
          )}
          <Button 
            type="submit" 
            className={`${showResults ? 'ml-auto' : 'w-full'} bg-emerald-600 hover:bg-emerald-700`}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? "Uploading & Processing..." : "Upload & Process"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default InvoiceUploader;
