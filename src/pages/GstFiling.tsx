
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GstFilingForm from "@/components/gst-filing/GstFilingForm";
import PaymentSection from "@/components/gst-filing/PaymentSection";

const GstFiling = () => {
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
          <h1 className="text-2xl font-bold text-gst-primary">GST Filing & Payment</h1>
          <p className="text-muted-foreground">
            Review your GST details, file your return, and make payments
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <GstFilingForm />
          <PaymentSection />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GstFiling;
