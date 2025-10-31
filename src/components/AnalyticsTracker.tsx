import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';

export function AnalyticsTracker() {
  const location = useLocation();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    // Track for internal analytics (Supabase)
    trackPageView(location.pathname);

    // Track for Mixpanel with descriptive names
    if (typeof window !== 'undefined' && window.mixpanel) {
      try {
        const path = location.pathname;
        const searchParams = new URLSearchParams(location.search);
        let pageName = 'Unknown Page';
        
        // Map routes to descriptive page names
        if (path === '/') {
          pageName = 'Home';
        } else if (path.includes('/communities/boca-bridges')) {
          pageName = 'Boca Bridges Community';
        } else if (path.includes('/communities/the-bridges')) {
          pageName = 'The Bridges Community';
        } else if (path.includes('/communities/')) {
          // Generic community page
          const communitySlug = path.split('/communities/')[1]?.split('/')[0];
          pageName = `Community: ${communitySlug}`;
        } else if (path === '/auth' || path === '/signin') {
          pageName = 'Sign In/Up';
        } else if (path === '/complete-profile') {
          pageName = 'Complete Profile';
        } else if (path.includes('/admin/users')) {
          pageName = 'Admin: Users';
        } else if (path.includes('/admin/vendors')) {
          pageName = 'Admin: Vendors';
        } else if (path.includes('/admin/analytics')) {
          pageName = 'Admin: Analytics';
        } else if (path.includes('/admin')) {
          pageName = 'Admin Dashboard';
        } else if (path === '/points' || path === '/neighborhood-cred') {
          pageName = 'Points Dashboard';
        } else if (path === '/profile') {
          pageName = 'User Profile';
        } else if (path === '/settings') {
          pageName = 'Settings';
        } else if (path === '/submit' || path === '/submit-vendor' || path.includes('/submit')) {
          pageName = 'Submit Vendor';
        } else if (path === '/contact') {
          pageName = 'Contact Us';
        } else if (path === '/privacy') {
          pageName = 'Privacy Policy';
        } else if (path === '/terms') {
          pageName = 'Terms of Service';
        }
        
        // Capture welcome flag if present
        const isWelcome = searchParams.get('welcome') === 'true';
        
        window.mixpanel.track(`Page Viewed: ${pageName}`, {
          page_path: path,
          page_url: window.location.href,
          is_welcome_flow: isWelcome,
          referrer: document.referrer || 'direct'
        });
        
        console.log('📊 Mixpanel page view tracked:', pageName);
      } catch (error) {
        console.error('Mixpanel page tracking error:', error);
      }
    }
  }, [location.pathname, location.search, trackPageView]);

  return null;
}