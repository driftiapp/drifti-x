/**
 * Represents the type identifier for a service
 * @typedef {string} ServiceId
 * @property {'ride'} ride - Ride service
 * @property {'food'} food - Food service
 * @property {'vape'} vape - Vape service
 * @property {'liquor'} liquor - Liquor service
 * @property {'default'} default - Default service type
 */
export type ServiceId = 'ride' | 'food' | 'vape' | 'liquor';

/**
 * Represents the definition of a service type
 * @interface ServiceDefinition
 * @property {ServiceId} id - Unique identifier for the service type
 * @property {string} name - Display name of the service type
 * @property {string} icon - Emoji icon for the service type
 * @property {string} description - Description of the service type
 * @property {string} color - Primary color for the service type
 * @property {string} hoverColor - Hover color for the service type
 */
export interface ServiceDefinition {
  id: ServiceId;
  name: string;
  icon: string;
  description: string;
  color: string;
  hoverColor: string;
}

/**
 * Available service types
 * @constant {ServiceId[]}
 */
export const SERVICE_IDS: ServiceId[] = ['ride', 'food', 'vape', 'liquor'];

/**
 * Service definitions for each service type
 * @constant {Record<ServiceId, ServiceDefinition>}
 */
export const SERVICE_DEFINITIONS: Record<ServiceId, ServiceDefinition> = {
  ride: {
    id: 'ride',
    name: 'Ride',
    icon: '🚘',
    description: 'Book a ride anywhere',
    color: '#3498db',
    hoverColor: '#2980b9'
  },
  food: {
    id: 'food',
    name: 'Food',
    icon: '🍔',
    description: 'Order food delivery',
    color: '#e74c3c',
    hoverColor: '#c0392b'
  },
  vape: {
    id: 'vape',
    name: 'Vape',
    icon: '🚬',
    description: 'Find vape shops',
    color: '#2ecc71',
    hoverColor: '#27ae60'
  },
  liquor: {
    id: 'liquor',
    name: 'Liquor',
    icon: '🍷',
    description: 'Discover liquor stores',
    color: '#9b59b6',
    hoverColor: '#8e44ad'
  },
  default: {
    id: 'default',
    name: 'Service',
    icon: '📍',
    description: 'General service',
    color: '#95a5a6',
    hoverColor: '#7f8c8d'
  }
};

/**
 * Minimum rating for services
 * @constant {number}
 */
export const MIN_RATING = 1;

/**
 * Maximum rating for services
 * @constant {number}
 */
export const MAX_RATING = 5;

/**
 * Minimum price for services
 * @constant {number}
 */
export const MIN_PRICE = 0;

/**
 * Maximum price for services
 * @constant {number}
 */
export const MAX_PRICE = 1000;

/**
 * Represents a geographical coordinate
 * @interface Coordinate
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 */
export interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * Represents a service in the application
 * @interface Service
 * @property {string} id - Unique identifier for the service
 * @property {ServiceId} type - Type of service
 * @property {string} name - Name of the service
 * @property {string} description - Description of the service
 * @property {number} price - Price of the service
 * @property {number} rating - Rating of the service (1-5)
 * @property {Coordinate} location - Location of the service
 * @property {[number, number]} coordinates - Coordinates of the service [longitude, latitude]
 * @property {string} image - URL of the service image
 * @property {boolean} available - Whether the service is available
 * @property {boolean} [isActive] - Whether the service is currently active
 * @property {string} [lastUpdated] - Last update timestamp
 */
export interface Service {
  id: ServiceId;
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  available: boolean;
  location: Coordinate;
}

/**
 * Represents the icon configuration for a service
 * @interface ServiceIcon
 * @property {string} emoji - Emoji representation of the service
 * @property {string} color - Color of the service icon
 * @property {string} hoverColor - Color of the service icon on hover
 */
export interface ServiceIcon {
  emoji: string;
  color: string;
  hoverColor: string;
}

/**
 * Validates if a string is a valid ServiceId
 * @param {string} id - The id to validate
 * @returns {boolean} True if the id is valid
 */
export function isValidServiceId(id: string): id is ServiceId {
  return SERVICE_IDS.includes(id as ServiceId);
}

/**
 * Validates if a number is a valid rating
 * @param {number} rating - The rating to validate
 * @returns {boolean} True if the rating is valid
 */
export function isValidRating(rating: number): boolean {
  return rating >= MIN_RATING && rating <= MAX_RATING;
}

/**
 * Validates if a number is a valid price
 * @param {number} price - The price to validate
 * @returns {boolean} True if the price is valid
 */
export function isValidPrice(price: number): boolean {
  return price >= MIN_PRICE && price <= MAX_PRICE;
}

/**
 * Validates if an object is a valid Coordinate
 * @param {unknown} coordinate - The object to validate
 * @returns {boolean} True if the object is a valid Coordinate
 */
export function isValidCoordinate(coordinate: unknown): coordinate is Coordinate {
  if (!coordinate || typeof coordinate !== 'object') return false;
  
  const c = coordinate as Coordinate;
  return (
    typeof c.lat === 'number' &&
    typeof c.lng === 'number' &&
    c.lat >= -90 && c.lat <= 90 &&
    c.lng >= -180 && c.lng <= 180
  );
}

/**
 * Validates if an array is a valid coordinate pair
 * @param {unknown} coordinates - The array to validate
 * @returns {boolean} True if the array is a valid coordinate pair
 */
