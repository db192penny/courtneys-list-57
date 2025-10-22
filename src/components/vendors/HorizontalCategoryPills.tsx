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
      <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2 block">
        Choose Category
      </label>
      
      <Select value={selectedCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger className={`${isMobile ? "w-full h-11 text-left text-sm" : "w-full h-12 text-left"} ${isBannerVisible ? "ring-2 ring-ring ring-offset-2" : ""}`}>
          <SelectValue>
            <span className="flex items-center gap-2">
              {getDisplayValue()}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className={isMobile ? "max-h-[60vh]" : "max-h-[70vh]"}>
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
                className={isMobile ? "h-10 cursor-pointer" : "h-11 cursor-pointer"}
              >
                <span className="flex items-center gap-2">
                  <span className={isMobile ? "text-base" : "text-lg"}>{emoji}</span>
                  <span className={isMobile ? "text-sm" : "text-base"}>{displayName}</span>
                </span>
              </SelectItem>
            );
          })}
          <SelectSeparator />
          <SelectItem 
            value="__suggest__" 
            className={`
              text-primary font-medium
              ${isMobile ? 'min-h-[48px] text-base' : 'min-h-[36px]'}
            `}
          >
            <div className="flex items-center gap-2">
              <span>💡</span>
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
