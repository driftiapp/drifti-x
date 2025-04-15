import React, { useState } from 'react';

const HeroVideo: React.FC = () => {
  const [videoError, setVideoError] = useState(false);

  if (videoError) {
    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900" />
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => setVideoError(true)}
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default HeroVideo; 