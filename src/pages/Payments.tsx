
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Mock payment data
const paymentHistory = [
  { 
    id: "PAY001", 
    date: "2025-03-15", 
    period: "Feb 2025", 
    amount: 10800, 
    mode: "UPI", 
    status: "successful",
    transactionId: "UPI123456789"
  },
  { 
    id: "PAY002", 
    date: "2025-02-18", 
    period: "Jan 2025", 
    amount: 11200, 
    mode: "Net Banking", 
    status: "successful",
    transactionId: "NB987654321"
  },
  { 
    id: "PAY003", 
    date: "2025-01-20", 
    period: "Dec 2024", 
    amount: 9700, 
    mode: "Credit Card", 
    status: "successful",
    transactionId: "CC123789456"
  },
  { 
    id: "PAY004", 
    date: "2024-12-17", 
    period: "Nov 2024", 
    amount: 8500, 
    mode: "UPI", 
    status: "successful",
    transactionId: "UPI456789123"
  }
];

const Payments = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  
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
  
  const filteredPayments = paymentHistory.filter(payment => {
    if (searchQuery) {
      return (
        payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.period.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "successful":
        return <Badge className="gst-badge gst-badge-green">Successful</Badge>;
      case "pending":
        return <Badge className="gst-badge gst-badge-yellow">Pending</Badge>;
      case "failed":
        return <Badge className="gst-badge gst-badge-red">Failed</Badge>;
      default:
        return null;
    }
  };
  
  // Calculate payment statistics
  const totalPaid = paymentHistory.reduce((total, payment) => total + payment.amount, 0);
  const averagePayment = totalPaid / paymentHistory.length;
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gst-primary">Payment History</h1>
          <p className="text-muted-foreground">
            View and download your GST payment history and receipts
          </p>
        </div>
        
        {/* Payment statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="gst-stat-card">
            <CardHeader className="p-0 pb-4 space-y-0">
              <CardTitle className="text-lg font-semibold text-gst-primary">Total Paid</CardTitle>
              <CardDescription>Last 12 months</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold">₹{totalPaid.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">
                Across {paymentHistory.length} transactions
              </div>
            </CardContent>
          </Card>
          
          <Card className="gst-stat-card">
            <CardHeader className="p-0 pb-4 space-y-0">
              <CardTitle className="text-lg font-semibold text-gst-primary">Average Payment</CardTitle>
              <CardDescription>Per filing</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold">₹{averagePayment.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">
                Monthly average
              </div>
            </CardContent>
          </Card>
          
          <Card className="gst-stat-card">
            <CardHeader className="p-0 pb-4 space-y-0">
              <CardTitle className="text-lg font-semibold text-gst-primary">Next Due</CardTitle>
              <CardDescription>For Mar 2025</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold">₹12,500</div>
              <div className="text-sm text-muted-foreground">
                Due on 20 Apr 2025
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Payment history table */}
        <Card className="gst-dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-gst-primary">Payment Records</CardTitle>
            <CardDescription>
              Complete history of your GST payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search by payment ID or transaction ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="gst-input-field"
                />
              </div>
              <div className="w-full md:w-36">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="successful">Successful</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        No payment records found. Try a different search query.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell>{payment.period}</TableCell>
                        <TableCell>{payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{payment.mode}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                            Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
