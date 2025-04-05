
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invoiceService } from "@/services/invoiceService";
import { Invoice } from "@/types/service";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO } from "date-fns";

const InvoiceList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvoices = async () => {
    if (!user) {
      setInvoices([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await invoiceService.getAll(user.id);
      
      if (error) {
        throw error;
      }
      
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setError("Failed to load invoices. Please try again.");
      toast({
        title: "Failed to load invoices",
        description: "There was an error loading your invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    
    // Listen for invoice upload events
    const handleInvoiceUploaded = () => {
      fetchInvoices();
    };
    
    window.addEventListener('invoice-uploaded', handleInvoiceUploaded);
    
    return () => {
      window.removeEventListener('invoice-uploaded', handleInvoiceUploaded);
    };
  }, [user]);

  const handleDelete = async (invoiceId: string) => {
    if (!user) return;
    
    if (!confirm("Are you sure you want to delete this invoice?")) {
      return;
    }
    
    try {
      const { error } = await invoiceService.delete(user.id, invoiceId);
      
      if (error) {
        throw error;
      }
      
      // Update the local state to remove the deleted invoice
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceId));
      
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    fetchInvoices();
    toast({
      title: "Refreshing Invoices",
      description: "Fetching the latest invoices from the database.",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'processed': return "success";
      case 'error': return "destructive";
      case 'pending': 
      default: return "outline";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Invoices</CardTitle>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={isLoading}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <p>Loading invoices...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-1">Error Loading Invoices</h3>
            <p className="text-sm text-gray-500">{error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : invoices.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendor/Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Badge variant={invoice.type === 'sales' ? 'default' : 'secondary'}>
                      {invoice.type === 'sales' ? 'Sales' : 'Purchase'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                  <TableCell>{invoice.vendor}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{formatCurrency(invoice.gst_amount)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="ghost" asChild>
                      <a href={invoice.file_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </a>
                    </Button>
                    <Button size="icon" variant="ghost" asChild>
                      <a href={invoice.file_url} download>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </a>
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleDelete(invoice.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-1">No Invoices Found</h3>
            <p className="text-sm text-gray-500">
              You haven't uploaded any invoices yet. <br />
              Start by uploading your first invoice.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceList;
