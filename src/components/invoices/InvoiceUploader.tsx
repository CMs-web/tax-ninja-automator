
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const InvoiceUploader = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [invoiceType, setInvoiceType] = useState("sales");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one invoice to upload",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // In a real app, you would upload the files to your server/backend here
    setTimeout(() => {
      toast({
        title: "Invoices processed successfully",
        description: `${files.length} ${invoiceType} invoices have been processed and data extracted.`,
      });
      setFiles([]);
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <Card className="gst-dashboard-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-gst-primary">Upload Invoices</CardTitle>
        <CardDescription>
          Upload your invoices to automatically extract GST data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <RadioGroup
            value={invoiceType}
            onValueChange={setInvoiceType}
            className="flex flex-row space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sales" id="sales" />
              <Label htmlFor="sales">Sales Invoices</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="purchase" id="purchase" />
              <Label htmlFor="purchase">Purchase Invoices</Label>
            </div>
          </RadioGroup>

          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gst-secondary mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-center text-muted-foreground mb-4">
              Drag & drop PDF or image files here, or click to select files
            </p>
            <div className="relative">
              <Button
                variant="outline"
                disabled={isProcessing}
              >
                Select Files
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
              </Button>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="space-y-3 mt-4">
              <h4 className="text-sm font-medium">Selected Files ({files.length})</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
                    <span className="truncate max-w-xs">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isProcessing}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-gst-secondary hover:bg-gst-primary"
          onClick={handleUpload}
          disabled={files.length === 0 || isProcessing}
        >
          {isProcessing ? "Processing..." : "Process Invoices"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InvoiceUploader;
