import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SurveyResponse {
  id: string;
  respondent_name: string;
  respondent_email: string | null;
  respondent_contact: string;
  isOldSystem?: boolean; // Track which table system is being used
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
      
      // Try BOTH table systems for backward compatibility
      let response = null;
      let responseId = null;
      let isOldSystem = false;

      // First try new system (survey_responses)
      const { data: newResponse } = await (supabase as any)
        .from("survey_responses")
        .select("*")
        .eq("session_token", token)
        .maybeSingle();

      if (newResponse) {
        response = {
          id: newResponse.id,
          respondent_name: newResponse.respondent_name,
          respondent_email: newResponse.respondent_email,
          respondent_contact: newResponse.respondent_contact,
          isOldSystem: false
        };
        responseId = newResponse.id;
      } else {
        // Fall back to old system (preview_sessions)
        const { data: oldResponse } = await (supabase as any)
          .from("preview_sessions")
          .select("*")
          .eq("session_token", token)
          .maybeSingle();
        
        if (oldResponse) {
          response = {
            id: oldResponse.id,
            respondent_name: oldResponse.name,
            respondent_email: oldResponse.email,
            respondent_contact: oldResponse.metadata?.phone || oldResponse.email,
            isOldSystem: true
          };
          responseId = oldResponse.id;
          isOldSystem = true;
        }
      }

      if (!response) {
        setError("Invalid link. Please check your email.");
        setLoading(false);
        return;
      }

      setSurveyResponse(response);

      // Fetch pending vendors from BOTH tables
      let vendors = [];

      if (!isOldSystem) {
        // Try new table first
        const { data: newVendors } = await (supabase as any)
          .from("survey_pending_vendors")
          .select("*")
          .eq("survey_response_id", responseId)
          .order("created_at", { ascending: true });

        if (newVendors && newVendors.length > 0) {
          vendors = newVendors;
        }
      } else {
        // Use old table
        const { data: oldVendors } = await (supabase as any)
          .from("survey_pending_ratings")
          .select("*")
          .eq("session_id", responseId)
          .order("created_at", { ascending: true });
        
        if (oldVendors) {
          // Map old format to new format
          vendors = oldVendors.map(v => ({
            id: v.id,
            vendor_name: v.vendor_name,
            category: v.category,
            rated: v.rated || false,
            survey_response_id: responseId
          }));
        }
      }

      // Filter for unrated vendors with robust filtering
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
      const tableName = surveyResponse.isOldSystem ? "preview_sessions" : "survey_responses";
      const { error } = await (supabase as any)
        .from(tableName)
        .update({ [surveyResponse.isOldSystem ? "email" : "respondent_email"]: email })
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
          cost_kind: ratingData.costEntries?.[0]?.cost_kind || null,
          cost_amount: ratingData.costEntries?.[0]?.amount || null,
          cost_period: ratingData.costEntries?.[0]?.period || null,
          cost_notes: ratingData.costEntries?.[0]?.notes || null,
        });

      if (insertError) throw insertError;

      // Mark as rated in the appropriate table
      const tableName = surveyResponse.isOldSystem ? "survey_pending_ratings" : "survey_pending_vendors";
      const { error: updateError } = await (supabase as any)
        .from(tableName)
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
    if (!surveyResponse) return false;
    
    try {
      const tableName = surveyResponse.isOldSystem ? "survey_pending_ratings" : "survey_pending_vendors";
      const { error } = await (supabase as any)
        .from(tableName)
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
