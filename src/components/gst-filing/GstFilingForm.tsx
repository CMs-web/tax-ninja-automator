
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

const GstFilingForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Mock data - in a real app, this would come from your backend
  const gstData = {
    period: "March 2025",
    dueDate: "20 Apr 2025",
    salesInvoices: {
      count: 12,
      totalAmount: 118000,
      totalGst: 18000,
    },
    purchaseInvoices: {
      count: 8,
      totalAmount: 35400,
      totalGst: 5400,
    },
    gstPayable: 12600,
  };

  const handleSubmitGst = () => {
    setIsSubmitting(true);

    // In a real app, this would submit the GST filing via your API
    setTimeout(() => {
      toast({
        title: "GST Filing Initiated",
        description: `Your GST return for ${gstData.period} has been submitted successfully.`,
      });
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <Card className="gst-dashboard-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-gst-primary">GST Return Filing</CardTitle>
        <CardDescription>
          File your GSTR-3B return for {gstData.period}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Filing Period</p>
              <p className="font-medium">{gstData.period}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{gstData.dueDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className="gst-badge gst-badge-yellow">Pending</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net GST Payable</p>
              <p className="font-bold text-lg">₹{gstData.gstPayable.toLocaleString()}</p>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction Type</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Total Amount (₹)</TableHead>
                  <TableHead>Total GST (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Sales (Output Tax)</TableCell>
                  <TableCell>{gstData.salesInvoices.count}</TableCell>
                  <TableCell>{gstData.salesInvoices.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{gstData.salesInvoices.totalGst.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Purchases (Input Tax)</TableCell>
                  <TableCell>{gstData.purchaseInvoices.count}</TableCell>
                  <TableCell>{gstData.purchaseInvoices.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{gstData.purchaseInvoices.totalGst.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={3} className="font-bold text-right">
                    Net GST Payable (Output - Input)
                  </TableCell>
                  <TableCell className="font-bold">
                    {gstData.gstPayable.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Summary</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                Your GST return for {gstData.period} is due on {gstData.dueDate}.
              </li>
              <li>
                Based on {gstData.salesInvoices.count} sales invoices and {gstData.purchaseInvoices.count} purchase invoices processed.
              </li>
              <li>
                After claiming input tax credit, your net GST liability is ₹{gstData.gstPayable.toLocaleString()}.
              </li>
              <li>
                Once filed, you'll need to make the GST payment before the due date.
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-4">
        <Button variant="outline">Preview GST Return</Button>
        <Button 
          className="bg-gst-secondary hover:bg-gst-primary"
          onClick={handleSubmitGst}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit GST Return"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GstFilingForm;
