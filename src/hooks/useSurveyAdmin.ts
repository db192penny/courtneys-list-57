import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SurveyStats {
  totalPeople: number;
  completedPeople: number;
  inProgressPeople: number;
  notStartedPeople: number;
  totalVendors: number;
  vendorsRated: number;
}

export interface Respondent {
  id: string;
  sessionToken: string;
  name: string;
  contact: string;
  contactMethod: string;
  email: string | null;
  totalVendors: number;
  completedVendors: number;
  status: 'complete' | 'in_progress' | 'not_started';
  createdAt: string;
  metadata: any;
}

export interface VendorRating {
  id: string;
  vendorName: string;
  category: string;
  rating: number;
  comments: string;
  vendorContact: string | null;
  showNameInReview: boolean;
  useForHome: boolean;
  costKind: string | null;
  costAmount: number | null;
  costPeriod: string | null;
  costNotes: string | null;
  createdAt: string;
}

export function useSurveyStats() {
  return useQuery<SurveyStats>({
    queryKey: ["survey-stats"],
    queryFn: async () => {
      const { data: responses, error: respError } = await supabase
        .from("survey_responses" as any)
        .select("id");

      if (respError) throw respError;

      const { data: vendors, error: vendError } = await supabase
        .from("survey_pending_vendors" as any)
        .select("id, rated, survey_response_id");

      if (vendError) throw vendError;

      const totalPeople = responses?.length || 0;
      const totalVendors = vendors?.length || 0;
      const vendorsRated = vendors?.filter((v: any) => v.rated).length || 0;

      // Calculate completion status for each person
      const personStatus = new Map<string, { hasRated: boolean; hasUnrated: boolean }>();
      
      vendors?.forEach((v: any) => {
        const status = personStatus.get(v.survey_response_id) || { hasRated: false, hasUnrated: false };
        if (v.rated) status.hasRated = true;
        else status.hasUnrated = true;
        personStatus.set(v.survey_response_id, status);
      });

      let completedPeople = 0;
      let inProgressPeople = 0;
      let notStartedPeople = 0;

      responses?.forEach((r: any) => {
        const status = personStatus.get(r.id);
        if (!status || !status.hasRated) notStartedPeople++;
        else if (status.hasUnrated) inProgressPeople++;
        else completedPeople++;
      });

      return {
        totalPeople,
        completedPeople,
        inProgressPeople,
        notStartedPeople,
        totalVendors,
        vendorsRated,
      };
    },
  });
}

export function useSurveyRespondents() {
  return useQuery<Respondent[]>({
    queryKey: ["survey-respondents"],
    queryFn: async () => {
      const { data: responses, error: respError } = await supabase
        .from("survey_responses" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (respError) throw respError;

      const { data: vendors, error: vendError } = await supabase
        .from("survey_pending_vendors" as any)
        .select("survey_response_id, rated");

      if (vendError) throw vendError;

      const vendorsByResponse = new Map<string, { total: number; completed: number }>();
      vendors?.forEach((v: any) => {
        const stats = vendorsByResponse.get(v.survey_response_id) || { total: 0, completed: 0 };
        stats.total++;
        if (v.rated) stats.completed++;
        vendorsByResponse.set(v.survey_response_id, stats);
      });

      return responses?.map((r: any) => {
        const vendorStats = vendorsByResponse.get(r.id) || { total: 0, completed: 0 };
        let status: 'complete' | 'in_progress' | 'not_started' = 'not_started';
        
        if (vendorStats.completed === vendorStats.total && vendorStats.total > 0) {
          status = 'complete';
        } else if (vendorStats.completed > 0) {
          status = 'in_progress';
        }

        return {
          id: r.id,
          sessionToken: r.session_token,
          name: r.respondent_name,
          contact: r.respondent_contact,
          contactMethod: r.respondent_contact_method,
          email: r.respondent_email,
          totalVendors: vendorStats.total,
          completedVendors: vendorStats.completed,
          status,
          createdAt: r.created_at,
          metadata: r.metadata,
        };
      }) || [];
    },
  });
}

export function useSurveyRatings(sessionToken: string | null) {
  return useQuery<VendorRating[]>({
    queryKey: ["survey-ratings", sessionToken],
    queryFn: async () => {
      if (!sessionToken) return [];

      const { data: response, error: respError } = await supabase
        .from("survey_responses" as any)
        .select("id")
        .eq("session_token", sessionToken)
        .maybeSingle();

      if (respError) throw respError;
      if (!response) return [];

      const { data: ratings, error: ratError } = await supabase
        .from("survey_vendor_ratings" as any)
        .select("*")
        .eq("survey_response_id", response.id)
        .order("created_at", { ascending: true });

      if (ratError) throw ratError;

      return ratings?.map((r: any) => ({
        id: r.id,
        vendorName: r.vendor_name,
        category: r.category,
        rating: r.rating,
        comments: r.comments,
        vendorContact: r.vendor_contact,
        showNameInReview: r.show_name_in_review,
        useForHome: r.use_for_home,
        costKind: r.cost_kind,
        costAmount: r.cost_amount,
        costPeriod: r.cost_period,
        costNotes: r.cost_notes,
        createdAt: r.created_at,
      })) || [];
    },
    enabled: !!sessionToken,
  });
}
