import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getCommunityDisplayName } from '@/utils/communityNames';

const DynamicMetaTags = () => {
  const location = useLocation();
  
  // Extract community slug from path (e.g., /boca-bridges or /communities/boca-bridges)
  const pathParts = location.pathname.split('/').filter(Boolean);
  let communitySlug: string | null = null;
  
  // Check if path includes a community slug
  if (pathParts.length > 0) {
    const lastPart = pathParts[pathParts.length - 1];
    // Check if it's a community slug (not a generic page like 'auth', 'admin', etc.)
    if (!['auth', 'admin', 'dashboard', 'profile', 'settings', 'contact', 'privacy', 'terms'].includes(lastPart)) {
      communitySlug = lastPart;
    }
  }
  
  const communityName = getCommunityDisplayName(communitySlug);
  const title = `Trusted ${communityName} Service Provider Directory`;
  const description = `${communityName}'s trusted service provider directory - Real reviews from real neighbors`;
  
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

export default DynamicMetaTags;
