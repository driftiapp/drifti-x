export type SuggestionType = 'service' | 'location' | 'category' | 'history';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface AISuggestionContext {
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  currentLocation?: Location;
  userPreferences?: {
    categories?: string[];
    priceRange?: 'low' | 'medium' | 'high';
    rating?: number;
  };
  recentSearches?: string[];
  deviceType?: 'mobile' | 'desktop';
  language?: string;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: SuggestionType;
  metadata: {
    category?: string;
    lat?: number;
    lng?: number;
  };
  score?: number;
}

export interface SuggestionGroup {
  type: SuggestionType;
  suggestions: SearchSuggestion[];
}

export interface SearchState {
  query: string;
  suggestions: SuggestionGroup[];
  loading: boolean;
  error: string | null;
  selectedIndex: number;
} 