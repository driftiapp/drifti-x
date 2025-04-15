import { NextResponse } from 'next/server';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'service' | 'location' | 'recent';
  metadata?: {
    rating?: number;
    distance?: string;
    openNow?: boolean;
  };
}

// Mock database of suggestions
const suggestionsDatabase: SearchSuggestion[] = [
  {
    id: '1',
    text: 'Pizza near me',
    type: 'service',
    metadata: { rating: 4.5, distance: '0.5km', openNow: true }
  },
  {
    id: '2',
    text: 'Vape shops in Rabat',
    type: 'service',
    metadata: { rating: 4.2, distance: '1.2km', openNow: true }
  },
  {
    id: '3',
    text: 'Casablanca',
    type: 'location',
    metadata: { distance: '80km' }
  },
  {
    id: '4',
    text: 'Restaurants near me',
    type: 'service',
    metadata: { rating: 4.3, distance: '0.3km', openNow: true }
  },
  {
    id: '5',
    text: 'Groceries delivery',
    type: 'service',
    metadata: { rating: 4.7, distance: '1.5km', openNow: true }
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';

    // Filter suggestions based on query
    const filteredSuggestions = suggestionsDatabase.filter(suggestion =>
      suggestion.text.toLowerCase().includes(query)
    );

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json(filteredSuggestions);
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
} 