/**
 * Maps URL slugs to display names for communities
 */
export const communityNames: Record<string, string> = {
  'boca-bridges': 'Boca Bridges',
  'the-bridges': 'The Bridges',
  'bridges': 'The Bridges',
  'the-oaks': 'The Oaks',
  'oaks': 'The Oaks',
  'woodfield-country-club': 'Woodfield Country Club',
  'woodfield': 'Woodfield Country Club',
};

/**
 * Public-facing communities (shown in dropdown)
 * Only add communities here when ready to launch publicly
 */
export const publicCommunities: Record<string, string> = {
  'boca-bridges': 'Boca Bridges',
  'the-bridges': 'The Bridges',
  // 'the-oaks' is NOT here - hidden from public
};

/**
 * Get display name for a community slug
 * @param slug - URL slug (e.g., 'boca-bridges')
 * @returns Display name (e.g., 'Boca Bridges')
 */
export function getCommunityDisplayName(slug: string | null | undefined): string {
  if (!slug) return 'Boca Bridges'; // Default when no slug
  return communityNames[slug] || 'Boca Bridges'; // Fallback to default
}
