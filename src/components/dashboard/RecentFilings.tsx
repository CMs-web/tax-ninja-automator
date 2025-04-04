
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { gstReturnsService } from "@/services/gstReturnsService";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

const RecentFilings = () => {
  const [filings, setFilings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const loadFilings = async () => {
      setIsLoading(true);
      try {
        const { data } = await gstReturnsService.getAll(user.id);
        setFilings(data.slice(0, 3)); // Show only 3 most recent filings
      } catch (error) {
        console.error("Error loading recent filings:", error);
        toast({
          title: "Error",
          description: "Failed to load recent GST filings.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFilings();
  }, [user, toast]);

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "filed": return "outline";
      case "paid": return "success";
      default: return "secondary";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Recent GST Filings</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-12 bg-gray-100 animate-pulse rounded-md"></div>
            <div className="h-12 bg-gray-100 animate-pulse rounded-md"></div>
          </div>
        ) : filings.length > 0 ? (
          <div className="space-y-4">
            {filings.map((filing: any) => (
              <div 
                key={filing.id} 
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{filing.filing_period}</p>
                  <p className="text-sm text-muted-foreground">
                    {filing.filed_date 
                      ? `Filed on ${format(new Date(filing.filed_date), 'MMM dd, yyyy')}` 
                      : `Due on ${format(new Date(filing.due_date), 'MMM dd, yyyy')}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">
                    {formatCurrency(filing.payable_gst)}
                  </p>
                  <Badge variant={getBadgeVariant(filing.status)}>
                    {filing.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No recent GST filings found</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => navigate('/gst-filing')}
        >
          View All GST Filings <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RecentFilings;
