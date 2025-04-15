import { logger } from '../utils/logger';
import { SmokeShopService } from '../services/smokeShop.service';

async function runMaintenance() {
  try {
    logger.info('Starting maintenance tasks...');
    
    // Initialize services
    const smokeShopService = new SmokeShopService();
    
    // Example maintenance task: Clean up old orders
    const result = await smokeShopService.cleanupOldOrders();
    logger.info(`Cleaned up ${result.deletedCount} old orders`);
    
    logger.info('Maintenance tasks completed successfully');
  } catch (error) {
    logger.error('Error during maintenance:', error);
    process.exit(1);
  }
}

// Run the maintenance script
runMaintenance(); 