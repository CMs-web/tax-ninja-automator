
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarClock, CreditCard, FileText } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    salesInvoicesCount: number;
    purchaseInvoicesCount: number;
    filingDueDate: string | null;
    lastFiled: string | null;
    complianceScore: number;
  };
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not available";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return "Invalid date";
    }
  };
  
  // Calculate days remaining until the due date
  const getDaysRemaining = () => {
    if (!stats.filingDueDate) return "No due date";
    
    try {
      const dueDate = new Date(stats.filingDueDate);
      const today = new Date();
      
      // Reset hours to compare just the days
      dueDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return "Overdue";
      } else if (diffDays === 0) {
        return "Due today";
      } else if (diffDays === 1) {
        return "1 day remaining";
      } else {
        return `${diffDays} days remaining`;
      }
    } catch (error) {
      return "Unable to calculate";
    }
  };
  
  const getComplianceColor = () => {
    const score = stats.complianceScore;
    if (score >= 90) return "text-emerald-600";
    if (score >= 75) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="border border-emerald-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Invoice Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-emerald-700">
                {stats.salesInvoicesCount + stats.purchaseInvoicesCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Total Invoices
              </p>
            </div>
            <div>
              <FileText className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div>Sales Invoices</div>
              <div className="font-medium">{stats.salesInvoicesCount}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>Purchase Invoices</div>
              <div className="font-medium">{stats.purchaseInvoicesCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-emerald-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Next Filing Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-emerald-700">
                {formatDate(stats.filingDueDate)}
              </div>
              <p className="text-xs text-muted-foreground">
                {getDaysRemaining()}
              </p>
            </div>
            <div>
              <CalendarClock className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div>Last Filed</div>
              <div className="font-medium">{formatDate(stats.lastFiled)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-emerald-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Compliance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${getComplianceColor()}`}>
                {stats.complianceScore}%
              </div>
              <p className="text-xs text-muted-foreground">
                On-time Filing Rate
              </p>
            </div>
            <div>
              <CreditCard className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <Progress 
              value={stats.complianceScore} 
              className="h-2 bg-emerald-100"
            />
            <p className="text-xs text-muted-foreground text-right">
              {stats.complianceScore >= 90 ? "Excellent" : 
               stats.complianceScore >= 75 ? "Good" : "Needs Improvement"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
