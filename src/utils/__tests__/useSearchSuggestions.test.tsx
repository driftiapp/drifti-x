import { renderHook, act } from '@testing-library/react';
import { useSearchSuggestions } from '../useSearchSuggestions';
import type { SearchSuggestion } from '@/types/search';

// Mock the fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockSuggestions: SearchSuggestion[] = [
  {
    id: '1',
    text: 'Pizza delivery',
    type: 'service',
    score: 0,
    metadata: { category: 'food', rating: 4.5 }
  },
  {
    id: '2',
    text: 'Casablanca',
    type: 'location',
    score: 0,
    metadata: { lat: 33.5731, lng: -7.5898 }
  }
];

describe('useSearchSuggestions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty suggestions and not loading', () => {
    const { result } = renderHook(() => useSearchSuggestions(''));
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should not fetch suggestions for empty query', () => {
    renderHook(() => useSearchSuggestions(''));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should fetch and update suggestions for valid query', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSuggestions)
      })
    );

    const { result } = renderHook(() => useSearchSuggestions('pizza'));

    // Should start loading
    expect(result.current.loading).toBe(true);

    // Fast-forward debounce timer
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    // Wait for fetch to complete
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/search-suggestions?q=pizza')
    );
    expect(result.current.suggestions).toEqual(mockSuggestions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    const { result } = renderHook(() => useSearchSuggestions('pizza'));

    // Fast-forward debounce timer
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    // Wait for fetch to complete
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('should handle non-ok response', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500
      })
    );

    const { result } = renderHook(() => useSearchSuggestions('pizza'));

    // Fast-forward debounce timer
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    // Wait for fetch to complete
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to fetch suggestions');
  });
}); 