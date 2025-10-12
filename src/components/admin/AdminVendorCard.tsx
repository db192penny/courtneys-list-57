import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Phone, Star, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { formatUSPhoneDisplay } from "@/utils/phone";

interface Vendor {
  id: string;
  name: string;
  category: string;
  contact_info: string;
  community: string;
  google_place_id: string | null;
  google_rating: number | null;
  google_rating_count: number | null;
  created_at: string;
}

interface AdminVendorCardProps {
  vendor: Vendor;
  onEdit: () => void;
  onDelete: () => void;
}

export function AdminVendorCard({ vendor, onEdit, onDelete }: AdminVendorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-base break-words">
                  {vendor.name}
                </h3>
                {vendor.google_place_id && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Google
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Badge variant="outline" className="w-fit">{vendor.category}</Badge>
                <span className="text-sm text-muted-foreground">{vendor.community}</span>
              </div>
            </div>
            
            {/* Google Rating */}
            {vendor.google_rating && (
              <div className="flex-shrink-0">
                <div className="flex flex-col items-center justify-center bg-amber-50 dark:bg-amber-950 rounded-lg px-3 py-2 min-w-[60px]">
                  <Star className="h-4 w-4 text-amber-500 mb-1 fill-amber-500" />
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{vendor.google_rating}</span>
                  <span className="text-[10px] text-muted-foreground">({vendor.google_rating_count})</span>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Details */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full">
              <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              <span>{isExpanded ? 'Hide' : 'Show'} Details</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{formatUSPhoneDisplay(vendor.contact_info)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Added {new Date(vendor.created_at).toLocaleDateString()}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="w-full"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="w-full text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
