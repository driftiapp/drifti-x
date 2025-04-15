import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

export function ServiceCard({ icon, title, description, link }: ServiceCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="group relative overflow-hidden rounded-lg bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
    >
      <div className="mb-4 text-4xl text-white">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="mb-4 text-gray-300">{description}</p>
      <Link
        href={link}
        className={cn(
          'inline-flex items-center text-sm font-medium text-white transition-colors',
          'hover:text-blue-400'
        )}
      >
        Learn more
        <svg
          className="ml-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    </motion.div>
  );
} 