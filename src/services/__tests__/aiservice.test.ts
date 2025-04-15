import { aiService, AIServiceError } from '../aiservice';
import { AISuggestionContext, Location } from '../../types/search';

// Mock fetch
global.fetch = jest.fn();

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    aiService.clearCache();
  });

  const mockContext: AISuggestionContext = {
    timeOfDay: 'afternoon',
    currentLocation: {
      lat: 40.7128,
      lng: -74.0060,
      city: 'New York',
    },
    userPreferences: {
      categories: ['food', 'shopping'],
      priceRange: 'medium',
    },
  };

  const mockLocation: Location = {
    lat: 40.7128,
    lng: -74.0060,
    city: 'New York',
  };

  it('should return cached suggestions if available', async () => {
    const mockResponse = {
      suggestions: [
        {
          text: 'Pizza',
          type: 'service',
          metadata: { category: 'food' },
          score: 0.9,
        },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    // First call - should fetch from API
    await aiService.getSuggestions('pizza', mockContext);
    expect(fetch).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    const result = await aiService.getSuggestions('pizza', mockContext);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponse);
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      aiService.getSuggestions('pizza', mockContext)
    ).rejects.toThrow(AIServiceError);
  });

  it('should retry on rate limit', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            suggestions: [
              {
                text: 'Pizza',
                type: 'service',
                metadata: { category: 'food' },
                score: 0.9,
              },
            ],
          }),
      });

    await aiService.getSuggestions('pizza', mockContext);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle location suggestions', async () => {
    const mockResponse = {
      suggestions: [
        {
          text: 'New York Pizza',
          type: 'location',
          metadata: {
            lat: 40.7128,
            lng: -74.0060,
          },
          score: 0.9,
        },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await aiService.getLocationSuggestions('pizza', mockLocation);
    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/locations'),
      expect.any(Object)
    );
  });

  it('should clear cache when requested', async () => {
    const mockResponse = {
      suggestions: [
        {
          text: 'Pizza',
          type: 'service',
          metadata: { category: 'food' },
          score: 0.9,
        },
      ],
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    // First call - should fetch from API
    await aiService.getSuggestions('pizza', mockContext);
    expect(fetch).toHaveBeenCalledTimes(1);

    // Clear cache
    aiService.clearCache();

    // Second call - should fetch again
    await aiService.getSuggestions('pizza', mockContext);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
}); 