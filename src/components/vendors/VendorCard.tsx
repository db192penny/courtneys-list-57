import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsHoaAdmin } from "@/hooks/useIsHoaAdmin";
import { useState } from "react";

type Vendor = {
  id: string;
  name: string;
  category: string;
  contact_info: string | null;
  typical_cost: number | null;
  community: string | null;
  homes_serviced?: number;
};

function VendorCard({ vendor, isVerified }: { vendor: Vendor; isVerified: boolean }) {
  const navigate = useNavigate();
  const { data: isAdmin } = useIsAdmin();
  const { data: isHoaAdmin } = useIsHoaAdmin();
  const [contactRevealed, setContactRevealed] = useState(false);

  const canEdit = isAdmin || isHoaAdmin;

  const handleRevealContact = () => {
    if (typeof window !== 'undefined' && window.mixpanel) {
      try {
        window.mixpanel.track(`Clicked Contact Button: ${vendor.name}`, {
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          category: vendor.category,
        });
        
        window.mixpanel.people.increment('total_contact_clicks', 1);
        window.mixpanel.people.set({
          'last_contact_date': new Date().toISOString(),
        });
        
        console.log('📊 Tracked contact button click:', vendor.name);
      } catch (error) {
        console.error('Mixpanel tracking error:', error);
      }
    }
    setContactRevealed(true);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg break-words">{vendor.name}</h3>
            <Badge variant="outline" className="mt-1">
              {vendor.category}
            </Badge>
          </div>
          {vendor.homes_serviced === 0 && (
            <Badge variant="secondary" className="ml-2">New</Badge>
          )}
        </div>

        {isVerified && !contactRevealed && vendor.contact_info && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevealContact}
            className="mt-2 w-full"
          >
            📞 Show Contact Info
          </Button>
        )}

        {isVerified && contactRevealed && vendor.contact_info && (
          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm font-medium text-center">
              {vendor.contact_info}
            </p>
          </div>
        )}

        {!isVerified && (
          <p className="text-sm text-muted-foreground mt-2">
            Contact: [Hidden – Sign in to view]
          </p>
        )}

        {vendor.typical_cost && (
          <p className="text-sm mt-1">
            Typical Cost: <span className="font-medium">${vendor.typical_cost}</span>
          </p>
        )}
      </CardContent>

      {canEdit && (
        <CardFooter className="p-4 pt-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/admin/vendors/edit?vendor_id=${vendor.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default VendorCard;
