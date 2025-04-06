
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import InvoiceUploader from "@/components/invoices/InvoiceUploader";
import InvoiceFilters from "@/components/invoices/InvoiceFilters";
import InvoiceList from "@/components/invoices/InvoiceList";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Upload, FilePlus } from "lucide-react";

const Invoices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filters, setFilters] = useState({
    type: 'all',
    processingStatus: 'all',
    reconciliationStatus: 'all'
  });

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

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">Invoice Management</h1>
            <p className="text-muted-foreground">
              Manage and view all your sales and purchase invoices for GST filing
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/invoices/review')}
            >
              <FilePlus className="h-4 w-4 mr-2" /> Review Pending
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => navigate('/invoices/upload')}
            >
              <Upload className="h-4 w-4 mr-2" /> Batch Upload
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <InvoiceFilters 
            filters={filters}
            onFilterChange={handleFilterChange}
          />
          <InvoiceList 
            key={`invoice-list-${refreshTrigger}`} 
            filters={filters}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
