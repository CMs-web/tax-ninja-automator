
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";

interface InvoiceFiltersProps {
  filters: {
    type: string;
    processingStatus: string;
    reconciliationStatus: string;
  };
  onFilterChange: (field: string, value: string) => void;
}

const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({ 
  filters, 
  onFilterChange 
}) => {
  const clearFilters = () => {
    onFilterChange('type', 'all');
    onFilterChange('processingStatus', 'all');
    onFilterChange('reconciliationStatus', 'all');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.processingStatus !== 'all') count++;
    if (filters.reconciliationStatus !== 'all') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-500 h-4 w-4" />
            <h3 className="font-medium">Filters</h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-gray-500">Type</span>
              <Select 
                value={filters.type} 
                onValueChange={(value) => onFilterChange('type', value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-sm text-gray-500">Processing Status</span>
              <Select 
                value={filters.processingStatus} 
                onValueChange={(value) => onFilterChange('processingStatus', value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-sm text-gray-500">Reconciliation</span>
              <Select 
                value={filters.reconciliationStatus} 
                onValueChange={(value) => onFilterChange('reconciliationStatus', value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="unmatched">Unmatched</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {activeFilterCount > 0 && (
              <div className="flex items-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters} 
                  className="text-gray-500 font-normal h-10"
                >
                  <X className="h-3 w-3 mr-1" /> Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceFilters;
