
import React from "react";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

interface InvoiceFileInputProps {
  file: File | null;
  isUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InvoiceFileInput: React.FC<InvoiceFileInputProps> = ({ file, isUploading, onFileChange }) => {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-md p-6 flex flex-col items-center justify-center">
      <Upload className="h-8 w-8 text-gray-400 mb-2" />
      <p className="text-sm text-gray-500 mb-2">Upload PDF or image file</p>
      <Input 
        id="invoice-file"
        type="file" 
        accept=".pdf,.jpg,.jpeg,.png,.webp" 
        onChange={onFileChange} 
        className="max-w-xs"
        disabled={isUploading}
      />
      {file && (
        <p className="text-sm text-emerald-600 mt-2">
          Selected: {file.name}
        </p>
      )}
    </div>
  );
};

export default InvoiceFileInput;
