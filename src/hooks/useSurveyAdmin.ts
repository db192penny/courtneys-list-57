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
      const { data: sessions, error: sessError } = await supabase
        .from("preview_sessions" as any)
        .select("id")
        .eq("source", "survey_oct_2024");

      if (sessError) throw sessError;

      const { data: ratings, error: ratError } = await supabase
        .from("survey_pending_ratings" as any)
        .select("id, rated, session_id");

      if (ratError) throw ratError;

      const totalPeople = sessions?.length || 0;
      const totalVendors = ratings?.length || 0;
      const vendorsRated = ratings?.filter((v: any) => v.rated).length || 0;

      // Calculate completion status for each person
      const personStatus = new Map<string, { hasRated: boolean; hasUnrated: boolean }>();
      
      ratings?.forEach((v: any) => {
        const status = personStatus.get(v.session_id) || { hasRated: false, hasUnrated: false };
        if (v.rated) status.hasRated = true;
        else status.hasUnrated = true;
        personStatus.set(v.session_id, status);
      });

      let completedPeople = 0;
      let inProgressPeople = 0;
      let notStartedPeople = 0;

      sessions?.forEach((r: any) => {
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
      const { data: sessions, error: sessError } = await supabase
        .from("preview_sessions" as any)
        .select("*")
        .eq("source", "survey_oct_2024")
        .order("created_at", { ascending: false });

      if (sessError) throw sessError;

      const { data: ratings, error: ratError } = await supabase
        .from("survey_pending_ratings" as any)
        .select("session_id, rated");

      if (ratError) throw ratError;

      const ratingsBySession = new Map<string, { total: number; completed: number }>();
      ratings?.forEach((r: any) => {
        const stats = ratingsBySession.get(r.session_id) || { total: 0, completed: 0 };
        stats.total++;
        if (r.rated) stats.completed++;
        ratingsBySession.set(r.session_id, stats);
      });

      return sessions?.map((s: any) => {
        const vendorStats = ratingsBySession.get(s.id) || { total: 0, completed: 0 };
        let status: 'complete' | 'in_progress' | 'not_started' = 'not_started';
        
        if (vendorStats.completed === vendorStats.total && vendorStats.total > 0) {
          status = 'complete';
        } else if (vendorStats.completed > 0) {
          status = 'in_progress';
        }

        const contact = s.email || s.metadata?.phone || 'No contact provided';

        return {
          id: s.id,
          sessionToken: s.session_token,
          name: s.name,
          contact: contact,
          contactMethod: s.metadata?.contact_method || 'Unknown',
          email: s.email,
          totalVendors: vendorStats.total,
          completedVendors: vendorStats.completed,
          status,
          createdAt: s.created_at,
          metadata: s.metadata,
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

      // Step 1: Get session_id from preview_sessions
      const { data: sessionData, error: sessError } = await supabase
        .from("preview_sessions" as any)
        .select("id")
        .eq("session_token", sessionToken)
        .eq("source", "survey_oct_2024")
        .single();

      if (sessError) {
        console.error('Session fetch error:', sessError);
        throw sessError;
      }
      
      if (!sessionData) {
        console.warn('No session found for token:', sessionToken);
        return [];
      }

      const sessionId = (sessionData as any).id as string;

      // Step 2: Get all pending ratings for this session
      const { data: ratings, error: ratError } = await supabase
        .from("survey_pending_ratings" as any)
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (ratError) {
        console.error('Ratings fetch error:', ratError);
        throw ratError;
      }

      return ratings?.map((r: any) => ({
        id: r.id,
        vendorName: r.vendor_name,
        category: r.category,
        rating: r.rating || 0,
        comments: r.comments || '',
        vendorContact: null,
        showNameInReview: true,
        useForHome: false,
        costKind: null,
        costAmount: null,
        costPeriod: null,
        costNotes: null,
        createdAt: r.created_at,
      })) || [];
    },
    enabled: !!sessionToken,
  });
}
