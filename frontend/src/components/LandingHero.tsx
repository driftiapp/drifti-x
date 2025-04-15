import React, { useRef, useEffect } from 'react';
import { MapRef } from 'react-map-gl';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useServiceSounds } from '@/hooks/useServiceSounds';

interface LandingHeroProps {
  mapRef: React.RefObject<MapRef>;
  onExplore: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ mapRef, onExplore }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { playServiceSound } = useServiceSounds();

  // Auto-focus first service button
  useEffect(() => {
    const firstButton = document.getElementById('ride-button');
    if (firstButton) {
      firstButton.focus();
    }
  }, []);

  // Parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const { clientX, clientY } = e;
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      const xPercent = (clientX / width - 0.5) * 2;
      const yPercent = (clientY / height - 0.5) * 2;
      
      containerRef.current.style.setProperty('--x-offset', `${xPercent * 20}px`);
      containerRef.current.style.setProperty('--y-offset', `${yPercent * 20}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleServiceClick = (service: string) => {
    console.log(`${service} button clicked`);
    playServiceSound(service as any);
    
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Navigate to the appropriate service page
    switch (service) {
      case 'ride':
        router.push('/ride');
        break;
      case 'food':
        router.push('/food');
        break;
      case 'vape':
        router.push('/vape');
        break;
      case 'liquor':
        router.push('/liquor');
        break;
      default:
        onExplore();
    }
  };

  const handleExploreClick = () => {
    console.log("Explore Services button clicked");
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Smooth scroll to map
    const mapSection = document.getElementById('map-section');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    onExplore();
  };

  return (
    <motion.div 
      ref={containerRef}
      className="
        relative w-full h-full
        flex flex-col items-center justify-center
        bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900
        overflow-hidden
      "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Ambient background gradients */}
      <div 
        className="
          absolute inset-0 
          bg-[radial-gradient(circle_at_var(--x-offset,0)_var(--y-offset,0),rgba(255,255,255,0.1)_0%,transparent_50%)]
          pointer-events-none
        "
      />
      
      {/* Floating icons */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Add your service icons here */}
      </motion.div>

      {/* Quick action buttons */}
      <div className="flex gap-6 mt-8 z-[110]">
        {['ride', 'food', 'vape', 'liquor'].map((service) => (
          <motion.button
            key={service}
            id={`${service}-button`}
            className="
              px-6 py-3 rounded-full
              bg-white/10 hover:bg-white/20
              text-white font-medium
              transition-colors
              relative
              cursor-pointer
              z-[110]
              focus:outline-none focus:ring-2 focus:ring-white/30
              focus-visible:ring-2 focus-visible:ring-white/30
            "
            whileHover={{
              scale: 1.05,
              backgroundColor: 'rgba(255, 255, 255, 0.2)'
            }}
            whileTap={{
              scale: 0.95,
              backgroundColor: 'rgba(255, 255, 255, 0.3)'
            }}
            onHoverStart={() => playServiceSound(service as any)}
            onClick={() => handleServiceClick(service)}
            role="button"
            aria-label={`Book ${service} service`}
            tabIndex={0}
          >
            {/* Reactive glow */}
            <div className="
              absolute inset-0 
              bg-white/5 rounded-full
              filter blur-xl
              scale-125
              animate-glow
              pointer-events-none
            "/>
            
            {service.charAt(0).toUpperCase() + service.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="text-center z-[110]"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-6xl font-bold text-white mb-4">
          DriftiX
        </h1>
        <p className="text-xl text-white/80 mb-8">
          Your premium delivery service in Morocco
        </p>
        <motion.button
          className="
            px-8 py-4 rounded-full
            bg-primary-500 hover:bg-primary-400
            text-white font-medium
            transition-colors
            cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-primary-300
            focus-visible:ring-2 focus-visible:ring-primary-300
            z-[110]
          "
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExploreClick}
          role="button"
          aria-label="Explore services"
          tabIndex={0}
        >
          Explore Services
        </motion.button>
      </motion.div>
    </motion.div>
  );
}; 