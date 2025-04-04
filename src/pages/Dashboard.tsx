
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import InvoiceSummary from "@/components/dashboard/InvoiceSummary";
import RecentFilings from "@/components/dashboard/RecentFilings";
import UpcomingReminders from "@/components/dashboard/UpcomingReminders";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { dashboardService } from "@/services/apiService";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    salesInvoicesCount: 0,
    purchaseInvoicesCount: 0,
    filingDueDate: null as string | null,
    lastFiled: null as string | null,
    complianceScore: 0
  });
  
  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const dashboardStats = await dashboardService.getStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user, toast]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your GST filing dashboard. Get an overview of your invoices, filings, and reminders.
          </p>
        </div>
        
        <DashboardStats stats={stats} isLoading={isLoading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvoiceSummary />
          <div className="space-y-6">
            <RecentFilings />
            <UpcomingReminders />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
