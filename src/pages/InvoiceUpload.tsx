
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Check, AlertCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

const InvoiceUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error' | 'warning'>('idle');
  const [results, setResults] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Convert FileList to array
      const fileArray = Array.from(e.target.files);
      setFiles(fileArray);
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
        title: "Missing Files",
        description: "Please select at least one file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    setUploadStatus('uploading');
    setProgress(0);
    setResults([]);

    try {
      // Create FormData with all files
      const formData = new FormData();
      
      // Append each file
      files.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('userId', user.id);
      
      // Track progress
      const totalFiles = files.length;
      let processedFiles = 0;
      const updateProgress = () => {
        processedFiles++;
        const newProgress = Math.round((processedFiles / totalFiles) * 100);
        setProgress(newProgress);
      };
      
      // Process files one by one to track progress accurately
      const processedResults = [];
      for (let i = 0; i < files.length; i++) {
        const singleFormData = new FormData();
        singleFormData.append('files', files[i]);
        singleFormData.append('userId', user.id);
        
        // Upload file using unified API endpoint
        const response = await fetch(`${API_BASE_URL}/invoices/upload`, {
          method: 'POST',
          body: singleFormData,
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          processedResults.push({
            fileName: files[i].name,
            success: false,
            error: result.error || result.details || 'Failed to upload invoice'
          });
        } else {
          processedResults.push({
            fileName: files[i].name,
            success: true,
            data: result.data || {},
            invoiceId: result.data?.id || null,
            hasMissingFields: checkForMissingFields(result.data)
          });
        }
        
        updateProgress();
      }
      
      setResults(processedResults);
      
      // Determine overall status
      const failedUploads = processedResults.filter(r => !r.success).length;
      const withMissingFields = processedResults.filter(r => r.success && r.hasMissingFields).length;
      
      if (failedUploads > 0) {
        if (failedUploads === files.length) {
          setUploadStatus('error');
          toast({
            title: "Upload Failed",
            description: `All ${files.length} files failed to process.`,
            variant: "destructive",
          });
        } else {
          setUploadStatus('warning');
          toast({
            title: "Partial Success",
            description: `${files.length - failedUploads} of ${files.length} files were processed successfully.`,
            variant: "default",
          });
        }
      } else if (withMissingFields > 0) {
        setUploadStatus('warning');
        toast({
          title: "Upload Complete with Warnings",
          description: `${withMissingFields} ${withMissingFields === 1 ? 'invoice has' : 'invoices have'} missing or incomplete fields.`,
          variant: "default",
        });
      } else {
        setUploadStatus('success');
        toast({
          title: "Upload Successful",
          description: `${files.length} ${files.length === 1 ? 'invoice has' : 'invoices have'} been processed successfully.`,
          variant: "default",
        });
      }
      
      // Notify other components to refresh invoice lists
      const event = new CustomEvent('invoice-uploaded');
      window.dispatchEvent(event);

    } catch (error) {
      setUploadStatus('error');
      console.error("Error uploading invoices:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "There was an error uploading your invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(100); // Ensure progress bar completes
    }
  };
  
  const checkForMissingFields = (invoice: any) => {
    if (!invoice) return true;
    
    return !invoice.invoice_number || 
           !invoice.invoice_date || 
           !invoice.vendor_name || 
           !invoice.amount || 
           !invoice.gst_amount ||
           invoice.type === 'unknown';
  };

  const navigateToReview = () => {
    navigate('/invoices/review');
  };
  
  const handleRetryAll = () => {
    // Reset states and allow user to try upload again
    setUploadStatus('idle');
    setProgress(0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700">Batch Invoice Upload</h1>
          <p className="text-muted-foreground">
            Upload multiple invoices at once for processing
          </p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Upload Invoices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center">
                <Upload className="h-10 w-10 text-gray-400 mb-4" />
                <p className="text-lg text-gray-600 mb-2">Drag files here or click to browse</p>
                <p className="text-sm text-gray-500 mb-4">Upload multiple invoices (PDF, JPG, PNG)</p>
                <input 
                  id="invoice-files"
                  type="file" 
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp" 
                  onChange={handleFileChange} 
                  className="max-w-xs"
                  disabled={uploading}
                />
                {files.length > 0 && (
                  <div className="mt-4 text-sm">
                    <p className="font-medium text-emerald-600 mb-2">
                      {files.length} {files.length === 1 ? 'file' : 'files'} selected:
                    </p>
                    <ul className="list-disc pl-5 max-h-32 overflow-y-auto">
                      {files.map((file, index) => (
                        <li key={index} className="text-gray-600">{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {uploadStatus === 'uploading' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Uploading...</span>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {uploadStatus === 'success' && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Success!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your invoices have been uploaded and processed successfully. 
                    <Button variant="link" className="p-0 h-auto font-semibold text-emerald-700" onClick={navigateToReview}>
                      Review them now
                    </Button>.
                  </AlertDescription>
                </Alert>
              )}
              
              {uploadStatus === 'warning' && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Partial Success</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Some invoices were uploaded but have missing or incomplete data.
                    <Button variant="link" className="p-0 h-auto font-semibold text-emerald-700" onClick={navigateToReview}>
                      Review and edit them now
                    </Button>.
                  </AlertDescription>
                </Alert>
              )}

              {uploadStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    There was a problem uploading your invoices.
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-semibold text-white underline" 
                      onClick={handleRetryAll}
                    >
                      Try again
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {results.length > 0 && (uploadStatus === 'warning' || uploadStatus === 'error') && (
                <div className="mt-4 border rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <h3 className="text-sm font-medium">Processing Results</h3>
                  </div>
                  <div className="divide-y">
                    {results.map((result, index) => (
                      <div key={index} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{result.fileName}</p>
                          {!result.success && (
                            <p className="text-xs text-red-600">{result.error}</p>
                          )}
                          {result.success && result.hasMissingFields && (
                            <p className="text-xs text-amber-600">Missing or incomplete fields</p>
                          )}
                        </div>
                        {result.success && result.hasMissingFields && result.invoiceId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/invoices/review?id=${result.invoiceId}`)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <h4 className="font-semibold mb-1">What happens next?</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Files are uploaded and processed immediately</li>
                  <li>Our OCR system extracts invoice data</li>
                  <li>You'll be able to review extracted data in the Invoice Review page</li>
                  <li>Any missing or incomplete data can be edited manually</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/invoices')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={files.length === 0 || uploading}
              >
                {uploading ? "Uploading..." : "Upload All Invoices"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceUpload;
