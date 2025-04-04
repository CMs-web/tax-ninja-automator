
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const DashboardStats = () => {
  // Mock data - in a real app, this would come from your API/backend
  const stats = {
    gstPayable: 12500,
    salesGst: 25000,
    purchaseGst: 12500,
    filingDueDate: "20 Apr 2025",
    lastFiled: "15 Mar 2025",
    complianceScore: 92
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="gst-stat-card">
        <CardHeader className="p-0 pb-4 space-y-0">
          <CardTitle className="text-lg font-semibold text-gst-primary">GST Payable</CardTitle>
          <CardDescription>Current month</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-3xl font-bold">₹{stats.gstPayable.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">
            Sales GST: ₹{stats.salesGst.toLocaleString()} | Purchase GST: ₹{stats.purchaseGst.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card className="gst-stat-card">
        <CardHeader className="p-0 pb-4 space-y-0">
          <CardTitle className="text-lg font-semibold text-gst-primary">Due Date</CardTitle>
          <CardDescription>GSTR-3B filing</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-3xl font-bold">{stats.filingDueDate}</div>
          <div className="text-sm text-muted-foreground">
            Last filed: {stats.lastFiled}
          </div>
        </CardContent>
      </Card>

      <Card className="gst-stat-card">
        <CardHeader className="p-0 pb-4 space-y-0">
          <CardTitle className="text-lg font-semibold text-gst-primary">Compliance Score</CardTitle>
          <CardDescription>Based on filing history</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-3xl font-bold">{stats.complianceScore}%</div>
          <Progress value={stats.complianceScore} className="h-2 mt-2" />
          <div className="text-sm text-muted-foreground mt-2">
            Excellent compliance record
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
