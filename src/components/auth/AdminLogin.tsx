
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("admin@taxninja.com");
  const [password, setPassword] = useState("admintest123");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Validation error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await login(email, password);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Login successful",
        description: "Welcome to Tax Ninja",
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Failed to login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border border-emerald-100">
      <CardHeader>
        <div className="mb-4 flex items-center justify-center">
          <div className="w-10 h-10 rounded-md bg-emerald-500 flex items-center justify-center text-white font-bold">
            TN
          </div>
        </div>
        <CardTitle className="text-xl text-center">Admin Login</CardTitle>
        <CardDescription className="text-center">
          Access your Tax Ninja admin dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="admin@taxninja.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="border-emerald-100 focus:border-emerald-300"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-emerald-600 hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="border-emerald-100 focus:border-emerald-300"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-emerald-100 px-6 py-4">
        <Button 
          variant="outline" 
          className="text-emerald-600 border-emerald-100" 
          onClick={() => {
            toast({
              title: "Admin user creation",
              description: "Creating admin user (admin@taxninja.com). Please wait...",
            });
            
            // Call Supabase Edge Function to create test user
            fetch("https://sjqezbfqmwfwbutgzwqd.supabase.co/functions/v1/create_test_user")
              .then(res => res.json())
              .then(data => {
                toast({
                  title: "Success",
                  description: "Admin user created. You can now login.",
                });
                console.log("Admin user created:", data);
              })
              .catch(err => {
                console.error("Error creating admin user:", err);
                toast({
                  title: "Error",
                  description: "Failed to create admin user. Try again later.",
                  variant: "destructive",
                });
              });
          }}
        >
          Create Admin User
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminLogin;
