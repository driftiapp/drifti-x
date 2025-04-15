import React from 'react';
import Link from 'next/link';

const Logo: React.FC = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="text-2xl">🌍</span>
      <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
        DriftiX
      </span>
    </Link>
  );
};

export default Logo; 