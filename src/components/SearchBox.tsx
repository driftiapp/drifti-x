'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Search, MapPin, History, TrendingUp, Loader2, Clock } from 'lucide-react';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'history' | 'trending' | 'location';
  metadata?: {
    timestamp?: number;
    distance?: string;
  };
}

interface SuggestionGroup {
  title: string;
  icon: React.ReactNode;
  items: SearchSuggestion[];
}

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionGroup[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce the search query
  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock API response with grouped suggestions
        const mockSuggestions: SuggestionGroup[] = [
          {
            title: 'Trending Now',
            icon: <TrendingUp size={16} className="text-orange-500" />,
            items: [
              { id: 't1', text: `Best ${debouncedQuery}`, type: 'trending' },
              { id: 't2', text: `${debouncedQuery} delivery`, type: 'trending' },
              { id: 't3', text: `${debouncedQuery} near me`, type: 'trending' },
            ]
          },
          {
            title: 'Recent Searches',
            icon: <Clock size={16} className="text-blue-500" />,
            items: [
              { id: 'r1', text: `${debouncedQuery} in New York`, type: 'history', metadata: { timestamp: Date.now() - 3600000 } },
              { id: 'r2', text: `${debouncedQuery} delivery`, type: 'history', metadata: { timestamp: Date.now() - 7200000 } },
            ]
          },
          {
            title: 'Nearby Locations',
            icon: <MapPin size={16} className="text-green-500" />,
            items: [
              { id: 'l1', text: `${debouncedQuery} in Brooklyn`, type: 'location', metadata: { distance: '0.5 miles' } },
              { id: 'l2', text: `${debouncedQuery} in Manhattan`, type: 'location', metadata: { distance: '1.2 miles' } },
            ]
          }
        ];

        setSuggestions(mockSuggestions);
      } catch (err) {
        setError('Failed to fetch suggestions. Please try again.');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // TODO: Implement actual search
      console.log('Searching for:', query);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => {
          const totalItems = suggestions.reduce((sum, group) => sum + group.items.length, 0);
          return prev < totalItems - 1 ? prev + 1 : prev;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault();
          let currentIndex = 0;
          for (const group of suggestions) {
            if (currentIndex + group.items.length > activeIndex) {
              setQuery(group.items[activeIndex - currentIndex].text);
              setIsFocused(false);
              break;
            }
            currentIndex += group.items.length;
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsFocused(false);
        setActiveIndex(-1);
        break;
      case 'Tab':
        if (activeIndex >= 0) {
          e.preventDefault();
          let currentIndex = 0;
          for (const group of suggestions) {
            if (currentIndex + group.items.length > activeIndex) {
              setQuery(group.items[activeIndex - currentIndex].text);
              break;
            }
            currentIndex += group.items.length;
          }
        }
        break;
    }
  };

  const getIconForType = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'location':
        return <MapPin size={16} className="text-gray-400" />;
      case 'history':
        return <History size={16} className="text-gray-400" />;
      case 'trending':
        return <TrendingUp size={16} className="text-gray-400" />;
      default:
        return <Search size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Search for services, locations..."
            className="w-full px-4 py-3 pl-12 pr-4 text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search"
            aria-expanded={isFocused && suggestions.length > 0}
            aria-controls="search-suggestions"
            role="combobox"
            aria-autocomplete="list"
          />
          <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          {isLoading && (
            <Loader2 
              size={16} 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" 
            />
          )}
        </div>
      </form>

      {isFocused && (suggestions.length > 0 || isLoading || error) && (
        <div 
          ref={suggestionsRef}
          id="search-suggestions"
          className="absolute w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto"
          role="listbox"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Searching...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              {error}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No results found
            </div>
          ) : (
            <>
              {suggestions.map((group, groupIndex) => (
                <div key={group.title} className="py-2">
                  <div className="px-4 py-2 flex items-center gap-2 text-sm font-medium text-gray-500 border-b border-gray-100">
                    {group.icon}
                    {group.title}
                  </div>
                  {group.items.map((suggestion, itemIndex) => {
                    const index = suggestions
                      .slice(0, groupIndex)
                      .reduce((sum, g) => sum + g.items.length, 0) + itemIndex;
                    
                    return (
                      <button
                        key={suggestion.id}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 ${
                          activeIndex === index ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => {
                          setQuery(suggestion.text);
                          inputRef.current?.focus();
                        }}
                        role="option"
                        aria-selected={activeIndex === index}
                      >
                        {getIconForType(suggestion.type)}
                        <div className="flex-1">
                          <span className="text-gray-900">{suggestion.text}</span>
                          {suggestion.metadata?.distance && (
                            <span className="ml-2 text-xs text-gray-500">
                              {suggestion.metadata.distance}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
} 