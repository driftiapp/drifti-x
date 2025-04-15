import { renderHook, act } from '@testing-library/react';
import { useSearchHistory } from '../useSearchHistory';
import type { SearchSuggestion } from '../../types/search';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

const createMockSuggestion = (text: string): SearchSuggestion => ({
  id: Math.random().toString(),
  text,
  type: 'service',
  metadata: {
    category: 'food',
    lat: 0,
    lng: 0,
  },
  score: 0,
});

describe('useSearchHistory', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
    mockLocalStorage.removeItem.mockReset();
  });

  it('should initialize with empty history', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
  });

  it('should load existing history from localStorage', () => {
    const mockHistory = [
      createMockSuggestion('Pizza'),
      createMockSuggestion('Burger'),
    ];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockHistory));
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual(mockHistory);
  });

  it('should handle invalid JSON in localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid json');
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('searchHistory');
  });

  it('should add new items to history', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory(createMockSuggestion('Pizza'));
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].text).toBe('Pizza');
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('should remove duplicates when adding items', () => {
    const mockHistory = [createMockSuggestion('Pizza')];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockHistory));
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory(createMockSuggestion('Pizza'));
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].text).toBe('Pizza');
  });

  it('should limit history to 10 items', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useSearchHistory());

    // Add 11 items
    for (let i = 0; i < 11; i++) {
      act(() => {
        result.current.addToHistory(createMockSuggestion(`Item ${i}`));
      });
    }

    expect(result.current.history).toHaveLength(10);
    expect(result.current.history[0].text).toBe('Item 1'); // First item should be removed
    expect(result.current.history[9].text).toBe('Item 10'); // Last item should be kept
  });

  it('should clear history', () => {
    const mockHistory = [createMockSuggestion('Pizza')];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockHistory));
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toEqual([]);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('searchHistory');
  });
}); 