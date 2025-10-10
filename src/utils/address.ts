
export const extractStreetName = (fullAddress: string) => {
  if (!fullAddress) return '';
  // Take first segment before the first comma, strip leading numbers, apartment/unit markers
  const firstSegment = fullAddress.split(',')[0] || fullAddress;
  // Remove leading numbers and extra spaces (e.g., "1234 N Main St" -> "N Main St")
  const noNumber = firstSegment.replace(/^\s*\d+[\s-]*/, '').trim();
  // Remove unit markers like "Apt 5", "#12" if present at the end
  const cleaned = noNumber.replace(/\b(apt|apartment|unit|#)\s*\w+$/i, '').trim();
  return cleaned || firstSegment.trim();
};

export const capitalizeStreetName = (streetName: string) => {
  if (!streetName || !streetName.trim()) return '';
  
  // Words that should stay lowercase (except if they're the first word)
  const smallWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in']);
  
  return streetName
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Always capitalize first word, or if it's not a small word
      if (index === 0 || !smallWords.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      // Keep small words lowercase
      return word;
    })
    .join(' ');
};

export const isInBocaBridges = (fullAddress: string) => {
  if (!fullAddress) return false;
  const hay = fullAddress.toLowerCase();
  // Simple MVP check: contains "boca bridges" anywhere
  return hay.includes('boca bridges');
};
