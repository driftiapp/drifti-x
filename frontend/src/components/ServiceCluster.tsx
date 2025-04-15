import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Marker } from 'react-map-gl';
import { Service, ServiceType } from '../types/services';
import useSound from 'use-sound';

interface ServiceClusterProps {
  services: Service[];
  activeFilters: ServiceType[];
  onServiceSelect: (service: Service | null) => void;
  selectedService: Service | null;
  viewport: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
}

const CLUSTER_COLORS = {
  small: 'bg-blue-500',
  medium: 'bg-purple-500',
  large: 'bg-red-500'
};

const CLUSTER_SIZES = {
  small: 'w-12 h-12',
  medium: 'w-14 h-14',
  large: 'w-16 h-16'
};

export const ServiceCluster: React.FC<ServiceClusterProps> = ({
  services,
  activeFilters,
  onServiceSelect,
  selectedService,
  viewport
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [playSound] = useSound('/sfx/click.mp3', { volume: 0.5 });
  
  // Filter services based on active filters
  const filteredServices = services.filter(service => 
    activeFilters.length === 0 || activeFilters.includes(service.type)
  );

  // Group services by location for clustering
  const clusters = filteredServices.reduce((acc, service) => {
    const key = `${service.coordinates[0]},${service.coordinates[1]}`;
    if (!acc[key]) {
      acc[key] = {
        coordinates: service.coordinates,
        services: [service],
        pointCount: 1
      };
    } else {
      acc[key].services.push(service);
      acc[key].pointCount++;
    }
    return acc;
  }, {} as Record<string, { coordinates: [number, number]; services: Service[]; pointCount: number }>);

  // Determine cluster size and color
  const getClusterSize = (pointCount: number) => {
    if (pointCount <= 5) return 'small';
    if (pointCount <= 15) return 'medium';
    return 'large';
  };

  const handleClick = (services: Service[]) => {
    playSound();
    if (services.length === 1) {
      onServiceSelect(services[0]);
    }
  };

  return (
    <>
      {Object.values(clusters).map(cluster => {
        const size = getClusterSize(cluster.pointCount);
        const color = CLUSTER_COLORS[size];
        const dimensions = CLUSTER_SIZES[size];

        return (
          <Marker
            key={`${cluster.coordinates[0]},${cluster.coordinates[1]}`}
            longitude={cluster.coordinates[0]}
            latitude={cluster.coordinates[1]}
          >
            <motion.div
              className="relative"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Cluster marker */}
              <motion.div 
                className={`
                  ${dimensions} rounded-full
                  flex items-center justify-center
                  text-white font-bold
                  ${color}
                  shadow-lg
                  cursor-pointer
                  relative
                `}
                onClick={() => handleClick(cluster.services)}
                animate={{
                  scale: isHovered ? 1.1 : 1,
                  rotate: isHovered ? [0, 5, -5, 0] : 0
                }}
                transition={{
                  scale: { duration: 0.2 },
                  rotate: { duration: 0.5, repeat: 0 }
                }}
              >
                {cluster.pointCount}
                
                {/* Service icons */}
                <motion.div 
                  className="absolute -bottom-2 -right-2 flex"
                  animate={{
                    y: isHovered ? [0, -5, 0] : 0
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  {cluster.services.slice(0, 3).map((service, index) => (
                    <motion.div
                      key={service.id}
                      className={`
                        w-6 h-6 rounded-full
                        flex items-center justify-center
                        text-xs
                        ${index === 0 ? 'bg-white' : 'bg-gray-100'}
                        ${index > 0 ? '-ml-2' : ''}
                        shadow-sm
                      `}
                      animate={{
                        scale: isHovered ? [1, 1.2, 1] : 1,
                        rotate: isHovered ? [0, 10, -10, 0] : 0
                      }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.1
                      }}
                    >
                      {service.type === 'ride' ? '🚗' :
                       service.type === 'food' ? '🍕' :
                       service.type === 'vape' ? '💨' : '🍷'}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-24"
                  >
                    <div className="
                      bg-white rounded-lg shadow-lg
                      p-3 min-w-[180px]
                      border border-gray-200
                    ">
                      <h3 className="font-medium text-gray-900">
                        {cluster.pointCount} Services
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {cluster.services.map(s => s.type.charAt(0).toUpperCase() + s.type.slice(1)).join(', ')}
                      </p>
                      <button
                        onClick={() => handleClick(cluster.services)}
                        className="
                          mt-2 w-full px-3 py-1.5 rounded-md
                          text-sm font-medium text-white
                          bg-primary-500 hover:bg-primary-600
                          transition-colors
                        "
                      >
                        View Services
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </Marker>
        );
      })}
    </>
  );
}; 