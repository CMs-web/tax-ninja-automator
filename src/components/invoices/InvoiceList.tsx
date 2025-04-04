
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { invoicesService } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Eye, Trash2 } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  gst_amount: number;
  gst_rate: number;
  type: "sales" | "purchase";
  status?: string;
}

const InvoiceList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<"sales" | "purchase" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const fetchInvoices = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await invoicesService.getAllInvoices(user.id);
      
      if (error) throw error;
      
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Failed to load invoices",
        description: "There was a problem fetching your invoices",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const { error } = await invoicesService.deleteInvoice(invoiceId);
      
      if (error) throw error;
      
      // Remove from local state
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceId));
      
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Failed to delete invoice",
        description: "There was a problem deleting this invoice",
        variant: "destructive",
      });
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    // Filter by type
    if (filter !== "all" && invoice.type !== filter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Processed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Error</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">New</Badge>;
    }
  };

  return (
    <Card className="border border-emerald-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-emerald-700">Invoice History</CardTitle>
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
              className="border-emerald-100 focus:border-emerald-300"
            />
          </div>
          <div className="w-full md:w-36">
            <Select value={filter} onValueChange={(value: "all" | "sales" | "purchase") => setFilter(value)}>
              <SelectTrigger className="border-emerald-100 focus:border-emerald-300">
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
        
        <div className="rounded-md border border-emerald-100">
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No invoices found. Try a different filter or upload some invoices.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize">{invoice.type}</TableCell>
                    <TableCell>{invoice.amount.toLocaleString()}</TableCell>
                    <TableCell>{invoice.gst_amount.toLocaleString()} ({invoice.gst_rate}%)</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteInvoice(invoice.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
