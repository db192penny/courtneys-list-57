import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SurveyResponse {
  id: string;
  respondent_name: string;
  respondent_email: string | null;
  respondent_contact: string;
}

interface PendingVendor {
  id: string;
  vendor_name: string;
  category: string;
  rated: boolean;
}

export function useSurveyRating(token: string | null) {
  const [loading, setLoading] = useState(true);
  const [surveyResponse, setSurveyResponse] = useState<SurveyResponse | null>(null);
  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      setError("Invalid link. Please check your email.");
      setLoading(false);
      return;
    }

    loadSurveyData();
  }, [token]);

  const loadSurveyData = async () => {
    try {
      setLoading(true);
      
      // Fetch survey response
      const { data: response, error: responseError } = await (supabase as any)
        .from("survey_responses")
        .select("*")
        .eq("session_token", token)
        .maybeSingle();

      if (responseError || !response) {
        setError("Invalid link. Please check your email.");
        setLoading(false);
        return;
      }

      setSurveyResponse(response);

      // Fetch pending vendors
      const { data: vendors, error: vendorsError } = await (supabase as any)
        .from("survey_pending_vendors")
        .select("*")
        .eq("survey_response_id", response.id)
        .eq("rated", false)
        .order("created_at", { ascending: true });

      if (vendorsError) {
        throw vendorsError;
      }

      if (!vendors || vendors.length === 0) {
        setError("already_completed");
      }

      setPendingVendors(vendors || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading survey data:", err);
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  const updateEmail = async (email: string) => {
    if (!surveyResponse) return false;

    try {
      const { error } = await (supabase as any)
        .from("survey_responses")
        .update({ respondent_email: email })
        .eq("id", surveyResponse.id);

      if (error) throw error;

      setSurveyResponse({ ...surveyResponse, respondent_email: email });
      return true;
    } catch (err) {
      console.error("Error updating email:", err);
      toast({
        title: "Error",
        description: "Failed to save email. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const submitRating = async (vendorId: string, ratingData: any) => {
    if (!surveyResponse) return false;

    try {
      const vendor = pendingVendors.find(v => v.id === vendorId);
      if (!vendor) return false;

      // Insert rating
      const { error: insertError } = await (supabase as any)
        .from("survey_vendor_ratings")
        .insert({
          survey_response_id: surveyResponse.id,
          category: vendor.category,
          vendor_name: vendor.vendor_name,
          vendor_contact: ratingData.vendorContact || null,
          rating: ratingData.rating,
          comments: ratingData.comments,
          use_for_home: ratingData.useForHome,
          show_name_in_review: ratingData.showName,
          cost_kind: ratingData.costKind || null,
          cost_amount: ratingData.costAmount,
          cost_period: ratingData.costPeriod || null,
          cost_notes: ratingData.costNotes || null,
        });

      if (insertError) throw insertError;

      // Mark as rated
      const { error: updateError } = await (supabase as any)
        .from("survey_pending_vendors")
        .update({ rated: true, rated_at: new Date().toISOString() })
        .eq("id", vendorId);

      if (updateError) throw updateError;

      // Update local state
      setPendingVendors(prev => prev.filter(v => v.id !== vendorId));
      
      return true;
    } catch (err) {
      console.error("Error submitting rating:", err);
      toast({
        title: "Error",
        description: "Failed to save rating. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const skipVendor = async (vendorId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("survey_pending_vendors")
        .update({ rated: true, rated_at: new Date().toISOString() })
        .eq("id", vendorId);

      if (error) throw error;

      setPendingVendors(prev => prev.filter(v => v.id !== vendorId));
      return true;
    } catch (err) {
      console.error("Error skipping vendor:", err);
      return false;
    }
  };

  return {
    loading,
    error,
    surveyResponse,
    pendingVendors,
    updateEmail,
    submitRating,
    skipVendor,
  };
}
