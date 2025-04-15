import dotenv from 'dotenv';

dotenv.config();

export interface IConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;
  jwtSecret: string;
  mongodbUri: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

export const config: IConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/driftix',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
}; 