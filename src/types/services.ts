export type ServiceId = 'ride' | 'food' | 'vape' | 'liquor' | 'default';

export interface ServiceDefinition {
  emoji: string;
  color: string;
  hoverColor: string;
}

export interface Service {
  id: string;
  type: ServiceId;
  name: string;
  description: string;
  price: number;
  rating: number;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  image: string;
  available: boolean;
  isActive: boolean;
  lastUpdated: Date;
}

export const SERVICE_DEFINITIONS: Record<ServiceId, ServiceDefinition> = {
  ride: {
    emoji: '🚗',
    color: '#4CAF50',
    hoverColor: '#388E3C'
  },
  food: {
    emoji: '🍔',
    color: '#FF9800',
    hoverColor: '#F57C00'
  },
  vape: {
    emoji: '💨',
    color: '#2196F3',
    hoverColor: '#1976D2'
  },
  liquor: {
    emoji: '🍾',
    color: '#9C27B0',
    hoverColor: '#7B1FA2'
  },
  default: {
    emoji: '📦',
    color: '#757575',
    hoverColor: '#616161'
  }
};

export const isValidServiceType = (type: string): type is ServiceId => {
  return Object.keys(SERVICE_DEFINITIONS).includes(type);
}; 