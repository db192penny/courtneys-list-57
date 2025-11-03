import { ChevronDown, Users, Building2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { publicCommunities, communityNames } from "@/utils/communityNames";

interface MobileCompactBarProps {
  communityName: string;
  photoUrl: string;
  vendorCount?: number;
  activeUsers?: number;
}

export function MobileCompactBar({
  communityName,
  photoUrl,
  vendorCount = 0,
  activeUsers = 0,
}: MobileCompactBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleCommunityChange = (slug: string) => {
    const searchParams = new URLSearchParams(location.search);
    const category = searchParams.get('category');
    const categoryParam = category ? `?category=${encodeURIComponent(category)}` : '';
    navigate(`/communities/${slug}${categoryParam}`);
    localStorage.setItem('selected_community', communityNames[slug] || slug);
  };

  return (
    <div className="bg-background/95 backdrop-blur-md border-b border-border shadow-sm py-2.5 px-4">
      <div className="flex items-center justify-between gap-3">
        {/* Community Switcher with Photo */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors min-w-0 border border-border/50">
              <img
                src={photoUrl}
                alt={communityName}
                className="w-7 h-7 rounded-full object-cover border border-border flex-shrink-0"
              />
              <span className="text-sm font-bold text-foreground truncate">
                {communityName}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh]">
            <SheetHeader>
              <SheetTitle>Switch Community</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-2">
              {Object.keys(publicCommunities).map((slug) => (
                <Button
                  key={slug}
                  variant={slug === location.pathname.split('/').pop()?.split('?')[0] ? "default" : "outline"}
                  className="w-full justify-start text-left"
                  onClick={() => handleCommunityChange(slug)}
                >
                  {communityNames[slug] || slug}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {vendorCount > 0 && (
            <div className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span className="font-medium">{vendorCount}</span>
            </div>
          )}
          {activeUsers > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium">{activeUsers}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
