import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SurveyStatsCard } from "@/components/admin/SurveyStatsCard";
import { RespondentsTable } from "@/components/admin/RespondentsTable";
import { CSVUpload } from "@/components/admin/CSVUpload";
import { useSurveyRespondents } from "@/hooks/useSurveyAdmin";
import { Loader2 } from "lucide-react";

export default function SurveyRatingsAdmin() {
  const { data: userData, isLoading: userLoading } = useUserData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refetch } = useSurveyRespondents();

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
    
    // Check admin access via hook
    const checkAdmin = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userEmail = session?.session?.user?.email;
      
      if (!userEmail) {
        navigate('/');
        return;
      }
      
      const adminEmails = [
        'courtney@courtneys-list.com',
        'your-email@example.com'
      ];
      
      if (!adminEmails.includes(userEmail)) {
        toast({
          title: "Admin access required",
          description: "You don't have permission to access this page",
          variant: "destructive"
        });
        navigate('/');
      }
    };
    
    checkAdmin();
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Survey Ratings Admin</h1>
          <p className="text-muted-foreground mt-2">Manage Bridges survey responses and ratings</p>
        </div>

        <SurveyStatsCard />
        
        <CSVUpload onUploadSuccess={refetch} />
        
        <RespondentsTable />
      </div>
    </div>
  );
}
