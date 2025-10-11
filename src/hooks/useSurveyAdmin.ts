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
      const { data: sessions, error: sessError } = await supabase
        .from("preview_sessions" as any)
        .select("id, session_token")
        .in("source", ["survey_oct_2024", "admin_csv_upload"]);

      if (sessError) throw sessError;

      const { data: pendingRatings, error: ratError } = await supabase
        .from("survey_pending_ratings" as any)
        .select("id, rated, session_id");

      if (ratError) throw ratError;

      // Get survey responses and actual ratings
      const { data: surveyResponses, error: respError } = await supabase
        .from("survey_responses" as any)
        .select("id, session_token");

      if (respError) throw respError;

      const { data: actualRatings, error: actualError } = await supabase
        .from("survey_vendor_ratings" as any)
        .select("id, survey_response_id");

      if (actualError) throw actualError;

      const totalPeople = sessions?.length || 0;
      const totalVendors = pendingRatings?.length || 0;

      // Map session_token to survey_response_id
      const sessionToResponseId = new Map(surveyResponses?.map((r: any) => [r.session_token, r.id]) || []);

      // Count actual ratings per session
      const actualRatingsPerSession = new Map<string, number>();
      sessions?.forEach((session: any) => {
        const responseId = sessionToResponseId.get(session.session_token);
        if (responseId) {
          const count = actualRatings?.filter((r: any) => r.survey_response_id === responseId).length || 0;
          actualRatingsPerSession.set(session.id, count);
        }
      });

      // Calculate completion status for each person
      const personStatus = new Map<string, { hasRated: boolean; hasUnrated: boolean; actualRatingCount: number }>();

      pendingRatings?.forEach((v: any) => {
        const status = personStatus.get(v.session_id) || { hasRated: false, hasUnrated: false, actualRatingCount: 0 };
        if (v.rated) status.hasRated = true;
        else status.hasUnrated = true;
        personStatus.set(v.session_id, status);
      });

      // Add actual rating counts
      sessions?.forEach((session: any) => {
        const status = personStatus.get(session.id) || { hasRated: false, hasUnrated: false, actualRatingCount: 0 };
        status.actualRatingCount = actualRatingsPerSession.get(session.id) || 0;
        personStatus.set(session.id, status);
      });

      let completedPeople = 0;
      let inProgressPeople = 0;
      let notStartedPeople = 0;
      let vendorsRated = 0;

      sessions?.forEach((session: any) => {
        const status = personStatus.get(session.id);
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
      const { data: sessions, error: sessError } = await supabase
        .from("preview_sessions" as any)
        .select("*")
        .in("source", ["survey_oct_2024", "admin_csv_upload"])
        .order("created_at", { ascending: false });

      if (sessError) throw sessError;

      const { data: pendingRatings, error: ratError } = await supabase
        .from("survey_pending_ratings" as any)
        .select("session_id, rated");

      if (ratError) throw ratError;

      // Get survey responses
      const { data: surveyResponses, error: respError } = await supabase
        .from("survey_responses" as any)
        .select("id, session_token");

      if (respError) throw respError;

      // Get actual ratings
      const { data: actualRatings, error: actualError } = await supabase
        .from("survey_vendor_ratings" as any)
        .select("id, survey_response_id");

      if (actualError) throw actualError;

      // Map session_token to survey_response_id
      const sessionToResponseId = new Map(surveyResponses?.map((r: any) => [r.session_token, r.id]) || []);

      // Count pending ratings by session
      const ratingsBySession = new Map<string, { total: number; completed: number }>();
      pendingRatings?.forEach((r: any) => {
        const stats = ratingsBySession.get(r.session_id) || { total: 0, completed: 0 };
        stats.total++;
        if (r.rated) stats.completed++;
        ratingsBySession.set(r.session_id, stats);
      });

      // Count actual ratings per session
      const actualRatingsPerSession = new Map<string, number>();
      sessions?.forEach((session: any) => {
        const responseId = sessionToResponseId.get(session.session_token);
        if (responseId) {
          const count = actualRatings?.filter((r: any) => r.survey_response_id === responseId).length || 0;
          actualRatingsPerSession.set(session.id, count);
        }
      });

      return (
        sessions?.map((s: any) => {
          const pendingStats = ratingsBySession.get(s.id) || { total: 0, completed: 0 };
          const actualRatingCount = actualRatingsPerSession.get(s.id) || 0;

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

          const contact = s.email || s.metadata?.phone || "No contact provided";

          return {
            id: s.id,
            sessionToken: s.session_token,
            name: s.name,
            contact: contact,
            contactMethod: s.metadata?.contact_method || "Unknown",
            email: s.email,
            totalVendors: totalVendors,
            completedVendors: completedVendors,
            status,
            createdAt: s.created_at,
            metadata: s.metadata,
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

      const { data: ratings } = await (supabase as any)
        .from("survey_ratings")
        .select("*")
        .eq("session_token", sessionToken)
        .order("created_at");

      return ratings?.map((r: any) => ({
        id: r.id,
        vendorName: r.vendor_name,
        category: r.vendor_category,
        rating: r.rating,
        comments: r.comments,
        showNameInReview: r.show_name,
        useForHome: r.current_vendor,
        vendorContact: r.vendor_phone,
        costKind: null,
        costAmount: r.cost_amount,
        costPeriod: r.cost_period,
        costNotes: r.cost_notes,
        createdAt: r.created_at
      })) || [];
    },
    enabled: !!sessionToken,
  });
}
