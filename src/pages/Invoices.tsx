
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import InvoiceUploader from "@/components/invoices/InvoiceUploader";
import InvoiceList from "@/components/invoices/InvoiceList";

const Invoices = () => {
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
            <InvoiceList />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
