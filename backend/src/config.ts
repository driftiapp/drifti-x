import dotenv from 'dotenv';

dotenv.config();

export interface IConfig {
  port: number;
  apiUrl: string;
  mongodbUri: string;
  jwtSecret: string;
  frontendUrl: string;
  environment: 'development' | 'production' | 'test';
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

const config: IConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/driftix',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  environment: (process.env.NODE_ENV as IConfig['environment']) || 'development',
  logLevel: (process.env.LOG_LEVEL as IConfig['logLevel']) || 'info'
};

export { config }; 