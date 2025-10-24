import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { TermsModal } from "@/components/TermsModal";
import { PrivacyModal } from "@/components/PrivacyModal";

type Props = {
  userId: string;
  onAccepted: () => void;
};

export function LegacyUserTermsModal({ userId, onAccepted }: Props) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    try {
      setLoading(true);

      // Use RPC to update terms acceptance (bypasses TypeScript types)
      const { error } = await supabase.rpc('update_terms_acceptance' as any, {
        user_id: userId,
        terms_version: '1.0'
      });

      if (error) {
        console.error('Failed to update terms acceptance:', error);
        toast({
          title: "Error",
          description: "Failed to save your acceptance. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Terms Accepted",
        description: "Thank you for accepting the updated terms.",
      });

      onAccepted();
    } catch (error) {
      console.error('Error accepting terms:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent 
          className="max-w-md"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Updated Terms & Conditions
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              We've updated our Terms of Service and Privacy Policy. Please review and accept to continue using Courtney's List.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="legacy-terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="legacy-terms"
                className="text-sm leading-relaxed cursor-pointer select-none"
              >
                I have read and agree to the{" "}
                <button
                  type="button"
                  onClick={() => setTermsModalOpen(true)}
                  className="text-primary underline hover:text-primary/80"
                >
                  Terms of Service
                </button>
                {" "}and{" "}
                <button
                  type="button"
                  onClick={() => setPrivacyModalOpen(true)}
                  className="text-primary underline hover:text-primary/80"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            <Button
              onClick={handleAccept}
              disabled={!termsAccepted || loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accept & Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TermsModal
        open={termsModalOpen}
        onOpenChange={setTermsModalOpen}
        variant="full"
      />

      <PrivacyModal
        open={privacyModalOpen}
        onOpenChange={setPrivacyModalOpen}
      />
    </>
  );
}
