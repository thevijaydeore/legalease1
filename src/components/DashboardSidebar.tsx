import { useState } from "react";
import { Home, FileText, User, Upload, LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { guestAuth } from "@/lib/guestAuth";

interface DashboardSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onOpenUploadModal: () => void;
}

const menuItems = [
  { id: "overview", title: "Dashboard", icon: Home },
  { id: "documents", title: "Documents", icon: FileText },
  { id: "profile", title: "Profile", icon: User },
];

export function DashboardSidebar({ activeView, onViewChange, onOpenUploadModal }: DashboardSidebarProps) {
  const { state, setOpen, isMobile } = useSidebar();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  
  // In mobile, always show expanded view. In desktop, follow the state
  const showExpanded = isMobile || state === "expanded";

  const handleSignOut = async () => {
    try {
      // Check if this is a guest session
      const guestSession = guestAuth.getGuestSession();
      if (guestSession) {
        guestAuth.signOut();
        navigate("/");
        return;
      }

      // Handle regular user sign out
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
      } else {
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewUpload = () => {
    onOpenUploadModal();
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => { if (!isMobile) setOpen(true); }}
      onMouseLeave={() => { if (!isMobile) setOpen(false); }}
    >
      <Sidebar 
        className={"border-r"}
        collapsible="icon" 
        variant="inset"
      >
        <SidebarContent>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              {showExpanded && (
                <h1 className="text-xl font-bold whitespace-nowrap">LegalEase</h1>
              )}
            </div>
            <SidebarTrigger className="md:hidden" />
          </div>

        <SidebarGroup>
          {showExpanded && (
            <SidebarGroupLabel>Main</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.id)}
                    isActive={activeView === item.id}
                    className="relative flex items-center justify-start gap-3 px-3 py-2"
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {showExpanded && (
                      <span className="whitespace-nowrap">{item.title}</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {showExpanded && (
            <SidebarGroupLabel>Actions</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNewUpload}
                  className="relative flex items-center justify-start gap-3 px-3 py-2"
                >
                  <Upload className="h-4 w-4 flex-shrink-0" />
                  {showExpanded && (
                    <span className="whitespace-nowrap">New Upload</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start gap-3 px-3 py-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {showExpanded && (
              <span className="whitespace-nowrap ml-2">Sign Out</span>
            )}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
    </div>
  );
}