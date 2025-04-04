
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import InvoiceUploader from "@/components/invoices/InvoiceUploader";
import InvoiceList from "@/components/invoices/InvoiceList";

const Invoices = () => {
  const navigate = useNavigate();
  
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  
  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated) {
    return null; // Don't render anything while checking authentication
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gst-primary">Invoice Management</h1>
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
