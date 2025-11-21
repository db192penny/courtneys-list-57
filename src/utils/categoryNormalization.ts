/**
 * Normalizes category names from CSV uploads to ensure consistent storage
 * Handles variations like "Carpet Cleaning" → "Carpet/Upholstery Cleaning"
 */

import { CATEGORIES, Category } from '@/data/categories';

export interface NormalizedCategory {
  displayName: string;
  isValid: boolean;
}

/**
 * Normalize a category name input to standard format
 * @param input - Raw category name from CSV (e.g., "Carpet Cleaning", "Mobile Car Wash")
 * @returns Normalized category with displayName and validity flag
 */
export function normalizeCategoryName(input: string | null | undefined): NormalizedCategory {
  // Return invalid if no input
  if (!input || !input.trim()) {
    return {
      displayName: input?.trim() || '',
      isValid: false
    };
  }

  // Clean and standardize the input
  const cleaned = input.trim();

  // Direct match check (case-insensitive)
  const directMatch = CATEGORIES.find(cat => 
    cat.toLowerCase() === cleaned.toLowerCase()
  );
  
  if (directMatch) {
    return {
      displayName: directMatch,
      isValid: true
    };
  }

  // Handle common survey variations
  const variations: Record<string, string> = {
    // Carpet variations
    'carpet cleaning': 'Carpet/Upholstery Cleaning',
    'carpet': 'Carpet/Upholstery Cleaning',
    
    // Car wash variations
    'mobile car wash': 'Car Wash & Detail',
    'car wash': 'Car Wash & Detail',
    'mobile wash': 'Car Wash & Detail',
    
    // Damage/Restoration variations
    'damage assessment / restoration': 'Damage Assessment/Restoration',
    'damage assessment': 'Damage Assessment/Restoration',
    'restoration': 'Damage Assessment/Restoration',
    
    // Generator variations
    'generator companies': 'Generator',
    'generator company': 'Generator',
    'generators': 'Generator',
    
    // Home Theater variations
    'home theater / av': 'Home Theater & AV',
    'home theater': 'Home Theater & AV',
    'av': 'Home Theater & AV',
    
    // Catering variations
    'caterers': 'Catering',
    'caterer': 'Catering',
    
    // Painter variations
    'painter': 'Painters',
    'painting': 'Painters',
    
    // Moving variations
    'movers': 'Moving Company',
    'moving': 'Moving Company',
    
    // Power washing variations
    'power wash': 'Power Washing',
    'powerwashing': 'Power Washing',
    'pressure washing': 'Power Washing',
    
    // Grill variations
    'grill': 'Grill Cleaning',
    'grill clean': 'Grill Cleaning',
  };

  // Check variations (case-insensitive)
  const lowerCleaned = cleaned.toLowerCase();
  if (variations[lowerCleaned]) {
    return {
      displayName: variations[lowerCleaned],
      isValid: true
    };
  }

  // If no match found, return input as-is but mark as invalid
  return {
    displayName: cleaned,
    isValid: false
  };
}
