import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CostInputs, { type CostEntry } from "./CostInputs";

interface SubmitCostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  vendorName: string;
  category: string;
  onSuccess: () => void;
}

export default function SubmitCostModal({
  open,
  onOpenChange,
  vendorId,
  vendorName,
  category,
  onSuccess,
}: SubmitCostModalProps) {
  const { toast } = useToast();
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Get user data
      const { data: authData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !authData.user) {
        toast({ title: "Not signed in", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      // Get user's address
      const { data: userProfile } = await supabase
        .from("users")
        .select("address")
        .eq("id", authData.user.id)
        .maybeSingle();

      const userAddress = userProfile?.address || "";

      // Save cost entries
      const validCostEntries = costEntries.filter(
        (entry) => entry.amount != null && entry.amount > 0
      );

      if (validCostEntries.length > 0) {
        const costInserts = validCostEntries.map((entry) => ({
          vendor_id: vendorId,
          created_by: authData.user.id,
          household_address: userAddress,
          normalized_address: userAddress, // Will be processed by trigger
          amount: entry.amount,
          currency: "USD",
          period: entry.period || null,
          cost_kind: entry.cost_kind,
          unit: entry.unit || null,
          quantity: entry.quantity || null,
          notes: entry.notes || null,
        }));

        const { error: costsErr } = await supabase
          .from("costs")
          .insert(costInserts);

        if (costsErr) {
          console.error("Cost insert error:", costsErr);
          toast({
            title: "Cost data not saved",
            description: "Your review was saved, but costs failed to save.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
      }

      toast({
        title: "✅ Cost information saved!",
        description: "Thank you for helping your neighbors budget!",
      });

      onSuccess();
    } catch (err) {
      console.error("Error saving costs:", err);
      toast({
        title: "Error saving costs",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>💰 Cost Information for {vendorName}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Help your neighbors budget by sharing pricing details (optional)
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <CostInputs
            category={category}
            value={costEntries}
            onChange={setCostEntries}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save Costs"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
