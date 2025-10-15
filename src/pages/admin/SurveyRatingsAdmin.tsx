import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

import { SurveyStatsCard } from "@/components/admin/SurveyStatsCard";
import { RespondentsTable } from "@/components/admin/RespondentsTable";
import { CSVUpload } from "@/components/admin/CSVUpload";
import { useSurveyRespondents } from "@/hooks/useSurveyAdmin";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportSurveyRatingsToCSV, downloadCSV } from "@/utils/csvExport";

export default function SurveyRatingsAdmin() {
  const { data: userData, isLoading: userLoading } = useUserData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refetch } = useSurveyRespondents();
  const [isExporting, setIsExporting] = useState(false);

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['survey-stats'] });
    queryClient.invalidateQueries({ queryKey: ['survey-respondents'] });
    toast({ title: "Refreshed", description: "All data updated" });
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Direct query using the REST API to fetch survey_ratings
      const response = await fetch(
        `https://iuxacgyocpwblpmmbwwc.supabase.co/rest/v1/survey_ratings?select=*&order=created_at.desc`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eGFjZ3lvY3B3YmxwbW1id3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzM4MzQsImV4cCI6MjA3MDM0OTgzNH0.ZmpBGKTwsEW4nctU_elOF2XY-n0-hOgaIvDrrneAS1Q',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch survey ratings');
      }

      const surveyData = await response.json();

      if (!surveyData || surveyData.length === 0) {
        toast({
          title: "No data",
          description: "No survey ratings found to export",
          variant: "destructive"
        });
        return;
      }

      const csvContent = exportSurveyRatingsToCSV(surveyData);
      const filename = `survey-ratings-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);

      toast({
        title: "Export successful",
        description: `Downloaded ${surveyData.length} survey ratings`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export survey ratings",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
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
      <div className="container max-w-7xl mx-auto py-6 md:py-8 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Survey Ratings Admin</h1>
            <p className="text-muted-foreground mt-2">Manage Bridges survey responses and ratings</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download CSV
            </Button>
            <Button onClick={handleRefreshAll} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </div>

        <SurveyStatsCard />
        
        <CSVUpload onUploadSuccess={refetch} />
        
        <RespondentsTable />
      </div>
    </div>
  );
}
