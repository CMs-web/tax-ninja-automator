
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Edit, Trash2, Eye } from "lucide-react";
import { invoiceService } from "@/services/invoiceService";

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const loadInvoices = async () => {
      setIsLoading(true);
      try {
        const { data } = await invoiceService.getAll(user.id);
        setInvoices(data);
      } catch (error) {
        console.error("Error loading invoices:", error);
        toast({
          title: "Error",
          description: "Failed to load invoices. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, [user, toast]);

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const { error } = await invoiceService.delete(id);
      
      if (error) throw error;
      
      // Remove from local state
      setInvoices(invoices.filter((invoice: any) => invoice.id !== id));
      
      toast({
        title: "Invoice Deleted",
        description: "Invoice has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-8 bg-gray-100 animate-pulse w-full rounded-md"></div>
            <div className="h-8 bg-gray-100 animate-pulse w-full rounded-md"></div>
            <div className="h-8 bg-gray-100 animate-pulse w-full rounded-md"></div>
          </div>
        ) : invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{format(new Date(invoice.invoice_date), "dd MMM yyyy")}</TableCell>
                    <TableCell>{invoice.vendor}</TableCell>
                    <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>{formatCurrency(invoice.gst_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.type === "sales" ? "default" : "outline"}>
                        {invoice.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          invoice.status === "processed" 
                            ? "success"
                            : invoice.status === "error" 
                              ? "destructive" 
                              : "secondary"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {invoice.file_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={invoice.file_url} target="_blank" rel="noreferrer">
                              <Eye className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No invoices found. Upload an invoice to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceList;
