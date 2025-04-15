import { Service, ServiceId, Coordinate } from '@/types/services';

/**
 * Base location for generating random services
 */
const BASE_LOCATION = {
  latitude: 40.7128,
  longitude: -74.0060
};

/**
 * Maximum deviation from base location in degrees
 */
const LOCATION_DEVIATION = 0.1;

/**
 * Price ranges for services
 */
const PRICE_RANGES = {
  ride: ['$', '$$'],
  food: ['$', '$$', '$$$'],
  vape: ['$', '$$'],
  liquor: ['$$', '$$$', '$$$$'],
  default: ['$', '$$']
} as const;

/**
 * Helper function to generate a random number within a range
 */
const getRandomNumber = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Helper function to generate a random service ID
 */
const getRandomServiceId = (): ServiceId => {
  const serviceIds: ServiceId[] = ['ride', 'food', 'vape', 'liquor', 'default'];
  return serviceIds[Math.floor(Math.random() * serviceIds.length)];
};

/**
 * Helper function to generate a random location near the base location
 */
const getRandomLocation = (): Coordinate => ({
  lat: BASE_LOCATION.latitude + getRandomNumber(-LOCATION_DEVIATION, LOCATION_DEVIATION),
  lng: BASE_LOCATION.longitude + getRandomNumber(-LOCATION_DEVIATION, LOCATION_DEVIATION)
});

/**
 * Helper function to generate a random price range for a service type
 */
const getRandomPriceRange = (type: ServiceId): string => {
  const ranges = PRICE_RANGES[type];
  return ranges[Math.floor(Math.random() * ranges.length)];
};

/**
 * Predefined mock services for testing
 */
export const mockServices: Service[] = [
  {
    id: '1',
    type: 'ride',
    name: 'Uber Pickup Point',
    description: 'Available 24/7',
    price: 15,
    rating: 4.8,
    location: { lat: BASE_LOCATION.latitude, lng: BASE_LOCATION.longitude },
    coordinates: [BASE_LOCATION.longitude, BASE_LOCATION.latitude],
    image: 'https://example.com/uber.jpg',
    available: true,
    isActive: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2',
    type: 'food',
    name: 'Pizza Paradise',
    description: 'Best pizza in town',
    price: 25,
    rating: 4.5,
    location: { lat: BASE_LOCATION.latitude + 0.001, lng: BASE_LOCATION.longitude + 0.001 },
    coordinates: [BASE_LOCATION.longitude + 0.001, BASE_LOCATION.latitude + 0.001],
    image: 'https://example.com/pizza.jpg',
    available: true,
    isActive: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: '3',
    type: 'vape',
    name: 'Cloud 9 Vape Shop',
    description: 'Wide selection of vapes',
    price: 30,
    rating: 4.2,
    location: { lat: BASE_LOCATION.latitude + 0.002, lng: BASE_LOCATION.longitude + 0.002 },
    coordinates: [BASE_LOCATION.longitude + 0.002, BASE_LOCATION.latitude + 0.002],
    image: 'https://example.com/vape.jpg',
    available: true,
    isActive: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: '4',
    type: 'liquor',
    name: 'Bottle Shop',
    description: 'Fine wines and spirits',
    price: 45,
    rating: 4.6,
    location: { lat: BASE_LOCATION.latitude + 0.003, lng: BASE_LOCATION.longitude + 0.003 },
    coordinates: [BASE_LOCATION.longitude + 0.003, BASE_LOCATION.latitude + 0.003],
    image: 'https://example.com/liquor.jpg',
    available: true,
    isActive: true,
    lastUpdated: new Date().toISOString()
  }
];

/**
 * Checks for duplicate IDs in an array of services
 * @param services Array of services to check
 * @returns Array of duplicate IDs found
 */
export const findDuplicateIds = (services: Service[]): string[] => {
  const idCounts = new Map<string, number>();
  const duplicates: string[] = [];

  services.forEach(service => {
    const count = (idCounts.get(service.id) || 0) + 1;
    idCounts.set(service.id, count);
    if (count === 2) {
      duplicates.push(service.id);
    }
  });

  return duplicates;
};

/**
 * Generates a unique ID that doesn't exist in the provided services
 * @param services Array of existing services
 * @param prefix Prefix for the new ID
 * @returns A unique ID
 */
const generateUniqueId = (services: Service[], prefix: string = 'random'): string => {
  const usedIds = new Set(services.map(s => s.id));
  let id: string;
  let counter = 1;

  do {
    id = `${prefix}-${counter}`;
    counter++;
  } while (usedIds.has(id));

  return id;
};

/**
 * Generates a specified number of random services
 * @param count Number of services to generate
 * @param existingServices Optional array of existing services to avoid ID conflicts
 * @returns Array of randomly generated services
 */
export const generateRandomServices = (count: number, existingServices: Service[] = []): Service[] => {
  if (count <= 0) {
    throw new Error('Count must be greater than 0');
  }

  const services: Service[] = [];
  const usedIds = new Set(existingServices.map(s => s.id));

  for (let i = 0; i < count; i++) {
    const type = getRandomServiceId();
    const location = getRandomLocation();
    const id = generateUniqueId([...existingServices, ...services]);

    services.push({
      id,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Service ${i + 1}`,
      description: `Random ${type} service description`,
      price: Math.floor(getRandomNumber(10, 100)),
      rating: Number(getRandomNumber(3, 5).toFixed(1)),
      location,
      coordinates: [location.lng, location.lat],
      image: `https://example.com/${type}.jpg`,
      available: Math.random() > 0.2,
      isActive: Math.random() > 0.1,
      lastUpdated: new Date().toISOString()
    });
  }

  return services;
};

/**
 * Updates the status of services with a chance to change their active state
 * @param services Array of services to update
 * @param changeChance Probability of a service changing state (0-1)
 * @returns Updated array of services
 */
export const updateServiceStatus = (services: Service[], changeChance: number = 0.1): Service[] => {
  if (changeChance < 0 || changeChance > 1) {
    throw new Error('Change chance must be between 0 and 1');
  }

  return services.map(service => {
    if (Math.random() < changeChance) {
      return {
        ...service,
        isActive: !service.isActive,
        lastUpdated: new Date().toISOString()
      };
    }
    return service;
  });
}; 