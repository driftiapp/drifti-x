import { motion, AnimatePresence } from 'framer-motion';
import { Service, ServiceType } from '../types/services';
import { SearchResult } from '../types/geocoding';
import { useState } from 'react';
import { useSound } from 'use-sound';

export interface ExtendedService extends Omit<Service, 'type'> {
  type: ServiceType;
}

export interface ExtendedSearchResult extends Omit<SearchResult, 'type'> {
  type: ServiceType | 'default';
  rating?: number;
  isActive?: boolean;
  lastUpdated?: string;
  description?: string;
}

export type DisplayableService = ExtendedService | ExtendedSearchResult;

export interface ServicePanelProps {
  service: DisplayableService | null;
  onClose: () => void;
}

const SERVICE_ACTIONS = {
  ride: {
    primary: 'Book Ride',
    secondary: 'Get Directions',
    icon: '🚗',
    sound: '/sfx/whoosh.mp3'
  },
  food: {
    primary: 'Order Now',
    secondary: 'View Menu',
    icon: '🍕',
    sound: '/sfx/ding.mp3'
  },
  vape: {
    primary: 'Shop Now',
    secondary: 'See Products',
    icon: '💨',
    sound: '/sfx/pop.mp3'
  },
  liquor: {
    primary: 'Browse Selection',
    secondary: 'Check Hours',
    icon: '🍷',
    sound: '/sfx/clink.mp3'
  },
  default: {
    primary: 'View Details',
    secondary: 'Get Directions',
    icon: '📍',
    sound: '/sfx/pop.mp3'
  }
} as const;

const isService = (service: DisplayableService): service is ExtendedService => {
  return 'coordinates' in service;
};

export const ServicePanel: React.FC<ServicePanelProps> = ({ service, onClose }) => {
  const [playSound] = useSound('/sfx/whoosh.mp3', { volume: 0.5 });
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!service) return null;

  const handleAction = () => {
    playSound();
    // Add action handling logic here
  };

  const getRandomImage = (type: ServiceType = 'default') => {
    const images: Record<ServiceType, string[]> = {
      ride: [
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
        'https://images.unsplash.com/photo-1511527844068-006b95d162c2?w=400'
      ],
      food: [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400'
      ],
      vape: [
        'https://images.unsplash.com/photo-1595392029431-448a33a662ab?w=400',
        'https://images.unsplash.com/photo-1595392030384-d5056c9a5d3c?w=400'
      ],
      liquor: [
        'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400',
        'https://images.unsplash.com/photo-1569529477258-43b2f038c7c0?w=400'
      ],
      default: [
        'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=400',
        'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=400'
      ]
    };
    return images[type][Math.floor(Math.random() * 2)];
  };

  const serviceType = (isService(service) ? service.type : 'default') as ServiceType;
  const actions = SERVICE_ACTIONS[serviceType];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50"
      >
        {/* Header Image */}
        <div className="relative h-48 overflow-hidden">
          <motion.img
            src={getRandomImage(serviceType)}
            alt={service.name}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: imageLoaded ? 1 : 0,
              scale: imageLoaded ? 1 : 1.1
            }}
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{service.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {isService(service) ? service.description : service.address}
              </p>
            </div>
            <div className="text-3xl">{actions.icon}</div>
          </div>

          {/* Rating - Only show for Service type */}
          {isService(service) && service.rating && (
            <div className="flex items-center mt-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-lg ${i < service.rating! ? 'text-yellow-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">({service.rating})</span>
            </div>
          )}

          {/* Status - Only show for Service type */}
          {isService(service) && (
            <div className="mt-6 flex items-center">
              <div className={`w-2 h-2 rounded-full ${service.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="ml-2 text-sm text-gray-600">
                {service.isActive ? 'Available Now' : 'Currently Unavailable'}
              </span>
            </div>
          )}

          {/* Last updated - Only show for Service type */}
          {isService(service) && service.lastUpdated && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {new Date(service.lastUpdated).toLocaleString()}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-8 space-y-3">
            <button
              onClick={handleAction}
              className={`
                w-full px-4 py-3 rounded-lg
                text-white font-medium
                ${serviceType === 'ride' ? 'bg-blue-500 hover:bg-blue-600' :
                  serviceType === 'food' ? 'bg-red-500 hover:bg-red-600' :
                  serviceType === 'vape' ? 'bg-green-500 hover:bg-green-600' :
                  'bg-purple-500 hover:bg-purple-600'}
                transition-colors
              `}
            >
              {actions.primary}
            </button>
            
            <button
              onClick={handleAction}
              className="w-full px-4 py-3 rounded-lg
                border-2 border-gray-200 hover:border-gray-300
                text-gray-700 font-medium
                transition-colors"
            >
              {actions.secondary}
            </button>
          </div>

          {/* Quick actions */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center px-4 py-2 rounded-lg
              border border-gray-200 hover:border-gray-300
              text-gray-600 text-sm
              transition-colors">
              📞 Call Now
            </button>
            <button className="flex items-center justify-center px-4 py-2 rounded-lg
              border border-gray-200 hover:border-gray-300
              text-gray-600 text-sm
              transition-colors">
              🗺️ Directions
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}; 