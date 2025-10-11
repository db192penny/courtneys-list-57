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
  status: "complete" | "in_progress" | "not_started";
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
  respondentEmail?: string;
  respondentName?: string;
}

export function useSurveyStats() {
  return useQuery<SurveyStats>({
    queryKey: ["survey-stats"],
    queryFn: async () => {
      // Get survey responses
      const { data: surveyResponses, error: respError } = await supabase
        .from("survey_responses" as any)
        .select("id, session_token")
        .in("source", ["survey_oct_2024", "admin_csv_upload"]);

      if (respError) throw respError;

      // Get pending vendors
      const { data: pendingVendors, error: vendError } = await supabase
        .from("survey_pending_vendors" as any)
        .select("id, rated, survey_response_id");

      if (vendError) throw vendError;

      // Get actual ratings
      const { data: actualRatings, error: actualError } = await supabase
        .from("survey_vendor_ratings" as any)
        .select("id, survey_response_id");

      if (actualError) throw actualError;

      const totalPeople = surveyResponses?.length || 0;
      const totalVendors = pendingVendors?.length || 0;

      // Count actual ratings per response
      const actualRatingsPerResponse = new Map<string, number>();
      surveyResponses?.forEach((response: any) => {
        const count = actualRatings?.filter((r: any) => r.survey_response_id === response.id).length || 0;
        actualRatingsPerResponse.set(response.id, count);
      });

      // Calculate completion status for each person
      const personStatus = new Map<string, { hasRated: boolean; hasUnrated: boolean; actualRatingCount: number }>();

      pendingVendors?.forEach((v: any) => {
        const status = personStatus.get(v.survey_response_id) || { hasRated: false, hasUnrated: false, actualRatingCount: 0 };
        if (v.rated) status.hasRated = true;
        else status.hasUnrated = true;
        personStatus.set(v.survey_response_id, status);
      });

      // Add actual rating counts
      surveyResponses?.forEach((response: any) => {
        const status = personStatus.get(response.id) || { hasRated: false, hasUnrated: false, actualRatingCount: 0 };
        status.actualRatingCount = actualRatingsPerResponse.get(response.id) || 0;
        personStatus.set(response.id, status);
      });

      let completedPeople = 0;
      let inProgressPeople = 0;
      let notStartedPeople = 0;
      let vendorsRated = 0;

      surveyResponses?.forEach((response: any) => {
        const status = personStatus.get(response.id);
        const hasActualRatings = status && status.actualRatingCount > 0;

        if (!status || (!status.hasRated && !hasActualRatings)) {
          notStartedPeople++;
        } else if (status.hasUnrated || status.actualRatingCount < totalVendors / totalPeople) {
          inProgressPeople++;
        } else {
          completedPeople++;
        }

        // Count total vendors rated (use actual ratings)
        if (status) {
          vendorsRated += status.actualRatingCount;
        }
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
      // Get survey responses
      const { data: surveyResponses, error: respError } = await supabase
        .from("survey_responses" as any)
        .select("*")
        .in("source", ["survey_oct_2024", "admin_csv_upload"])
        .order("created_at", { ascending: false });

      if (respError) throw respError;

      // Get pending vendors
      const { data: pendingVendors, error: vendError } = await supabase
        .from("survey_pending_vendors" as any)
        .select("survey_response_id, rated");

      if (vendError) throw vendError;

      // Get actual ratings
      const { data: actualRatings, error: actualError } = await supabase
        .from("survey_vendor_ratings" as any)
        .select("id, survey_response_id");

      if (actualError) throw actualError;

      // Count pending vendors by response
      const vendorsByResponse = new Map<string, { total: number; completed: number }>();
      pendingVendors?.forEach((v: any) => {
        const stats = vendorsByResponse.get(v.survey_response_id) || { total: 0, completed: 0 };
        stats.total++;
        if (v.rated) stats.completed++;
        vendorsByResponse.set(v.survey_response_id, stats);
      });

      // Count actual ratings per response
      const actualRatingsPerResponse = new Map<string, number>();
      surveyResponses?.forEach((response: any) => {
        const count = actualRatings?.filter((r: any) => r.survey_response_id === response.id).length || 0;
        actualRatingsPerResponse.set(response.id, count);
      });

      return (
        surveyResponses?.map((r: any) => {
          const pendingStats = vendorsByResponse.get(r.id) || { total: 0, completed: 0 };
          const actualRatingCount = actualRatingsPerResponse.get(r.id) || 0;

          // Use the HIGHER of the two counts
          const completedVendors = Math.max(pendingStats.completed, actualRatingCount);
          const totalVendors = pendingStats.total;

          let status: "complete" | "in_progress" | "not_started" = "not_started";

          if (completedVendors > 0) {
            if (completedVendors === totalVendors && totalVendors > 0) {
              status = "complete";
            } else {
              status = "in_progress";
            }
          }

          const contact = r.respondent_email || r.metadata?.phone || r.respondent_contact || "No contact provided";

          return {
            id: r.id,
            sessionToken: r.session_token,
            name: r.respondent_name,
            contact: contact,
            contactMethod: r.respondent_contact_method || "Unknown",
            email: r.respondent_email,
            totalVendors: totalVendors,
            completedVendors: completedVendors,
            status,
            createdAt: r.created_at,
            metadata: r.metadata,
          };
        }) || []
      );
    },
  });
}

export function useSurveyRatings(sessionToken: string | null) {
  return useQuery<VendorRating[]>({
    queryKey: ["survey-ratings", sessionToken],
    queryFn: async () => {
      if (!sessionToken) return [];

      // Get survey_response by matching session_token
      const { data: responseData, error: respError } = await supabase
        .from("survey_responses" as any)
        .select("id, respondent_email, respondent_name")
        .eq("session_token", sessionToken)
        .single();

      if (respError) {
        console.error("Survey response fetch error:", respError);
        // If no survey_response, return empty array
        return [];
      }

      if (!responseData) {
        console.warn("No survey response found for token:", sessionToken);
        return [];
      }

      const responseId = (responseData as any).id as string;
      const respondentEmail = (responseData as any).respondent_email as string;
      const respondentName = (responseData as any).respondent_name as string;

      // Get ACTUAL ratings from survey_vendor_ratings
      const { data: ratings, error: ratError } = await supabase
        .from("survey_vendor_ratings" as any)
        .select("*")
        .eq("survey_response_id", responseId)
        .order("created_at", { ascending: true });

      if (ratError) {
        console.error("Ratings fetch error:", ratError);
        throw ratError;
      }

      // Map with ACTUAL data from the ratings table
      return (
        ratings?.map((r: any, index: number) => ({
          id: r.id,
          vendorName: r.vendor_name,
          category: r.category,
          rating: r.rating || 0,
          comments: r.comments || "",
          vendorContact: r.vendor_contact || null,
          showNameInReview: r.show_name_in_review ?? true,
          useForHome: r.use_for_home ?? false,
          costKind: r.cost_kind || null,
          costAmount: r.cost_amount || null,
          costPeriod: r.cost_period || null,
          costNotes: r.cost_notes || null,
          createdAt: r.created_at,
          ...(index === 0 ? { 
            respondentEmail: respondentEmail || 'No email provided',
            respondentName: respondentName 
          } : {})
        })) || []
      );
    },
    enabled: !!sessionToken,
  });
}
