export interface Coordinate {
  lat: number;
  lng: number;
}

export interface VoiceLocation extends Coordinate {
  name?: string;
  type: 'voice';
}

export interface SearchResult {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number]; // [longitude, latitude]
  type: 'search' | 'voice';
}

export interface Location {
  id?: string;
  name?: string;
  location?: string;
  coordinates?: [number, number];
  lat?: number;
  lng?: number;
  type?: 'search' | 'voice';
}

export const isSearchResult = (location: Location): location is SearchResult => {
  return location.type === 'search';
};

export const isVoiceLocation = (location: Location): location is VoiceLocation => {
  return location.type === 'voice';
};

export function convertSearchResultToCoordinate(result: SearchResult): Coordinate {
  return {
    lat: result.coordinates[1],
    lng: result.coordinates[0]
  };
}

export function convertLocationToCoordinate(location: Location): Coordinate {
  if (location.coordinates) {
    return {
      lat: location.coordinates[1],
      lng: location.coordinates[0]
    };
  }
  if (location.lat !== undefined && location.lng !== undefined) {
    return {
      lat: location.lat,
      lng: location.lng
    };
  }
  throw new Error('Invalid location format');
}

export function convertCoordinateToViewport(coordinate: Coordinate) {
  return {
    latitude: coordinate.lat,
    longitude: coordinate.lng,
    zoom: 15
  };
} 