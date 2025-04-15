import React from 'react';
import Link from 'next/link';

const Navigation: React.FC = () => {
  return (
    <nav className="hidden md:flex items-center gap-6">
      <Link href="/ride" className="text-white hover:text-purple-400 transition-colors">
        Ride
      </Link>
      <Link href="/food" className="text-white hover:text-purple-400 transition-colors">
        Food
      </Link>
      <Link href="/vape" className="text-white hover:text-purple-400 transition-colors">
        Vape
      </Link>
      <Link href="/liquor" className="text-white hover:text-purple-400 transition-colors">
        Liquor
      </Link>
    </nav>
  );
};

export default Navigation; 