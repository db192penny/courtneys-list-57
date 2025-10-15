import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VendorReview {
  id: string;
  rating: number;
  comments: string | null;
  created_at: string;
  author_label: string;
  is_pending: boolean;
}

export function useVendorReviews(vendorId: string, isAuthenticated: boolean = false) {
  return useQuery({
    queryKey: ["vendor-reviews", vendorId, isAuthenticated],
    queryFn: async () => {
      // Fetch verified user reviews
      const functionName = isAuthenticated ? 'list_vendor_reviews' : 'list_vendor_reviews_preview';
      const { data: verifiedReviews, error: verifiedError } = await supabase
        .rpc(functionName as any, { _vendor_id: vendorId });
      
      if (verifiedError) {
        console.error("Error fetching verified reviews:", verifiedError);
      }
      
      // Get vendor name to match preview reviews (use maybeSingle to handle RLS gracefully)
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("name")
        .eq("id", vendorId)
        .maybeSingle();
      
      // Fetch preview reviews by vendor NAME
      const { data: previewReviews, error: previewError } = vendorData ? await supabase
        .from("preview_reviews")
        .select(`
          id, 
          rating, 
          comments, 
          created_at, 
          anonymous,
          preview_sessions!inner(name),
          vendors!inner(name)
        `)
        .eq("vendors.name", vendorData.name)
        : { data: [], error: null };
      
      if (previewError) {
        console.error("Error fetching preview reviews:", previewError);
      }

      // Fetch survey ratings by vendor ID
      let surveyReviews: any[] = [];
      try {
        const result = await supabase
          .from("survey_ratings" as any)
          .select("id, rating, comments, created_at, respondent_name, show_name")
          .eq("vendor_id", vendorId)
          .not("rating", "is", null);
        
        if (result.error) {
          console.error("Error fetching survey reviews:", result.error);
        } else {
          surveyReviews = result.data || [];
        }
      } catch (err) {
        console.error("Error fetching survey reviews:", err);
      }
      
      // Format and tag verified reviews
      const taggedVerifiedReviews = (verifiedReviews || []).map(vr => ({
        ...vr,
        is_pending: false
      }));
      
      // Format and tag preview reviews as pending
      const formattedPreviewReviews = (previewReviews || []).map(pr => ({
        id: pr.id,
        rating: pr.rating,
        comments: pr.comments,
        created_at: pr.created_at,
        author_label: pr.anonymous 
          ? "Neighbor|in The Bridges"
          : `${pr.preview_sessions.name}|in The Bridges`,
        is_pending: true
      }));

      // Format and tag survey reviews as pending
      const formattedSurveyReviews = (surveyReviews || []).map(sr => {
        const authorLabel = sr.show_name && sr.respondent_name
          ? `${sr.respondent_name}|in The Bridges`
          : "Neighbor|in The Bridges";

        return {
          id: sr.id,
          rating: sr.rating,
          comments: sr.comments,
          created_at: sr.created_at,
          author_label: authorLabel,
          is_pending: true,
        };
      });
      
      // Combine all three sources with proper is_pending flags
      return [
        ...taggedVerifiedReviews,
        ...formattedPreviewReviews,
        ...formattedSurveyReviews
      ] as VendorReview[];
    },
    enabled: !!vendorId,
  });
}
