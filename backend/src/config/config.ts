import dotenv from 'dotenv';
import { z } from 'zod';
import { AppError, ErrorCode } from '../utils/errors';
import { logger } from '../utils/logger';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Environment variable validation schema with enhanced validation rules
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().transform(Number).refine((val) => val > 0 && val < 65536, {
    message: 'Port must be between 1 and 65535'
  }).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_VERSION: z.string().regex(/^v\d+$/).default('v1'),
  CORS_ORIGIN: z.string().default('*'),
  
  // Database Configuration
  MONGO_URI: z.string().url().default('mongodb://localhost:27017/driftix'),
  MONGO_USER: z.string().optional(),
  MONGO_PASS: z.string().optional(),
  MONGO_DB: z.string().default('driftix'),
  MONGO_POOL_SIZE: z.string().transform(Number).default('10'),
  
  // Security Configuration
  JWT_SECRET: z.string().min(32).default('your-secret-key'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  SESSION_SECRET: z.string().min(32).default('your-session-secret'),
  SESSION_MAX_AGE: z.string().transform(Number).default('86400000'), // 24 hours
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  
  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().optional(),
  LOG_MAX_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  LOG_MAX_FILES: z.string().transform(Number).default('5'),
  
  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  SMTP_SECURE: z.string().transform((val) => val === 'true').default('true'),
  
  // Redis Configuration
  REDIS_URL: z.string().url().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_ENDPOINT: z.string().url().optional(),
  
  // Feature Flags
  ENABLE_CACHE: z.string().transform((val) => val === 'true').default('true'),
  ENABLE_RATE_LIMIT: z.string().transform((val) => val === 'true').default('true'),
  ENABLE_LOGGING: z.string().transform((val) => val === 'true').default('true'),
  ENABLE_METRICS: z.string().transform((val) => val === 'true').default('true'),
  
  // Application Settings
  APP_NAME: z.string().default('Driftix'),
  APP_DESCRIPTION: z.string().default('Driftix API'),
  APP_VERSION: z.string().default('1.0.0'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  APP_CONTACT_EMAIL: z.string().email().optional(),
  APP_CONTACT_URL: z.string().url().optional(),
  APP_LICENSE: z.string().default('MIT'),
  
  // API Documentation
  SWAGGER_ENABLED: z.string().transform((val) => val === 'true').default('true'),
  SWAGGER_PATH: z.string().default('/api-docs'),
  
  // Health Check
  HEALTH_CHECK_PATH: z.string().default('/health'),
  HEALTH_CHECK_INTERVAL: z.string().transform(Number).default('30000'), // 30 seconds
  HEALTH_CHECK_TIMEOUT: z.string().transform(Number).default('5000'), // 5 seconds
});

/**
 * Validated environment variables
 */
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
  console.log('Environment variables validated successfully');
} catch (error) {
  console.error('Environment variable validation failed:', error);
  throw new AppError('Invalid environment configuration', ErrorCode.CONFIGURATION_ERROR, {
    metadata: { error },
    errorType: 'technical',
    errorSource: 'server'
  });
}

/**
 * Rate limit configuration
 */
export interface IRateLimitConfig {
  windowMs: number;
  max: number;
  enabled: boolean;
}

/**
 * Session configuration
 */
export interface ISessionConfig {
  secret: string;
  maxAge: number;
  secure: boolean;
}

/**
 * SMTP configuration
 */
export interface ISmtpConfig {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
  secure: boolean;
}

/**
 * Redis configuration
 */
export interface IRedisConfig {
  url?: string;
  password?: string;
  db: number;
}

/**
 * AWS configuration
 */
export interface IAwsConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  bucketName?: string;
  endpoint?: string;
}

/**
 * Logging configuration
 */
export interface ILoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  file?: string;
  maxSize: number;
  maxFiles: number;
  enabled: boolean;
}

/**
 * Health check configuration
 */
export interface IHealthCheckConfig {
  path: string;
  interval: number;
  timeout: number;
}

/**
 * Main application configuration
 */
export interface IConfig {
  // Server Configuration
  port: number;
  environment: 'development' | 'production' | 'test';
  apiVersion: string;
  corsOrigin: string;
  logLevel: string;
  
  // Database Configuration
  mongoUri: string;
  mongoUser?: string;
  mongoPass?: string;
  mongoDb: string;
  mongoPoolSize: number;
  
  // Security Configuration
  jwtSecret: string;
  jwtExpiresIn: string;
  rateLimit: IRateLimitConfig;
  session: ISessionConfig;
  
  // Service Configuration
  smtp?: ISmtpConfig;
  redis?: IRedisConfig;
  aws?: IAwsConfig;
  logging: ILoggingConfig;
  healthCheck: IHealthCheckConfig;
  
  // Feature Flags
  enableCache: boolean;
  enableMetrics: boolean;
  
