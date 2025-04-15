import { Service } from '../types/services';

export const mockServices: Service[] = [
  {
    id: '1',
    type: 'ride',
    name: 'Uber Pickup Point',
    latitude: 40.7128,
    longitude: -74.0060,
    description: 'Available 24/7',
    rating: 4.8
  },
  {
    id: '2',
    type: 'food',
    name: 'Pizza Paradise',
    latitude: 40.7138,
    longitude: -74.0070,
    description: 'Best pizza in town',
    rating: 4.5,
    priceRange: '$$'
  },
  {
    id: '3',
    type: 'vape',
    name: 'Cloud 9 Vape Shop',
    latitude: 40.7148,
    longitude: -74.0080,
    description: 'Wide selection of vapes',
    rating: 4.2
  },
  {
    id: '4',
    type: 'liquor',
    name: 'Bottle Shop',
    latitude: 40.7158,
    longitude: -74.0090,
    description: 'Fine wines and spirits',
    rating: 4.6,
    priceRange: '$$$'
  },
  {
    id: '5',
    type: 'food',
    name: 'Burger Joint',
    latitude: 40.7168,
    longitude: -74.0100,
    description: 'Gourmet burgers',
    rating: 4.7,
    priceRange: '$$'
  },
  {
    id: '6',
    type: 'ride',
    name: 'Lyft Station',
    latitude: 40.7178,
    longitude: -74.0110,
    description: 'Quick pickups',
    rating: 4.9
  }
];

const duplicates = findDuplicateIds(mockServices);
if (duplicates.length > 0) {
  console.warn('Found duplicate IDs:', duplicates);
}

// Generate 10 new services, avoiding conflicts with existing ones
const newServices = generateRandomServices(10, mockServices);

const allServices = [...mockServices, ...newServices]; 