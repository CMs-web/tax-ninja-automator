
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileText, X } from "lucide-react";
import { invoicesService } from "@/services/apiService";

const InvoiceUploader = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [invoiceType, setInvoiceType] = useState("sales");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one invoice to upload",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload invoices",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Process each file
      for (const file of files) {
        // Upload to Supabase Storage
        const fileUrl = await invoicesService.uploadInvoiceFile(file, user.id);
        
        // Generate a random invoice number for demo purposes
        const invoiceNo = `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        
        // Add invoice record to database
        const newInvoice = {
          user_id: user.id,
          type: invoiceType as "sales" | "purchase",
          invoice_number: invoiceNo,
          invoice_date: new Date().toISOString().split('T')[0],
          customer_vendor_name: "Sample Customer",
          amount: Math.floor(Math.random() * 10000), // Random amount for demo
          gst_rate: 18, // Standard GST rate
          gst_amount: 0, // Will be calculated below
          file_url: fileUrl
        };
        
        // Calculate GST amount
        newInvoice.gst_amount = (newInvoice.amount * newInvoice.gst_rate) / 100;
        
        const { error } = await invoicesService.addInvoice(newInvoice);
        
        if (error) throw error;
      }

      toast({
        title: "Invoices uploaded successfully",
        description: `${files.length} ${invoiceType} invoices have been uploaded and are being processed.`,
      });

      setFiles([]);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      
      // Tell parent component to refresh the invoice list
      // You could emit an event or use a callback prop here
      window.dispatchEvent(new CustomEvent('invoice-uploaded'));
    }
  };

  return (
    <Card className="overflow-hidden border border-emerald-100">
      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium text-emerald-700">
          Upload Invoices
        </CardTitle>
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

          <div className="border-2 border-dashed border-emerald-200 rounded-xl p-8 flex flex-col items-center bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
            <Upload
              className="h-12 w-12 text-emerald-500 mb-3"
              strokeWidth={1.5}
            />
            <p className="text-sm text-center text-muted-foreground mb-4 max-w-xs">
              Drag & drop PDF or image files here, or click to select files
            </p>
            <div className="relative">
              <Button
                variant="outline"
                className="border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
                disabled={isProcessing}
              >
                <FileText className="mr-2 h-4 w-4" />
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
              <h4 className="text-sm font-medium text-emerald-800">
                Selected Files ({files.length})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg text-sm border border-emerald-100"
                  >
                    <span className="truncate max-w-xs">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-emerald-100 hover:text-emerald-700"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4" />
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
          className="w-full bg-emerald-600 hover:bg-emerald-700"
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
