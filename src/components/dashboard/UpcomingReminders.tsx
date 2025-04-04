
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const UpcomingReminders = () => {
  // Mock data - in a real app, this would come from your API/backend
  const reminders = [
    {
      id: 1,
      title: "GSTR-3B Filing Due",
      description: "Your GSTR-3B filing for March 2025 is due in 15 days.",
      priority: "high",
      action: "File Now"
    },
    {
      id: 2,
      title: "GST Payment Pending",
      description: "You have a pending GST payment of ₹12,500 for March 2025.",
      priority: "medium",
      action: "Pay Now"
    },
    {
      id: 3,
      title: "Reconcile Invoices",
      description: "5 invoices need reconciliation for proper ITC claim.",
      priority: "low",
      action: "Reconcile"
    }
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="gst-badge gst-badge-red">High</Badge>;
      case "medium":
        return <Badge className="gst-badge gst-badge-yellow">Medium</Badge>;
      case "low":
        return <Badge className="gst-badge gst-badge-blue">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="gst-dashboard-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-gst-primary">Upcoming Tasks & Reminders</CardTitle>
        <CardDescription>
          Action items that need your attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="flex items-start justify-between border-b pb-4 last:border-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{reminder.title}</h4>
                  {getPriorityBadge(reminder.priority)}
                </div>
                <p className="text-sm text-muted-foreground">{reminder.description}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="whitespace-nowrap"
              >
                {reminder.action}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingReminders;
