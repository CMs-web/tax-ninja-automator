
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Invoice } from "@/types/service";

interface InvoiceMissingFieldsAlertProps {
  invoice: Invoice;
  onEditClick: () => void;
}

const InvoiceMissingFieldsAlert: React.FC<InvoiceMissingFieldsAlertProps> = ({
  invoice,
  onEditClick,
}) => {
  // Check for missing or null fields in the invoice
  const missingFields = [];
  if (!invoice.invoice_number) missingFields.push("Invoice Number");
  if (!invoice.invoice_date) missingFields.push("Date");
  if (!invoice.vendor_name) missingFields.push("Vendor Name");
  if (!invoice.amount) missingFields.push("Amount");
  if (!invoice.gst_amount) missingFields.push("GST Amount");
  if (!invoice.type || invoice.type === "unknown") missingFields.push("Invoice Type");

  if (missingFields.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Missing Information</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          The following fields couldn't be extracted from this invoice or have invalid values:
        </p>
        <ul className="list-disc pl-5">
          {missingFields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
        <button
          onClick={onEditClick}
          className="text-sm font-medium underline text-white hover:text-gray-100 w-fit"
        >
          Edit invoice details
        </button>
      </AlertDescription>
    </Alert>
  );
};

export default InvoiceMissingFieldsAlert;
