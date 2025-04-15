export interface GeocodingFeature {
  id: string;
  type: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
  text: string;
  context?: Array<{
    id: string;
    text: string;
  }>;
}

export interface GeocodingResponse {
  type: string;
  features: GeocodingFeature[];
  attribution: string;
}

export interface SearchResult {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number];
  type: 'address' | 'place' | 'poi';
  relevance?: number;
}

export interface RecentSearch extends SearchResult {
  timestamp: number;
} 