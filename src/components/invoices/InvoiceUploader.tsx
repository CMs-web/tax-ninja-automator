
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload } from "lucide-react";
import { invoiceService } from "@/services/invoiceService";

const InvoiceUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [invoiceType, setInvoiceType] = useState<'sales' | 'purchase'>('sales');
  const [isUploading, setIsUploading] = useState(false);
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
        title: "Error",
        description: "You must be logged in to upload invoices",
        variant: "destructive",
      });
      return;
    }
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload the file to Supabase storage
      const { fileUrl, error: uploadError } = await invoiceService.uploadFile(user.id, file);
      
      if (uploadError) throw uploadError;
      
      // Create the invoice record
      const invoiceData = {
        user_id: user.id,
        invoice_number: `INV-${Date.now().toString().slice(-6)}`, // Dummy invoice number
        invoice_date: new Date().toISOString().split('T')[0],
        vendor: file.name.split('.')[0], // Using filename as placeholder vendor
        amount: Math.floor(Math.random() * 10000) + 1000, // Random amount
        gst_amount: Math.floor(Math.random() * 1000) + 100, // Random GST amount
        type: invoiceType,
        status: 'pending',
        file_url: fileUrl
      };
      
      const { error: createError } = await invoiceService.create(invoiceData);
      
      if (createError) throw createError;
      
      toast({
        title: "Upload Successful",
        description: "Your invoice has been uploaded and will be processed shortly.",
      });
      
      // Reset form
      setFile(null);
      const fileInput = document.getElementById('invoice-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error("Error uploading invoice:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={handleFileChange} 
                className="max-w-xs"
              />
              {file && (
                <p className="text-sm text-emerald-600 mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={!file || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Invoice"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default InvoiceUploader;
