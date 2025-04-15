import { LucideIcon } from 'lucide-react';
import { ComponentType } from 'react';

interface IconProps {
  icon: ComponentType<{ className?: string; size?: number }>;
  className?: string;
  size?: number;
}

export function Icon({ icon: IconComponent, className = '', size = 20 }: IconProps) {
  return <IconComponent className={className} size={size} />;
} 