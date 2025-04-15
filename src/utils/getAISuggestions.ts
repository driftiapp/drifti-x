import { SearchSuggestion } from '@/types/search';

interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

interface AISuggestionContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  location?: Location;
  previousSearches: string[];
}

const TIME_BASED_SUGGESTIONS = {
  morning: [
    { text: 'Coffee shops', type: 'service' as const, metadata: { openNow: true } },
    { text: 'Breakfast places', type: 'service' as const, metadata: { openNow: true } },
    { text: 'Gym', type: 'service' as const, metadata: { openNow: true } }
  ],
  afternoon: [
    { text: 'Lunch spots', type: 'service' as const, metadata: { openNow: true } },
    { text: 'Shopping', type: 'service' as const, metadata: { openNow: true } },
    { text: 'Parks', type: 'location' as const, metadata: { openNow: true } }
  ],
  evening: [
    { text: 'Dinner restaurants', type: 'service' as const, metadata: { openNow: true } },
    { text: 'Movie theaters', type: 'service' as const, metadata: { openNow: true } },
    { text: 'Bars', type: 'service' as const, metadata: { openNow: true } }
  ],
  night: [
    { text: 'Late night food', type: 'service' as const, metadata: { openNow: true } },
    { text: '24-hour pharmacy', type: 'service' as const, metadata: { openNow: true } },
    { text: 'Gas stations', type: 'service' as const, metadata: { openNow: true } }
  ]
};

const CONTEXT_SUGGESTIONS = {
  'airport': [
    { text: 'Ride to airport', type: 'service' as const },
    { text: 'Airport parking', type: 'service' as const },
    { text: 'Airport hotels', type: 'service' as const }
  ],
  'hotel': [
    { text: 'Hotel booking', type: 'service' as const },
    { text: 'Hotel restaurants', type: 'service' as const },
    { text: 'Hotel amenities', type: 'service' as const }
  ],
  'restaurant': [
    { text: 'Restaurant reservations', type: 'service' as const },
    { text: 'Restaurant reviews', type: 'service' as const },
    { text: 'Restaurant deals', type: 'service' as const }
  ]
};

export async function getAISuggestions(
  query: string,
  context: AISuggestionContext
): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = [];
  
  // Add time-based suggestions if query is empty
  if (!query) {
    suggestions.push(...TIME_BASED_SUGGESTIONS[context.timeOfDay]);
  }

  // Add context-based suggestions
  for (const [keyword, keywordSuggestions] of Object.entries(CONTEXT_SUGGESTIONS)) {
    if (query.toLowerCase().includes(keyword)) {
      suggestions.push(...keywordSuggestions);
    }
  }

  // Add location-based suggestions if available
  if (context.location) {
    suggestions.push(
      {
        id: 'nearby',
        text: `Services near ${context.location.city || 'you'}`,
        type: 'service',
        metadata: { distance: 'Nearby' }
      },
      {
        id: 'local',
        text: `Local attractions in ${context.location.city || 'your area'}`,
        type: 'location',
        metadata: { distance: 'Local' }
      }
    );
  }

  // Add previous search context
  if (context.previousSearches.length > 0) {
    const lastSearch = context.previousSearches[0];
    if (lastSearch.includes('to') || lastSearch.includes('from')) {
      suggestions.push({
        id: 'related',
        text: `More ${lastSearch.split(' ')[0]} options`,
        type: 'service',
        metadata: { timestamp: Date.now() }
      });
    }
  }

  // Remove duplicates
  const uniqueSuggestions = suggestions.filter(
    (suggestion, index, self) =>
      index === self.findIndex((s) => s.text === suggestion.text)
  );

  return uniqueSuggestions;
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export async function getCurrentLocation(): Promise<Location | undefined> {
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    // In a real app, you'd call a reverse geocoding API here
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      city: 'Current Location'
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return undefined;
  }
} 