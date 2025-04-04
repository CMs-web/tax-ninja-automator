
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type InvoiceType = "sales" | "purchase";

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  gstAmount: number;
  gstRate: number;
  type: InvoiceType;
  status: "processed" | "pending" | "error";
}

const InvoiceList = () => {
  // Mock data - in a real app, this would come from your API/backend
  const invoices: Invoice[] = [
    { id: "1", number: "INV-001", date: "2025-03-15", amount: 11800, gstAmount: 1800, gstRate: 18, type: "sales", status: "processed" },
    { id: "2", number: "INV-002", date: "2025-03-20", amount: 5900, gstAmount: 900, gstRate: 18, type: "sales", status: "processed" },
    { id: "3", number: "INV-003", date: "2025-03-22", amount: 3540, gstAmount: 540, gstRate: 18, type: "sales", status: "pending" },
    { id: "4", number: "PUR-001", date: "2025-03-10", amount: 7080, gstAmount: 1080, gstRate: 18, type: "purchase", status: "processed" },
    { id: "5", number: "PUR-002", date: "2025-03-18", amount: 4720, gstAmount: 720, gstRate: 18, type: "purchase", status: "error" }
  ];

  const [filter, setFilter] = useState<InvoiceType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInvoices = invoices.filter((invoice) => {
    // Filter by type
    if (filter !== "all" && invoice.type !== filter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !invoice.number.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="gst-badge gst-badge-green">Processed</Badge>;
      case "pending":
        return <Badge className="gst-badge gst-badge-yellow">Pending</Badge>;
      case "error":
        return <Badge className="gst-badge gst-badge-red">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="gst-dashboard-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-gst-primary">Invoice History</CardTitle>
        <CardDescription>
          View and manage all your uploaded invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="gst-input-field"
            />
          </div>
          <div className="w-full md:w-36">
            <Select value={filter} onValueChange={(value: "all" | "sales" | "purchase") => setFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount (₹)</TableHead>
                <TableHead>GST (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No invoices found. Try a different filter or upload some invoices.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize">{invoice.type}</TableCell>
                    <TableCell>{invoice.amount.toLocaleString()}</TableCell>
                    <TableCell>{invoice.gstAmount.toLocaleString()} ({invoice.gstRate}%)</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
  );
};

export default InvoiceList;
