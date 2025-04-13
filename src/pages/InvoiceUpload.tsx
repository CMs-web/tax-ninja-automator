
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Check, AlertCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

const InvoiceUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [processedFiles, setProcessedFiles] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Reset progress when files change
    if (files.length > 0) {
      setTotalFiles(files.length);
    }
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Convert FileList to array
      const fileArray = Array.from(e.target.files);
      setFiles(fileArray);
      setUploadStatus('idle');
      setProgress(0);
    }
  };

  const simulateProgress = () => {
    setProgress(0);
    setProcessedFiles(0);
    
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        // Only increment progress up to 95% for visual indication that work is happening
        const increment = Math.random() * 10;
        const newProgress = Math.min(prevProgress + increment, 95);
        
        // Simulate file processing progress
        const filesProcessed = Math.floor((newProgress / 100) * totalFiles);
        if (filesProcessed > processedFiles) {
          setProcessedFiles(filesProcessed);
        }
        
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

    // Start progress simulation
    const progressInterval = simulateProgress();
    
    try {
      // Create FormData with all files
      const formData = new FormData();
      
      // Append each file
      files.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('userId', user.id);
      
      // Upload all files using unified API endpoint
      const response = await fetch(`${API_BASE_URL}/invoices/upload`, {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to upload invoices');
      }
      
      // Complete the progress to 100%
      setProgress(100);
      setProcessedFiles(totalFiles);
      setUploadStatus('success');
      
      toast({
        title: "Upload Successful",
        description: `${result.processed?.length || 0} ${result.processed?.length === 1 ? 'invoice has' : 'invoices have'} been processed successfully.`,
      });

      // Dispatch event to notify other components
      const event = new CustomEvent('invoice-uploaded');
      window.dispatchEvent(event);

      // Reset form after short delay
      setTimeout(() => {
        setFiles([]);
        const fileInput = document.getElementById('invoice-files') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }, 2000);

    } catch (error) {
      clearInterval(progressInterval);
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

  const handleRetry = async () => {
    if (!user || files.length === 0) return;
    
    setRetrying(true);
    setUploadStatus('uploading');
    
    // Start progress simulation
    const progressInterval = simulateProgress();
    
    try {
      // Create FormData with all files
      const formData = new FormData();
      
      // Append each file
      files.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('userId', user.id);
      formData.append('isRetry', 'true'); // Signal that this is a retry
      
      // Upload all files using unified API endpoint
      const response = await fetch(`${API_BASE_URL}/invoices/upload`, {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to retry invoice processing');
      }
      
      // Complete the progress to 100%
      setProgress(100);
      setProcessedFiles(totalFiles);
      setUploadStatus('success');
      
      toast({
        title: "Retry Successful",
        description: `${result.processed?.length || 0} ${result.processed?.length === 1 ? 'invoice has' : 'invoices have'} been reprocessed successfully.`,
      });

      // Dispatch event to notify other components
      const event = new CustomEvent('invoice-uploaded');
      window.dispatchEvent(event);

    } catch (error) {
      clearInterval(progressInterval);
      setUploadStatus('error');
      console.error("Error retrying invoices:", error);
      
      toast({
        title: "Retry Failed",
        description: error instanceof Error ? error.message : "There was an error retrying your invoice processing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRetrying(false);
    }
  };

  const navigateToReview = () => {
    navigate('/invoices/review');
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
                    <span className="text-sm font-medium">
                      {retrying ? "Retrying..." : "Uploading & Processing..."}
                    </span>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-gray-500 text-center">
                    {processedFiles} of {totalFiles} files processed
                  </p>
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

              {uploadStatus === 'error' && (
                <div>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      There was a problem processing your invoices.
                    </AlertDescription>
                  </Alert>
                  <Button
                    type="button" 
                    variant="outline"
                    className="mt-2 flex items-center gap-1"
                    onClick={handleRetry}
                    disabled={retrying}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry Processing
                  </Button>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <h4 className="font-semibold mb-1">What happens next?</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Files are uploaded and processed by our OCR system</li>
                  <li>Invoice data is extracted and stored in your account</li>
                  <li>You'll be able to review and edit extracted data if needed</li>
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
                disabled={files.length === 0 || uploading || retrying}
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
