'use client';

import posthog from 'posthog-js';
import { PostHogProvider as Provider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

      if (!apiKey) {
        console.warn('PostHog API key is not set. Analytics will not be collected.');
        return;
      }

      try {
        posthog.init(apiKey, {
          api_host: apiHost,
          loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
              posthog.debug();
            }
          },
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: true,
          disable_session_recording: true,
          debug: process.env.NODE_ENV === 'development',
        });
      } catch (error) {
        console.error('Failed to initialize PostHog:', error);
      }
    }
  }, []);

  return <Provider client={posthog}>{children}</Provider>;
} 