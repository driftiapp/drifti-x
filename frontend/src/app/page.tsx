import React from 'react';
import HeroSection from '@/components/HeroSection';
import ServiceCards from '@/components/ServiceCards';
import AIConcierge from '@/components/AIConcierge';
import SignUpCards from '@/components/SignUpCards';
import AboutSection from '@/components/AboutSection';
import AppDownload from '@/components/AppDownload';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900">
      <HeroSection />
      <ServiceCards />
      <AIConcierge />
      <SignUpCards />
      <AboutSection />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <AppDownload />
        </div>
      </div>
    </main>
  );
} 