import { worker } from '../src/workers/slack.worker';
import { logger } from '../src/utils/logger';
import { ConfigGuard } from '../src/middleware/configGuard.middleware';
import '../src/workers/health';

// Validate configuration
const configGuard = ConfigGuard.getInstance();
configGuard.validate();

// Start the worker
logger.info('Starting Slack notification worker...');

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
  process.exit(1);
}); 