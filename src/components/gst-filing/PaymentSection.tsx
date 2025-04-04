
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const PaymentSection = () => {
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Mock data - in a real app, this would come from your backend
  const paymentDetails = {
    amount: 12600,
    period: "March 2025",
    dueDate: "20 Apr 2025",
  };

  const handlePayment = () => {
    setIsProcessing(true);

    // In a real app, this would initiate payment via Razorpay or another payment gateway
    setTimeout(() => {
      toast({
        title: "Payment Successful",
        description: `You have successfully paid ₹${paymentDetails.amount.toLocaleString()} for ${paymentDetails.period}.`,
      });
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <Card className="gst-dashboard-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-gst-primary">GST Payment</CardTitle>
        <CardDescription>
          Pay your GST liability for {paymentDetails.period}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-md flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Payment Amount</p>
              <p className="font-bold text-xl">₹{paymentDetails.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">For Period</p>
              <p className="font-medium">{paymentDetails.period}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{paymentDetails.dueDate}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Choose Payment Method</h4>
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="flex flex-col space-y-2 border rounded-md p-4 cursor-pointer hover:border-gst-secondary">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="upi" id="upi" />
                  <div>
                    <Label htmlFor="upi" className="font-medium">UPI</Label>
                    <p className="text-sm text-muted-foreground">Pay using any UPI app</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <div className="bg-gray-100 rounded p-2 h-8 w-12 flex items-center justify-center text-xs">GPay</div>
                  <div className="bg-gray-100 rounded p-2 h-8 w-12 flex items-center justify-center text-xs">PhonePe</div>
                  <div className="bg-gray-100 rounded p-2 h-8 w-12 flex items-center justify-center text-xs">BHIM</div>
                </div>
              </div>
              <div className="flex flex-col space-y-2 border rounded-md p-4 cursor-pointer hover:border-gst-secondary">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="netbanking" id="netbanking" />
                  <div>
                    <Label htmlFor="netbanking" className="font-medium">Net Banking</Label>
                    <p className="text-sm text-muted-foreground">Pay from your bank account</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <div className="bg-gray-100 rounded p-2 h-8 w-16 flex items-center justify-center text-xs">HDFC</div>
                  <div className="bg-gray-100 rounded p-2 h-8 w-16 flex items-center justify-center text-xs">ICICI</div>
                  <div className="bg-gray-100 rounded p-2 h-8 w-16 flex items-center justify-center text-xs">SBI</div>
                </div>
              </div>
              <div className="flex flex-col space-y-2 border rounded-md p-4 cursor-pointer hover:border-gst-secondary">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="card" id="card" />
                  <div>
                    <Label htmlFor="card" className="font-medium">Card</Label>
                    <p className="text-sm text-muted-foreground">Credit or Debit Card</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <div className="bg-gray-100 rounded p-2 h-8 w-12 flex items-center justify-center text-xs">Visa</div>
                  <div className="bg-gray-100 rounded p-2 h-8 w-16 flex items-center justify-center text-xs">MasterCard</div>
                  <div className="bg-gray-100 rounded p-2 h-8 w-16 flex items-center justify-center text-xs">RuPay</div>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Payment Summary</h4>
            <div className="border rounded-md p-4 space-y-2">
              <div className="flex justify-between">
                <span>GST Amount</span>
                <span>₹{paymentDetails.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Convenience Fee</span>
                <span>₹0.00</span>
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                <span>Total</span>
                <span>₹{paymentDetails.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          className="bg-gst-secondary hover:bg-gst-primary"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : `Pay ₹${paymentDetails.amount.toLocaleString()}`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PaymentSection;
