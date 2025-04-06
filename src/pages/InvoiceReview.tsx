
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { FileText, Eye, Save, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invoiceService } from "@/services/invoiceService";
import { Invoice } from "@/types/service";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

const InvoiceReview = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoiceUrl, setSelectedInvoiceUrl] = useState<string | null>(null);
  const [editedInvoices, setEditedInvoices] = useState<Record<string, Partial<Invoice>>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchPendingInvoices = async () => {
    if (!user) {
      setInvoices([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all invoices that need review (unknown type or low confidence)
      const { data, error } = await invoiceService.getAll(user.id);
      
      if (error) {
        throw error;
      }

      // Filter for invoices that need review
      const pendingInvoices = data.filter(invoice => 
        invoice.type === 'unknown' || 
        invoice.processing_status === 'pending' ||
        (invoice.confidence_score !== undefined && invoice.confidence_score < 70)
      );
      
      setInvoices(pendingInvoices);
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
    fetchPendingInvoices();
  }, [user]);

  const handleFieldChange = (invoiceId: string, field: keyof Invoice, value: any) => {
    setEditedInvoices(prev => ({
      ...prev,
      [invoiceId]: {
        ...(prev[invoiceId] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveInvoice = async (invoiceId: string) => {
    if (!user || !editedInvoices[invoiceId]) return;
    
    setSaving(prev => ({ ...prev, [invoiceId]: true }));
    
    try {
      const updatedData = {
        ...editedInvoices[invoiceId],
        processing_status: 'reviewed' as const
      };
      
      const { error } = await invoiceService.update(invoiceId, updatedData);
      
      if (error) {
        throw error;
      }

      toast({
        title: "Invoice Updated",
        description: "Invoice data has been successfully reviewed and saved.",
      });
      
      // Remove this invoice from the list
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceId));
      
      // Clear edited data for this invoice
      const newEditedInvoices = { ...editedInvoices };
      delete newEditedInvoices[invoiceId];
      setEditedInvoices(newEditedInvoices);
      
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(prev => ({ ...prev, [invoiceId]: false }));
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

  const getConfidenceColor = (score: number | undefined) => {
    if (!score) return "bg-gray-100 text-gray-700";
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">Invoice Review</h1>
            <p className="text-muted-foreground">
              Review and correct invoice information extracted by OCR
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={fetchPendingInvoices}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button onClick={() => navigate('/invoices')}>
              View All Invoices
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Invoices</CardTitle>
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
                <Button onClick={fetchPendingInvoices} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Preview</TableHead>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => {
                      const editedInvoice = editedInvoices[invoice.id] || {};
                      const isEdited = Object.keys(editedInvoice).length > 0;
                      
                      return (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="p-0 h-auto"
                                onClick={() => setSelectedInvoiceUrl(invoice.file_url || '')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>Invoice Preview</DialogTitle>
                              </DialogHeader>
                              <div className="flex-1 h-full overflow-auto">
                                {invoice.file_url?.endsWith('.pdf') ? (
                                  <iframe 
                                    src={invoice.file_url} 
                                    className="w-full h-full" 
                                    title="Invoice PDF"
                                  />
                                ) : (
                                  <img 
                                    src={invoice.file_url} 
                                    alt="Invoice" 
                                    className="w-full h-full object-contain" 
                                  />
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell>
                          <Input 
                            defaultValue={invoice.invoice_number} 
                            onChange={(e) => handleFieldChange(invoice.id, 'invoice_number', e.target.value)}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            defaultValue={invoice.invoice_date} 
                            onChange={(e) => handleFieldChange(invoice.id, 'invoice_date', e.target.value)}
                            className="w-32"
                            type="date"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            defaultValue={invoice.vendor_name} 
                            onChange={(e) => handleFieldChange(invoice.id, 'vendor_name', e.target.value)}
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            defaultValue={String(invoice.amount)} 
                            onChange={(e) => handleFieldChange(invoice.id, 'amount', parseFloat(e.target.value))}
                            className="w-28"
                            type="number"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            defaultValue={String(invoice.gst_amount)} 
                            onChange={(e) => handleFieldChange(invoice.id, 'gst_amount', parseFloat(e.target.value))}
                            className="w-28"
                            type="number"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            defaultValue={invoice.type}
                            onValueChange={(value) => handleFieldChange(invoice.id, 'type', value as 'sales' | 'purchase' | 'unknown')}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="purchase">Purchase</SelectItem>
                              <SelectItem value="unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={getConfidenceColor(invoice.confidence_score)}
                          >
                            {invoice.confidence_score ? `${Math.round(invoice.confidence_score)}%` : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSaveInvoice(invoice.id)}
                            disabled={saving[invoice.id] || !isEdited}
                          >
                            {saving[invoice.id] ? "Saving..." : <><Save className="h-3.5 w-3.5 mr-1" /> Save</>}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-1">No Invoices Need Review</h3>
                <p className="text-sm text-gray-500">
                  All invoices have been properly processed or reviewed. <br />
                  Upload new invoices to see them here.
                </p>
                <Button 
                  onClick={() => navigate('/invoices/upload')} 
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  Upload Invoices
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceReview;
