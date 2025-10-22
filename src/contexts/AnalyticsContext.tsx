import { createContext, useContext, ReactNode } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface AnalyticsContextType {
  trackCategoryClick: (category: string) => Promise<void>;
  trackVendorClick: (vendorId: string, vendorName: string, category: string) => Promise<void>;
  trackModalOpen: (modalType: 'review' | 'cost', vendorId?: string) => Promise<void>;
  trackFilterChange: (filterType: string, filterValue: string) => Promise<void>;
  trackSignUpClick: () => Promise<void>;
  trackEmailSubmit: (email: string) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { trackEvent } = useAnalytics();

  const trackCategoryClick = async (category: string) => {
    await trackEvent({
      eventType: 'button_click',
      eventName: 'category_selected',
      category: category,
      metadata: { 
        timestamp: new Date().toISOString(),
        page: window.location.pathname 
      }
    });
    
    // Also track in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'category_change', {
        to_category: category,
        page_path: window.location.pathname
      });
    }
    
    console.log('📊 Tracked category click:', category);
  };

  const trackVendorClick = async (vendorId: string, vendorName: string, category: string) => {
    await trackEvent({
      eventType: 'button_click',
      eventName: 'vendor_clicked',
      vendorId: vendorId,
      category: category,
      metadata: { 
        vendor_name: vendorName,
        timestamp: new Date().toISOString() 
      }
    });
    
    // Also track in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'vendor_click', {
        vendor_id: vendorId,
        vendor_name: vendorName,
        vendor_category: category,
        page_path: window.location.pathname
      });
    }
    
    console.log('📊 Tracked vendor click:', vendorName);
  };

  const trackModalOpen = async (modalType: 'review' | 'cost', vendorId?: string) => {
    await trackEvent({
      eventType: 'modal_open',
      eventName: `${modalType}_modal_opened`,
      vendorId: vendorId,
      metadata: { 
        modal_type: modalType,
        timestamp: new Date().toISOString() 
      }
    });
    
    // Also track in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'modal_open', {
        modal_type: modalType,
        vendor_id: vendorId,
        page_path: window.location.pathname
      });
    }
    
    console.log('📊 Tracked modal open:', modalType);
  };

  const trackFilterChange = async (filterType: string, filterValue: string) => {
    await trackEvent({
      eventType: 'button_click',
      eventName: 'filter_changed',
      metadata: { 
        filter_type: filterType,
        filter_value: filterValue,
        timestamp: new Date().toISOString() 
      }
    });
    
    console.log('📊 Tracked filter change:', filterType, filterValue);
  };

  const trackSignUpClick = async () => {
    await trackEvent({
      eventType: 'button_click',
      eventName: 'sign_up_clicked',
      metadata: {
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      }
    });
    
    // Also track in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'sign_up_started', {
        method: 'magic_link',
        page_path: window.location.pathname
      });
    }
    
    console.log('📊 Tracked sign-up click');
  };

  const trackEmailSubmit = async (email: string) => {
    const emailDomain = email.split('@')[1] || 'unknown';
    
    await trackEvent({
      eventType: 'form_submit',
      eventName: 'sign_up_email_submitted',
      metadata: {
        email_domain: emailDomain,
        timestamp: new Date().toISOString()
      }
    });
    
    // Also track in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'form_submit', {
        form_type: 'sign_up',
        page_path: window.location.pathname
      });
    }
    
    console.log('📊 Tracked email submission');
  };

  return (
    <AnalyticsContext.Provider
      value={{
        trackCategoryClick,
        trackVendorClick,
        trackModalOpen,
        trackFilterChange,
        trackSignUpClick,
        trackEmailSubmit,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsTracking() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsTracking must be used within an AnalyticsProvider');
  }
  return context;
}
