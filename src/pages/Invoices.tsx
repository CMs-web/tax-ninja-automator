
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import InvoiceUploader from "@/components/invoices/InvoiceUploader";
import InvoiceList from "@/components/invoices/InvoiceList";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Invoices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Make sure the Storage bucket exists for uploading files
  useEffect(() => {
    if (!user) return;
    
    // Listen for invoice upload events
    const handleInvoiceUploaded = () => {
      // Update the refresh trigger to cause the InvoiceList to refresh
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: "Invoices updated",
        description: "Your invoice list has been refreshed",
      });
    };

    window.addEventListener('invoice-uploaded', handleInvoiceUploaded);
    
    return () => {
      window.removeEventListener('invoice-uploaded', handleInvoiceUploaded);
    };
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700">Invoice Management</h1>
          <p className="text-muted-foreground">
            Upload and manage your sales and purchase invoices for GST filing
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <InvoiceUploader />
          </div>
          <div className="lg:col-span-2">
            <InvoiceList key={`invoice-list-${refreshTrigger}`} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
