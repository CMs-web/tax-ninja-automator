
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { signUp } from "@/integrations/supabase/client";

const RegisterForm = () => {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const { data, error } = await signUp(email, password);
      
      if (error) {
        throw error;
      }
      
      // If successful but needs email verification
      toast({
        title: "Registration Successful",
        description: "Your account has been created. Please verify your email before logging in.",
      });
      
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border border-emerald-100">
      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-emerald-700">Create Your Account</CardTitle>
        <CardDescription>
          Register to start automating your GST filing process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="border-emerald-100 focus:border-emerald-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-emerald-100 focus:border-emerald-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="border-emerald-100 focus:border-emerald-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN</Label>
            <Input
              id="gstin"
              placeholder="22AAAAA0000A1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              required
              className="border-emerald-100 focus:border-emerald-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-emerald-100 focus:border-emerald-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border-emerald-100 focus:border-emerald-300"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Register"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-emerald-600 hover:underline">
            Login now
          </a>
        </p>
      </CardFooter>
    </Card>
  );
};

export default RegisterForm;
