'use client';

import dynamic from 'next/dynamic';

const SearchBox = dynamic(() => import('./SearchBox'), {
  ssr: false,
  loading: () => <div className="text-center p-4">Loading search...</div>
});

export default function SearchBoxWrapper() {
  return <SearchBox />;
} 