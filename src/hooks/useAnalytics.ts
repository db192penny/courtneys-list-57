import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';

// Global session tracker - prevents duplicate sessions across all component instances
let GLOBAL_SESSION_ID: string | null = null;
let GLOBAL_USER_ID: string | null = null;
let SESSION_START_TIME: number | null = null;
let SESSION_CREATION_PROMISE: Promise<void> | null = null; // Async mutex for session creation

interface AnalyticsSession {
  id: string;
  sessionToken: string;
  startTime: Date;
}

interface TrackEventOptions {
  eventType: 'page_view' | 'button_click' | 'form_submit' | 'modal_open' | 'modal_close';
  eventName: string;
  elementId?: string;
  elementText?: string;
  vendorId?: string;
  category?: string;
  metadata?: Record<string, any>;
}

export function useAnalytics() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(); // Phase 2: Check if user is admin
  const [session, setSession] = useState<AnalyticsSession | null>(null);
  const startTimeRef = useRef<Date>(new Date());
  const lastPageRef = useRef<string>('');

  // Generate session token
  const generateSessionToken = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Detect device info
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    let deviceType = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    // Device detection
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(userAgent)) {
      deviceType = /iPad/i.test(userAgent) ? 'Tablet' : 'Mobile';
    }

    // Browser detection
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // OS detection
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return { deviceType, browser, os };
  };

  // Get community from current path
  const getCommunity = () => {
    const path = window.location.pathname;
    if (path.includes('/communities/')) {
      const segments = path.split('/');
      const communityIndex = segments.indexOf('communities');
      return segments[communityIndex + 1] || null;
    }
    return null;
  };

  // Initialize session
  const initializeSession = async () => {
    console.log('Session tracking disabled');
    return;
  };

  // Track event
  const trackEvent = async (options: TrackEventOptions) => {
    if (!session) return;

    const { deviceType } = getDeviceInfo();
    const community = getCommunity();

    try {
      await supabase
        .from('user_analytics')
        .insert({
          session_id: session.id,
          user_id: user?.id || null,
          event_type: options.eventType,
          event_name: options.eventName,
          page_path: window.location.pathname,
          element_id: options.elementId,
          element_text: options.elementText,
          vendor_id: options.vendorId,
          category: options.category,
          community: community,
          device_type: deviceType,
          metadata: options.metadata
        });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  // Track page view
  const trackPageView = async (pagePath?: string) => {
    const currentPage = pagePath || window.location.pathname;
    
    if (currentPage !== lastPageRef.current) {
      lastPageRef.current = currentPage;
      
      await trackEvent({
        eventType: 'page_view',
        eventName: 'page_navigation',
        metadata: { 
          previousPage: lastPageRef.current,
          timestamp: Date.now()
        }
      });
    }
  };

  // End session
  const endSession = async () => {
    if (!session) return;
    
    // Only end if this is the current global session
    if (GLOBAL_SESSION_ID !== session.id) {
      console.log('Skipping session end - not the active session');
      return;
    }

    const duration = Math.floor((Date.now() - session.startTime.getTime()) / 1000);

    try {
      await supabase
        .from('user_sessions')
        .update({
          session_end: new Date().toISOString(),
          duration_seconds: duration
        })
        .eq('id', session.id);
      
      // Clear global session data
      GLOBAL_SESSION_ID = null;
      GLOBAL_USER_ID = null;
      SESSION_START_TIME = null;
      localStorage.removeItem('analytics_active_session');
      
      console.log('Analytics session ended:', session.sessionToken);
    } catch (error) {
      console.warn('Session end tracking failed:', error);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeSession();

    // Track page changes
    const handlePopState = () => {
      trackPageView();
    };

    window.addEventListener('popstate', handlePopState);

    // End session ONLY on browser close (not on component unmount/navigation)
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // DO NOT call endSession() here - causes session spam on navigation
    };
  }, [user?.id, isAdmin.data]); // Phase 3: Only re-run when user ID or actual admin status changes

  return {
    trackEvent,
    trackPageView,
    session
  };
}