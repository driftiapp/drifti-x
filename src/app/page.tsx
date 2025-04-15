'use client';

import { useState, useEffect } from 'react';
import SearchBox from '@/components/SearchBox';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to Drifti
          </h1>
          <p className="text-xl text-gray-600">
            Your AI-powered search assistant
          </p>
        </div>
        
        <div className="w-full max-w-2xl mx-auto">
          <SearchBox />
        </div>
      </div>
    </main>
  );
} 