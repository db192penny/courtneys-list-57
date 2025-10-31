import { Star, Info, ChevronRight, Smartphone, DollarSign, Phone, MessageSquare, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "@/components/ui/rating-stars";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SectionHeader } from "@/components/ui/section-header";
import { formatUSPhoneDisplay } from "@/utils/phone";
import { getCategoryIcon } from "@/utils/categoryIcons";
import { getCategoryEmoji } from "@/utils/categoryEmojis";
import { useUserReviews } from "@/hooks/useUserReviews";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import ReviewsHover from "@/components/vendors/ReviewsHover";
import GoogleReviewsHover from "@/components/vendors/GoogleReviewsHover";
import { CostDisplay } from "@/components/vendors/CostDisplay";
import { MobileReviewsModal } from "@/components/vendors/MobileReviewsModal";
import { MobileGoogleReviewsModal } from "@/components/vendors/MobileGoogleReviewsModal";
import { ReviewSourceIcon } from "./ReviewSourceIcon";
import { NeighborReviewPreview } from "./NeighborReviewPreview";
import { MobileCostsModal } from "./MobileCostsModal";
import { NeighborsModal } from "./NeighborsModal";
import { AddContactModal } from "./AddContactModal";
import type { CommunityVendorRow } from "@/components/vendors/CommunityVendorTable";
import React, { useState } from "react";
import { GATracking } from "@/components/analytics/GoogleAnalytics";
import { AccessGateModal } from "@/components/vendors/AccessGateModal";
import { useAnalyticsTracking } from "@/contexts/AnalyticsContext";
import CostManagementModalWrapper from "@/components/vendors/CostManagementModalWrapper";

const isContactInfoPending = (contactInfo: string | null | undefined): boolean => {
  return !contactInfo || 
         contactInfo === 'PENDING_CONTACT_INFO' || 
         contactInfo.toLowerCase().includes('phone not') ||
         contactInfo.toLowerCase().includes('pending') ||
         contactInfo.toLowerCase().includes('not available');
};

interface VendorMobileCardProps {
  vendor: CommunityVendorRow;
  rank: number;
  showContact: boolean;
  onCategoryClick: (category: string) => void;
  onRate: (vendor: CommunityVendorRow) => void;
  onCosts: (vendor: CommunityVendorRow) => void;
  userHomeVendors?: Set<string>;
  userReviews?: Map<string, { rating: number; id: string }>;
  userCosts?: Map<string, boolean>;
  isAuthenticated?: boolean;
  isVerified?: boolean;
  communityName?: string;
  communityPhotoUrl?: string | null;
}

