'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { trackAnalytics } from '@/lib/analytics';
import Image from 'next/image';

interface AppBadgeProps {
  type: 'appstore' | 'playstore';
  theme?: 'clean' | 'luxe' | 'night' | 'dark' | 'neon';
  className?: string;
  onClick?: () => void;
}

const badgeStyles = {
  clean: {
    container: 'p-2 rounded-lg border backdrop-blur-sm transition-all duration-300',
    badge: 'relative',
    glow: 'hover:shadow-lg',
    border: 'border-gray-200'
  },
  luxe: {
    container: 'p-2 rounded-lg border backdrop-blur-sm transition-all duration-300',
    badge: 'relative',
    glow: 'hover:shadow-lg hover:shadow-gray-500/20',
    border: 'border-gray-400/20'
  },
  night: {
    container: 'p-2 rounded-lg border backdrop-blur-sm transition-all duration-300',
    badge: 'relative',
    glow: 'hover:shadow-lg hover:shadow-blue-500/20',
    border: 'border-gray-700'
  },
  dark: {
    container: 'p-2 rounded-lg border backdrop-blur-sm transition-all duration-300',
    badge: 'relative',
    glow: 'hover:shadow-lg hover:shadow-blue-500/20',
    border: 'border-gray-700'
  },
  neon: {
    container: 'p-2 rounded-lg border backdrop-blur-sm transition-all duration-300',
    badge: 'relative',
    glow: 'hover:shadow-lg hover:shadow-pink-500/30',
    border: 'border-pink-500/30'
  }
};

export const AppBadge: React.FC<AppBadgeProps> = ({ type, theme = 'clean', className = '', onClick }) => {
  const currentStyle = badgeStyles[theme];
  const storeUrl = type === 'appstore' 
    ? 'https://apps.apple.com/app/your-app-id'
    : 'https://play.google.com/store/apps/details?id=your.app.id';

  const handleClick = () => {
    trackAnalytics(`${type}_click`, {
      source: 'badge',
      theme,
      timestamp: new Date().toISOString(),
    });
    if (onClick) onClick();
  };

  return (
    <a 
      href={storeUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`inline-block ${currentStyle.container} ${className}`}
    >
      <div className={currentStyle.badge}>
        {type === 'appstore' ? (
          <Image
            src="/images/app-store-badge.png"
            alt="Download on the App Store"
            width={120}
            height={40}
            className="h-10 w-auto"
            sizes="120px"
            priority
          />
        ) : (
          <Image
            src="/images/google-play-badge.png"
            alt="GET IT ON Google Play"
            width={120}
            height={40}
            className="h-10 w-auto"
            sizes="120px"
            priority
          />
        )}
      </div>
    </a>
  );
}; 