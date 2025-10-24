import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TermsModal } from "@/components/TermsModal";
import { PrivacyModal } from "@/components/PrivacyModal";

interface LegacyUserTermsModalProps {
  userId: string;
  onAccepted: () => void;
}

export function LegacyUserTermsModal({ userId, onAccepted }: LegacyUserTermsModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('users')
        .update({
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted_at: new Date().toISOString(),
          terms_version: '1.0'
        } as any)
        .eq('id', userId);

      if (error) {
        console.error('Failed to update terms acceptance:', error);
        toast({
          title: "Update failed",
          description: "Unable to save your acceptance. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log('✅ Terms tracked: Legacy user acceptance');
      onAccepted();
    } catch (error) {
      console.error('Failed to update terms acceptance:', error);
      toast({
        title: "Update failed",
        description: "Unable to save your acceptance. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={true} modal={true}>
        <DialogContent 
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Updated Terms & Conditions</DialogTitle>
            <DialogDescription>
              We've updated our Terms of Service and Privacy Policy. Please review and accept to continue using Courtney's List.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="legacy-terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                disabled={loading}
              />
              <label
                htmlFor="legacy-terms"
                className="text-sm leading-relaxed cursor-pointer"
              >
                I have read and agree to the{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setTermsModalOpen(true);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Terms of Service
                </button>
                {" "}and{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setPrivacyModalOpen(true);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleAccept}
              disabled={!termsAccepted || loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept & Continue"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TermsModal open={termsModalOpen} onOpenChange={setTermsModalOpen} />
      <PrivacyModal open={privacyModalOpen} onOpenChange={setPrivacyModalOpen} />
    </>
  );
}
