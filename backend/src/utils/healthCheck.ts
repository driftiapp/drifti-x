import axios from 'axios';
import { createLogger } from './logger';
import { AppError, ErrorType } from './AppError';

const logger = createLogger({ module: 'HealthCheck' });

const SERVICES = {
  FRONTEND: 'http://localhost:3000',
  BACKEND: 'http://localhost:3001',
  REDIS: 'redis://localhost:6379'
};

async function checkService(url: string, name: string) {
  try {
    const startTime = Date.now();
    const response = await axios.get(url);
    const responseTime = Date.now() - startTime;
    
    if (response.status >= 200 && response.status < 300) {
      logger.info(`${name} is healthy`, {
        url,
        status: response.status,
        responseTime: `${responseTime}ms`
      });
      return true;
    }
    
    throw new Error(`Status: ${response.status}`);
  } catch (error) {
    logger.error(`${name} is not responding`, error as Error);
    return false;
  }
}

async function checkRedis() {
  try {
    const startTime = Date.now();
    // Simple Redis ping check
    const response = await axios.get(`${SERVICES.REDIS}/ping`);
    const responseTime = Date.now() - startTime;
    
    if (response.data === 'PONG') {
      logger.info('Redis is healthy', {
        url: SERVICES.REDIS,
        responseTime: `${responseTime}ms`
      });
      return true;
    }
    
    throw new Error('Redis ping failed');
  } catch (error) {
    logger.error('Redis is not responding', error as Error);
    return false;
  }
}

export async function healthCheck() {
  logger.info('Starting health check...');
  
  const results = await Promise.all([
    checkService(SERVICES.FRONTEND, 'Frontend'),
    checkService(SERVICES.BACKEND, 'Backend'),
    checkRedis()
  ]);
  
  const allHealthy = results.every(result => result);
  
  if (!allHealthy) {
    throw new AppError('Health check failed', ErrorType.SYSTEM, {
      severity: 'critical',
      metadata: {
        frontend: results[0],
        backend: results[1],
        redis: results[2]
      }
    });
  }
  
  logger.info('All services are healthy!');
  return true;
}

// Run health check if script is executed directly
if (require.main === module) {
  healthCheck()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Health check failed', error);
      process.exit(1);
    });
} 