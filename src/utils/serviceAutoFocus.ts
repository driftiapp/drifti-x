import type { SearchSuggestion } from '@/types/search';

// Define service categories and their keywords
export const SERVICE_CATEGORIES = {
  ride: {
    keywords: ['ride', 'taxi', 'uber', 'lyft', 'driver', 'car', 'transport', 'airport', 'pickup'],
    icon: '🚗',
    priority: 1
  },
  food: {
    keywords: ['food', 'eat', 'restaurant', 'dinner', 'lunch', 'breakfast', 'burger', 'pizza', 'taco', 'sushi'],
    icon: '🍽️',
    priority: 2
  },
  delivery: {
    keywords: ['delivery', 'deliver', 'order', 'takeout', 'take-out', 'pickup', 'bring'],
    icon: '📦',
    priority: 3
  },
  shopping: {
    keywords: ['shop', 'store', 'market', 'mall', 'buy', 'purchase', 'retail'],
    icon: '🛍️',
    priority: 4
  },
  entertainment: {
    keywords: ['movie', 'cinema', 'theater', 'show', 'concert', 'event', 'ticket'],
    icon: '🎭',
    priority: 5
  },
  health: {
    keywords: ['doctor', 'clinic', 'pharmacy', 'medical', 'health', 'hospital', 'drugstore'],
    icon: '🏥',
    priority: 6
  }
} as const;

// Define location-based keywords
export const LOCATION_KEYWORDS = {
  near: ['near', 'nearby', 'close', 'around', 'local'],
  me: ['me', 'my location', 'current location', 'here'],
  open: ['open', 'now', 'today', 'available', '24/7']
};

// Function to detect service category from query
export const detectServiceCategory = (query: string): string | null => {
  const normalizedQuery = query.toLowerCase();
  
  // Check for location keywords first
  const hasLocationKeywords = Object.values(LOCATION_KEYWORDS).some(keywords =>
    keywords.some(keyword => normalizedQuery.includes(keyword))
  );

  // Find matching service category
  for (const [category, { keywords }] of Object.entries(SERVICE_CATEGORIES)) {
    if (keywords.some(keyword => normalizedQuery.includes(keyword))) {
      return category;
    }
  }

  return null;
};

// Function to boost suggestions based on detected category
export const boostCategorySuggestions = (
  suggestions: SearchSuggestion[],
  category: string | null
): SearchSuggestion[] => {
  if (!category) return suggestions;

  return suggestions.map(suggestion => {
    let boost = 0;

    // Boost if suggestion matches the detected category
    if (suggestion.type === 'service' && 
        suggestion.text.toLowerCase().includes(category)) {
      boost += 0.5;
    }

    // Additional boost for location-based queries
    if (suggestion.metadata?.distance) {
      boost += 0.3;
    }

    // Additional boost for open businesses
    if (suggestion.metadata?.openNow) {
      boost += 0.2;
    }

    return {
      ...suggestion,
      score: (suggestion.score || 0) - boost
    };
  });
};

// Function to generate quick actions based on query
export const generateQuickActions = (query: string): SearchSuggestion[] => {
  const category = detectServiceCategory(query);
  if (!category) return [];

  const categoryConfig = SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES];
  const now = new Date();

  return [
    {
      id: `quick-${category}-1`,
      text: `Find ${category} near me`,
      type: 'service',
      metadata: {
        timestamp: now.getTime()
      }
    },
    {
      id: `quick-${category}-2`,
      text: `Order ${category} now`,
      type: 'service',
      metadata: {
        timestamp: now.getTime()
      }
    },
    {
      id: `quick-${category}-3`,
      text: `Best ${category} places`,
      type: 'service',
      metadata: {
        timestamp: now.getTime()
      }
    }
  ];
}; 