import { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface QuickStatsProps {
  userId: string;
}

interface Stats {
  totalDocuments: number;
  completedAnalyses: number;
  pendingAnalyses: number;
  recentUploads: number;
}

export function QuickStats({ userId }: QuickStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    completedAnalyses: 0,
    pendingAnalyses: 0,
    recentUploads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      // For guest users, return zero stats
      if (userId === '00000000-0000-0000-0000-000000000001') {
        setStats({
          totalDocuments: 0,
          completedAnalyses: 0,
          pendingAnalyses: 0,
          recentUploads: 0,
        });
        return;
      }

      // Get total documents
      const { data: totalDocs, error: totalError } = await supabase
        .from("documents")
        .select("id, analysis_status, upload_date")
        .eq("user_id", userId);

      if (totalError) throw totalError;

      const total = totalDocs?.length || 0;
      const completed = totalDocs?.filter(doc => doc.analysis_status === "completed").length || 0;
      const pending = totalDocs?.filter(doc => 
        doc.analysis_status === "pending" || doc.analysis_status === "processing"
      ).length || 0;

      // Get recent uploads (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recent = totalDocs?.filter(doc => 
        new Date(doc.upload_date) >= sevenDaysAgo
      ).length || 0;

      setStats({
        totalDocuments: total,
        completedAnalyses: completed,
        pendingAnalyses: pending,
        recentUploads: recent,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Documents",
      value: stats.totalDocuments,
      icon: FileText,
      color: "text-blue-500",
    },
    {
      title: "Completed",
      value: stats.completedAnalyses,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Pending",
      value: stats.pendingAnalyses,
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      title: "Recent (7 days)",
      value: stats.recentUploads,
      icon: AlertCircle,
      color: "text-purple-500",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}