  // Application Settings
  appName: string;
  appDescription: string;
  appVersion: string;
  appUrl: string;
  appContactEmail?: string;
  appContactUrl?: string;
  appLicense: string;
  
  // API Documentation
  swaggerEnabled: boolean;
  swaggerPath: string;

  cleanup: {
    interval: number;
    watchPatterns: string[];
    ignoredPaths: string[];
    logRotation: {
      maxSize: string;
      maxFiles: string;
    };
  };
}

/**
 * Application configuration object
 */
export const config: IConfig = {
  // Server Configuration
  port: env.PORT,
  environment: env.NODE_ENV,
  apiVersion: env.API_VERSION,
  corsOrigin: env.CORS_ORIGIN,
  logLevel: env.LOG_LEVEL,
  
  // Database Configuration
  mongoUri: env.MONGO_URI,
  mongoUser: env.MONGO_USER,
  mongoPass: env.MONGO_PASS,
  mongoDb: env.MONGO_DB,
  mongoPoolSize: env.MONGO_POOL_SIZE,
  
  // Security Configuration
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    enabled: env.ENABLE_RATE_LIMIT
  },
  session: {
    secret: env.SESSION_SECRET,
    maxAge: env.SESSION_MAX_AGE,
    secure: env.NODE_ENV === 'production'
  },
  
  // Service Configuration
  smtp: env.SMTP_HOST ? {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
    secure: env.SMTP_SECURE
  } : undefined,
  
  redis: env.REDIS_URL ? {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB
  } : undefined,
  
  aws: env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    bucketName: env.AWS_BUCKET_NAME,
    endpoint: env.AWS_ENDPOINT
  } : undefined,
  
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
    maxSize: env.LOG_MAX_SIZE,
    maxFiles: env.LOG_MAX_FILES,
    enabled: env.ENABLE_LOGGING
  },
  
  healthCheck: {
    path: env.HEALTH_CHECK_PATH,
    interval: env.HEALTH_CHECK_INTERVAL,
    timeout: env.HEALTH_CHECK_TIMEOUT
  },
  
  // Feature Flags
  enableCache: env.ENABLE_CACHE,
  enableMetrics: env.ENABLE_METRICS,
  
  // Application Settings
  appName: env.APP_NAME,
  appDescription: env.APP_DESCRIPTION,
  appVersion: env.APP_VERSION,
  appUrl: env.APP_URL,
  appContactEmail: env.APP_CONTACT_EMAIL,
  appContactUrl: env.APP_CONTACT_URL,
  appLicense: env.APP_LICENSE,
  
  // API Documentation
  swaggerEnabled: env.SWAGGER_ENABLED,
  swaggerPath: env.SWAGGER_PATH,

  cleanup: {
    interval: process.env.CLEANUP_INTERVAL ? parseInt(process.env.CLEANUP_INTERVAL) : 300000, // 5 minutes
    watchPatterns: ['src/**/*.ts', 'src/**/*.tsx'],
    ignoredPaths: [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.next',
      '*.log',
      '*.tmp'
    ],
    logRotation: {
      maxSize: '20m',
      maxFiles: '14d'
    }
  }
};

/**
 * Helper function to get a configuration value
 * @param key - The configuration key to get
 * @returns The configuration value
 * @throws {AppError} if the key is invalid
 */
export function getConfigValue<K extends keyof IConfig>(key: K): IConfig[K] {
  if (!(key in config)) {
    throw new AppError(`Invalid configuration key: ${key}`, ErrorCode.CONFIGURATION_ERROR, {
      metadata: { key },
      errorType: 'technical',
      errorSource: 'server'
    });
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

/**
 * Helper function to check if email service is configured
 * @returns True if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!config.smtp?.host;
}

/**
 * Helper function to check if AWS is configured
 * @returns True if AWS is configured
 */
export function isAwsConfigured(): boolean {
  return !!config.aws?.accessKeyId;
}

/**
 * Helper function to check if Redis is configured
 * @returns True if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return !!config.redis?.url;
}

/**
 * Helper function to check if caching is enabled
 * @returns True if caching is enabled
 */
export function isCacheEnabled(): boolean {
  return config.enableCache;
}

/**
 * Helper function to check if metrics are enabled
 * @returns True if metrics are enabled
 */
export function isMetricsEnabled(): boolean {
  return config.enableMetrics;
}

/**
 * Helper function to check if logging is enabled
 * @returns True if logging is enabled
 */
export function isLoggingEnabled(): boolean {
  return config.logging.enabled;
}

/**
 * Helper function to check if rate limiting is enabled
 * @returns True if rate limiting is enabled
 */
export function isRateLimitEnabled(): boolean {
  return config.rateLimit.enabled;
}

/**
 * Helper function to check if Swagger documentation is enabled
 * @returns True if Swagger documentation is enabled
 */
export function isSwaggerEnabled(): boolean {
  return config.swaggerEnabled;
} 