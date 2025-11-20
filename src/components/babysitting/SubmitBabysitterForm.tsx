import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  sitter_first_name: string;
  sitter_age: number;
  contact_relationship: string;
  experience_description: string;
  age_groups: string[];
  availability: string;
  certifications: string;
  hourly_rate_range: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
}

export function SubmitBabysitterForm({ 
  communityName,
  editMode,
  onSuccess 
}: { 
  communityName: string;
  editMode?: any;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: editMode ? {
      sitter_first_name: editMode.sitter_first_name,
      sitter_age: editMode.sitter_age,
      contact_relationship: editMode.contact_relationship,
      experience_description: editMode.experience_description || '',
      availability: editMode.availability || '',
      certifications: editMode.certifications?.join(', ') || '',
      hourly_rate_range: editMode.hourly_rate_range || '',
      contact_name: editMode.contact_name,
      contact_phone: editMode.contact_phone,
      contact_email: editMode.contact_email || '',
    } : {}
  });
  
  const sitterAge = watch("sitter_age");
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>(
    editMode?.age_groups || []
  );

  const ageGroupOptions = [
    { value: "infants", label: "Infants (0-2)" },
    { value: "toddlers", label: "Toddlers (2-5)" },
    { value: "school-age", label: "School-age (5-12)" },
    { value: "teens", label: "Teens (13+)" },
  ];

  const onSubmit = async (data: FormData) => {
    // Validation
    if (data.sitter_age < 18 && data.contact_relationship !== "parent") {
      toast({
        title: "Validation Error",
        description: "For sitters under 18, you must be the parent.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAgeGroups.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one age group.",
        variant: "destructive",
      });
      return;
    }

    if (!data.availability || data.availability.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Please provide availability information.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit a listing.",
          variant: "destructive",
        });
        return;
      }

      const certArray = data.certifications 
        ? data.certifications.split(",").map(c => c.trim()).filter(Boolean)
        : [];

      const listingData = {
        sitter_first_name: data.sitter_first_name,
        sitter_age: Number(data.sitter_age),
        experience_description: data.experience_description || null,
        age_groups: selectedAgeGroups.length > 0 ? selectedAgeGroups : null,
        availability: data.availability || null,
        certifications: certArray.length > 0 ? certArray : null,
        hourly_rate_range: data.hourly_rate_range || null,
        contact_name: data.contact_name,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email || null,
        contact_relationship: data.contact_relationship,
        community: communityName,
      };

      let error;
      
      if (editMode) {
        // UPDATE existing listing
        const result = await supabase
          .from("babysitter_listings")
          .update(listingData)
          .eq("id", editMode.id);
        error = result.error;
      } else {
        // INSERT new listing
        const result = await supabase
          .from("babysitter_listings")
          .insert({
            ...listingData,
            posted_by: user.id,
            status: "approved",
            approved_at: new Date().toISOString(),
            approved_by: user.id,
          });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: editMode ? "Updated!" : "Live!",
        description: editMode 
          ? "Your listing has been updated." 
          : "Your babysitter is now live on the board!",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: editMode ? "Update Failed" : "Submission Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Sitter Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="sitter_first_name">Sitter First Name *</Label>
          <Input
            id="sitter_first_name"
            {...register("sitter_first_name", { required: "Required" })}
            placeholder="Sarah"
          />
          {errors.sitter_first_name && (
            <p className="text-sm text-red-500 mt-1">{errors.sitter_first_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="sitter_age">Age *</Label>
          <Input
            id="sitter_age"
            type="number"
            {...register("sitter_age", { 
              required: "Required",
              min: { value: 12, message: "Must be at least 12" },
              max: { value: 25, message: "Must be 25 or under" }
            })}
            placeholder="16"
          />
          {errors.sitter_age && (
            <p className="text-sm text-red-500 mt-1">{errors.sitter_age.message}</p>
          )}
        </div>
      </div>

      {/* Relationship */}
      <div>
        <Label>Your Relationship *</Label>
        <RadioGroup defaultValue={editMode?.contact_relationship || "parent"}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="parent" id="parent" {...register("contact_relationship", { required: true })} />
            <Label htmlFor="parent" className="font-normal cursor-pointer">
              I'm the parent
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem 
              value="self" 
              id="self" 
              {...register("contact_relationship", { required: true })}
              disabled={sitterAge && Number(sitterAge) < 18}
            />
            <Label htmlFor="self" className="font-normal cursor-pointer">
              I'm the babysitter (18+ only)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Experience */}
      <div>
        <Label htmlFor="experience_description">Experience (Optional)</Label>
        <Textarea
          id="experience_description"
          {...register("experience_description")}
          placeholder="3 years experience with toddlers, great with bedtime routines..."
          rows={3}
        />
      </div>

      {/* Age Groups */}
      <div>
        <Label>Age Groups *</Label>
        <div className="grid gap-2 mt-2">
          {ageGroupOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={option.value}
                checked={selectedAgeGroups.includes(option.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedAgeGroups([...selectedAgeGroups, option.value]);
                  } else {
                    setSelectedAgeGroups(selectedAgeGroups.filter(g => g !== option.value));
                  }
                }}
              />
              <Label htmlFor={option.value} className="font-normal cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <Label htmlFor="availability">Availability *</Label>
        <Input
          id="availability"
          {...register("availability", { required: "Required" })}
          placeholder="Weekends and summer"
        />
        {errors.availability && (
          <p className="text-sm text-red-500 mt-1">{errors.availability.message}</p>
        )}
      </div>

      {/* Certifications */}
      <div>
        <Label htmlFor="certifications">Certifications (Optional)</Label>
        <Input
          id="certifications"
          {...register("certifications")}
          placeholder="CPR certified, First Aid (comma-separated)"
        />
      </div>

      {/* Rate */}
      <div>
        <Label htmlFor="hourly_rate_range">Hourly Rate (Optional)</Label>
        <Input
          id="hourly_rate_range"
          {...register("hourly_rate_range")}
          placeholder="$15-20/hour"
        />
      </div>

      {/* Contact Info */}
      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Contact Information</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="contact_name">Your Name *</Label>
            <Input
              id="contact_name"
              {...register("contact_name", { required: "Required" })}
              placeholder="Jane Smith"
            />
            {errors.contact_name && (
              <p className="text-sm text-red-500 mt-1">{errors.contact_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contact_phone">Your Phone *</Label>
            <Input
              id="contact_phone"
              type="tel"
              {...register("contact_phone", { required: "Required" })}
              placeholder="561-555-1234"
            />
            {errors.contact_phone && (
              <p className="text-sm text-red-500 mt-1">{errors.contact_phone.message}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="contact_email">Your Email (Optional)</Label>
          <Input
            id="contact_email"
            type="email"
            {...register("contact_email")}
            placeholder="jane@example.com"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting 
            ? (editMode ? "Updating..." : "Publishing...") 
            : (editMode ? "Update Listing" : "Publish Listing")}
        </Button>
      </div>
    </form>
  );
}
