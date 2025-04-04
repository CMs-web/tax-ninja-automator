
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { gstReturnsService } from "@/services/apiService";

interface GstReturn {
  id: string;
  filing_period: string;
  due_date: string;
  gst_payable: number;
  status: "pending" | "submitted" | "paid";
}

const RecentFilings = () => {
  const [filings, setFilings] = useState<GstReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReturns = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await gstReturnsService.getAll(user.id);
        
        if (error) throw error;
        
        // Get only the first 4 returns
        setFilings(data?.slice(0, 4) || []);
      } catch (error) {
        console.error("Error fetching GST returns:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReturns();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700">Pending</Badge>;
      case "submitted":
        return <Badge variant="outline" className="border-blue-300 text-blue-700">Submitted</Badge>;
      case "paid":
        return <Badge variant="outline" className="border-emerald-300 text-emerald-700">Paid</Badge>;
      default:
        return <Badge variant="outline" className="border-red-300 text-red-700">Unknown</Badge>;
    }
  };

  return (
    <Card className="border border-emerald-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-emerald-700">Recent GST Filings</CardTitle>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">
                  Loading filing history...
                </TableCell>
              </TableRow>
            ) : filings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">
                  No filing history found. Your recent GST filings will appear here.
                </TableCell>
              </TableRow>
            ) : (
              filings.map((filing) => (
                <TableRow key={filing.id}>
                  <TableCell className="font-medium">{filing.filing_period}</TableCell>
                  <TableCell>{new Date(filing.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>₹{filing.gst_payable.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(filing.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentFilings;
