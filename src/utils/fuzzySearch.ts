import Fuse from 'fuse.js';
import type { SearchSuggestion } from '@/types/search';

// Configure Fuse.js options
const fuseOptions = {
  keys: ['text', 'metadata.rating', 'metadata.distance'],
  threshold: 0.3,
  distance: 100,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  useExtendedSearch: true,
};

// Create a function to highlight matched characters
export const highlightMatches = (text: string, matches: readonly Fuse.FuseResultMatch[] | undefined) => {
  if (!matches || matches.length === 0) return text;

  const match = matches[0];
  if (!match.indices || match.indices.length === 0) return text;

  let result = '';
  let lastIndex = 0;

  match.indices.forEach(([start, end]: [number, number]) => {
    // Add the text before the match
    result += text.slice(lastIndex, start);
    // Add the highlighted match
    result += `<mark class="bg-yellow-200">${text.slice(start, end + 1)}</mark>`;
    lastIndex = end + 1;
  });

  // Add any remaining text
  result += text.slice(lastIndex);

  return result;
};

// Create a function to perform fuzzy search
export const performFuzzySearch = (
  query: string,
  suggestions: SearchSuggestion[]
): SearchSuggestion[] => {
  if (!query) return suggestions;

  const fuse = new Fuse(suggestions, fuseOptions);
  const results = fuse.search(query);

  // Transform results to include highlighted text and maintain original structure
  return results.map(result => ({
    ...result.item,
    text: highlightMatches(result.item.text, result.matches),
    score: result.score || 0,
  }));
};

// Create a function to boost scores based on metadata
export const boostScores = (suggestions: SearchSuggestion[]): SearchSuggestion[] => {
  return suggestions.map(suggestion => {
    let boost = 0;

    // Boost based on rating
    if (suggestion.metadata?.rating) {
      boost += suggestion.metadata.rating * 0.1;
    }

    // Boost based on distance (closer is better)
    if (suggestion.metadata?.distance) {
      const distance = parseFloat(suggestion.metadata.distance);
      if (!isNaN(distance)) {
        boost += (1 / (distance + 1)) * 0.2;
      }
    }

    // Boost if open now
    if (suggestion.metadata?.openNow) {
      boost += 0.3;
    }

    return {
      ...suggestion,
      score: (suggestion.score || 0) - boost,
    };
  });
}; 