import { logger } from '../utils/logger';
import { setupFileMonitor } from './fileMonitor';
import { setupHealthCheck } from './healthCheck';

export const setupMonitoring = (): void => {
  try {
    // Setup file monitoring
    setupFileMonitor();
    
    // Setup health checks
    setupHealthCheck();
    
    logger.info('Monitoring systems initialized');
  } catch (error) {
    logger.error('Error setting up monitoring:', error);
  }
}; 