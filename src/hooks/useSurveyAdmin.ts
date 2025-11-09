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
  community: string;
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
  costUnit: string | null;
  costQuantity: number | null;
  costEntries: any[] | null;
  createdAt: string;
  respondentEmail?: string;
  respondentName?: string;
  respondentPhone?: string;
}

export function useSurveyStats() {
  return useQuery<SurveyStats>({
    queryKey: ["survey-stats"],
    queryFn: async () => {
      const { data: sessions, error: sessError } = await supabase
        .from("preview_sessions" as any)
        .select("id, session_token")
        .not("source", "like", "archived_%");

      if (sessError) throw sessError;

      // Get total vendors from survey_pending_ratings
      const { data: pendingRatings, error: ratError } = await supabase
        .from("survey_pending_ratings" as any)
        .select("session_id");

      if (ratError) throw ratError;

      // Get ACTUAL ratings from survey_ratings (source of truth)
      const { data: actualRatings, error: actualError } = await (supabase as any)
        .from("survey_ratings")
        .select("session_id");

      if (actualError) throw actualError;

      const totalPeople = sessions?.length || 0;
      const totalVendors = pendingRatings?.length || 0;

      // Count total vendors per session
      const totalVendorsBySession = new Map<string, number>();
      pendingRatings?.forEach((r: any) => {
        totalVendorsBySession.set(r.session_id, (totalVendorsBySession.get(r.session_id) || 0) + 1);
      });

      // Count actual completed ratings per session
      const actualRatingsPerSession = new Map<string, number>();
      actualRatings?.forEach((r: any) => {
        actualRatingsPerSession.set(r.session_id, (actualRatingsPerSession.get(r.session_id) || 0) + 1);
      });

      let completedPeople = 0;
      let inProgressPeople = 0;
      let notStartedPeople = 0;
      let vendorsRated = 0;

      sessions?.forEach((session: any) => {
        const totalForSession = totalVendorsBySession.get(session.id) || 0;
        const completedForSession = actualRatingsPerSession.get(session.id) || 0;

        if (completedForSession === 0) {
          notStartedPeople++;
        } else if (completedForSession < totalForSession) {
          inProgressPeople++;
        } else {
          completedPeople++;
        }

        vendorsRated += completedForSession;
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
        .not("source", "like", "archived_%")
        .order("created_at", { ascending: false });

      if (sessError) throw sessError;

      // Get total vendors per session from survey_pending_ratings
      const { data: pendingRatings, error: ratError } = await supabase
        .from("survey_pending_ratings" as any)
        .select("session_id");

      if (ratError) throw ratError;

      // Get ACTUAL ratings from survey_ratings (source of truth)
      const { data: actualRatings, error: actualError } = await (supabase as any)
        .from("survey_ratings")
        .select("session_id");

      if (actualError) throw actualError;

      // Count total vendors per session
      const totalVendorsBySession = new Map<string, number>();
      pendingRatings?.forEach((r: any) => {
        totalVendorsBySession.set(r.session_id, (totalVendorsBySession.get(r.session_id) || 0) + 1);
      });

      // Count actual completed ratings per session
      const completedRatingsBySession = new Map<string, number>();
      actualRatings?.forEach((r: any) => {
        completedRatingsBySession.set(r.session_id, (completedRatingsBySession.get(r.session_id) || 0) + 1);
      });

      return (
        sessions?.map((s: any) => {
          const totalVendors = totalVendorsBySession.get(s.id) || 0;
          const completedVendors = completedRatingsBySession.get(s.id) || 0;

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
            community: s.community || "Unknown",
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
        costKind: r.cost_kind,
        costAmount: r.cost_amount,
        costPeriod: r.cost_period,
        costNotes: r.cost_notes,
        costUnit: r.cost_unit,
        costQuantity: r.cost_quantity,
        costEntries: r.cost_entries,
        createdAt: r.created_at,
        respondentEmail: r.respondent_email,
        respondentName: r.respondent_name
      })) || [];
    },
    enabled: !!sessionToken,
  });
}
