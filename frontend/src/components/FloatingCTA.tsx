'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AppBadge } from './AppBadge';
import { trackAnalytics } from '@/lib/analytics';

interface FloatingCTAProps {
  theme?: 'clean' | 'luxe' | 'night';
}

export const FloatingCTA: React.FC<FloatingCTAProps> = ({ theme = 'clean' }) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setScrollDepth(scrollPercent);
      
      // Show CTA after 25% scroll depth
      if (scrollPercent > 25 && !isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    trackAnalytics('cta_dismiss', {
      scrollDepth,
      timeOnPage: new Date().toISOString(),
    });
  };

  const handleInteraction = (type: string) => {
    trackAnalytics('cta_interaction', {
      type,
      scrollDepth,
      timeOnPage: new Date().toISOString(),
      theme,
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className={`p-4 rounded-xl backdrop-blur-sm border ${
            theme === 'clean' ? 'bg-white/10 border-white/20' :
            theme === 'luxe' ? 'bg-purple-900/30 border-purple-400/20' :
            'bg-gray-900/30 border-gray-400/20'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <h3 className={`text-lg font-semibold ${
                  theme === 'clean' ? 'text-white' :
                  theme === 'luxe' ? 'text-purple-200' :
                  'text-gray-200'
                }`}>
                  {t('downloadApp.floatingTitle')}
                </h3>
                <p className={`text-sm ${
                  theme === 'clean' ? 'text-white/80' :
                  theme === 'luxe' ? 'text-purple-300/80' :
                  'text-gray-300/80'
                }`}>
                  {t('downloadApp.floatingSubtitle')}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <AppBadge type="appstore" theme={theme} onClick={() => handleInteraction('appstore')} />
                <AppBadge type="playstore" theme={theme} onClick={() => handleInteraction('playstore')} />
              </div>

              <button
                onClick={handleDismiss}
                className={`p-2 rounded-lg hover:bg-opacity-20 transition-colors ${
                  theme === 'clean' ? 'text-white hover:bg-white' :
                  theme === 'luxe' ? 'text-purple-200 hover:bg-purple-400' :
                  'text-gray-200 hover:bg-gray-400'
                }`}
                aria-label={t('common.dismiss')}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 