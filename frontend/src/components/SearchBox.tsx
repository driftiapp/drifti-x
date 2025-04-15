import { useState, useEffect, useRef } from 'react';
import { GeocodingResponse, SearchResult, RecentSearch } from '@/types/geocoding';
import { ServiceType } from '@/types/services';
import { VoiceSearchFeedback } from '@/components/VoiceSearchFeedback';

// Add type definitions for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SearchBoxProps {
  onSelect: (result: SearchResult) => void;
  onClear: () => void;
  mapboxToken: string;
  onFilterChange?: (filters: ServiceType[]) => void;
  activeFilters?: ServiceType[];
}

const MAX_RECENT_SEARCHES = 5;
const RECENT_SEARCHES_KEY = 'driftix_recent_searches';

// Keyword to service type mapping
const keywordMap: Record<string, ServiceType[]> = {
  // Food keywords
  'pizza|burger|taco|food|restaurant|eat|dining|meal|delivery|takeout': ['food'],
  'vape|smoke|disposable|e-cig|nicotine': ['vape'],
  'liquor|wine|beer|alcohol|bar|pub|drink|spirits': ['liquor'],
  'ride|taxi|cab|uber|lyft|transport|car': ['ride']
};

export const SearchBox: React.FC<SearchBoxProps> = ({ 
  onSelect, 
  onClear, 
  mapboxToken,
  onFilterChange,
  activeFilters = []
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [showVoiceFeedback, setShowVoiceFeedback] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition as new () => SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        setRecognitionError(`Speech recognition error: ${event.error}`);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setShowResults(true);
      };

      recognitionRef.current = recognition;
    } else {
      setRecognitionError('Speech recognition is not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setRecognitionError('Speech recognition is not available');
      return;
    }

    try {
      recognition.start();
      setShowVoiceFeedback(true);
    } catch (error) {
      setRecognitionError('Failed to start speech recognition');
    }
  };

  const stopListening = () => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.stop();
    }
  };

  // Extract keywords from query and match to service types
  const getMatchingFilters = (searchQuery: string): ServiceType[] => {
    const matches: ServiceType[] = [];
    Object.entries(keywordMap).forEach(([pattern, types]) => {
      if (new RegExp(pattern, 'i').test(searchQuery)) {
        matches.push(...types);
      }
    });
    return [...new Set(matches)]; // Remove duplicates
  };

  useEffect(() => {
    // Load recent searches from localStorage
    try {
      const storedSearches = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (storedSearches) {
        const parsedSearches = JSON.parse(storedSearches) as RecentSearch[];
        setRecentSearches(parsedSearches);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  const saveRecentSearch = (result: SearchResult) => {
    const newRecent: RecentSearch = {
      ...result,
      timestamp: Date.now()
    };

    setRecentSearches(prev => {
      const updated = [
        newRecent,
        ...prev.filter(item => item.id !== result.id)
      ].slice(0, MAX_RECENT_SEARCHES);

      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recent searches:', error);
      }
      return updated;
    });
  };

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Check for keyword matches and update filters
    const matchingFilters = getMatchingFilters(query);
    if (matchingFilters.length > 0 && onFilterChange) {
      onFilterChange(matchingFilters);
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=address,poi,place`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: GeocodingResponse = await response.json();
        
        const formattedResults: SearchResult[] = data.features.map(feature => ({
          id: feature.id,
          name: feature.text,
          latitude: feature.center[1],
          longitude: feature.center[0],
          address: feature.place_name,
          type: feature.place_type[0]
        }));
        
        setResults(formattedResults);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, mapboxToken, onFilterChange]);

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(result);
    onSelect(result);
    setQuery(result.name);
    setShowResults(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onClear();
    if (onFilterChange) {
      onFilterChange([]);
    }
    inputRef.current?.focus();
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => {
            // Delay hiding results to allow for click events
            setTimeout(() => setShowResults(false), 200);
          }}
          placeholder="Search locations or services..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {query && (
            <button
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          <button
            onClick={isListening ? stopListening : startListening}
            className={`p-1 rounded-full transition-colors ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice search'}
            aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {recognitionError && (
        <div className="mt-1 text-sm text-red-500">
          {recognitionError}
        </div>
      )}

      <VoiceSearchFeedback
        isListening={isListening}
        query={query}
        activeFilters={activeFilters}
        onClose={() => setShowVoiceFeedback(false)}
      />
      
      {showResults && (
        <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((result) => (
                <li
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-medium">{result.name}</div>
                  <div className="text-sm text-gray-500">{result.address}</div>
                </li>
              ))}
            </ul>
          ) : query.length < 2 && recentSearches.length > 0 ? (
            <div>
              <div className="px-4 py-2 text-sm text-gray-500 border-b">Recent searches</div>
              <ul>
                {recentSearches.map((search) => (
                  <li
                    key={`${search.id}-${search.timestamp}`}
                    onClick={() => handleSelect(search)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="flex items-center">
                      <span className="mr-2">📍</span>
                      <div>
                        <div className="font-medium">{search.name}</div>
                        <div className="text-sm text-gray-500">
                          {search.address}
                          <span className="ml-2 text-xs text-gray-400">
                            {formatTimeAgo(search.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}; 