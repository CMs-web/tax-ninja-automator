
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle } from "lucide-react";

interface UploadStatusDetails {
  needs_review?: boolean;
  missing_fields?: string[];
  confidence_score?: number;
  type?: string;
  message?: string;
  data?: {
    invoice_number?: string;
  };
}

export interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  details?: UploadStatusDetails;
}

interface InvoiceStatusMessageProps {
  uploadStatus: UploadStatus;
}

const InvoiceStatusMessage: React.FC<InvoiceStatusMessageProps> = ({ uploadStatus }) => {
  switch (uploadStatus.status) {
    case 'uploading':
      return (
        <Alert className="mt-4 bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <div className="animate-spin mr-2">⏳</div>
            <div>
              <p className="text-sm font-medium">Uploading and processing invoice...</p>
              <p className="text-xs text-muted-foreground">This might take a few moments.</p>
            </div>
          </div>
        </Alert>
      );
      
    case 'success':
      if (uploadStatus.details?.needs_review) {
        return (
          <Alert className="mt-4 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <p className="text-sm font-medium">Invoice uploaded but needs review</p>
              <p className="text-xs text-muted-foreground">
                Confidence score: {uploadStatus.details.confidence_score}%
              </p>
              {uploadStatus.details.missing_fields?.length > 0 && (
                <div className="mt-1">
                  <p className="text-xs font-medium">Fields to check:</p>
                  <ul className="text-xs list-disc pl-4">
                    {uploadStatus.details.missing_fields.map((field: string) => (
                      <li key={field}>{field.replace('_', ' ')}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        );
      }
      return (
        <Alert className="mt-4 bg-green-50 border-green-200">
          <div className="text-green-600 mr-2">✅</div>
          <AlertDescription>
            <p className="text-sm font-medium">Invoice uploaded successfully!</p>
          </AlertDescription>
        </Alert>
      );
      
    case 'error':
      if (uploadStatus.details?.type === 'duplicate') {
        return (
          <Alert className="mt-4 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <p className="text-sm font-medium">Duplicate invoice detected</p>
              <p className="text-xs text-muted-foreground">
                Invoice number {uploadStatus.details.data?.invoice_number} already exists in your records.
              </p>
            </AlertDescription>
          </Alert>
        );
      }
      return (
        <Alert className="mt-4 bg-red-50 border-red-200" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="text-sm font-medium">Upload failed</p>
            <p className="text-xs">
              {uploadStatus.details?.message || "An unknown error occurred"}
            </p>
          </AlertDescription>
        </Alert>
      );
      
    default:
      return null;
  }
};

export default InvoiceStatusMessage;
