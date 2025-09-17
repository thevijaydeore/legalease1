import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardOverview } from "@/components/DashboardOverview";
import { DocumentGrid } from "@/components/DocumentGrid";
import { ProfileSettings } from "@/components/ProfileSettings";
import { DocumentUploadModal } from "@/components/DocumentUploadModal";
import { guestAuth, GuestUser } from "@/lib/guestAuth";

const Dashboard = () => {
  const [user, setUser] = useState<User | GuestUser | null>(null);
  const [session, setSession] = useState<Session | any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("overview");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    // Check for guest session first
    const guestSession = guestAuth.getGuestSession();
    if (guestSession) {
      setSession(guestSession.session);
      setUser(guestSession.user);
      setLoading(false);
      return;
    }

    // Set up auth state listener for regular users
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not logged in (neither regular user nor guest)
  if (!session || !user) {
    return <Navigate to="/auth" replace />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case "overview":
        return <DashboardOverview user={user} onOpenUploadModal={() => setUploadModalOpen(true)} />;
      case "documents":
        return <DocumentGrid user={user} onOpenUploadModal={() => setUploadModalOpen(true)} />;
      case "profile":
        return <ProfileSettings user={user} />;
      default:
        return <DashboardOverview user={user} onOpenUploadModal={() => setUploadModalOpen(true)} />;
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar 
          activeView={activeView} 
          onViewChange={setActiveView}
          onOpenUploadModal={() => setUploadModalOpen(true)}
        />
        <main className="flex-1 overflow-auto">
          {/* Mobile Header */}
          <div className="sticky top-0 z-40 md:hidden bg-background border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">
                {activeView === 'overview' ? 'Dashboard' : 
                 activeView === 'documents' ? 'Documents' : 
                 activeView === 'profile' ? 'Profile' : 'Dashboard'}
              </h1>
              <SidebarTrigger />
            </div>
          </div>
          
          <div className="container mx-auto p-4 md:p-6">
            {renderActiveView()}
          </div>
        </main>
        <DocumentUploadModal 
          open={uploadModalOpen} 
          onOpenChange={setUploadModalOpen}
        />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;