import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RatingStars } from "@/components/ui/rating-stars";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Star, 
  Filter, 
  ChevronUp, 
  ChevronDown, 
  ArrowUpDown, 
  Plus, 
  Building2,
  Users,
  BarChart3,
  DollarSign,
  Phone,
  Settings,
  HelpCircle,
  Pencil,
  Share
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CATEGORIES } from "@/data/categories";
import { getCategoryIcon } from "@/utils/categoryIcons";
import { getCategoryEmoji } from "@/utils/categoryEmojis";
import { useUserHomeVendors } from "@/hooks/useUserHomeVendors";
import { useUserReviews } from "@/hooks/useUserReviews";
import { useUserCosts } from "@/hooks/useUserCosts";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { GATracking } from "@/components/analytics/GoogleAnalytics";
import { useAnalyticsTracking } from "@/contexts/AnalyticsContext";
import { useUserData } from "@/hooks/useUserData";
import { BabysittingBoard } from "@/components/babysitting/BabysittingBoard";

import ReviewsHover from "@/components/vendors/ReviewsHover";
import PreviewReviewsHover from "@/components/vendors/PreviewReviewsHover";
import GoogleReviewsHover from "@/components/vendors/GoogleReviewsHover";
import RateVendorModalWrapper from "@/components/vendors/RateVendorModalWrapper";
import VendorMobileCard from "@/components/vendors/VendorMobileCard";
import CostManagementModalWrapper from "@/components/vendors/CostManagementModalWrapper";
import { CostDisplay } from "@/components/vendors/CostDisplay";
import { HorizontalSortControls } from "./HorizontalSortControls";
import { HorizontalCategoryPills } from "./HorizontalCategoryPills";
import { formatUSPhoneDisplay } from "@/utils/phone";
import { AccessGateModal } from "@/components/vendors/AccessGateModal";

export type CommunityVendorRow = {
  id: string;
  name: string;
  category: string;
  homes_serviced: number;
  homes_pct: number | null;
  hoa_rating: number | null;
  hoa_rating_count: number | null;
  google_rating: number | null;
  google_rating_count: number | null;
  google_reviews_json: any | null;
  google_place_id: string | null;
  avg_monthly_cost: number | null;
  service_call_avg: number | null;
  contact_info: string | null;
  typical_cost: number | null;
  avg_cost_display: string | null;
  avg_cost_amount: number | null;
  community_amount: number | null;
  community_unit: string | null;
  community_sample_size: number | null;
  market_amount: number | null;
  market_unit: string | null;
  secondary_categories?: string[] | null;
  tutoring_subjects?: string[] | null;
  grade_levels?: string[] | null;
};

const getSorts = (communityName: string) => [
  { key: "homes", label: "Neighbors Using" },
  { key: "hoa_rating", label: `${communityName} Rating` },
  { key: "google_rating", label: "Google Rating" },
] as const;

// Popular categories to show as tabs (exactly 4 for 5-tab layout with All Categories)
const POPULAR_CATEGORIES = ["Pool", "HVAC", "Landscaping", "Pest Control"] as const;
const OTHER_CATEGORIES = CATEGORIES.filter(cat => !POPULAR_CATEGORIES.includes(cat as any));

