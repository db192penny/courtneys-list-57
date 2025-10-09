import { useState } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReviewPreview from "@/components/ReviewPreview";
import { ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VendorRatingCardProps {
  vendorName: string;
  category: string;
  currentIndex: number;
  totalVendors: number;
  userName: string;
  streetName: string;
  onSubmit: (data: VendorRatingData) => void;
  onSkip: () => void;
}

export interface VendorRatingData {
  rating: number;
  comments: string;
  vendorContact: string;
  useForHome: boolean;
  showName: boolean;
  costKind: string;
  costAmount: number | null;
  costPeriod: string;
  costNotes: string;
}

export function VendorRatingCard({
  vendorName,
  category,
  currentIndex,
  totalVendors,
  userName,
  streetName,
  onSubmit,
  onSkip
}: VendorRatingCardProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [useForHome, setUseForHome] = useState(false);
  const [showName, setShowName] = useState(true);
  const [costOpen, setCostOpen] = useState(false);
  const [costKind, setCostKind] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costPeriod, setCostPeriod] = useState("");
  const [costNotes, setCostNotes] = useState("");

  const getRatingPrompt = (rating: number): string => {
    switch(rating) {
      case 5: return "💬 Tell neighbors why they'll love this vendor!";
      case 4: return "💬 What made this service good but not perfect?";
      case 3: return "💬 Help others understand your mixed experience";
      case 2: return "💬 What went wrong? Your neighbors need to know";
      case 1: return "💬 Warn your neighbors - what happened?";
      default: return "💬 Share your experience";
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVendorContact(formatPhoneNumber(e.target.value));
  };

  const handleSubmit = () => {
    // Check rating
    if (!rating || rating < 1 || rating > 5) {
      toast({
        title: "Rating required",
        description: "Please select a rating from 1 to 5 stars",
        variant: "destructive"
      });
      return;
    }
    
    // Check comments - friendly message
    if (!comments || comments.trim().length === 0) {
      toast({
        title: "Comments help neighbors",
        description: "Please leave some words - good or bad - as comments are what really helps neighbors!",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit({
      rating,
      comments,
      vendorContact,
      useForHome,
      showName,
      costKind,
      costAmount: costAmount ? parseFloat(costAmount) : null,
      costPeriod,
      costNotes
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center border-b border-border pb-4">
        <div className="text-sm text-muted-foreground font-medium mb-2">
          VENDOR {currentIndex} OF {totalVendors}
        </div>
        <div className="flex items-start gap-2 justify-center">
          <span className="text-2xl">✓</span>
          <div className="text-left">
            <div className="text-xl font-semibold text-foreground">{vendorName}</div>
            <div className="text-sm text-muted-foreground">Category: {category}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-medium flex items-center gap-2">
          <span>⭐</span> Your Rating <span className="text-destructive">*</span>
        </Label>
        <div className="flex justify-center py-2">
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>
      </div>

      {rating > 0 && (
        <div className="space-y-2">
          <Label htmlFor="comments" className="text-base font-medium text-foreground">
            {getRatingPrompt(rating)}
          </Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Share your experience..."
            className="min-h-[120px]"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-base font-medium flex items-center gap-2">
          <span>📞</span> Vendor's Phone Number
        </Label>
        <Input
          id="phone"
          value={vendorContact}
          onChange={handlePhoneChange}
          placeholder="(555) 123-4567"
          className="h-14 text-base"
          maxLength={12}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="use-for-home"
          checked={useForHome}
          onCheckedChange={(checked) => setUseForHome(checked as boolean)}
        />
        <Label htmlFor="use-for-home" className="text-base cursor-pointer">
          <span className="mr-2">✓</span>I currently use this vendor for my home
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="show-name"
          checked={showName}
          onCheckedChange={(checked) => setShowName(checked as boolean)}
        />
        <Label htmlFor="show-name" className="text-base cursor-pointer">
          <span className="mr-2">✓</span>Show my name in review
        </Label>
      </div>

      <ReviewPreview
        rating={rating}
        showName={showName}
        userName={userName}
        streetName={streetName}
      />

      <Collapsible open={costOpen} onOpenChange={setCostOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between" type="button">
            <span className="flex items-center gap-2">
              <span>💰</span> Add pricing details (optional)
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${costOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="cost-type">Cost Type</Label>
            <select
              id="cost-type"
              value={costKind}
              onChange={(e) => setCostKind(e.target.value)}
              className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select type...</option>
              <option value="monthly_plan">Monthly Plan</option>
              <option value="yearly_plan">Yearly Plan</option>
              <option value="service_call">Service Call</option>
              <option value="hourly">Hourly</option>
              <option value="one_time">One-Time</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="cost-amount"
                type="number"
                value={costAmount}
                onChange={(e) => setCostAmount(e.target.value)}
                placeholder="0.00"
                className="h-14 text-base pl-8"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost-notes">Notes</Label>
            <Textarea
              id="cost-notes"
              value={costNotes}
              onChange={(e) => setCostNotes(e.target.value)}
              placeholder="e.g., Includes weekly service + chemicals"
              className="min-h-[80px]"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex gap-4 pt-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onSkip}
          className="flex-1 h-14 text-lg"
        >
          Skip This Vendor
        </Button>
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={rating === 0}
          className="flex-1 h-14 text-lg"
        >
          Save & Continue →
        </Button>
      </div>
    </div>
  );
}
