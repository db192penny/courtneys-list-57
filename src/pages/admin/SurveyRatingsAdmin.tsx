import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

import { SurveyStatsCard } from "@/components/admin/SurveyStatsCard";
import { RespondentsTable } from "@/components/admin/RespondentsTable";
import { CSVUpload } from "@/components/admin/CSVUpload";
import { useSurveyRespondents } from "@/hooks/useSurveyAdmin";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

export default function SurveyRatingsAdmin() {
  const { data: userData, isLoading: userLoading } = useUserData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refetch } = useSurveyRespondents();

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['survey-stats'] });
    queryClient.invalidateQueries({ queryKey: ['survey-respondents'] });
    toast({ title: "Refreshed", description: "All data updated" });
  };

  useEffect(() => {
    if (userLoading) return;

    if (!userData?.isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access admin",
        variant: "destructive"
      });
      navigate('/');
      return;
    }
  }, [userData, userLoading, navigate, toast]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Survey Ratings Admin</h1>
            <p className="text-muted-foreground mt-2">Manage Bridges survey responses and ratings</p>
          </div>
          <Button onClick={handleRefreshAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>

        <SurveyStatsCard />
        
        <CSVUpload onUploadSuccess={refetch} />
        
        <RespondentsTable />
      </div>
    </div>
  );
}
