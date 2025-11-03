import { ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/data/categories";
import { getCategoryEmoji } from "@/utils/categoryEmojis";
import { useNavigate, useLocation } from "react-router-dom";
import { publicCommunities, communityNames } from "@/utils/communityNames";

interface MobileCompactBarProps {
  communityName: string;
  photoUrl: string;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function MobileCompactBar({
  communityName,
  photoUrl,
  selectedCategory,
  onCategoryChange,
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
    <div className="bg-background/95 backdrop-blur-md border-b border-border shadow-sm py-3 px-4">
      <div className="flex items-center gap-3">
        {/* Community Switcher - Enhanced & Prominent */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors flex-1 min-w-0 border border-border/50">
              <img
                src={photoUrl}
                alt={communityName}
                className="w-7 h-7 rounded-full object-cover border border-border flex-shrink-0"
              />
              <span className="text-sm font-bold text-foreground flex-1 text-left">
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

        {/* Category Selector - Enhanced */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-10 text-sm flex-1 min-w-0">
            <SelectValue>
              <span className="truncate">
                {selectedCategory === "all" ? "All Categories" : `${getCategoryEmoji(selectedCategory)} ${selectedCategory}`}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {getCategoryEmoji(cat)} {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
