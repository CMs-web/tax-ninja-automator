import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Download, Trash2, AlertCircle, Info, Edit, RefreshCw, Save, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invoiceService } from "@/services/invoiceService";
import { Invoice } from "@/types/service";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";

interface InvoiceListProps {
  filters?: {
    type: string;
    processingStatus: string;
    reconciliationStatus: string;
  };
}

const InvoiceList: React.FC<InvoiceListProps> = ({ 
  filters = { type: 'all', processingStatus: 'all', reconciliationStatus: 'all' } 
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<Invoice>>({});
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
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
    const applyFilters = () => {
      let result = [...invoices];
      
      if (filters.type !== 'all') {
        result = result.filter(invoice => invoice.type === filters.type);
      }
      
      if (filters.processingStatus !== 'all') {
        result = result.filter(invoice => invoice.processing_status === filters.processingStatus);
      }
      
      if (filters.reconciliationStatus !== 'all') {
        result = result.filter(invoice => invoice.reconciliation_status === filters.reconciliationStatus);
      }
      
      setFilteredInvoices(result);
    };
    
    applyFilters();
  }, [invoices, filters]);

  useEffect(() => {
    fetchInvoices();
    
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

  const startEditing = (invoice: Invoice) => {
    setEditingInvoiceId(invoice.id);
    setEditedValues({});
  };

  const cancelEditing = () => {
    setEditingInvoiceId(null);
    setEditedValues({});
  };

  const handleInputChange = (field: keyof Invoice, value: any) => {
    setEditedValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveChanges = async (invoice: Invoice) => {
    if (!user || Object.keys(editedValues).length === 0) {
      cancelEditing();
      return;
    }
    
    try {
      const updatedData = {
        ...editedValues,
        processing_status: 'reviewed' as const
      };
      
      const { error } = await invoiceService.update(invoice.id, updatedData);
      
      if (error) {
        throw error;
      }

      toast({
        title: "Invoice Updated",
        description: "Invoice data has been successfully updated.",
      });
      
      fetchInvoices();
      
      cancelEditing();
      
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRetry = async (invoice: Invoice) => {
    if (!user) return;
    
    setRetrying(prev => ({ ...prev, [invoice.id]: true }));
    
    try {
      const { error } = await invoiceService.update(invoice.id, {
        processing_status: 'pending'
      });
      
      if (error) {
        throw error;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/invoices/retry/${invoice.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to retry processing');
        }
        
        const result = await response.json();
        
        if (result.success) {
          toast({
            title: "Retry Initiated",
            description: "The invoice is being reprocessed. Results will appear shortly.",
          });
        }
      } catch (retryError) {
        console.error("Error calling retry API:", retryError);
      }
      
      setTimeout(() => {
        fetchInvoices();
      }, 2000);
      
    } catch (error) {
      console.error("Error retrying invoice processing:", error);
      toast({
        title: "Retry Failed",
        description: "There was an error retrying the invoice processing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRetrying(prev => ({ ...prev, [invoice.id]: false }));
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'processed': 
      case 'reviewed': 
      case 'matched': return "success";
      case 'failed': 
      case 'unmatched': return "destructive";
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

  const getConfidenceIndicator = (score: number | undefined) => {
    if (!score) return null;
    
    let color = "text-red-500";
    if (score >= 80) {
      color = "text-emerald-500";
    } else if (score >= 50) {
      color = "text-amber-500";
    }
    
    return (
      <span className={`inline-flex items-center ${color}`} title={`OCR Confidence: ${score.toFixed(0)}%`}>
        <span className="ml-1 text-xs">{score.toFixed(0)}%</span>
      </span>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Invoices
          {filteredInvoices.length !== invoices.length && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              (Showing {filteredInvoices.length} of {invoices.length})
            </span>
          )}
        </CardTitle>
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
        ) : filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor/Customer</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reconciliation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const isEditing = editingInvoiceId === invoice.id;
                  const needsAttention = invoice.processing_status === 'failed' || 
                                        invoice.confidence_score !== undefined && invoice.confidence_score < 60;
                  return (
                    <TableRow key={invoice.id} className={needsAttention ? "bg-amber-50" : ""}>
                      <TableCell>
                        {isEditing ? (
                          <select 
                            className="w-full rounded border p-1 text-sm"
                            value={editedValues.type || invoice.type}
                            onChange={e => handleInputChange('type', e.target.value)}
                          >
                            <option value="sales">Sales</option>
                            <option value="purchase">Purchase</option>
                            <option value="unknown">Unknown</option>
                          </select>
                        ) : (
                          <Badge variant={invoice.type === 'sales' ? 'default' : invoice.type === 'purchase' ? 'secondary' : 'outline'}>
                            {invoice.type === 'sales' ? 'Sales' : invoice.type === 'purchase' ? 'Purchase' : 'Unknown'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Input 
                            className="w-24 h-8 text-sm"
                            value={editedValues.invoice_number !== undefined ? editedValues.invoice_number : invoice.invoice_number || ''}
                            onChange={e => handleInputChange('invoice_number', e.target.value)}
                          />
                        ) : (
                          <>
                            {invoice.invoice_number}
                            {getConfidenceIndicator(invoice.confidence_score)}
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input 
                            className="w-24 h-8 text-sm" 
                            type="date"
                            value={editedValues.invoice_date !== undefined ? editedValues.invoice_date : invoice.invoice_date || ''}
                            onChange={e => handleInputChange('invoice_date', e.target.value)}
                          />
                        ) : (
                          formatDate(invoice.invoice_date)
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input 
                            className="w-32 h-8 text-sm"
                            value={editedValues.vendor_name !== undefined ? editedValues.vendor_name : invoice.vendor_name || ''}
                            onChange={e => handleInputChange('vendor_name', e.target.value)}
                          />
                        ) : (
                          invoice.vendor_name
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input 
                            className="w-32 h-8 text-sm font-mono"
                            value={editedValues.vendor_gstin !== undefined ? editedValues.vendor_gstin : invoice.vendor_gstin || ''}
                            onChange={e => handleInputChange('vendor_gstin', e.target.value)}
                          />
                        ) : (
                          <span className="text-xs font-mono">
                            {invoice.vendor_gstin || '-'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input 
                            className="w-24 h-8 text-sm"
                            type="number"
                            step="0.01"
                            value={editedValues.amount !== undefined ? editedValues.amount : invoice.amount || 0}
                            onChange={e => handleInputChange('amount', parseFloat(e.target.value))}
                          />
                        ) : (
                          formatCurrency(invoice.amount)
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input 
                            className="w-24 h-8 text-sm"
                            type="number"
                            step="0.01"
                            value={editedValues.gst_amount !== undefined ? editedValues.gst_amount : invoice.gst_amount || 0}
                            onChange={e => handleInputChange('gst_amount', parseFloat(e.target.value))}
                          />
                        ) : (
                          formatCurrency(invoice.gst_amount)
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input 
                            className="w-16 h-8 text-sm"
                            type="number"
                            step="0.1"
                            value={editedValues.gst_rate !== undefined ? editedValues.gst_rate : invoice.gst_rate || 0}
                            onChange={e => handleInputChange('gst_rate', parseFloat(e.target.value))}
                          />
                        ) : (
                          invoice.gst_rate ? `${invoice.gst_rate}%` : '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.processing_status)}>
                          {invoice.processing_status.charAt(0).toUpperCase() + invoice.processing_status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.reconciliation_status || 'pending')}>
                          {(invoice.reconciliation_status || 'pending').charAt(0).toUpperCase() + (invoice.reconciliation_status || 'pending').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex justify-end space-x-1">
                            <Button 
                              size="icon" 
                              variant="outline"
                              onClick={() => saveChanges(invoice)}
                              title="Save changes"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={cancelEditing}
                              title="Cancel editing"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-1">
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
                              onClick={() => startEditing(invoice)}
                              title="Edit invoice"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRetry(invoice)}
                              disabled={retrying[invoice.id] || invoice.processing_status === 'pending'}
                              title="Retry processing"
                            >
                              <RefreshCw className={`h-4 w-4 ${retrying[invoice.id] ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleDelete(invoice.id)}
                              title="Delete invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-1">No Invoices Found</h3>
            <p className="text-sm text-gray-500">
              {invoices.length > 0 
                ? "No invoices match your current filters. Try changing the filter criteria."
                : "You haven't uploaded any invoices yet. Start by uploading your first invoice."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceList;
