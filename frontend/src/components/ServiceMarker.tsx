import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Marker } from 'react-map-gl';
import { Service } from '@/types/services';
import { serviceIcons } from '@/types/serviceIcons';
import { MapPin, Navigation, Clock, Car } from 'lucide-react';

const SERVICE_SOUNDS = {
  ride: '/sounds/ride.mp3',
  food: '/sounds/food.mp3',
  vape: '/sounds/vape.mp3',
  liquor: '/sounds/liquor.mp3'
} as const;

interface ServiceMarkerProps {
  service: Service;
  onClick: (service: Service) => void;
  isNew?: boolean;
  userLocation?: { lat: number; lng: number };
}

interface DistanceInfo {
  distance: string;
  duration: string;
  error?: string;
}

export const ServiceMarker: React.FC<ServiceMarkerProps> = ({ 
  service, 
  onClick,
  isNew = false,
  userLocation
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState<DistanceInfo | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const icon = serviceIcons[service.type];

  // Initialize audio on client side
  useEffect(() => {
    const soundPath = SERVICE_SOUNDS[service.type as keyof typeof SERVICE_SOUNDS];
    const audioElement = new Audio(soundPath);
    audioElement.volume = 0.5;
    setAudio(audioElement);
  }, [service.type]);

  // Handle initial animation for new markers
  useEffect(() => {
    if (isNew) {
      setIsVisible(true);
    }
  }, [isNew]);

  // Calculate distance and ETA when user location is available
  useEffect(() => {
    if (userLocation) {
      calculateDistanceAndETA(userLocation, service.location);
    }
  }, [userLocation, service.location]);

  const calculateDistanceAndETA = async (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    try {
      // Try Google Maps Distance Matrix API first
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
        // Fallback to haversine calculation
        const distance = calculateHaversineDistance(origin, destination);
        const duration = estimateTravelTime(distance);
        setDistanceInfo({
          distance: `${distance.toFixed(1)} miles`,
          duration: `${duration} min`
        });
      }
    } catch (error) {
      // Fallback to haversine calculation
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
    // Assuming average speed of 30 mph in city
    return Math.round(distance * 2);
  };

  const handleSelect = () => {
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.error('Error playing sound:', error);
      });
    }
    onClick(service);
  };

  const getDirectionsUrl = () => {
    const { lat, lng } = service.location;
    const origin = userLocation 
      ? `${userLocation.lat},${userLocation.lng}`
      : 'current+location';
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lng}&travelmode=driving`;
  };

  const handleGetDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(getDirectionsUrl(), '_blank');
    // Track the directions click
    console.log('Directions clicked for:', service.name);
  };

  return (
    <Marker
      longitude={service.coordinates[0]}
      latitude={service.coordinates[1]}
      offsetLeft={-20}
      offsetTop={-40}
    >
      <motion.div
        initial={isNew ? { scale: 0, opacity: 0 } : false}
        animate={isNew ? { scale: 1, opacity: 1 } : false}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleSelect}
        className="relative"
      >
        {/* Main marker container */}
        <motion.div
          animate={{
            scale: isHovered ? 1.2 : 1,
            y: isHovered ? -5 : 0
          }}
          transition={{ type: 'spring', stiffness: 500 }}
          className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-${icon?.color}-500 text-white text-xl cursor-pointer`}
        >
          {icon?.emoji}
          
          {/* Active status indicator */}
          {service.isActive && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          )}
          
          {/* Pulsing glow effect */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.2, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className={`absolute inset-0 rounded-full bg-${icon?.color}-500 blur-md`}
          />
        </motion.div>

        {/* Enhanced hover popup */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 rounded-lg bg-${icon?.color}-500 text-white min-w-[200px]`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{service.name}</h3>
                {service.isActive && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Live Now
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${
                        i < service.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xs ml-1">({service.rating})</span>
              </div>

              {/* Distance and ETA Info */}
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
              
              {/* Get Directions Button */}
              <button
                onClick={handleGetDirections}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm py-1 px-3 rounded transition-colors"
                title="Open in Google Maps"
              >
                <Navigation size={14} />
                <span>Get Directions</span>
              </button>

              <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-${icon?.color}-500 rotate-45`} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Marker>
  );
}; 