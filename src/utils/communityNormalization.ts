/**
 * Normalizes community names from CSV uploads to ensure consistent storage
 * Handles variations like "oaks" → "The Oaks", "woodfield" → "Woodfield Country Club"
 */

import { communityNames } from './communityNames';

export interface NormalizedCommunity {
  displayName: string;
  slug: string;
  isValid: boolean;
}

/**
 * Normalize a community name input to standard format
 * @param input - Raw community name from CSV (e.g., "oaks", "the-bridges", "Woodfield")
 * @returns Normalized community with displayName, slug, and validity flag
 */
export function normalizeCommunityName(input: string | null | undefined): NormalizedCommunity {
  // Default to The Bridges if no input
  if (!input || !input.trim()) {
    return {
      displayName: 'The Bridges',
      slug: 'the-bridges',
      isValid: true
    };
  }

  // Clean and lowercase the input
  const cleaned = input.toLowerCase().trim();

  // Direct slug matches (e.g., "boca-bridges", "the-oaks")
  if (communityNames[cleaned]) {
    return {
      displayName: communityNames[cleaned],
      slug: cleaned,
      isValid: true
    };
  }

  // Handle common variations and partial matches
  const variations: Record<string, { displayName: string, slug: string }> = {
    // Bridges variations
    'bridges': { displayName: 'The Bridges', slug: 'the-bridges' },
    'the bridges': { displayName: 'The Bridges', slug: 'the-bridges' },
    'boca bridges': { displayName: 'Boca Bridges', slug: 'boca-bridges' },
    
    // Oaks variations
    'oaks': { displayName: 'The Oaks', slug: 'the-oaks' },
    'the oaks': { displayName: 'The Oaks', slug: 'the-oaks' },
    
    // Woodfield variations
    'woodfield': { displayName: 'Woodfield Country Club', slug: 'woodfield-country-club' },
    'woodfield cc': { displayName: 'Woodfield Country Club', slug: 'woodfield-country-club' },
    'woodfield country club': { displayName: 'Woodfield Country Club', slug: 'woodfield-country-club' },
  };

  // Check variations
  if (variations[cleaned]) {
    return {
      ...variations[cleaned],
      isValid: true
    };
  }

  // Partial match check (e.g., "wood" could match "woodfield")
  const partialMatch = Object.entries(variations).find(([key]) => 
    key.includes(cleaned) || cleaned.includes(key)
  );

  if (partialMatch) {
    return {
      ...partialMatch[1],
      isValid: true
    };
  }

  // If no match found, return input as-is but mark as invalid
  return {
    displayName: input.trim(),
    slug: input.toLowerCase().trim().replace(/\s+/g, '-'),
    isValid: false
  };
}
