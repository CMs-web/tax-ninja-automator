
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InvoiceFileInput from "./InvoiceFileInput";
import InvoiceTypeSelector from "./InvoiceTypeSelector";
import InvoiceStatusMessage from "./InvoiceStatusMessage";
import { useInvoiceUpload } from "@/hooks/useInvoiceUpload";

const InvoiceUploader = () => {
  const {
    file,
    invoiceType,
    isUploading,
    uploadStatus,
    handleFileChange,
    setInvoiceType,
    handleSubmit
  } = useInvoiceUpload();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Invoice</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <InvoiceTypeSelector 
            invoiceType={invoiceType}
            onTypeChange={setInvoiceType}
          />
          
          <div className="space-y-2">
            <InvoiceFileInput 
              file={file}
              isUploading={isUploading}
              onFileChange={handleFileChange}
            />
            <p className="text-xs text-gray-500 mt-2">
              The system will automatically extract invoice details using OCR technology
            </p>
          </div>

          <InvoiceStatusMessage uploadStatus={uploadStatus} />
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
