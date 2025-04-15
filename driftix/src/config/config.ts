import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  PORT: z.string().transform(Number).default('3000'),
  MONGO_URI: z.string().default('mongodb://localhost:27017/driftix'),
  JWT_SECRET: z.string().min(32).default('your-secret-key'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_VERSION: z.string().default('v1'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().transform(Number).default('100')
});

/**
 * Validated environment variables
 */
const env = envSchema.parse(process.env);

/**
 * Rate limit configuration
 */
export interface IRateLimitConfig {
  windowMs: number;
  max: number;
}

/**
 * Main application configuration
 */
export interface IConfig {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  environment: 'development' | 'production' | 'test';
  apiVersion: string;
  corsOrigin: string;
  rateLimit: IRateLimitConfig;
}

/**
 * Application configuration object
 */
export const config: IConfig = {
  port: env.PORT,
  mongoUri: env.MONGO_URI,
  jwtSecret: env.JWT_SECRET,
  logLevel: env.LOG_LEVEL,
  environment: env.NODE_ENV,
  apiVersion: env.API_VERSION,
  corsOrigin: env.CORS_ORIGIN,
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX
  }
};

/**
 * Helper function to get a configuration value
 * @param key - The configuration key to get
 * @returns The configuration value
 * @throws Error if the key is invalid
 */
export function getConfigValue<K extends keyof IConfig>(key: K): IConfig[K] {
  if (!(key in config)) {
    throw new Error(`Invalid configuration key: ${key}`);
  }
  return config[key];
}

/**
 * Helper function to check if the application is in production mode
 * @returns True if the application is in production mode
 */
export function isProduction(): boolean {
  return config.environment === 'production';
}

/**
 * Helper function to check if the application is in development mode
 * @returns True if the application is in development mode
 */
export function isDevelopment(): boolean {
  return config.environment === 'development';
}

/**
 * Helper function to check if the application is in test mode
 * @returns True if the application is in test mode
 */
export function isTest(): boolean {
  return config.environment === 'test';
} 