interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

export const trackAnalytics = async (event: string, properties?: Record<string, any>) => {
  try {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      },
    };

    // Send to your analytics endpoint
    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analyticsEvent),
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', analyticsEvent);
    }
  } catch (error) {
    console.error('Failed to track analytics:', error);
  }
}; 