export function isValidCoordinatePair(coordinates: unknown): coordinates is [number, number] {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;
  
  const [lng, lat] = coordinates;
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

/**
 * Validates if an object is a valid Service
 * @param {unknown} service - The object to validate
 * @returns {boolean} True if the object is a valid Service
 */
export function isValidService(service: unknown): service is Service {
  if (!service || typeof service !== 'object') return false;
  
  const s = service as Service;
  return (
    typeof s.id === 'string' &&
    isValidServiceId(s.id) &&
    typeof s.name === 'string' &&
    typeof s.description === 'string' &&
    isValidPrice(s.price) &&
    isValidRating(s.rating) &&
    isValidCoordinate(s.location) &&
    isValidCoordinatePair(s.location.coordinates) &&
    typeof s.image === 'string' &&
    typeof s.available === 'boolean' &&
    (s.isActive === undefined || typeof s.isActive === 'boolean') &&
    (s.lastUpdated === undefined || typeof s.lastUpdated === 'string')
  );
}

/**
 * Validates if an array contains valid Service objects
 * @param {unknown} services - The array to validate
 * @returns {boolean} True if the array contains valid Service objects
 */
export function isValidServiceArray(services: unknown): services is Service[] {
  if (!Array.isArray(services)) return false;
  return services.every(isValidService);
}

/**
 * Validates if an object is a valid ServiceIcon
 * @param {unknown} icon - The object to validate
 * @returns {boolean} True if the object is a valid ServiceIcon
 */
export function isValidServiceIcon(icon: unknown): icon is ServiceIcon {
  if (!icon || typeof icon !== 'object') return false;
  
  const i = icon as ServiceIcon;
  return (
    typeof i.emoji === 'string' &&
    typeof i.color === 'string' &&
    typeof i.hoverColor === 'string'
  );
}

/**
 * Creates a new Service object with default values
 * @param {Partial<Service>} [overrides] - Optional overrides for default values
 * @returns {Service} A new Service object
 */
export function createService(overrides?: Partial<Service>): Service {
  const defaultService: Service = {
    id: 'default',
    name: 'New Service',
    description: 'Service description',
    price: MIN_PRICE,
    rating: MIN_RATING,
    image: '/images/services/default.jpg',
    available: true,
    location: { lat: 0, lng: 0 },
    isActive: false,
    lastUpdated: new Date().toISOString()
  };

  return { ...defaultService, ...overrides };
}

/**
 * Filters services by type
 * @param {Service[]} services - Array of services to filter
 * @param {ServiceId[]} types - Types to filter by
 * @returns {Service[]} Filtered services
 */
export function filterServicesByType(services: Service[], types: ServiceId[]): Service[] {
  if (!isValidServiceArray(services)) return [];
  return services.filter(service => types.includes(service.id));
}

/**
 * Filters services by rating
 * @param {Service[]} services - Array of services to filter
 * @param {number} minRating - Minimum rating
 * @returns {Service[]} Filtered services
 */
export function filterServicesByRating(services: Service[], minRating: number): Service[] {
  if (!isValidServiceArray(services)) return [];
  return services.filter(service => service.rating >= minRating);
}

/**
 * Sorts services by price
 * @param {Service[]} services - Array of services to sort
 * @param {'asc' | 'desc'} [order='asc'] - Sort order
 * @returns {Service[]} Sorted services
 */
export function sortServicesByPrice(services: Service[], order: 'asc' | 'desc' = 'asc'): Service[] {
  if (!isValidServiceArray(services)) return [];
  return [...services].sort((a, b) => order === 'asc' ? a.price - b.price : b.price - a.price);
}

/**
 * Sorts services by rating
 * @param {Service[]} services - Array of services to sort
 * @param {'asc' | 'desc'} [order='desc'] - Sort order
 * @returns {Service[]} Sorted services
 */
export function sortServicesByRating(services: Service[], order: 'asc' | 'desc' = 'desc'): Service[] {
  if (!isValidServiceArray(services)) return [];
  return [...services].sort((a, b) => order === 'asc' ? a.rating - b.rating : b.rating - a.rating);
}

/**
 * Gets active services
 * @param {Service[]} services - Array of services to filter
 * @returns {Service[]} Active services
 */
export function getActiveServices(services: Service[]): Service[] {
  if (!isValidServiceArray(services)) return [];
  return services.filter(service => service.isActive);
}

/**
 * Gets available services
 * @param {Service[]} services - Array of services to filter
 * @returns {Service[]} Available services
 */
export function getAvailableServices(services: Service[]): Service[] {
  if (!isValidServiceArray(services)) return [];
  return services.filter(service => service.available);
}

export interface DisplayableService extends Service {
  type: ServiceId;
  rating?: number;
  reviews?: number;
  distance?: number;
  estimatedTime?: number;
}

export interface Location {
  lat: number;
  lng: number;
}

export type ServiceType = 'ride' | 'food' | 'vape' | 'liquor';

export interface Service {
  id: ServiceType;
  name: string;
  description: string;
  icon: string;
  price?: number;
  rating?: number;
  image?: string;
  available?: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export const SERVICES: Record<ServiceType, Service> = {
  ride: {
    id: 'ride',
    name: 'Ride',
    description: 'Book a ride to your destination',
    icon: '🚗',
    available: true
  },
  food: {
    id: 'food',
    name: 'Food',
    description: 'Order food from local restaurants',
    icon: '🍔',
    available: true
  },
  vape: {
    id: 'vape',
    name: 'Vape',
    description: 'Find vape shops and products',
    icon: '💨',
    available: true
  },
  liquor: {
    id: 'liquor',
    name: 'Liquor',
    description: 'Order drinks for delivery',
    icon: '🍷',
    available: true
  }
}; 