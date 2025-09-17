import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { FileText, Upload, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { QuickStats } from "@/components/QuickStats";

interface DashboardOverviewProps {
  user: any; // Accept both User and GuestUser
  onOpenUploadModal: () => void;
}

interface RecentDocument {
  id: string;
  title: string;
  analysis_status: string;
  upload_date: string;
}

export function DashboardOverview({ user, onOpenUploadModal }: DashboardOverviewProps) {
  const navigate = useNavigate();
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentDocuments();
  }, []);

  const fetchRecentDocuments = async () => {
    try {
      // For guest users, return empty array since they don't have persistent documents
      if (user.isGuest) {
        setRecentDocuments([]);
        return;
      }

      const { data, error } = await supabase
        .from("documents")
        .select("id, title, analysis_status, upload_date")
        .eq("user_id", user.id)
        .order("upload_date", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentDocuments(data || []);
    } catch (error) {
      console.error("Error fetching recent documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case "failed":
        return <FileText className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDisplayName = () => {
    return user.user_metadata?.display_name || 
           user.user_metadata?.full_name || 
           user.email?.split('@')[0] || 
           'User';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {getDisplayName()}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your document analysis activity.
        </p>
      </div>

      {/* Quick Stats */}
      <QuickStats userId={user.id} />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with your most common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button onClick={onOpenUploadModal} className="flex items-center gap-2 w-full sm:w-auto">
              <Upload className="h-4 w-4" />
              Analyze New Document
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard?view=documents")}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <FileText className="h-4 w-4" />
              View All Documents
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest document analyses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : recentDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your first document to get started
              </p>
              <Button onClick={onOpenUploadModal}>
                Upload Document
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.analysis_status)}
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {doc.analysis_status} • {new Date(doc.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}