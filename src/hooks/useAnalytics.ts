import { useCallback } from 'react';

declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'js',
      action: string,
      params?: Record<string, any>
    ) => void;
  }
}

export const useAnalytics = () => {
  const trackEvent = useCallback((category: string, action: string, label?: string) => {
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
      });
    }
  }, []);

  const trackPageView = useCallback((path: string) => {
    if (window.gtag) {
      window.gtag('config', 'G-1K71PF07LN', {
        page_path: path,
      });
    }
  }, []);

  return {
    trackEvent,
    trackPageView,
  };
};