import { useState, useEffect } from 'react';
import type { SearchSuggestion } from '@/types/search';

const HISTORY_KEY = 'driftix_search_history';
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchSuggestion[]>([]);

  useEffect(() => {
    // Load history from localStorage on mount
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Failed to parse search history:', err);
        localStorage.removeItem(HISTORY_KEY);
      }
    }
  }, []);

  const addToHistory = (item: SearchSuggestion) => {
    setHistory(prevHistory => {
      // Remove duplicates and add new item at the start
      const newHistory = [
        item,
        ...prevHistory.filter(h => h.text !== item.text)
      ].slice(0, MAX_HISTORY_ITEMS);

      // Save to localStorage
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  return {
    history,
    addToHistory,
    clearHistory
  };
} 