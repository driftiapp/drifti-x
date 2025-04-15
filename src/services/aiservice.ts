import { AISuggestionContext, Location } from '../types/search';

const API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:3001/api/ai';
const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY;

interface AIResponse {
  suggestions: Array<{
    text: string;
    type: 'service' | 'location' | 'category';
    metadata: {
      category?: string;
      lat?: number;
      lng?: number;
    };
    score: number;
  }>;
  error?: string;
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class AIService {
  private static instance: AIService;
  private cache: Map<string, AIResponse> = new Map();

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async fetchWithRetry(
    endpoint: string,
    options: RequestInit,
    retries = 3
  ): Promise<Response> {
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 429 && retries > 0) {
          // Rate limit hit, wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.fetchWithRetry(endpoint, options, retries - 1);
        }
        throw new AIServiceError(
          `AI service error: ${response.statusText}`,
          response.status
        );
      }

      return response;
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      throw new AIServiceError(
        'Failed to connect to AI service',
        500,
        'CONNECTION_ERROR'
      );
    }
  }

  public async getSuggestions(
    query: string,
    context: AISuggestionContext
  ): Promise<AIResponse> {
    const cacheKey = `${query}-${JSON.stringify(context)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.fetchWithRetry(
        `${API_BASE_URL}/suggestions`,
        {
          method: 'POST',
          body: JSON.stringify({ query, context }),
        }
      );

      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      throw new AIServiceError(
        'Failed to get AI suggestions',
        500,
        'SUGGESTION_ERROR'
      );
    }
  }

  public async getLocationSuggestions(
    query: string,
    currentLocation?: Location
  ): Promise<AIResponse> {
    const cacheKey = `location-${query}-${JSON.stringify(currentLocation)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.fetchWithRetry(
        `${API_BASE_URL}/locations`,
        {
          method: 'POST',
          body: JSON.stringify({ query, currentLocation }),
        }
      );

      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      throw new AIServiceError(
        'Failed to get location suggestions',
        500,
        'LOCATION_ERROR'
      );
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const aiService = AIService.getInstance(); 