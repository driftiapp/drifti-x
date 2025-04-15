import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

const MobileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-white p-2"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
          <nav className="flex flex-col gap-4">
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
        </div>
      )}
    </div>
  );
};

export default MobileMenu; 