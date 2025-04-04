
import React, { useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentFilings from "@/components/dashboard/RecentFilings";
import InvoiceSummary from "@/components/dashboard/InvoiceSummary";
import UpcomingReminders from "@/components/dashboard/UpcomingReminders";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your GST filing status.
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
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
