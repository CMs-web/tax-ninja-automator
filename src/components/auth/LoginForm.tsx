
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // This is a mock login - in a real app you'd authenticate with Supabase or another auth provider
      console.log("Logging in with:", email, password);
      
      // Simulate successful login
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userEmail", email);
      
      toast({
        title: "Login Successful",
        description: "Welcome to Tax Ninja GST Automator!",
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gst-primary">Login to Tax Ninja</CardTitle>
        <CardDescription>
          Enter your credentials to access your GST filing dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="gst-input-field"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <a 
                href="/forgot-password" 
                className="text-xs text-gst-secondary hover:underline"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="gst-input-field"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-gst-secondary hover:bg-gst-primary text-white"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <a href="/register" className="text-gst-secondary hover:underline">
            Register now
          </a>
        </p>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
