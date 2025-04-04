
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  FileText,
  FileCheck,
  CreditCard,
  User,
  Settings,
  LogOut,
} from "lucide-react";

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex items-center">
        <SidebarTrigger />
        <div className="flex items-center space-x-2 mx-auto">
          <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center text-white font-bold">
            TN
          </div>
          <span className="text-lg font-semibold">Tax Ninja</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>GST Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard")}
                  onClick={() => navigate("/dashboard")}
                >
                  <div className="flex items-center space-x-3 w-full px-3 py-2 cursor-pointer">
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/invoices")}
                  onClick={() => navigate("/invoices")}
                >
                  <div className="flex items-center space-x-3 w-full px-3 py-2 cursor-pointer">
                    <FileText className="h-5 w-5" />
                    <span>Invoices</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/gst-filing")}
                  onClick={() => navigate("/gst-filing")}
                >
                  <div className="flex items-center space-x-3 w-full px-3 py-2 cursor-pointer">
                    <FileCheck className="h-5 w-5" />
                    <span>GST Filing</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/payments")}
                  onClick={() => navigate("/payments")}
                >
                  <div className="flex items-center space-x-3 w-full px-3 py-2 cursor-pointer">
                    <CreditCard className="h-5 w-5" />
                    <span>Payments</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/profile")}
                  onClick={() => navigate("/profile")}
                >
                  <div className="flex items-center space-x-3 w-full px-3 py-2 cursor-pointer">
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/settings")}
                  onClick={() => navigate("/settings")}
                >
                  <div className="flex items-center space-x-3 w-full px-3 py-2 cursor-pointer">
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="outline"
          className="w-full justify-center"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
