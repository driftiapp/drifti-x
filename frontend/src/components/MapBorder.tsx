import React from 'react';

interface MapBorderProps {
  isVisible: boolean;
}

export const MapBorder: React.FC<MapBorderProps> = ({ isVisible }) => {
  return (
    <div 
      className={`
        absolute inset-0 pointer-events-none
        transition-all duration-1000
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Animated border */}
      <div 
        className="
          absolute inset-0 
          border-4 border-primary-500/30
          animate-pulse
        "
      />
      
      {/* Glowing effect */}
      <div 
        className="
          absolute inset-0 
          bg-gradient-to-r from-primary-500/20 via-transparent to-primary-500/20
          animate-glow
        "
      />
      
      {/* Location Label */}
      <div 
        className={`
          absolute top-8 left-1/2 -translate-x-1/2
          px-4 py-2 rounded-full
          bg-black/80 text-white
          font-medium text-sm
          flex items-center gap-2
          transition-all duration-500
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        `}
      >
        <span className="text-lg">📍</span>
        Casablanca
      </div>
    </div>
  );
}; 