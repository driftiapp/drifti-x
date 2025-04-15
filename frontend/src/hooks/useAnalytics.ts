import posthog from 'posthog-js';

// Add type declaration for gtag
declare global {
  interface Window {
    gtag: (command: string, eventName: string, eventParams?: Record<string, any>) => void;
  }
}

interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  properties?: Record<string, any>;
}

export const useAnalytics = () => {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.capture(eventName, properties);
    }
  };

  const identifyUser = (userId: string, traits?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, traits);
    }
  };

  const trackPageView = (path: string) => {
    if (typeof window !== 'undefined') {
      posthog.capture('$pageview', {
        $current_url: window.location.origin + path,
      });
    }
  };

  const trackPerformance = (metric: PerformanceMetric) => {
    if (typeof window === 'undefined') return;
    
    // Here you would typically send the performance metric to your analytics service
    console.log('Performance Metric:', metric);
    
    // Example: Using Google Analytics
    if (window.gtag) {
      window.gtag('event', 'performance', {
        name: metric.name,
        value: metric.value,
        ...metric.properties
      });
    }
  };

  return {
    trackEvent,
    identifyUser,
    trackPageView,
    trackPerformance
  };
}; 