
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { dashboardService } from "@/services/apiService";

const DashboardStats = () => {
  const [stats, setStats] = useState({
    gstPayable: 0,
    salesGst: 0,
    purchaseGst: 0,
    filingDueDate: "",
    lastFiled: "",
    complianceScore: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const dashboardStats = await dashboardService.getStats(user.id);
        
        setStats({
          gstPayable: dashboardStats.currentReturn?.gst_payable || 0,
          salesGst: dashboardStats.currentReturn?.sales_gst || 0,
          purchaseGst: dashboardStats.currentReturn?.purchase_gst || 0,
          filingDueDate: dashboardStats.currentReturn?.due_date || formatNextDueDate(),
          lastFiled: dashboardStats.lastFiled ? formatDate(dashboardStats.lastFiled) : "No previous filing",
          complianceScore: dashboardStats.complianceScore || 100,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, [user]);
  
  // Format the next due date (20th of next month)
  const formatNextDueDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 20);
    return `${nextMonth.getDate()} ${nextMonth.toLocaleString('default', { month: 'short' })} ${nextMonth.getFullYear()}`;
  };
  
  // Format date from ISO string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="overflow-hidden border border-emerald-100">
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
        <CardHeader className="pb-2 pt-6">
          <CardTitle className="text-lg font-medium text-emerald-700">
            GST Payable
          </CardTitle>
          <CardDescription>Current month</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          {isLoading ? (
            <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
          ) : (
            <>
              <div className="text-3xl font-bold">
                ₹{stats.gstPayable.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Sales GST: ₹{stats.salesGst.toLocaleString()} | Purchase GST: ₹
                {stats.purchaseGst.toLocaleString()}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-emerald-100">
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
        <CardHeader className="pb-2 pt-6">
          <CardTitle className="text-lg font-medium text-emerald-700">
            Due Date
          </CardTitle>
          <CardDescription>GSTR-3B filing</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          {isLoading ? (
            <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
          ) : (
            <>
              <div className="text-3xl font-bold">{stats.filingDueDate}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Last filed: {stats.lastFiled}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-emerald-100">
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
        <CardHeader className="pb-2 pt-6">
          <CardTitle className="text-lg font-medium text-emerald-700">
            Compliance Score
          </CardTitle>
          <CardDescription>Based on filing history</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          {isLoading ? (
            <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
          ) : (
            <>
              <div className="text-3xl font-bold">{stats.complianceScore}%</div>
              <Progress
                value={stats.complianceScore}
                className="h-2 mt-2 bg-emerald-100"
                indicatorClassName="bg-emerald-500"
              />
              <div className="text-sm text-muted-foreground mt-2">
                {stats.complianceScore > 90
                  ? "Excellent compliance record"
                  : stats.complianceScore > 70
                  ? "Good compliance record"
                  : "Needs improvement"}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
