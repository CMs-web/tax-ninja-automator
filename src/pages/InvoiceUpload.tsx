
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Check, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

const InvoiceUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
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
      
      // Upload all files in batch
      const response = await fetch(`${API_BASE_URL}/invoices/batch-upload`, {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(simulateProgress);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload invoices');
      }
      
      const result = await response.json();
      setProgress(100);
      setUploadStatus('success');
      
      toast({
        title: "Upload Successful",
        description: `${files.length} ${files.length === 1 ? 'invoice has' : 'invoices have'} been queued for processing.`,
      });

      // Reset form after short delay
      setTimeout(() => {
        setFiles([]);
        const fileInput = document.getElementById('invoice-files') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }, 2000);

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
                    Your invoices have been uploaded and queued for processing. 
                    <Button variant="link" className="p-0 h-auto font-semibold text-emerald-700" onClick={navigateToReview}>
                      Review them later
                    </Button>.
                  </AlertDescription>
                </Alert>
              )}

              {uploadStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    There was a problem uploading your invoices. Please try again.
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-gray-500">
                <h4 className="font-semibold mb-1">What happens next?</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Files are uploaded and queued for processing</li>
                  <li>Our OCR system extracts invoice data</li>
                  <li>You'll be able to review extracted data in the Invoice Review page</li>
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
