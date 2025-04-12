
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Check, AlertCircle, AlertTriangle, FileWarning } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const API_BASE_URL = "http://localhost:5000/api";

interface ProcessedInvoice {
  filename: string;
  invoice_id: string;
  type: 'sales' | 'purchase' | 'unknown';
  confidence_score: number;
  needs_review: boolean;
  missing_fields?: string[];
}

interface UploadError {
  file: string;
  error: string;
  details?: string;
}

interface DuplicateInvoice {
  file: string;
  invoice_number: string;
  existing_invoice_id: string;
}

interface PotentialDuplicate {
  file: string;
  invoice_number: string;
  similar_invoices: {
    id: string;
    invoice_number: string;
    invoice_date: string;
    amount: number;
  }[];
}

interface UploadResult {
  processed: ProcessedInvoice[];
  errors?: UploadError[];
  duplicates?: DuplicateInvoice[];
  potentialDuplicates?: PotentialDuplicate[];
  success: boolean;
}

const InvoiceUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<UploadResult | null>(null);
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
    setResults(null);

    try {
      // Create FormData with all files
      const formData = new FormData();
      
      // Append each file
      files.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('userId', user.id);
      
      // Simulate progress for better user experience
      const simulateProgress = setInterval(() => {
        setProgress(prev => {
          const increment = Math.random() * 10;
          const newProgress = Math.min(prev + increment, 95);
          return newProgress;
        });
      }, 300);
      
      // Upload all files using unified API endpoint
      const response = await fetch(`${API_BASE_URL}/invoices/upload`, {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(simulateProgress);
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to upload invoices');
      }
      
      setProgress(100);
      setResults(result);
      setUploadStatus(result.success ? 'success' : 'error');
      
      // Determine notification message based on results
      const processedCount = result.processed?.length || 0;
      const errorCount = result.errors?.length || 0;
      const duplicateCount = result.duplicates?.length || 0;
      const potentialDuplicateCount = result.potentialDuplicates?.length || 0;
      
      let toastTitle = "Upload Complete";
      let toastMessage = `${processedCount} ${processedCount === 1 ? 'invoice' : 'invoices'} processed successfully.`;
      let toastVariant: "default" | "destructive" | undefined = "default";
      
      if (errorCount > 0) {
        toastTitle = errorCount === files.length ? "Upload Failed" : "Partial Upload Success";
        toastMessage += ` ${errorCount} ${errorCount === 1 ? 'file' : 'files'} failed.`;
        toastVariant = errorCount === files.length ? "destructive" : undefined;
      }
      
      if (duplicateCount > 0) {
        toastMessage += ` ${duplicateCount} ${duplicateCount === 1 ? 'duplicate was' : 'duplicates were'} skipped.`;
      }
      
      toast({
        title: toastTitle,
        description: toastMessage,
        variant: toastVariant,
      });

      // Dispatch event for other components
      if (processedCount > 0) {
        const event = new CustomEvent('invoice-uploaded');
        window.dispatchEvent(event);
      }

      // Reset form after short delay if all successful
      if (errorCount === 0 && duplicateCount === 0) {
        setTimeout(() => {
          setFiles([]);
          const fileInput = document.getElementById('invoice-files') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }, 2000);
      }

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
    }
  };

  const navigateToReview = () => {
    navigate('/invoices/review');
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">High ({score}%)</Badge>;
    if (score >= 60) return <Badge className="bg-amber-500">Medium ({score}%)</Badge>;
    return <Badge className="bg-red-500">Low ({score}%)</Badge>;
  };

  const renderInvoiceResults = () => {
    if (!results) return null;
    
    return (
      <div className="space-y-4 mt-4">
        {results.processed && results.processed.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Successfully Processed ({results.processed.length})</h3>
            <ScrollArea className="h-48 w-full border rounded-md p-2">
              <div className="space-y-2">
                {results.processed.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-1 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.filename}</p>
                      <div className="flex gap-2 items-center">
                        <Badge variant={item.type === 'sales' ? 'default' : 'secondary'}>
                          {item.type}
                        </Badge>
                        {getConfidenceBadge(item.confidence_score)}
                      </div>
                    </div>
                    <div className="flex items-center">
                      {item.needs_review ? (
                        <Badge variant="outline" className="border-amber-500 text-amber-600">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Needs Review
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-500 text-green-600">
                          <Check className="h-3 w-3 mr-1" /> Ready
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {results.duplicates && results.duplicates.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Duplicates ({results.duplicates.length})</h3>
            <ScrollArea className="h-32 w-full border rounded-md p-2">
              <div className="space-y-2">
                {results.duplicates.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-1 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.file}</p>
                      <p className="text-xs text-gray-600">Invoice #{item.invoice_number}</p>
                    </div>
                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                      <FileWarning className="h-3 w-3 mr-1" /> Duplicate
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {results.errors && results.errors.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Errors ({results.errors.length})</h3>
            <ScrollArea className="h-32 w-full border rounded-md p-2">
              <div className="space-y-2">
                {results.errors.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-1 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.file}</p>
                      <p className="text-xs text-red-500">{item.error}</p>
                    </div>
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" /> Failed
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    );
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
                    Your invoices have been uploaded and processed.
                    {results?.processed?.some(inv => inv.needs_review) && (
                      <>
                        {" "}Some invoices need your review.{" "}
                        <Button variant="link" className="p-0 h-auto font-semibold text-emerald-700" onClick={navigateToReview}>
                          Review them now
                        </Button>.
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {uploadStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    There was a problem uploading your invoices. Please check the error details.
                  </AlertDescription>
                </Alert>
              )}

              {renderInvoiceResults()}

              <div className="text-sm text-gray-500">
                <h4 className="font-semibold mb-1">What happens next?</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Files are uploaded and processed with OCR</li>
                  <li>System detects duplicates and extracts invoice data</li>
                  <li>Low confidence extractions are flagged for manual review</li>
                  <li>You can review and correct any data in the Invoice Review page</li>
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
