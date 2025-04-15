'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Service } from '@/types/services';

interface MapProps {
  services: Service[];
  activeFilters: string[];
  mapboxToken: string;
}

const Map = ({ services, activeFilters, mapboxToken }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng] = useState(-7.5898);
  const [lat] = useState(33.5731);
  const [zoom] = useState(9);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });

    return () => {
      map.current?.remove();
    };
  }, [lng, lat, zoom, mapboxToken]);

  useEffect(() => {
    if (!map.current) return;

    // Filter services based on active filters
    const filteredServices = services.filter(service => 
      activeFilters.length === 0 || activeFilters.includes(service.type)
    );

    // Add markers for filtered services
    filteredServices.forEach(service => {
      const marker = new mapboxgl.Marker()
        .setLngLat([service.coordinates.lng, service.coordinates.lat])
        .addTo(map.current!);

      // Add popup with service details
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <h3>${service.name}</h3>
          <p>${service.description}</p>
          <p>Rating: ${service.rating}/5</p>
          <p>Price: $${service.price}</p>
        `);

      marker.setPopup(popup);
    });

    return () => {
      // Remove all markers when component updates
      const markers = document.getElementsByClassName('mapboxgl-marker');
      while(markers.length > 0) {
        markers[0].remove();
      }
    };
  }, [services, activeFilters]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-screen"
      aria-label="Interactive map showing service locations"
    />
  );
};

export default Map; 