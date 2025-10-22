import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/hooks/useUserData";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getCommunityDisplayName } from "@/utils/communityNames";

type CategorySuggestionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CategorySuggestionModal({ open, onOpenChange }: CategorySuggestionModalProps) {
  const [categoryName, setCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { data: userData } = useUserData();
  const isMobile = useIsMobile();

  const communityName = userData?.communityName || "Boca Bridges";
  const displayCommunityName = getCommunityDisplayName(communityName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const trimmedCategory = categoryName.trim();
    if (!trimmedCategory) {
      toast({
        title: "Category name required",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedCategory.length < 3) {
      toast({
        title: "Category name too short",
        description: "Category name must be at least 3 characters.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedCategory.length > 50) {
      toast({
        title: "Category name too long",
        description: "Category name must be 50 characters or less.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to suggest a category.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("category_suggestions" as any).insert({
        user_id: user.id,
        user_email: user.email,
        community: communityName,
        suggested_category: trimmedCategory,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Suggestion submitted!",
        description: "Thanks! We'll review your suggestion.",
      });

      // Reset form and close modal
      setCategoryName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting category suggestion:", error);
      toast({
        title: "Submission failed",
        description: "Unable to submit your suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={isMobile ? "h-full sm:h-auto" : "sm:max-w-[425px]"}
      >
        <DialogHeader>
          <DialogTitle>Suggest a New Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Pool Maintenance"
              maxLength={50}
              className="h-12 text-base"
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              {categoryName.length}/50 characters
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-12 sm:h-10 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !categoryName.trim()}
              className="h-12 sm:h-10 w-full sm:w-auto"
            >
              {isSubmitting ? "Submitting..." : "Submit Suggestion"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
