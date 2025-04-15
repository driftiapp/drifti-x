import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import type { SearchSuggestion } from '@/types/search';
import { detectServiceCategory, boostCategorySuggestions } from './serviceAutoFocus';

export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery.trim()) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(debouncedQuery)}`);
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        
        const data = await response.json();
        const category = detectServiceCategory(debouncedQuery);
        const boostedSuggestions = boostCategorySuggestions(data, category);
        
        setSuggestions(boostedSuggestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  return { suggestions, loading, error };
} 