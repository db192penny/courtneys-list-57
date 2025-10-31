import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectScrollUpButton, SelectScrollDownButton, SelectSeparator } from "@/components/ui/select";
import { getCategoryEmoji } from "@/utils/categoryEmojis";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronUp, ChevronDown } from "lucide-react";
import CategorySuggestionModal from "@/components/CategorySuggestionModal";

interface HorizontalCategoryPillsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  isBannerVisible?: boolean;
}

export const HorizontalCategoryPills: React.FC<HorizontalCategoryPillsProps> = ({
  selectedCategory,
  onCategoryChange,
  categories,
  isBannerVisible = false
}) => {
  const isMobile = useIsMobile();
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  
  const handleCategoryChange = (val: string) => {
    if (val === "__suggest__") {
      setShowSuggestionModal(true);
    } else {
      // Track category selection in Mixpanel
      if (typeof window !== 'undefined' && window.mixpanel) {
        try {
          window.mixpanel.track('Category Selected', {
            from_category: selectedCategory,
            to_category: val,
          });
          console.log('📊 Tracked category selection:', val);
        } catch (error) {
          console.error('Mixpanel tracking error:', error);
        }
      }
      onCategoryChange(val);
    }
  };
  
  // Create sorted categories with "all" first
  const sortedCategories = [
    "all",
    ...categories.sort()
  ];

  const getDisplayValue = () => {
    if (selectedCategory === "all") {
      return `${getCategoryEmoji("all")} All Categories`;
    }
    return `${getCategoryEmoji(selectedCategory)} ${selectedCategory}`;
  };

  return (
    <div>
      <label className={`${isMobile ? "text-sm font-semibold" : "text-xs font-medium"} text-foreground uppercase tracking-wide mb-2 block`}>
        Choose Category
      </label>
      
      <Select value={selectedCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger className={`w-full ${isMobile ? "h-14 text-base" : "h-12"} text-left font-medium border-2 border-primary/40 shadow-md bg-primary/5 hover:bg-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20 ${isBannerVisible ? "ring-2 ring-ring ring-offset-2" : ""}`}>
          <SelectValue>
            <span className={`flex items-center ${isMobile ? "gap-3" : "gap-2"}`}>
              {getDisplayValue()}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className={isMobile ? "max-h-[60vh] py-2" : "max-h-[70vh]"}>
          <SelectScrollUpButton>
            <ChevronUp className="h-4 w-4" />
          </SelectScrollUpButton>
          {sortedCategories.map((category) => {
            const displayName = category === 'all' ? 'All Categories' : category;
            const emoji = getCategoryEmoji(category);
            
            return (
              <SelectItem 
                key={category} 
                value={category} 
                className={isMobile ? "h-14 cursor-pointer py-3" : "h-11 cursor-pointer"}
              >
                <span className={`flex items-center ${isMobile ? "gap-3" : "gap-2"}`}>
                  <span className={isMobile ? "text-xl" : "text-lg"}>{emoji}</span>
                  <span className={isMobile ? "text-base font-medium" : "text-base"}>{displayName}</span>
                </span>
              </SelectItem>
            );
          })}
          <SelectSeparator />
          <SelectItem 
            value="__suggest__" 
            className={`
              text-primary font-medium
              ${isMobile ? 'h-14 py-3 text-base' : 'min-h-[36px]'}
            `}
          >
            <div className={`flex items-center ${isMobile ? "gap-3" : "gap-2"}`}>
              <span className={isMobile ? "text-xl" : "text-base"}>💡</span>
              <span>{isMobile ? "Suggest a category" : "Can't find your category? Suggest one"}</span>
            </div>
          </SelectItem>
          <SelectScrollDownButton>
            <ChevronDown className="h-4 w-4" />
          </SelectScrollDownButton>
        </SelectContent>
      </Select>
      
      <CategorySuggestionModal 
        open={showSuggestionModal} 
        onOpenChange={setShowSuggestionModal} 
      />
    </div>
  );
};
