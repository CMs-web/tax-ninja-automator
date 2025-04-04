
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentFilings from "@/components/dashboard/RecentFilings";
import InvoiceSummary from "@/components/dashboard/InvoiceSummary";
import UpcomingReminders from "@/components/dashboard/UpcomingReminders";

const Dashboard = () => {
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gst-primary">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your GST filing status.
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
            Last updated: 4 April, 2025 • 10:30 AM
          </div>
        </div>
        
        {/* Stats cards */}
        <DashboardStats />
        
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentFilings />
          <div className="space-y-6">
            <InvoiceSummary />
            <UpcomingReminders />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