export default function CommunityVendorTable({
  communityName,
  showContact = true,
  isAuthenticated = false,
  isVerified = false,
}: {
  communityName: string;
  showContact?: boolean;
  isAuthenticated?: boolean;
  isVerified?: boolean;
}) {
  // Special handling for Babysitting category
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  
  if (categoryFromUrl === "Babysitting") {
    return <BabysittingBoard communityName={communityName} isAuthenticated={isAuthenticated} />;
  }
  
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>("Pool");
  const SORTS = getSorts(communityName);
  const [sortBy, setSortBy] = useState<typeof SORTS[number]["key"]>("hoa_rating");
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [showInitialAnimation, setShowInitialAnimation] = useState(true);
  const { isScrollingDown, hasScrolled } = useScrollDirection();
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isBannerExiting, setIsBannerExiting] = useState(false);
  const [prevCommunityName, setPrevCommunityName] = useState<string>(communityName);
  const { trackCategoryClick } = useAnalyticsTracking();

  // Initialize category from URL parameter
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory) {
      setCategory(urlCategory);
    }
  }, [searchParams]);

  // Remove animation after initial attention
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialAnimation(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Check if banner was previously dismissed (separate keys for auth states)
  // Reset banner when community changes or after 24 hours
  useEffect(() => {
    // Detect community change
    if (prevCommunityName !== communityName) {
      // Community changed - clear any previous dismissal and reset banner visibility
      const authState = isAuthenticated ? 'authenticated' : 'unauthenticated';
      const bannerKey = `banner_dismissed_${communityName}_${authState}`;
      localStorage.removeItem(bannerKey);
      setIsBannerVisible(true);
      setIsBannerExiting(false);
      setPrevCommunityName(communityName);
      return;
    }
    
    const authState = isAuthenticated ? 'authenticated' : 'unauthenticated';
    const bannerKey = `banner_dismissed_${communityName}_${authState}`;
    const dismissedTimestamp = localStorage.getItem(bannerKey);
    
    if (dismissedTimestamp) {
      const dismissedTime = parseInt(dismissedTimestamp, 10);
      const currentTime = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      // Check if 24 hours have passed
      if (currentTime - dismissedTime < twentyFourHours) {
        setIsBannerVisible(false);
      } else {
        // 24 hours passed - clear dismissal and show banner
        localStorage.removeItem(bannerKey);
        setIsBannerVisible(true);
        setIsBannerExiting(false);
      }
    } else {
      // Not dismissed - show banner
      setIsBannerVisible(true);
      setIsBannerExiting(false);
    }
  }, [communityName, isAuthenticated, prevCommunityName]);

  // Auto-dismiss banner on scroll (separate dismissal per auth state, expires after 24 hours)
  useEffect(() => {
    if (!isBannerVisible || !hasScrolled) return;

    const authState = isAuthenticated ? 'authenticated' : 'unauthenticated';
    const bannerKey = `banner_dismissed_${communityName}_${authState}`;
    
    // Trigger fade-out animation
    setIsBannerExiting(true);
    
    // After animation, hide banner and store dismissal timestamp
    const timer = setTimeout(() => {
      setIsBannerVisible(false);
      localStorage.setItem(bannerKey, Date.now().toString());
    }, 300); // Match animation duration

    return () => clearTimeout(timer);
  }, [hasScrolled, communityName, isAuthenticated, isBannerVisible]);

  const { data, isLoading, error, refetch, isFetching } = useQuery<CommunityVendorRow[]>({
    queryKey: ["community-stats", communityName, category, sortBy],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_vendor_stats", {
        _hoa_name: communityName,
        _category: category === "all" ? null : category,
        _sort_by: sortBy,
        _limit: 100,
        _offset: 0,
      });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!communityName,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Fetch available categories for The Bridges
  const { data: availableCategories } = useQuery<string[]>({
    queryKey: ["available-categories", communityName],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_vendor_stats", {
        _hoa_name: communityName,
        _category: null,
        _sort_by: "hoa_rating",
        _limit: 1000,
        _offset: 0,
      });
      if (error) throw error;
      
      // Get unique categories from the results
      const uniqueCategories = [...new Set(data?.map((v: any) => v.category) || [])];
      return uniqueCategories.sort();
    },
    enabled: !!communityName,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch community photo for the review source icon
  const { data: communityAssets } = useQuery({
    queryKey: ["community-assets", communityName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_assets")
        .select("photo_path")
        .ilike("hoa_name", communityName)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!communityName,
  });

  // Generate public URL for community photo
  const communityPhotoUrl = useMemo(() => {
    if (!communityAssets?.photo_path) return null;
    
    const { data } = supabase.storage
      .from("community-photos")
      .getPublicUrl(communityAssets.photo_path);
    
    return data.publicUrl;
  }, [communityAssets]);

  // Community-wide stats (independent of category)
  const { data: communityStats } = useQuery<{ total_reviews: number; active_users: number } | null>({
    queryKey: ["community-wide-stats", communityName],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_community_stats", { _hoa_name: communityName });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : (data as any);
      return row ? { total_reviews: row.total_reviews, active_users: row.active_users } : null;
    },
    enabled: !!communityName,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Calculate social proof stats (category-scoped fallback)
  const socialProofStats = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const totalNeighbors = data.reduce((sum, v) => sum + (v.homes_serviced || 0), 0);
    const totalProviders = data.length;
    const totalReviews = data.reduce((sum, v) => sum + (v.hoa_rating_count || 0), 0);
    const totalCategories = availableCategories?.length || 0;
    
    return {
      neighbors: totalNeighbors,
      providers: totalProviders,
      reviews: totalReviews,
      categories: totalCategories
    };
  }, [data, availableCategories]);
  const { data: userHomeVendors } = useUserHomeVendors();
  const { data: userReviews } = useUserReviews();
  const userCosts = useUserCosts();
  const { data: userData } = useUserData();
  
  // Modal states
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<{ id: string; name: string; category: string } | null>(null);
  const [addVendorModalOpen, setAddVendorModalOpen] = useState(false);
  const [addVendorCategory, setAddVendorCategory] = useState<string>('');


  const handleCategoryChange = async (newCategory: string) => {
    GATracking.trackCategoryChange(category, newCategory);
    await trackCategoryClick(newCategory);
    setCategory(newCategory);
    // Update URL parameter
    const newSearchParams = new URLSearchParams(searchParams);
    if (newCategory === 'all') {
      newSearchParams.delete('category');
    } else {
      newSearchParams.set('category', newCategory);
    }
    setSearchParams(newSearchParams);
    
    // Scroll to top of vendor list with smooth animation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareCategory = async () => {
    try {
      const currentUrl = new URL(window.location.href);
      if (category !== 'all') {
        currentUrl.searchParams.set('category', category);
      } else {
        currentUrl.searchParams.delete('category');
      }
      
      await navigator.clipboard.writeText(currentUrl.toString());
      toast({
        title: "Link copied!",
        description: `Share this ${category === 'all' ? 'vendor list' : category} link with neighbors`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy link",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleShowBanner = () => {
    setIsBannerVisible(true);
    setIsBannerExiting(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openRate = (row: CommunityVendorRow) => {
    // Check if user is trying to rate a vendor from a different community
    if (userData?.communityName && userData.communityName !== communityName) {
      toast({
        title: "Rate vendors in your community",
        description: `You can rate and review vendors in ${userData.communityName}. Visit your community page to share your experience!`,
      });
      return;
    }
    
    setSelectedVendor({ id: row.id, name: row.name, category: row.category });
    setRateModalOpen(true);
  };

  const openCosts = (row: CommunityVendorRow) => {
    // Check if user is trying to add costs for a vendor from a different community
    if (userData?.communityName && userData.communityName !== communityName) {
      toast({
        title: "Add costs in your community",
        description: `You can add cost information for vendors in ${userData.communityName}. Visit your community page to contribute!`,
      });
      return;
    }
    
    // Track cost button click in Mixpanel
    if (typeof window !== 'undefined' && window.mixpanel) {
      try {
        window.mixpanel.track(`Clicked View Costs: ${row.name}`, {
          vendor_name: row.name,
          vendor_id: row.id,
          category: row.category,
          has_costs: (row.community_sample_size || 0) > 0,
          community: communityName,
        });
        console.log('📊 Tracked cost button click:', row.name);
      } catch (error) {
        console.error('Mixpanel tracking error:', error);
      }
    }
    
    setSelectedVendor({ id: row.id, name: row.name, category: row.category });
    setCostModalOpen(true);
  };

  const handleAddVendor = () => {
    if (!isAuthenticated) {
      setAddVendorCategory(category);
      setAddVendorModalOpen(true);
    } else {
      navigate(`/submit?community=${communityName}&category=${category}`);
    }
  };

  const formatted = useMemo(() => data || [], [data]);

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto">
        {/* Mobile-Optimized Filter Controls - Two Rows */}
        <div className={`sticky top-2 sm:top-16 z-40 bg-background/80 backdrop-blur-sm transition-transform duration-300 ease-out mb-3 sm:mb-6 ${
          isScrollingDown ? '-translate-y-full' : 'translate-y-0'
        }`}>
          {/* Horizontal Info Bar - Mobile Only */}
          {isMobile && communityPhotoUrl && isBannerVisible && (
            <div className={`bg-card border border-border rounded-lg shadow-sm mb-6 transition-all duration-300 overflow-hidden ${
              isBannerExiting ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
            }`}>
              <div className="flex items-center">
                {/* Community Image - Left */}
                <div className="flex-shrink-0 p-3 bg-primary/5 border-r border-border">
                  <img 
                    src={communityPhotoUrl} 
                    alt={communityName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                  />
                </div>
                
                {/* Stats Cells - Spread Across */}
                {(communityStats || socialProofStats) && (
                  <div className="flex-1 flex divide-x divide-border">
                    {/* Neighbors Cell */}
                    <div className="flex-1 flex flex-col items-center justify-center p-3 min-w-0">
                      <Users className="h-4 w-4 text-primary mb-1" />
                      <span className="text-lg font-bold text-foreground leading-none">
                        {(communityStats?.active_users ?? socialProofStats?.neighbors) || 0}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                        Neighbors
                      </span>
                    </div>
                    
                    {/* Reviews Cell */}
                    <div className="flex-1 flex flex-col items-center justify-center p-3 min-w-0">
                      <Star className="h-4 w-4 text-amber-500 mb-1" />
                      <span className="text-lg font-bold text-foreground leading-none">
                        {(communityStats?.total_reviews ?? socialProofStats?.reviews) || 0}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                        Reviews
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Loading state for stats */}
                {!socialProofStats && isLoading && (
                  <div className="flex-1 text-sm text-muted-foreground text-center py-4">
                    Loading...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Row 1: Category Dropdown + Info + Share Buttons */}
          <div className="flex items-end gap-3 mb-4">
            <div className="flex-1 flex flex-col justify-end">
              <HorizontalCategoryPills
                selectedCategory={category}
                onCategoryChange={handleCategoryChange}
                categories={(
                  availableCategories?.length > 0 ? 
                  availableCategories : CATEGORIES
                ) as string[]}
                isBannerVisible={isMobile && isBannerVisible}
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2 block text-right sm:text-left">
                Share
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareCategory}
                className="h-12 w-12 p-0 flex items-center justify-center"
              >
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Row 2: Sort Controls */}
          <div className="mb-4">
            <HorizontalSortControls
              selectedSort={sortBy}
              onSortChange={(sort) => {
                setSortBy(sort as any);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              communityName={communityName}
            />
          </div>
        </div>

        {/* Mobile-style Card Layout for Desktop */}
        <div className="space-y-3 pt-2">
          {category !== "all" && (
            <div className="flex items-center justify-between py-2">
              <h3 className="text-lg font-semibold text-foreground">
                {category} Providers
              </h3>
              <Button
                onClick={handleAddVendor}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Provider
              </Button>
            </div>
          )}
          {isLoading && (
            <div className="text-sm text-muted-foreground text-center py-8">Loading…</div>
          )}
          {error && (
            <div className="text-sm text-muted-foreground text-center py-8">Unable to load providers.</div>
          )}
          {!isLoading && !error && formatted.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">What? No vendors? Please be the first to add one to this category and help out your neighbors :)</div>
          )}
          {formatted.map((vendor, idx) => (
            <VendorMobileCard
              key={vendor.id}
              vendor={vendor}
              rank={idx + 1}
              showContact={showContact}
              onCategoryClick={setCategory}
              onRate={openRate}
              onCosts={openCosts}
              userHomeVendors={userHomeVendors}
              userReviews={userReviews}
              userCosts={userCosts.data}
              isAuthenticated={isAuthenticated}
              isVerified={isVerified}
              communityName={communityName}
              communityPhotoUrl={communityPhotoUrl}
            />
          ))}
        </div>

        {/* Modals */}
        {isAuthenticated && (
          <>
            <RateVendorModalWrapper 
              open={rateModalOpen} 
              onOpenChange={setRateModalOpen} 
              vendor={selectedVendor} 
              onSuccess={() => { 
                setRateModalOpen(false);
                // Scroll back to the vendor card after DOM updates
                setTimeout(() => {
                  const vendorCard = document.querySelector(`[data-vendor-id="${selectedVendor?.id}"]`);
                  if (vendorCard) {
                    vendorCard.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center',
                      inline: 'nearest'
                    });
                  }
                }, 150);
              }}
              communityName={communityName}
            />
            <CostManagementModalWrapper 
              open={costModalOpen} 
              onOpenChange={setCostModalOpen} 
              vendor={selectedVendor} 
              onSuccess={() => { 
                setCostModalOpen(false);
                // Scroll back to the vendor card after DOM updates
                setTimeout(() => {
                  const vendorCard = document.querySelector(`[data-vendor-id="${selectedVendor?.id}"]`);
                  if (vendorCard) {
                    vendorCard.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center',
                      inline: 'nearest'
                    });
                  }
                }, 150);
              }}
              communityName={communityName}
            />
          </>
        )}

        <AccessGateModal
          open={addVendorModalOpen}
          onOpenChange={setAddVendorModalOpen}
          contentType="add_vendor"
          communityName={communityName}
          category={addVendorCategory}
        />

      </div>
    </TooltipProvider>
  );
}