
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  TooltipProps
} from "recharts";

// Mock data for the pie chart
const data = [
  { name: "Sales Invoices", value: 65, color: "#2C7A7B" },
  { name: "Purchase Invoices", value: 35, color: "#4FD1C5" }
];

// Custom tooltip for the pie chart
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded shadow border text-sm">
        <p className="font-medium">{`${payload[0].name}: ${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

const InvoiceSummary = () => {
  return (
    <Card className="gst-dashboard-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-gst-primary">Invoice Distribution</CardTitle>
        <CardDescription>
          Breakdown of your sales and purchase invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceSummary;
