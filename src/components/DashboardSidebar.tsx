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
  const { state } = useSidebar();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const [isHovered, setIsHovered] = useState(false);

  // On desktop, show expanded view on hover, otherwise show collapsed
  const showExpanded = isHovered || !collapsed;

  const handleSignOut = async () => {
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
  };

  const handleNewUpload = () => {
    onOpenUploadModal();
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Sidebar 
        className={`
          border-r transition-all duration-300 ease-in-out
          ${showExpanded ? 'w-64' : 'w-16'}
          md:hover:w-64
        `} 
        collapsible="icon" 
        variant="inset"
      >
        <SidebarContent>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <div className={`transition-all duration-300 overflow-hidden ${
                showExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              }`}>
                <h1 className="text-xl font-bold whitespace-nowrap">LegalEase</h1>
              </div>
            </div>
            <SidebarTrigger className="md:hidden" />
          </div>

        <SidebarGroup>
          <div className={`transition-all duration-300 overflow-hidden ${
            showExpanded ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0'
          }`}>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
          </div>
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
                    <span className={`transition-all duration-300 overflow-hidden ${
                      showExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                    }`}>
                      <span className="whitespace-nowrap">{item.title}</span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className={`transition-all duration-300 overflow-hidden ${
            showExpanded ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0'
          }`}>
            <SidebarGroupLabel>Actions</SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNewUpload}
                  className="relative flex items-center justify-start gap-3 px-3 py-2"
                >
                  <Upload className="h-4 w-4 flex-shrink-0" />
                  <span className={`transition-all duration-300 overflow-hidden ${
                    showExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                  }`}>
                    <span className="whitespace-nowrap">New Upload</span>
                  </span>
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
            <span className={`transition-all duration-300 overflow-hidden ${
              showExpanded ? 'opacity-100 w-auto ml-2' : 'opacity-0 w-0'
            }`}>
              <span className="whitespace-nowrap">Sign Out</span>
            </span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
    </div>
  );
}