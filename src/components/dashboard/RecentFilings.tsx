
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const RecentFilings = () => {
  // Mock data - in a real app, this would come from your API/backend
  const filings = [
    {
      period: "Mar 2025",
      dueDate: "20 Apr 2025",
      gstPayable: 12500,
      status: "pending"
    },
    {
      period: "Feb 2025",
      dueDate: "20 Mar 2025",
      gstPayable: 10800,
      status: "paid"
    },
    {
      period: "Jan 2025",
      dueDate: "20 Feb 2025",
      gstPayable: 11200,
      status: "submitted"
    },
    {
      period: "Dec 2024",
      dueDate: "20 Jan 2025",
      gstPayable: 9700,
      status: "paid"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gst-badge gst-badge-yellow">Pending</Badge>;
      case "submitted":
        return <Badge variant="outline" className="gst-badge gst-badge-blue">Submitted</Badge>;
      case "paid":
        return <Badge variant="outline" className="gst-badge gst-badge-green">Paid</Badge>;
      default:
        return <Badge variant="outline" className="gst-badge gst-badge-red">Unknown</Badge>;
    }
  };

  return (
    <Card className="gst-dashboard-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-gst-primary">Recent GST Filings</CardTitle>
        <CardDescription>
          Your GST return filing history for the last few months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>GST Payable</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filings.map((filing) => (
              <TableRow key={filing.period}>
                <TableCell className="font-medium">{filing.period}</TableCell>
                <TableCell>{filing.dueDate}</TableCell>
                <TableCell>₹{filing.gstPayable.toLocaleString()}</TableCell>
                <TableCell>{getStatusBadge(filing.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentFilings;
