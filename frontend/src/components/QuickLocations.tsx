import React from 'react';
import { useCallback } from 'react';
import { MapRef } from 'react-map-gl';
import { Service, SearchResult } from '../types/services';

interface QuickLocation {
  id: string;
  name: string;
  icon: string;
  coordinates: [number, number];
  zoom: number;
}

interface QuickLocationsProps {
  mapRef: React.RefObject<MapRef>;
  onSelect: (service: Service | SearchResult | null) => void;
}

const QUICK_LOCATIONS: QuickLocation[] = [
  {
    id: 'casablanca',
    name: 'Casablanca',
    icon: '📍',
    coordinates: [-7.5898, 33.5731],
    zoom: 12
  },
  {
    id: 'marrakech',
    name: 'Marrakech',
    icon: '🕌',
    coordinates: [-8.0089, 31.6295],
    zoom: 13
  },
  {
    id: 'chefchaouen',
    name: 'Chefchaouen',
    icon: '⛰️',
    coordinates: [-5.2687, 35.1714],
    zoom: 14
  },
  {
    id: 'rabat',
    name: 'Rabat',
    icon: '🏛️',
    coordinates: [-6.8498, 34.0209],
    zoom: 12
  },
  {
    id: 'tangier',
    name: 'Tangier',
    icon: '🌊',
    coordinates: [-5.8135, 35.7595],
    zoom: 13
  },
  {
    id: 'fes',
    name: 'Fes',
    icon: '🏺',
    coordinates: [-4.9998, 34.0333],
    zoom: 13
  }
];

export const QuickLocations: React.FC<QuickLocationsProps> = ({ mapRef, onSelect }) => {
  const flyToLocation = useCallback((location: QuickLocation) => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.flyTo({
        center: location.coordinates,
        zoom: location.zoom,
        duration: 2000,
        essential: true
      });
    }
  }, [mapRef]);

  return (
    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 z-10">
      <div className="flex flex-wrap gap-2">
        {QUICK_LOCATIONS.map((location) => (
          <button
            key={location.id}
            onClick={() => flyToLocation(location)}
            className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-gray-100 rounded-md shadow-sm transition-colors"
            title={`Fly to ${location.name}`}
          >
            <span className="text-lg">{location.icon}</span>
            <span className="text-sm font-medium">{location.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}; 