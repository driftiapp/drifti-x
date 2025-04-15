import { ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// Common icons that are used frequently
import { Search, X, MapPin, Star, Clock } from './icons';

interface IconResolverProps {
  name: string;
  size?: number;
  className?: string;
}

// Map of all available icons
const IconMap: Record<string, ComponentType<any>> = {
  search: Search,
  x: X,
  mapPin: MapPin,
  star: Star,
  clock: Clock,
  // Add more icons as needed
};

export function IconResolver({ name, size = 20, className = '' }: IconResolverProps) {
  const Icon = IconMap[name];

  if (!Icon) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <Icon size={size} className={className} />;
} 