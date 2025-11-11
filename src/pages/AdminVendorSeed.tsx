import { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/data/categories";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useCanSeedVendors } from "@/hooks/useCanSeedVendors";
import VendorNameInput, { type VendorSelectedPayload } from "@/components/VendorNameInput";
import { ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Tutoring subject options organized by category
const TUTORING_SUBJECTS = [
  // Math
  'Math (Elementary K-5)',
  'Math (Middle School 6-8)',
  'Math (High School 9-12)',
  'Math (College/Advanced)',
  
  // Science
  'Science (Elementary)',
  'Science (Middle School)',
  'Biology',
  'Chemistry',
  'Physics',
  
  // English
  'English/Language Arts',
  'Reading Comprehension',
  'Writing & Composition',
  'Grammar & Vocabulary',
  
  // Languages
  'Spanish',
  'French',
  'Mandarin Chinese',
  'Other Languages',
  
  // Test Prep
  'SAT Prep',
  'ACT Prep',
  'AP Exams',
  'PSAT/Pre-ACT',
  
  // Specialized
  'Special Needs/IEP Support',
  'ADHD/Executive Function',
  'ESL/English as Second Language',
  'Study Skills & Organization',
  'Homework Help (All Subjects)',
  
  // Other
  'History/Social Studies',
  'Computer Science/Coding',
];

const GRADE_LEVELS = [
  'Elementary (K-5)',
  'Middle School (6-8)',
  'High School (9-12)',
  'College/Adult',
];

const AdminVendorSeed = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Form state
  const [category, setCategory] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [contact, setContact] = useState<string>("");
  const [googlePlaceId, setGooglePlaceId] = useState<string>("");
  const [isManualEntry, setIsManualEntry] = useState<boolean>(false);
  const [community, setCommunity] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [adminCommunity, setAdminCommunity] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [availableCommunities, setAvailableCommunities] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>([]);
  
  const { data: canSeed, isLoading: adminLoading } = useCanSeedVendors();
  
  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  // Load admin's community and check permissions
  useEffect(() => {
    const loadAdminData = async () => {
      if (adminLoading) return;
      
      if (!canSeed) {
        toast({
          title: "Access denied",
          description: "You need vendor contributor or admin permissions to seed vendors.",
          variant: "destructive"
        });
        navigate("/admin");
        return;
      }

      try {
        // Try to get admin's HOA first
        const { data: myHoa } = await supabase.rpc("get_my_hoa");
        const hoa = Array.isArray(myHoa) ? (myHoa as any[])[0]?.hoa_name : (myHoa as any)?.hoa_name;
        
        if (hoa) {
          setAdminCommunity(hoa);
          setCommunity(hoa); // Default to admin's community
        } else {
          // Fallback to default community
          setCommunity("Boca Bridges");
        }
      } catch (error) {
        console.warn("Could not load admin HOA, using default:", error);
        setCommunity("Boca Bridges");
      }
      
      setLoading(false);
    };

    loadAdminData();
  }, [canSeed, adminLoading, navigate, toast]);

  // Fetch available communities from database
  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('name')
        .order('name');
      
      if (data && !error) {
        setAvailableCommunities(data.map(c => c.name));
      } else {
        // Fallback to hardcoded list if query fails
        setAvailableCommunities(['Boca Bridges', 'The Bridges', 'The Oaks']);
      }
    };
    
    fetchCommunities();
  }, []);

  // Reset tutoring selections when category changes
  useEffect(() => {
    setSelectedSubjects([]);
    setSelectedGradeLevels([]);
  }, [category]);

  const handleVendorSelected = async (payload: VendorSelectedPayload) => {
    setName(payload.name);
    setGooglePlaceId(payload.place_id);
    setIsManualEntry(false);
    
    // Auto-populate contact info if available
    if (payload.phone) {
      setContact(payload.phone);
    }

    // Fetch additional Google details
    try {
      const { data, error } = await supabase.functions.invoke('fetch-google-place-details', {
        body: { place_id: payload.place_id }
      });

      if (error) {
        console.warn("Failed to fetch Google place details:", error);
        return;
      }

      if (data?.formatted_phone_number && !contact.trim()) {
        setContact(data.formatted_phone_number);
      }
    } catch (err) {
      console.warn("Error fetching Google place details:", err);
    }
  };

  const handleManualNameInput = (inputName: string) => {
    setName(inputName);
    setIsManualEntry(true);
    setGooglePlaceId("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Tutoring validation
    if (category === 'Tutoring' && (selectedSubjects.length === 0 || selectedGradeLevels.length === 0)) {
      toast({
        title: "Tutoring information required",
        description: "Please select at least one subject and one grade level for tutoring vendors.",
        variant: "destructive"
      });
      return;
    }

    // Validation
    if (!category) {
      toast({ 
        title: "Category required", 
        description: "Please select a service category.", 
        variant: "destructive" 
      });
      return;
    }
    if (!name.trim()) {
      toast({ 
        title: "Provider name required", 
        description: "Please enter the provider name.", 
        variant: "destructive" 
      });
      return;
    }
    if (!contact.trim()) {
      toast({ 
        title: "Contact info required", 
        description: "Please enter phone or email.", 
        variant: "destructive" 
      });
      return;
    }
    if (!community.trim()) {
      toast({ 
        title: "Community required", 
        description: "Please select a community.", 
        variant: "destructive" 
      });
      return;
    }

    setSubmitting(true);
    console.log("[AdminVendorSeed] starting submission");

    // Check for duplicate vendor
    const { data: duplicates } = await supabase.rpc("check_vendor_duplicate", {
      _name: name.trim(),
      _community: community.trim()
    });
    
    if (duplicates && duplicates.length > 0) {
      const existing = duplicates[0];
      toast({ 
        title: "Vendor already exists", 
        description: `"${existing.vendor_name}" (${existing.vendor_category}) is already seeded in ${community}.`,
        variant: "destructive"
      });
      setSubmitting(false);
      return;
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      console.error("[AdminVendorSeed] auth error:", userErr);
      toast({ 
        title: "Not signed in", 
        description: "Please sign in to seed vendors.", 
        variant: "destructive" 
      });
      setSubmitting(false);
      return;
    }

    const userId = userData.user.id;
    
    // Create vendor data with Google integration
    const vendorData: any = {
      name: name.trim(),
      category,
      contact_info: contact.trim(),
      created_by: userId,
      community: community.trim(),
      google_place_id: googlePlaceId || null,
      // Add tutoring fields if category is Tutoring
      ...(category === 'Tutoring' && {
        tutoring_subjects: selectedSubjects,
        grade_levels: selectedGradeLevels
      })
    };

    // If we have Google place data, fetch and store Google ratings
    if (googlePlaceId) {
      try {
        const { data: googleData, error: googleError } = await supabase.functions.invoke('fetch-google-place-details', {
          body: { place_id: googlePlaceId }
        });

        if (!googleError && googleData) {
          vendorData.google_rating = googleData.rating;
          vendorData.google_rating_count = googleData.user_ratings_total;
          vendorData.google_last_updated = new Date().toISOString();
          vendorData.google_reviews_json = googleData.reviews;
        }
      } catch (err) {
        console.warn("Failed to fetch Google data during vendor seeding:", err);
      }
    }

    const { data: vendorInsert, error: vendorErr } = await supabase
      .from("vendors")
      .insert([vendorData])
      .select("id")
      .single();

    if (vendorErr || !vendorInsert) {
      console.error("[AdminVendorSeed] vendor insert error:", vendorErr);
      toast({ 
        title: "Could not seed vendor", 
        description: vendorErr?.message || "Please try again.", 
        variant: "destructive" 
      });
      setSubmitting(false);
      return;
    }

    console.log("[AdminVendorSeed] vendor seeded:", vendorInsert.id);

    toast({
      title: "Vendor seeded successfully!",
      description: `${name} has been added to ${community}. Users can now rate and add cost information.`,
    });

    // Reset form
    setCategory("");
    setName("");
    setContact("");
    setGooglePlaceId("");
    setIsManualEntry(false);
    setSelectedSubjects([]);
    setSelectedGradeLevels([]);
    setCommunity(adminCommunity || "Boca Bridges");
    setSubmitting(false);
  };

  if (adminLoading || loading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-10 max-w-2xl">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </section>
      </main>
    );
  }

  if (!canSeed) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-10 max-w-2xl">
          <p className="text-sm text-muted-foreground">Access denied. You need vendor contributor or admin permissions to seed vendors.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Courtney's List | Admin Vendor Seed"
        description="Admin tool to pre-populate vendors for community tables."
        canonical={canonical}
      />
      <section className="container py-6 md:py-10 max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Seed Vendor</h1>
          <p className="text-muted-foreground mt-2">
            Pre-populate a vendor for the community. Users will be able to rate and add cost information later.
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="community">Community/HOA</Label>
              <Select value={community} onValueChange={setCommunity}>
                <SelectTrigger id="community">
                  <SelectValue placeholder="Select a community" />
                </SelectTrigger>
                <SelectContent>
                  {availableCommunities.map((communityName) => (
                    <SelectItem key={communityName} value={communityName}>
                      {communityName}
                    </SelectItem>
                  ))}
                  {adminCommunity && 
                   !availableCommunities.includes(adminCommunity) && (
                    <SelectItem value={adminCommunity}>{adminCommunity}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {adminCommunity && (
                <p className="text-xs text-muted-foreground">
                  Default: {adminCommunity} (your HOA)
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Service Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Provider Name</Label>
              <VendorNameInput
                id="name"
                placeholder="Search business name or enter manually..."
                defaultValue={name}
                onSelected={handleVendorSelected}
                onManualInput={handleManualNameInput}
              />
              {!isManualEntry && googlePlaceId && (
                <p className="text-xs text-green-600">✓ Verified business from Google</p>
              )}
            </div>

            {/* Tutoring Subject and Grade Level Selection */}
            {category === 'Tutoring' && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                {/* Subjects */}
                <div>
                  <Label className="text-base font-semibold">Subjects Offered <span className="text-red-500">*</span></Label>
                  <p className="text-sm text-muted-foreground mb-3">Select all that apply</p>
                  
                  <div className="space-y-4">
                    {/* Mathematics */}
                    <div>
                      <p className="font-medium text-sm mb-2">Mathematics</p>
                      <div className="space-y-2 ml-2">
                        {['Math (Elementary K-5)', 'Math (Middle School 6-8)', 'Math (High School 9-12)', 'Math (College/Advanced)'].map((subject) => (
                          <div key={subject} className="flex items-center gap-2">
                            <Checkbox
                              id={`subject-${subject}`}
                              checked={selectedSubjects.includes(subject)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubjects([...selectedSubjects, subject]);
                                } else {
                                  setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
                                }
                              }}
                            />
                            <Label htmlFor={`subject-${subject}`} className="text-sm font-normal cursor-pointer">
                              {subject}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Science */}
                    <div>
                      <p className="font-medium text-sm mb-2">Science</p>
                      <div className="space-y-2 ml-2">
                        {['Science (Elementary)', 'Science (Middle School)', 'Biology', 'Chemistry', 'Physics'].map((subject) => (
                          <div key={subject} className="flex items-center gap-2">
                            <Checkbox
                              id={`subject-${subject}`}
                              checked={selectedSubjects.includes(subject)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubjects([...selectedSubjects, subject]);
                                } else {
                                  setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
                                }
                              }}
                            />
                            <Label htmlFor={`subject-${subject}`} className="text-sm font-normal cursor-pointer">
                              {subject}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* English/Language Arts */}
                    <div>
                      <p className="font-medium text-sm mb-2">English/Language Arts</p>
                      <div className="space-y-2 ml-2">
                        {['English/Language Arts', 'Reading Comprehension', 'Writing & Composition', 'Grammar & Vocabulary'].map((subject) => (
                          <div key={subject} className="flex items-center gap-2">
                            <Checkbox
                              id={`subject-${subject}`}
                              checked={selectedSubjects.includes(subject)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubjects([...selectedSubjects, subject]);
                                } else {
                                  setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
                                }
                              }}
                            />
                            <Label htmlFor={`subject-${subject}`} className="text-sm font-normal cursor-pointer">
                              {subject}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Languages */}
                    <div>
                      <p className="font-medium text-sm mb-2">Languages</p>
                      <div className="space-y-2 ml-2">
                        {['Spanish', 'French', 'Mandarin Chinese', 'Other Languages'].map((subject) => (
                          <div key={subject} className="flex items-center gap-2">
                            <Checkbox
                              id={`subject-${subject}`}
                              checked={selectedSubjects.includes(subject)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubjects([...selectedSubjects, subject]);
                                } else {
                                  setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
                                }
                              }}
                            />
                            <Label htmlFor={`subject-${subject}`} className="text-sm font-normal cursor-pointer">
                              {subject}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Test Preparation */}
                    <div>
                      <p className="font-medium text-sm mb-2">Test Preparation</p>
                      <div className="space-y-2 ml-2">
                        {['SAT Prep', 'ACT Prep', 'AP Exams', 'PSAT/Pre-ACT'].map((subject) => (
                          <div key={subject} className="flex items-center gap-2">
                            <Checkbox
                              id={`subject-${subject}`}
                              checked={selectedSubjects.includes(subject)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubjects([...selectedSubjects, subject]);
                                } else {
                                  setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
                                }
                              }}
                            />
                            <Label htmlFor={`subject-${subject}`} className="text-sm font-normal cursor-pointer">
                              {subject}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Specialized Support */}
                    <div>
                      <p className="font-medium text-sm mb-2">Specialized Support</p>
                      <div className="space-y-2 ml-2">
                        {['Special Needs/IEP Support', 'ADHD/Executive Function', 'ESL/English as Second Language', 'Study Skills & Organization', 'Homework Help (All Subjects)'].map((subject) => (
                          <div key={subject} className="flex items-center gap-2">
                            <Checkbox
                              id={`subject-${subject}`}
                              checked={selectedSubjects.includes(subject)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubjects([...selectedSubjects, subject]);
                                } else {
                                  setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
                                }
                              }}
                            />
                            <Label htmlFor={`subject-${subject}`} className="text-sm font-normal cursor-pointer">
                              {subject}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Other Subjects */}
                    <div>
                      <p className="font-medium text-sm mb-2">Other Subjects</p>
                      <div className="space-y-2 ml-2">
                        {['History/Social Studies', 'Computer Science/Coding'].map((subject) => (
                          <div key={subject} className="flex items-center gap-2">
                            <Checkbox
                              id={`subject-${subject}`}
                              checked={selectedSubjects.includes(subject)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubjects([...selectedSubjects, subject]);
                                } else {
                                  setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
                                }
                              }}
                            />
                            <Label htmlFor={`subject-${subject}`} className="text-sm font-normal cursor-pointer">
                              {subject}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grade Levels */}
                <div>
                  <Label className="text-base font-semibold">Grade Levels <span className="text-red-500">*</span></Label>
                  <p className="text-sm text-muted-foreground mb-3">Select all that apply</p>
                  <div className="space-y-2">
                    {GRADE_LEVELS.map((level) => (
                      <div key={level} className="flex items-center gap-2">
                        <Checkbox
                          id={`grade-${level}`}
                          checked={selectedGradeLevels.includes(level)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedGradeLevels([...selectedGradeLevels, level]);
                            } else {
                              setSelectedGradeLevels(selectedGradeLevels.filter(g => g !== level));
                            }
                          }}
                        />
                        <Label htmlFor={`grade-${level}`} className="text-sm font-normal cursor-pointer">
                          {level}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="contact">Provider Contact Info</Label>
              <Input 
                id="contact" 
                placeholder="phone or email" 
                value={contact} 
                onChange={(e) => setContact(e.currentTarget.value)} 
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Seeding Vendor..." : "Seed Vendor"}
          </Button>
        </form>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">About Vendor Seeding</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Seeded vendors appear in community tables with "No Ratings Yet" and "TBD" for costs</li>
            <li>• Users can rate and add cost information using the existing Rate modal</li>
            <li>• Duplicate prevention ensures vendor names + categories are unique per community</li>
            <li>• Google Places integration automatically fetches business ratings and contact info</li>
          </ul>
        </div>
      </section>
    </main>
  );
};

export default AdminVendorSeed;