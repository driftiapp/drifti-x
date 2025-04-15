import { LucideProps } from 'lucide-react';

declare module 'lucide-react' {
  export interface IconProps extends LucideProps {
    className?: string;
  }
  
  export type Icon = React.ForwardRefExoticComponent<IconProps>;
  
  export const Search: Icon;
  export const X: Icon;
  export const Command: Icon;
  export const MapPin: Icon;
  export const History: Icon;
  export const TrendingUp: Icon;
  export const Sparkles: Icon;
} 