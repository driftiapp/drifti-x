import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Service, ServiceType, isValidServiceType } from '@/types/services';
import useSound from 'use-sound';

/**
 * Represents the trending statistics for a service type
 * @interface TrendingStats
 * @property {ServiceType} type - Type of service
 * @property {number} count - Number of active services
 * @property {number} trend - Percentage change in activity
 * @property {Service[]} services - List of trending services
 */
interface TrendingStats {
  type: ServiceType;
  count: number;
  trend: number; // percentage change
  services: Service[];
}

/**
 * Props for the TrendingWidget component
 * @interface TrendingWidgetProps
 * @property {Service[]} services - List of services to display
 * @property {(service: Service) => void} onServiceSelect - Callback when a service is selected
 */
interface TrendingWidgetProps {
  services: Service[];
  onServiceSelect: (service: Service) => void;
}

/**
 * Emoji mapping for service types
 * @constant {Record<ServiceType, string>}
 */
const SERVICE_EMOJIS: Record<ServiceType, string> = {
  ride: '🚗',
  food: '🍕',
  vape: '💨',
  liquor: '🍷',
  default: '📍'
};

/**
 * TrendingWidget component displays trending services in a floating panel
 * @component
 * @param {TrendingWidgetProps} props - Component props
 * @returns {JSX.Element} TrendingWidget component
 */
export const TrendingWidget: React.FC<TrendingWidgetProps> = ({
  services,
  onServiceSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [trendingStats, setTrendingStats] = useState<TrendingStats[]>([]);
  const [playHover] = useSound('/sfx/hover.mp3', { volume: 0.2 });
  const [playSelect] = useSound('/sfx/select.mp3', { volume: 0.3 });

  // Calculate trending stats
  useEffect(() => {
    const stats: TrendingStats[] = Object.keys(SERVICE_EMOJIS)
      .filter(type => isValidServiceType(type))
      .map(type => {
        const typeServices = services.filter(s => s.type === type && s.isActive);
        return {
          type: type as ServiceType,
          count: typeServices.length,
          trend: Math.random() * 100 - 50, // Mock trend data
          services: typeServices.sort((a, b) => b.rating - a.rating).slice(0, 3)
        };
      })
      .sort((a, b) => b.count - a.count);

    setTrendingStats(stats);
  }, [services]);

  const handleServiceSelect = (service: Service) => {
    playSelect();
    onServiceSelect(service);
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          playSelect();
          setIsExpanded(!isExpanded);
        }}
        className="
          bg-white rounded-full p-3
          shadow-lg border border-gray-100
          flex items-center gap-2
          text-sm font-medium
          hover:shadow-xl
          transition-shadow
        "
        aria-label={isExpanded ? 'Close trending panel' : 'Open trending panel'}
        aria-expanded={isExpanded}
      >
        <span className="text-xl" role="img" aria-label="Fire emoji">🔥</span>
        <span className="pr-1">What's Hot</span>
      </motion.button>

      {/* Trending panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="
              absolute bottom-full right-0 mb-2
              w-80 bg-white rounded-lg
              shadow-xl border border-gray-100
              overflow-hidden
            "
            role="dialog"
            aria-label="Trending services panel"
          >
            <div className="p-4 bg-gradient-to-r from-orange-500 to-pink-500">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span role="img" aria-label="Fire emoji">🔥</span> Trending Now
              </h3>
              <p className="text-sm text-white/80">
                Live updates from across Morocco
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {trendingStats.map(stat => (
                <div key={stat.type} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" role="img" aria-label={`${stat.type} service emoji`}>
                        {SERVICE_EMOJIS[stat.type]}
                      </span>
                      <div>
                        <h4 className="font-medium capitalize">{stat.type}</h4>
                        <p className="text-sm text-gray-500">
                          {stat.count} active services
                        </p>
                      </div>
                    </div>
                    <div className={`
                      text-sm font-medium
                      ${stat.trend > 0 ? 'text-green-500' : 'text-red-500'}
                    `}>
                      <span role="img" aria-label={stat.trend > 0 ? 'Up arrow' : 'Down arrow'}>
                        {stat.trend > 0 ? '↑' : '↓'}
                      </span> {Math.abs(stat.trend).toFixed(1)}%
                    </div>
                  </div>

                  {/* Top services */}
                  <div className="mt-3 space-y-2">
                    {stat.services.map(service => (
                      <motion.button
                        key={service.id}
                        whileHover={{ x: 4 }}
                        onClick={() => handleServiceSelect(service)}
                        onMouseEnter={() => playHover()}
                        className="
                          w-full p-2 rounded
                          bg-white shadow-sm
                          border border-gray-100
                          hover:border-gray-200
                          flex items-center justify-between
                          text-sm
                          transition-colors
                        "
                        aria-label={`Select ${service.name} service`}
                      >
                        <span className="font-medium">{service.name}</span>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <span role="img" aria-label="Star rating">★</span>
                          <span className="text-gray-600">{service.rating}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick insights */}
            <div className="p-4 bg-gray-50 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Updated just now</span>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close trending panel"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 