import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number).default('3000'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/drifti-x'),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SENTRY_DSN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
});

const env = envSchema.parse(process.env);

export interface Config {
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  corsOrigin: string;
  sentryDsn?: string;
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

export const config: Config = {
  port: env.PORT,
  mongodbUri: env.MONGODB_URI,
  jwtSecret: env.JWT_SECRET,
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  corsOrigin: env.CORS_ORIGIN,
  sentryDsn: env.SENTRY_DSN,
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },
}; 