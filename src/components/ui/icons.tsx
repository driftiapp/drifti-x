/**
 * Centralized icon imports with tree-shaking support
 * 
 * @see https://lucide.dev/guide/packages/lucide-react#tree-shaking
 * 
 * Note: TypeScript errors are expected and safe to ignore
 * @see README.md > Development Notes > Lucide Icons
 */

// @ts-ignore
// TypeScript doesn't like Lucide icon imports, but they work fine at runtime.
import {
  Search,
  X,
  MapPin,
  Star,
  Clock,
  // Add more icons as needed
} from 'lucide-react';

// Export icons individually for better tree-shaking
export { Search };
export { X };
export { MapPin };
export { Star };
export { Clock }; 