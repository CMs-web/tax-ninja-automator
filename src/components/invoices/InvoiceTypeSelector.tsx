
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface InvoiceTypeSelectorProps {
  invoiceType: 'sales' | 'purchase';
  onTypeChange: (value: 'sales' | 'purchase') => void;
}

const InvoiceTypeSelector: React.FC<InvoiceTypeSelectorProps> = ({ invoiceType, onTypeChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="invoice-type">Invoice Type</Label>
      <RadioGroup 
        id="invoice-type"
        value={invoiceType} 
        onValueChange={(value) => onTypeChange(value as 'sales' | 'purchase')}
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
  );
};

export default InvoiceTypeSelector;
