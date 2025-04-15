import { useEffect, useState, useMemo, useCallback } from 'react';
import { Marker, Popup } from 'react-map-gl';
import Supercluster from 'supercluster';
import { Service, ServiceType } from '@/types/services';
import { serviceIcons } from '@/types/serviceIcons';
import { MapPin, Navigation, Clock, Car } from 'lucide-react';

interface ClusteredMarkersProps {
  services: Service[];
  activeFilters: ServiceType[];
  onServiceSelect: (service: Service | null) => void;
  selectedService: Service | null;
  viewport: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  userLocation?: {
    lat: number;
    lng: number;
  };
}

interface ClusterProperties {
  cluster: boolean;
  service?: Service;
  point_count?: number;
  cluster_id?: number;
}

interface ClusterPoint {
  type: 'Feature';
  properties: ClusterProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

interface DistanceInfo {
  distance: string;
  duration: string;
  error?: string;
}

export const ClusteredMarkers: React.FC<ClusteredMarkersProps> = ({
  services,
  activeFilters,
  onServiceSelect,
  selectedService,
  viewport,
  userLocation
}) => {
  const [clusters, setClusters] = useState<ClusterPoint[]>([]);
  const [hoveredCluster, setHoveredCluster] = useState<ClusterPoint | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<DistanceInfo | null>(null);

  // Create supercluster instance
  const supercluster = useMemo(() => {
    return new Supercluster<ClusterProperties>({
      radius: 60,
      maxZoom: 16,
      minZoom: 0
    });
  }, []);

  // Convert services to GeoJSON features
  const points = useMemo(() => {
    return services
      .filter(service => activeFilters.length === 0 || activeFilters.includes(service.type))
      .map(service => ({
        type: 'Feature' as const,
        properties: {
          cluster: false,
          service
        },
        geometry: {
          type: 'Point' as const,
          coordinates: service.coordinates
        }
      }));
  }, [services, activeFilters]);

  // Update clusters when viewport or points change
  useEffect(() => {
    supercluster.load(points);
    const newClusters = supercluster.getClusters(
      [viewport.longitude - 180, viewport.latitude - 90, viewport.longitude + 180, viewport.latitude + 90],
      Math.floor(viewport.zoom)
    ) as ClusterPoint[];
    setClusters(newClusters);
  }, [viewport, points, supercluster]);

  // Calculate distance and ETA when user location is available
  useEffect(() => {
    if (userLocation && selectedService) {
      calculateDistanceAndETA(userLocation, selectedService.location);
    }
  }, [userLocation, selectedService]);

  const calculateDistanceAndETA = async (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&mode=driving&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
        const { distance, duration } = data.rows[0].elements[0];
        setDistanceInfo({
          distance: distance.text,
          duration: duration.text
        });
      } else {
        const distance = calculateHaversineDistance(origin, destination);
        const duration = estimateTravelTime(distance);
        setDistanceInfo({
          distance: `${distance.toFixed(1)} miles`,
          duration: `${duration} min`
        });
      }
    } catch (error) {
      const distance = calculateHaversineDistance(origin, destination);
      const duration = estimateTravelTime(distance);
      setDistanceInfo({
        distance: `${distance.toFixed(1)} miles`,
        duration: `${duration} min`
      });
    }
  };

  const calculateHaversineDistance = (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRad(destination.lat - origin.lat);
    const dLng = toRad(destination.lng - origin.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toRad = (value: number) => {
    return value * Math.PI / 180;
  };

  const estimateTravelTime = (distance: number) => {
    return Math.round(distance * 2);
  };

  const handleClusterClick = useCallback((cluster: ClusterPoint) => {
    if (cluster.properties.cluster && cluster.properties.cluster_id) {
      const expansionZoom = supercluster.getClusterExpansionZoom(cluster.properties.cluster_id);
      // You can handle zooming here if needed
    } else if (cluster.properties.service) {
      onServiceSelect(cluster.properties.service);
    }
  }, [supercluster, onServiceSelect]);

  const getDirectionsUrl = (service: Service) => {
    const { lat, lng } = service.location;
    const origin = userLocation 
      ? `${userLocation.lat},${userLocation.lng}`
      : 'current+location';
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lng}&travelmode=driving`;
  };

  const renderClusterMarker = (cluster: ClusterPoint) => {
    const [longitude, latitude] = cluster.geometry.coordinates;
    const { cluster: isCluster, point_count } = cluster.properties;

    if (isCluster) {
      return (
        <Marker
          key={`cluster-${cluster.properties.cluster_id}`}
          latitude={latitude}
          longitude={longitude}
          onClick={() => handleClusterClick(cluster)}
        >
          <div 
            className="relative"
            onMouseEnter={() => setHoveredCluster(cluster)}
            onMouseLeave={() => setHoveredCluster(null)}
          >
            <div className="w-10 h-10 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer flex items-center justify-center text-white font-bold">
              {point_count}
            </div>
            {hoveredCluster === cluster && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs">
                {point_count} services
              </div>
            )}
          </div>
        </Marker>
      );
    }

    const service = cluster.properties.service;
    if (!service) return null;

    const icon = serviceIcons[service.type];
    return (
      <Marker
        key={service.id}
        latitude={latitude}
        longitude={longitude}
        onClick={() => handleClusterClick(cluster)}
      >
        <div 
          className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-${icon?.color}-500 text-white text-xl cursor-pointer`}
        >
          {icon?.emoji}
          
          {service.isActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
          
          <div className={`absolute inset-0 rounded-full bg-${icon?.color}-500 blur-md opacity-50`} />
        </div>
      </Marker>
    );
  };

  return (
    <>
      {clusters.map(renderClusterMarker)}
      {selectedService && (
        <Popup
          latitude={selectedService.location.lat}
          longitude={selectedService.location.lng}
          onClose={() => onServiceSelect(null)}
          closeButton={true}
          closeOnClick={false}
          offsetTop={-10}
          className="shadow-lg"
        >
          <div className="p-3 min-w-[200px]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg mb-1">{selectedService.name}</h3>
              {selectedService.isActive && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Live Now
                </span>
              )}
            </div>
            {selectedService.description && (
              <p className="text-sm text-gray-600 mb-2">{selectedService.description}</p>
            )}
            <div className="mt-1 flex items-center">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${
                      i < selectedService.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-xs ml-1">({selectedService.rating})</span>
            </div>

            {distanceInfo && (
              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <MapPin size={12} />
                  <span>{distanceInfo.distance}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{distanceInfo.duration}</span>
                </div>
              </div>
            )}

            <button
              className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-500 text-white text-sm py-1 px-3 rounded hover:bg-blue-600 transition-colors"
              onClick={() => window.open(getDirectionsUrl(selectedService), '_blank')}
            >
              <Navigation size={14} />
              <span>Get Directions</span>
            </button>
          </div>
        </Popup>
      )}
    </>
  );
}; 