export default function VendorMobileCard({
  vendor,
  rank,
  showContact,
  onCategoryClick,
  onRate,
  onCosts,
  userHomeVendors,
  userReviews,
  userCosts,
  isAuthenticated = false,
  isVerified = false,
  communityName,
  communityPhotoUrl,
}: VendorMobileCardProps) {
  // Use a combined query that works for both authenticated and preview users
  const { data: vendorCosts, isLoading: costsLoading } = useQuery({
    queryKey: ["vendor-costs-combined", vendor.id],
    queryFn: async () => {
      let allCosts: any[] = [];
      
      // Try to fetch real costs (works for authenticated users)
      try {
        const { data: realCosts, error } = await supabase.rpc("list_vendor_costs", {
          _vendor_id: vendor.id,
        });
        
        if (!error && realCosts) {
          allCosts = realCosts;
        }
      } catch (error) {
        // Silently handle RLS errors for logged-out users
        console.log("Cannot fetch real costs (user not authenticated)");
      }

      // Also fetch preview costs (always accessible)
      try {
        const { data: previewCosts, error: previewError } = await supabase
          .from("preview_costs")
          .select("*")
          .eq("vendor_id", vendor.id);
          
        if (!previewError && previewCosts) {
          // Convert preview costs to match real costs format
          const formattedPreviewCosts = previewCosts.map(cost => ({
            id: `preview-${cost.id}`,
            vendor_id: cost.vendor_id,
            amount: cost.amount,
            period: cost.period,
            unit: cost.unit,
            cost_kind: cost.cost_kind,
            notes: cost.notes,
            created_at: cost.created_at,
            anonymous: cost.anonymous,
            currency: cost.currency || 'USD'
          }));
          allCosts = [...allCosts, ...formattedPreviewCosts];
        }
      } catch (error) {
        console.error("Failed to fetch preview costs:", error);
      }

      return allCosts;
    },
    enabled: !!vendor.id,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,  // Always fetch fresh data
    gcTime: 0,  // Don't cache results (replaces deprecated cacheTime)
  });
  const { data: profile } = useUserProfile();
  const { toast } = useToast();
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [googleReviewsModalOpen, setGoogleReviewsModalOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
  const [contactRevealed, setContactRevealed] = useState(false);
  const [accessGateOpen, setAccessGateOpen] = useState(false);
  const [accessGateType, setAccessGateType] = useState<"rate" | "reviews" | "costs">("rate");
  const [neighborsModalOpen, setNeighborsModalOpen] = useState(false);
  const [addContactModalOpen, setAddContactModalOpen] = useState(false);
  const [costManagementModalOpen, setCostManagementModalOpen] = useState(false);
  const [selectedVendorForCostEdit, setSelectedVendorForCostEdit] = useState<{
    id: string;
    name: string;
    category: string;
  } | null>(null);
  const { trackVendorClick, trackModalOpen, trackContactAction } = useAnalyticsTracking();

  const userHasCosts = userCosts?.has(vendor.id) || false;

  const handleContactButtonClick = () => {
    // Track the initial contact button click
    if (typeof window !== 'undefined' && window.mixpanel) {
      try {
        window.mixpanel.track(`Clicked Contact Button: ${vendor.name}`, {
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          category: vendor.category,
          has_contact_info: !isContactInfoPending(vendor.contact_info),
          community: communityName,
        });
        
        // Increment user's contact attempts
        window.mixpanel.people.increment('total_contact_clicks', 1);
        window.mixpanel.people.set({
          'last_contact_date': new Date().toISOString(),
        });
        
        console.log('📊 Tracked contact button click:', vendor.name);
      } catch (error) {
        console.error('Mixpanel tracking error:', error);
      }
    }
    
    // Reveal the contact options
    setContactRevealed(true);
  };

  const handleCall = () => {
    if (typeof window !== 'undefined' && window.mixpanel) {
      try {
        window.mixpanel.track(`Called Vendor: ${vendor.name}`, {
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          phone: vendor.contact_info,
          action: 'call',
          category: vendor.category,
        });
        
        window.mixpanel.people.increment('vendors_called', 1);
        console.log('📊 Tracked vendor call:', vendor.name);
      } catch (error) {
        console.error('Mixpanel tracking error:', error);
      }
    }
    
    trackContactAction('call_clicked', vendor.id, vendor.name, vendor.contact_info || undefined);
    window.location.href = `tel:${vendor.contact_info}`;
    setContactRevealed(false);
  };

  const handleText = () => {
    if (typeof window !== 'undefined' && window.mixpanel) {
      try {
        window.mixpanel.track(`Texted Vendor: ${vendor.name}`, {
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          phone: vendor.contact_info,
          action: 'text',
          category: vendor.category,
        });
        
        window.mixpanel.people.increment('vendors_texted', 1);
        console.log('📊 Tracked vendor text:', vendor.name);
      } catch (error) {
        console.error('Mixpanel tracking error:', error);
      }
    }
    
    trackContactAction('text_clicked', vendor.id, vendor.name, vendor.contact_info || undefined);
    window.location.href = `sms:${vendor.contact_info}`;
    setContactRevealed(false);
  };

  const handleCopyNumber = async () => {
    if (typeof window !== 'undefined' && window.mixpanel) {
      try {
        window.mixpanel.track(`Copied Vendor Number: ${vendor.name}`, {
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          phone: vendor.contact_info,
          action: 'copy',
          category: vendor.category,
        });
        
        window.mixpanel.people.increment('vendor_numbers_copied', 1);
        console.log('📊 Tracked number copy:', vendor.name);
      } catch (error) {
        console.error('Mixpanel tracking error:', error);
      }
    }
    
    trackContactAction('copy_clicked', vendor.id, vendor.name, vendor.contact_info || undefined);
    try {
      await navigator.clipboard.writeText(vendor.contact_info || '');
      toast({
        title: "Number copied",
        description: "Phone number copied to clipboard",
      });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = vendor.contact_info || '';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({
        title: "Number copied",
        description: "Phone number copied to clipboard",
      });
    }
    setContactRevealed(false);
  };

  return (
    <>
    <Card className="w-full" data-vendor-id={vendor.id} data-vendor-name={vendor.name}>
      <CardContent className="p-3 space-y-3">
        {/* Header Section - Rank and Name on same line */}
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-blue-500 text-white text-sm font-semibold px-3 py-1 rounded-lg shrink-0">
            #{rank}
          </span>
          <h3 className="text-lg font-bold break-words leading-tight flex-1">{vendor.name}</h3>
        </div>

        {/* Category, Neighbors, and Rate Button */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {getCategoryEmoji(vendor.category)} {vendor.category}
            </Badge>
            {vendor.secondary_categories && vendor.secondary_categories.length > 0 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Also does: {vendor.secondary_categories.join(', ')}
              </Badge>
            )}
            {vendor.homes_serviced > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  GATracking.trackModalOpen('neighbors_modal', { 
                    vendor_id: vendor.id,
                    vendor_name: vendor.name,
                    homes_serviced: vendor.homes_serviced 
                  });
                  if (isAuthenticated) {
                    setNeighborsModalOpen(true);
                  } else {
                    setAccessGateType("reviews");
                    setAccessGateOpen(true);
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary font-medium text-sm active:scale-95 transition-transform"
              >
                👥 {vendor.homes_serviced} neighbor{vendor.homes_serviced !== 1 ? 's' : ''}
                <ChevronRight size={14} className="shrink-0" />
              </button>
            )}
          </div>
          <Button
            onClick={async (e) => {
              e.stopPropagation();
              GATracking.trackButtonClick('rate_vendor', { 
                vendor_id: vendor.id,
                vendor_name: vendor.name 
              });
              
              // Track Rate button click in Mixpanel
              if (typeof window !== 'undefined' && window.mixpanel) {
                try {
                  window.mixpanel.track(`Clicked Rate Button: ${vendor.name}`, {
                    vendor_id: vendor.id,
                    vendor_name: vendor.name,
                    category: vendor.category,
                    is_authenticated: isAuthenticated,
                    user_has_reviewed: userReviews?.has(vendor.id) || false,
                    community: communityName,
                  });
                  console.log('📊 Tracked rate button click:', vendor.name);
                } catch (error) {
                  console.error('Mixpanel tracking error:', error);
                }
              }
              
              try {
                await trackModalOpen('review', vendor.id);
                await trackVendorClick(vendor.id, vendor.name, vendor.category);
              } catch (error) {
                console.warn('Analytics tracking failed:', error);
              }
              if (isAuthenticated) {
                onRate(vendor);
              } else {
                setAccessGateType("rate");
                setAccessGateOpen(true);
              }
            }}
            className={`rounded-lg px-3 py-1.5 font-medium shrink-0 flex items-center gap-1.5 transition-colors duration-200 ${
              userReviews?.has(vendor.id) 
                ? "border-2 border-green-600 bg-green-50 text-green-700 hover:bg-green-100" 
                : "border-2 border-blue-600 bg-transparent text-blue-600 hover:bg-blue-50"
            }`}
          >
            <Star size={14} className={userReviews?.has(vendor.id) ? "fill-current text-green-600" : "text-blue-600"} />
            {userReviews?.has(vendor.id) ? "Rated!" : "Rate!"}
          </Button>
        </div>

        {/* Status Badges */}
        {(vendor.homes_serviced === 0 || userHomeVendors?.has(vendor.id)) && (
          <div className="flex gap-2 mb-4">
            {vendor.homes_serviced === 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                🆕 New Provider
              </Badge>
            )}
            {userHomeVendors?.has(vendor.id) && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✅ Your Provider
              </Badge>
            )}
          </div>
        )}


        {/* Reviews Section */}
        <div className="space-y-3">
          <NeighborReviewPreview 
            vendorId={vendor.id} 
            vendor={vendor}
            onOpenModal={() => {
              GATracking.trackModalOpen('reviews_modal', { 
                vendor_id: vendor.id,
                vendor_name: vendor.name 
              });
              if (isAuthenticated) {
                setIsReviewsModalOpen(true);
              } else {
                setAccessGateType("reviews");
                setAccessGateOpen(true);
              }
            }}
            onRate={() => {
              if (isAuthenticated) {
                onRate(vendor);
              } else {
                setAccessGateType("rate");
                setAccessGateOpen(true);
              }
            }}
            onSignUp={() => {
              setAccessGateType("reviews");
              setAccessGateOpen(true);
            }}
            communityName={communityName}
            isAuthenticated={isAuthenticated}
            communityPhotoUrl={communityPhotoUrl}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {/* Reviews Button */}
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              GATracking.trackModalOpen('reviews_modal', { 
                vendor_id: vendor.id,
                vendor_name: vendor.name 
              });
              if (isAuthenticated) {
                setIsReviewsModalOpen(true);
              } else {
                setAccessGateType("reviews");
                setAccessGateOpen(true);
              }
            }}
          >
            📝 Reviews ({vendor.hoa_rating_count || 0})
          </Button>

          {/* Costs Button */}
          <Button
            variant="outline"
            size="sm"
            className={`flex-1 text-xs ${
              userHasCosts 
                ? 'border-green-500 text-green-700 hover:bg-green-50' 
                : ''
            }`}
            onClick={() => {
              GATracking.trackModalOpen('cost_details_modal', { 
                vendor_id: vendor.id,
                vendor_name: vendor.name 
              });
              
              if (isAuthenticated) {
                setCostModalOpen(true);
              } else {
                setAccessGateType("costs");
                setAccessGateOpen(true);
              }
            }}
          >
            {userHasCosts && '✓ '}💰 {(() => {
              const costsWithAmounts = vendorCosts?.filter(c => 
                c.amount !== null && 
                c.amount !== undefined && 
                c.amount > 0
              ) || [];
              
              if (costsWithAmounts.length === 0) return 'Costs';
              
              const amounts = costsWithAmounts.map(c => c.amount);
              const minAmount = Math.min(...amounts);
              const maxAmount = Math.max(...amounts);
              
              return minAmount === maxAmount ? `$${minAmount}` : `$${minAmount}-${maxAmount}`;
            })()}
          </Button>

          {/* Contact Button */}
          {showContact && !contactRevealed && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleContactButtonClick}
            >
              📞 Contact
            </Button>
          )}

          {/* Revealed Contact Actions */}
          {showContact && contactRevealed && (
            <div className="flex-1 flex flex-col gap-1.5">
              {isContactInfoPending(vendor.contact_info) ? (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-2">
                  <p className="text-xs text-orange-800 font-medium mb-1">
                    Contact info coming soon!
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      trackContactAction('add_contact_clicked', vendor.id, vendor.name);
                      setContactRevealed(false);
                      setAddContactModalOpen(true);
                    }}
                    className="w-full text-xs mt-1"
                  >
                    📝 I have their info
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-xs font-medium text-center bg-blue-50 py-1 px-2 rounded">
                    {formatUSPhoneDisplay(vendor.contact_info)}
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCall}
                      className="flex-1 text-xs"
                    >
                      <Phone size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleText}
                      className="flex-1 text-xs"
                    >
                      <MessageSquare size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyNumber}
                      className="flex-1 text-xs"
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>

   {/* Reviews Modal - Only for authenticated users */}
    {isAuthenticated && (
      <Dialog open={isReviewsModalOpen} onOpenChange={setIsReviewsModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>{communityName || "Boca Bridges"}</DialogTitle>
          </DialogHeader>
          <MobileReviewsModal 
            open={true}
            onOpenChange={() => {}}
            vendor={vendor}
            onRate={() => onRate(vendor)}
            communityName={communityName}
          />
        </DialogContent>
      </Dialog>
    )}

    {/* Cost Details Modal - Only for authenticated users */}
    {isAuthenticated && (
      <Dialog open={costModalOpen} onOpenChange={setCostModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Cost Details</DialogTitle>
          </DialogHeader>
          <MobileCostsModal 
            vendorId={vendor.id}
            userHasCosts={userHasCosts}
            vendorCommunity={communityName}
            onEditCosts={() => {
              setCostModalOpen(false);
              setSelectedVendorForCostEdit({
                id: vendor.id,
                name: vendor.name,
                category: vendor.category
              });
              setCostManagementModalOpen(true);
              GATracking.trackModalOpen('edit_costs_modal', { 
                vendor_id: vendor.id,
                vendor_name: vendor.name,
                source: 'costs_modal'
              });
            }}
          />
        </DialogContent>
      </Dialog>
    )}

    {/* Google Reviews Modal */}
    <Dialog open={googleReviewsModalOpen} onOpenChange={setGoogleReviewsModalOpen}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Google Reviews</DialogTitle>
        </DialogHeader>
        <MobileGoogleReviewsModal 
          vendorId={vendor.id}
          googleReviewsJson={vendor.google_reviews_json}
          googlePlaceId={vendor.google_place_id}
        />
      </DialogContent>
    </Dialog>

    {/* Access Gate Modal */}
    <AccessGateModal
      open={accessGateOpen}
      onOpenChange={setAccessGateOpen}
      contentType={accessGateType}
      communityName={communityName || "Boca Bridges"}
      vendorName={vendor.name}
    />

    {/* Neighbors Modal - Only for authenticated users */}
    {isAuthenticated && (
      <NeighborsModal
        open={neighborsModalOpen}
        onOpenChange={setNeighborsModalOpen}
        vendorId={vendor.id}
        vendorName={vendor.name}
        homesServiced={vendor.homes_serviced}
        communityName={communityName}
      />
    )}

    {/* Add Contact Modal */}
    <AddContactModal
      open={addContactModalOpen}
      onOpenChange={setAddContactModalOpen}
      vendorId={vendor.id}
      vendorName={vendor.name}
      onSuccess={() => {
        window.location.reload();
      }}
    />

    {/* Cost Management Modal - For editing user's own costs */}
    {isAuthenticated && (
      <CostManagementModalWrapper
        open={costManagementModalOpen}
        onOpenChange={setCostManagementModalOpen}
        vendor={selectedVendorForCostEdit}
        onSuccess={() => {
          setCostManagementModalOpen(false);
          setSelectedVendorForCostEdit(null);
        }}
        isPreviewMode={false}
      />
    )}
  </>
  );
}