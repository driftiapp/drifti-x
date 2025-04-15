import { Service, ServiceType, isValidServiceType } from '@/types/services';

/**
 * Represents a city in Morocco
 * @interface City
 * @property {string} name - Name of the city
 * @property {[number, number]} coordinates - Coordinates of the city [longitude, latitude]
 */
interface City {
  name: string;
  coordinates: [number, number];
}

/**
 * List of major cities in Morocco
 * @constant {City[]}
 */
const MOROCCO_CITIES: City[] = [
  { name: 'Casablanca', coordinates: [-7.5898, 33.5731] },
  { name: 'Rabat', coordinates: [-6.8498, 34.0209] },
  { name: 'Marrakesh', coordinates: [-7.9812, 31.6295] },
  { name: 'Fes', coordinates: [-4.9998, 34.0331] },
  { name: 'Tangier', coordinates: [-5.8135, 35.7595] },
  { name: 'Agadir', coordinates: [-9.5981, 30.4278] },
  { name: 'Meknes', coordinates: [-5.5475, 33.8952] },
  { name: 'Oujda', coordinates: [-1.9086, 34.6819] },
  { name: 'Kenitra', coordinates: [-6.5802, 34.2610] },
  { name: 'Tetouan', coordinates: [-5.3689, 35.5711] }
];

/**
 * Available service types
 * @constant {ServiceType[]}
 */
const SERVICE_TYPES: ServiceType[] = ['ride', 'food', 'vape', 'liquor'];

/**
 * Service names by type
 * @constant {Record<ServiceType, string[]>}
 */
const SERVICE_NAMES: Record<ServiceType, string[]> = {
  ride: ['Express Ride', 'Luxury Car', 'VIP Transport', 'Quick Taxi'],
  food: ['Gourmet Kitchen', 'Street Food', 'Fine Dining', 'Café Express'],
  vape: ['Vape Shop', 'Cloud Lounge', 'E-Cig Store', 'Vape Bar'],
  liquor: ['Wine Cellar', 'Cocktail Bar', 'Liquor Store', 'Bottle Shop'],
  default: ['General Service', 'Local Business', 'Community Service', 'Neighborhood Spot']
};

/**
 * Maximum distance from city center in degrees
 * @constant {number}
 */
const MAX_DISTANCE_FROM_CENTER = 0.1;

/**
 * Minimum rating for services
 * @constant {number}
 */
const MIN_RATING = 1;

/**
 * Maximum rating for services
 * @constant {number}
 */
const MAX_RATING = 5;

/**
 * Probability of a service being active
 * @constant {number}
 */
const ACTIVE_PROBABILITY = 0.7;

/**
 * Probability of a service status changing
 * @constant {number}
 */
const STATUS_CHANGE_PROBABILITY = 0.2;

/**
 * Generates a random number within a range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number within the range
 */
const getRandomNumber = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Generates a random service in a given city
 * @param {City} city - City to generate the service in
 * @returns {Service} Randomly generated service
 */
const generateRandomService = (city: City): Service => {
  const type = SERVICE_TYPES[Math.floor(Math.random() * SERVICE_TYPES.length)];
  const name = SERVICE_NAMES[type][Math.floor(Math.random() * SERVICE_NAMES[type].length)];
  
  // Generate random coordinates within MAX_DISTANCE_FROM_CENTER of city center
  const latOffset = (Math.random() - 0.5) * MAX_DISTANCE_FROM_CENTER;
  const lngOffset = (Math.random() - 0.5) * MAX_DISTANCE_FROM_CENTER;
  
  const coordinates: [number, number] = [
    city.coordinates[0] + lngOffset,
    city.coordinates[1] + latOffset
  ];

  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    name,
    description: `${name} in ${city.name}`,
    price: Math.floor(getRandomNumber(20, 100)),
    rating: Math.floor(getRandomNumber(MIN_RATING, MAX_RATING)),
    location: {
      lat: coordinates[1],
      lng: coordinates[0]
    },
    coordinates,
    image: `/images/services/${type}-${Math.floor(Math.random() * 2) + 1}.jpg`,
    available: true,
    isActive: Math.random() > (1 - ACTIVE_PROBABILITY),
    lastUpdated: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
  };
};

/**
 * Generates mock services
 * @param {number} [count=100] - Number of services to generate
 * @returns {Service[]} Array of mock services
 * @throws {Error} If count is less than 1
 */
export const generateMockServices = (count: number = 100): Service[] => {
  if (count < 1) {
    throw new Error('Count must be greater than 0');
  }

  const services: Service[] = [];
  
  // Distribute services across cities
  const servicesPerCity = Math.ceil(count / MOROCCO_CITIES.length);
  
  MOROCCO_CITIES.forEach(city => {
    for (let i = 0; i < servicesPerCity; i++) {
      services.push(generateRandomService(city));
    }
  });
  
  // Shuffle and trim to requested count
  return services
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
};

/**
 * Updates mock services with random status changes
 * @param {Service[]} services - Services to update
 * @returns {Service[]} Updated services
 */
export const updateMockServices = (services: Service[]): Service[] => {
  return services.map(service => {
    // STATUS_CHANGE_PROBABILITY chance of status change
    if (Math.random() < STATUS_CHANGE_PROBABILITY) {
      return {
        ...service,
        isActive: !service.isActive,
        lastUpdated: new Date().toISOString()
      };
    }
    return service;
  });
}; 