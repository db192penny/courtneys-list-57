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
      
      // Load from preview_sessions
      const { data: sessionData } = await (supabase as any)
        .from("preview_sessions")
        .select("*")
        .eq("session_token", token)
        .maybeSingle();
      
      if (!sessionData) {
        setError("Invalid link. Please check your email.");
        setLoading(false);
        return;
      }

      const response = {
        id: sessionData.id,
        respondent_name: sessionData.name,
        respondent_email: sessionData.email,
        respondent_contact: sessionData.metadata?.phone || sessionData.email
      };

      setSurveyResponse(response);

      // Fetch pending vendors from survey_pending_ratings
      const { data: vendors } = await (supabase as any)
        .from("survey_pending_ratings")
        .select("*")
        .eq("session_id", sessionData.id)
        .order("created_at", { ascending: true });

      // Filter for unrated vendors
      const unratedVendors = (vendors || [])
        .filter(v => !v.rated)
        .map(v => ({
          id: v.id,
          vendor_name: v.vendor_name,
          category: v.category,
          rated: v.rated || false
        }));

      if (unratedVendors.length === 0) {
        setError("already_completed");
      }

      setPendingVendors(unratedVendors);
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
        .from("preview_sessions")
        .update({ email })
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

  const submitRating = async (vendorId: string, ratingData: any, email?: string) => {
    if (!surveyResponse) return false;

    const vendor = pendingVendors.find(v => v.id === vendorId);
    if (!vendor) return false;

    try {
      const costEntry = ratingData.costEntries?.length > 0 ? ratingData.costEntries[0] : null;

      // Simple insert to survey_ratings table
      const { error } = await (supabase as any)
        .from("survey_ratings")
        .insert({
          session_token: token,
          session_id: surveyResponse.id,
          respondent_name: surveyResponse.respondent_name,
          respondent_email: email || surveyResponse.respondent_email,
          vendor_name: vendor.vendor_name,
          vendor_category: vendor.category,
          rating: ratingData.rating,
          comments: ratingData.comments,
          show_name: ratingData.showName,
          current_vendor: ratingData.useForHome,
          vendor_phone: ratingData.vendorContact,
          // Capture all cost fields
          cost_kind: costEntry?.cost_kind || null,
          cost_amount: costEntry?.amount || null,
          cost_period: costEntry?.period || null,
          cost_unit: costEntry?.unit || null,
          cost_quantity: costEntry?.quantity || null,
          cost_notes: costEntry?.notes || null,
          // Store complete cost data as JSON backup
          cost_entries: ratingData.costEntries || null
        });

      if (error) throw error;

      // Mark as rated in survey_pending_ratings
      await (supabase as any)
        .from("survey_pending_ratings")
        .update({ rated: true, rated_at: new Date().toISOString() })
        .eq("id", vendorId);

      // Remove from pending list
      setPendingVendors(prev => prev.filter(v => v.id !== vendorId));
      
      toast({
        title: "Rating saved!",
        description: "Thank you for rating " + vendor.vendor_name,
      });
      
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
    // Just remove from pending list without marking as rated
    setPendingVendors(prev => prev.filter(v => v.id !== vendorId));
    return true;
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
